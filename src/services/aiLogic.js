import {
  getGenerativeModel,
  InferenceMode,
  InferenceSource,
  Schema
} from "firebase/ai";
import { ai, verifyAppCheckStatus } from "./firebase.js";
import { scrubLocalPII } from "./piiScrubber.js";

// Active stable free-tier models per Firebase AI Logic docs (no retired 2.0/2.5 models)
export const PRIMARY_CLOUD_MODEL = "gemini-3.5-flash-lite";
export const SECONDARY_CLOUD_MODEL = "gemini-4-hydrogen";

const SOAP_SYSTEM_PROMPT =
  "You are ScribeZero, an expert clinical documentation AI. Preserve all redaction placeholders ([PATIENT], [DATE], [REDACTED], [CLINICIAN]) verbatim and organize clinical facts into clear markdown SOAP sections (# SUBJECTIVE, # OBJECTIVE, # ASSESSMENT, # PLAN). Never invent facts or medications absent from the consultation.";

const BILLING_RESPONSE_SCHEMA = Schema.object({
  properties: {
    icd10_codes: Schema.array({
      items: Schema.object({
        properties: {
          code: Schema.string(),
          description: Schema.string(),
          confidence: Schema.number()
        }
      })
    }),
    cpt_codes: Schema.array({
      items: Schema.object({
        properties: {
          code: Schema.string(),
          description: Schema.string(),
          level: Schema.string()
        }
      })
    }),
    drug_interactions: Schema.array({
      items: Schema.object({
        properties: {
          severity: Schema.enumString({ enum: ["High", "Moderate", "Low"] }),
          medications: Schema.array({ items: Schema.string() }),
          warning: Schema.string()
        }
      })
    }),
    clinical_summary: Schema.string()
  }
});

function createHybridSOAPModel(cloudModelName) {
  if (!ai) return null;
  return getGenerativeModel(ai, {
    mode: InferenceMode.PREFER_ON_DEVICE,
    inCloudParams: {
      model: cloudModelName,
      systemInstruction: SOAP_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.15,
        topP: 0.95
      }
    },
    onDeviceParams: {
      createOptions: {
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
        initialPrompts: [
          {
            role: "system",
            content: [{ type: "text", value: SOAP_SYSTEM_PROMPT }]
          }
        ]
      }
    }
  });
}

function createHybridBillingModel(cloudModelName) {
  if (!ai) return null;
  return getGenerativeModel(ai, {
    mode: InferenceMode.PREFER_IN_CLOUD,
    inCloudParams: {
      model: cloudModelName,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: BILLING_RESPONSE_SCHEMA
      }
    },
    onDeviceParams: {
      promptOptions: {
        responseConstraint: BILLING_RESPONSE_SCHEMA
      }
    }
  });
}

export const onDeviceModel = createHybridSOAPModel(PRIMARY_CLOUD_MODEL);
export const cloudModel = createHybridBillingModel(PRIMARY_CLOUD_MODEL);

/**
 * Checks browser on-device LanguageModel availability WITHOUT triggering any local model download,
 * plus live network and Firebase App Check readiness.
 */
export async function checkModelCapabilities(isOfflineMode = false) {
  const browserOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  const isOnline = browserOnline && !isOfflineMode;

  let languageModelState = "unavailable";
  let onDeviceReady = false;

  if (typeof globalThis !== "undefined" && globalThis.LanguageModel?.availability) {
    try {
      languageModelState = await globalThis.LanguageModel.availability({
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }]
      });
      // Strictly treat ONLY "available" (already downloaded) as ready; never trigger download on "downloadable"
      onDeviceReady = languageModelState === "available";
    } catch (err) {
      console.warn("[aiLogic] Chrome LanguageModel availability probe:", err?.message || err);
    }
  } else if (typeof window !== "undefined" && window.ai?.languageModel?.capabilities) {
    try {
      const caps = await window.ai.languageModel.capabilities();
      languageModelState = caps?.available || "unavailable";
      onDeviceReady = languageModelState === "readily";
    } catch (err) {
      console.warn("[aiLogic] Legacy window.ai probe:", err?.message || err);
    }
  }

  const appCheckStatus = isOnline
    ? await verifyAppCheckStatus()
    : { verified: false, mode: "offline" };

  return {
    onDeviceAvailable: onDeviceReady,
    languageModelState,
    cloudAvailable: Boolean(ai && isOnline),
    deviceEngine: onDeviceReady
      ? "Gemini Nano (Chrome Built-in)"
      : `Firebase AI Logic (${PRIMARY_CLOUD_MODEL})`,
    appCheckVerified: appCheckStatus.verified,
    appCheckMode: appCheckStatus.mode,
    appCheckError: appCheckStatus.error,
    isOnline
  };
}

function isTransientCloudError(err) {
  const msg = String(err?.message || err || "");
  return /\b(429|500|502|503|504)\b|high demand|RESOURCE_EXHAUSTED|INTERNAL|UNAVAILABLE|fetch/i.test(msg);
}

/**
 * Scrubs raw PHI strictly on-device BEFORE sending anything to Firebase AI Logic,
 * then streams SOAP note generation using InferenceMode.PREFER_ON_DEVICE.
 * Never triggers a local model download and never masks errors with static templates.
 */
export async function streamLocalSOAPNote(consultationText, onChunk, options = {}) {
  if (!consultationText || typeof consultationText !== "string") {
    throw new Error("consultationText is required and must be a string");
  }

  const { isOffline = false, knownPatient = null, onScrubbed = null } = options;
  const startTime = Date.now();

  // 1. Always scrub PII strictly locally in browser memory first (0 KB egress)
  const scrubResult = scrubLocalPII(consultationText, knownPatient);
  const sanitizedTranscript = scrubResult.sanitizedText;
  if (onScrubbed) {
    onScrubbed({
      scrubbedCount: scrubResult.scrubbedCount,
      sanitizedTranscript
    });
  }

  // Probe local Nano readiness without downloading
  const caps = await checkModelCapabilities(isOffline);

  if ((isOffline || !caps.isOnline) && !caps.onDeviceAvailable) {
    const err = new Error(
      "Network is offline and on-device Gemini Nano is not pre-installed in this browser (local downloads are disabled). Local PII scrubbing completed safely with 0 KB egress; restore Wi-Fi to run cloud SOAP synthesis."
    );
    err.sanitizedTranscript = sanitizedTranscript;
    err.scrubbedCount = scrubResult.scrubbedCount;
    err.isOfflineBlocked = true;
    throw err;
  }

  if (!onDeviceModel) {
    throw new Error("Firebase AI Logic is not configured. Add VITE_FIREBASE_* variables to .env.local.");
  }

  const prompt = `Format the following de-identified clinician-patient consultation into a clinical SOAP note.

MANDATORY RULES:
1. Keep all redaction tokens ([PATIENT], [DATE], [REDACTED], [CLINICIAN]) intact; never invent names or dates.
2. Output strictly under these four markdown headers:
# SUBJECTIVE
# OBJECTIVE
# ASSESSMENT
# PLAN
3. Base every clinical finding, vital sign, assessment, and medication solely on the sanitized consultation below.

Sanitized Consultation Transcript:
${sanitizedTranscript}`;

  const modelCandidates = [PRIMARY_CLOUD_MODEL, SECONDARY_CLOUD_MODEL];
  let lastError = null;

  for (const modelName of modelCandidates) {
    const activeModel =
      modelName === PRIMARY_CLOUD_MODEL ? onDeviceModel : createHybridSOAPModel(modelName);
    if (!activeModel) continue;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const resultStream = await activeModel.generateContentStream(prompt);
        let accumulatedText = "";
        let inferenceSource = null;
        let usageMetadata = null;

        for await (const chunk of resultStream.stream) {
          if (chunk.inferenceSource) inferenceSource = chunk.inferenceSource;
          const chunkText = chunk.text();
          if (chunkText) {
            accumulatedText += chunkText;
            if (onChunk) onChunk(chunkText, accumulatedText);
          }
        }

        const finalResp = await resultStream.response;
        inferenceSource = finalResp?.inferenceSource || inferenceSource || InferenceSource.IN_CLOUD;
        usageMetadata = finalResp?.usageMetadata || null;

        const usedOnDevice = inferenceSource === InferenceSource.ON_DEVICE;
        const egressBytes = usedOnDevice ? 0 : new Blob([prompt]).size;
        const totalTokens = usageMetadata?.totalTokenCount || 0;
        const estimatedCost = usedOnDevice
          ? "$0.0000"
          : `$${((totalTokens || Math.ceil(egressBytes / 4)) * 0.0000001).toFixed(4)}`;

        return {
          text: accumulatedText,
          sanitizedTranscript,
          stats: {
            latencyMs: Date.now() - startTime,
            engine: usedOnDevice
              ? "Gemini Nano (On-Device)"
              : `${modelName} (Firebase AI Logic)`,
            modelName: usedOnDevice ? "gemini-nano" : modelName,
            mode: InferenceMode.PREFER_ON_DEVICE,
            inferenceSource,
            onDevice: usedOnDevice,
            egressBytes,
            estimatedCost,
            phiScrubbedCount: scrubResult.scrubbedCount,
            preCloudScrubbed: true,
            appCheckVerified: caps.appCheckVerified,
            usageMetadata
          }
        };
      } catch (err) {
        // Fallback to non-streaming generateContent on the same Firebase AI Logic model if SSE framing fails
        if (/parse-failed|Failed to parse stream/i.test(String(err?.message || ""))) {
          try {
            const directResult = await activeModel.generateContent(prompt);
            const directResp = directResult.response;
            const fullText = directResp.text();
            if (onChunk) onChunk(fullText, fullText);
            const inferenceSource = directResp?.inferenceSource || InferenceSource.IN_CLOUD;
            const usedOnDevice = inferenceSource === InferenceSource.ON_DEVICE;
            const egressBytes = usedOnDevice ? 0 : new Blob([prompt]).size;
            const usageMetadata = directResp?.usageMetadata || null;
            const totalTokens = usageMetadata?.totalTokenCount || 0;
            const estimatedCost = usedOnDevice
              ? "$0.0000"
              : `$${((totalTokens || Math.ceil(egressBytes / 4)) * 0.0000001).toFixed(4)}`;

            return {
              text: fullText,
              sanitizedTranscript,
              stats: {
                latencyMs: Date.now() - startTime,
                engine: usedOnDevice
                  ? "Gemini Nano (On-Device)"
                  : `${modelName} (Firebase AI Logic)`,
                modelName: usedOnDevice ? "gemini-nano" : modelName,
                mode: InferenceMode.PREFER_ON_DEVICE,
                inferenceSource,
                onDevice: usedOnDevice,
                egressBytes,
                estimatedCost,
                phiScrubbedCount: scrubResult.scrubbedCount,
                preCloudScrubbed: true,
                appCheckVerified: caps.appCheckVerified,
                usageMetadata
              }
            };
          } catch (directErr) {
            lastError = directErr;
          }
        } else {
          lastError = err;
        }
        console.warn(`[aiLogic] SOAP stream ${modelName} attempt ${attempt} failed:`, lastError?.message || lastError);
        if (!isTransientCloudError(lastError)) break;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
        }
      }
    }
  }

  const finalErr = new Error(
    `Firebase AI Logic SOAP generation failed across all configured models: ${lastError?.message || "Unknown AI error"}`
  );
  finalErr.cause = lastError;
  finalErr.sanitizedTranscript = sanitizedTranscript;
  finalErr.scrubbedCount = scrubResult.scrubbedCount;
  throw finalErr;
}

/**
 * Cross-references a strictly de-identified SOAP note for ICD-10-CM, CPT E/M,
 * and drug-drug interactions via Firebase AI Logic (InferenceMode.PREFER_IN_CLOUD).
 * Never returns hardcoded mock medical codes on API failure.
 */
export async function generateBillingAndInteractions(sanitizedSOAP, options = {}) {
  if (!sanitizedSOAP || typeof sanitizedSOAP !== "string") {
    throw new Error("sanitizedSOAP is required and must be a string");
  }

  const { isOffline = false, knownPatient = null } = options;
  const startTime = Date.now();

  // Defensive second-pass PII scrub before cloud billing transmission
  const scrubResult = scrubLocalPII(sanitizedSOAP, knownPatient);
  const cleanSOAP = scrubResult.sanitizedText;

  const caps = await checkModelCapabilities(isOffline);
  if ((isOffline || !caps.isOnline) && !caps.onDeviceAvailable) {
    throw new Error(
      "Offline mode is active. Cloud medical coding & pharmacology screening require an internet connection."
    );
  }

  if (!cloudModel) {
    throw new Error("Firebase AI Logic cloud model is not initialized. Check .env.local configuration.");
  }

  const codingPrompt = `You are a certified professional medical coder (CPC) and clinical pharmacologist.
Analyze the following de-identified clinical SOAP note accurately and thoroughly.
Identify ALL primary and secondary ICD-10-CM diagnosis codes, the appropriate outpatient CPT Evaluation & Management code (based on medical decision making complexity), any clinically significant drug-drug or drug-disease interactions among the current or newly prescribed medications mentioned in the note, and a concise 2-sentence clinical summary.

Sanitized SOAP Note:
${cleanSOAP}`;

  const modelCandidates = [PRIMARY_CLOUD_MODEL, SECONDARY_CLOUD_MODEL];
  let lastError = null;

  for (const modelName of modelCandidates) {
    const activeModel =
      modelName === PRIMARY_CLOUD_MODEL ? cloudModel : createHybridBillingModel(modelName);
    if (!activeModel) continue;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await activeModel.generateContent(codingPrompt);
        const response = result.response;
        const rawText = response.text();
        const cleanedText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanedText);

        const inferenceSource = response.inferenceSource || InferenceSource.IN_CLOUD;
        const usedOnDevice = inferenceSource === InferenceSource.ON_DEVICE;
        const egressBytes = usedOnDevice ? 0 : new Blob([codingPrompt]).size;
        const usageMetadata = response.usageMetadata || null;
        const totalTokens = usageMetadata?.totalTokenCount || 0;
        const estimatedCost = usedOnDevice
          ? "$0.0000"
          : `$${((totalTokens || Math.ceil(egressBytes / 4)) * 0.0000001).toFixed(4)}`;

        return {
          icd10_codes: Array.isArray(parsed.icd10_codes) ? parsed.icd10_codes : [],
          cpt_codes: Array.isArray(parsed.cpt_codes) ? parsed.cpt_codes : [],
          drug_interactions: Array.isArray(parsed.drug_interactions) ? parsed.drug_interactions : [],
          clinical_summary: parsed.clinical_summary || "",
          stats: {
            latencyMs: Date.now() - startTime,
            engine: usedOnDevice
              ? "Gemini Nano (On-Device)"
              : `${modelName} (Firebase AI Logic)`,
            modelName: usedOnDevice ? "gemini-nano" : modelName,
            mode: InferenceMode.PREFER_IN_CLOUD,
            inferenceSource,
            onDevice: usedOnDevice,
            appCheckVerified: caps.appCheckVerified,
            egressBytes,
            estimatedCost,
            usageMetadata
          }
        };
      } catch (err) {
        lastError = err;
        console.warn(`[aiLogic] Cloud billing ${modelName} attempt ${attempt} failed:`, err?.message || err);
        if (!isTransientCloudError(err)) break;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
        }
      }
    }
  }

  throw new Error(
    `Firebase AI Logic cloud coding failed: ${lastError?.message || "Model unavailable or invalid JSON response"}`
  );
}
