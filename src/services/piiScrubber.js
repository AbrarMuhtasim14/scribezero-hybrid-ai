/**
 * Deterministic client-side HIPAA / PII scrubber.
 * Runs 100% locally in browser memory before ANY hybrid/cloud inference
 * call or Cloud Firestore persistence so raw PHI never leaves the device.
 */

const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;

function escapeRegex(value) {
  return String(value).replace(ESCAPE_REGEX, "\\$&");
}

function addDaysFormatVariants(dob) {
  if (!dob || typeof dob !== "string") return [];
  const variants = new Set([dob.trim()]);
  // Support YYYY-MM-DD <-> MM/DD/YYYY
  const isoMatch = dob.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    variants.add(`${mm}/${dd}/${yyyy}`);
    variants.add(`${Number(mm)}/${Number(dd)}/${yyyy}`);
    variants.add(`${mm}-${dd}-${yyyy}`);
  }
  return Array.from(variants).filter(Boolean);
}

/**
 * Strips identifiable Protected Health Information (PHI) from clinical text locally.
 *
 * @param {string} rawText
 * @param {{ name?: string, dob?: string, mrn?: string }} [knownPatient]
 * @returns {{ sanitizedText: string, scrubbedCount: number, categories: string[] }}
 */
export function scrubLocalPII(rawText, knownPatient = null) {
  if (!rawText || typeof rawText !== "string") {
    return { sanitizedText: "", scrubbedCount: 0, categories: [] };
  }

  let text = rawText;
  let scrubbedCount = 0;
  const categories = new Set();

  const replaceAndCount = (regex, replacement, category) => {
    text = text.replace(regex, (match) => {
      scrubbedCount += 1;
      categories.add(category);
      return typeof replacement === "function" ? replacement(match) : replacement;
    });
  };

  // 1. Deterministic scrub for any explicitly known patient metadata (active case context)
  if (knownPatient) {
    if (knownPatient.name) {
      const fullName = knownPatient.name.trim();
      if (fullName.length >= 2) {
        replaceAndCount(new RegExp(`\\b${escapeRegex(fullName)}\\b`, "gi"), "[PATIENT]", "name");
      }
      // Also scrub individual multi-character name parts (handles middle initial omissions or surname references)
      const nameTokens = fullName.split(/\s+/).filter((t) => t.replace(/\./g, "").length >= 3);
      for (const token of nameTokens) {
        replaceAndCount(new RegExp(`\\b${escapeRegex(token)}\\b`, "g"), "[PATIENT]", "name");
      }
    }

    if (knownPatient.mrn) {
      const mrnVal = knownPatient.mrn.trim();
      const digitsOnly = mrnVal.replace(/^MRN[\s:-]*/i, "");
      if (mrnVal) {
        replaceAndCount(new RegExp(`\\b${escapeRegex(mrnVal)}\\b`, "gi"), "MRN [REDACTED]", "mrn");
      }
      if (digitsOnly.length >= 4) {
        replaceAndCount(new RegExp(`\\b(?:MRN|ID|Record)[\\s:#-]*${escapeRegex(digitsOnly)}\\b`, "gi"), "MRN [REDACTED]", "mrn");
        replaceAndCount(new RegExp(`\\b${escapeRegex(digitsOnly)}\\b`, "g"), "[REDACTED]", "mrn");
      }
    }

    if (knownPatient.dob) {
      for (const dobVariant of addDaysFormatVariants(knownPatient.dob)) {
        replaceAndCount(
          new RegExp(`(?:\\b(?:DOB|date\\s+of\\s+birth|born(?:\\s+on)?)[\\s:]+)?\\b${escapeRegex(dobVariant)}\\b`, "gi"),
          "[DATE]",
          "dob"
        );
      }
    }
  }

  // 2. General pattern scrubbing (covers freeform dictation & non-preset cases)
  // Patient / person introducers including middle initials (e.g., "Patient is Robert C. Sterling", "Ms. Sarah M. Jenkins")
  replaceAndCount(
    /\b(?:Patient(?:'s)?(?:\s+name)?\s+(?:is|:)|Name\s*:|Mr\.|Mrs\.|Ms\.|Miss|Dr\.)\s+([A-Z][a-zA-Z'-]+(?:\s+(?:[A-Z]\.?|[A-Z][a-zA-Z'-]+)){0,3})/g,
    (match) => {
      const prefixMatch = match.match(/^((?:Patient(?:'s)?(?:\s+name)?\s+(?:is|:)|Name\s*:|Mr\.|Mrs\.|Ms\.|Miss|Dr\.)\s+)/i);
      const prefix = prefixMatch ? prefixMatch[1] : "";
      if (/^Dr\./i.test(prefix)) {
        return "Dr. [CLINICIAN]";
      }
      return `${prefix}[PATIENT]`;
    },
    "name"
  );

  // Labeled DOB / Birthdates
  replaceAndCount(
    /\b(?:DOB|Date\s+of\s+Birth|born(?:\s+on)?)[\s:]+(?:\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\b/gi,
    "DOB [DATE]",
    "dob"
  );

  // Calendar dates (MM/DD/YYYY, YYYY-MM-DD)
  replaceAndCount(/\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g, "[DATE]", "date");

  // Labeled Medical Record Numbers / Account IDs
  replaceAndCount(/\b(?:MRN|Medical\s+Record(?:\s+Number)?|Record\s*(?:ID|#)|Patient\s*ID)[\s:#-]*[A-Z0-9-]{4,14}\b/gi, "MRN [REDACTED]", "mrn");

  // SSNs
  replaceAndCount(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]", "ssn");

  // Phone numbers
  replaceAndCount(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g, "[PHONE_REDACTED]", "phone");

  // Emails
  replaceAndCount(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL_REDACTED]", "email");

  // Street addresses (common patterns)
  replaceAndCount(
    /\b\d{1,5}\s+[A-Z][a-zA-Z0-9.\s]{1,30}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)\b\.?/g,
    "[ADDRESS_REDACTED]",
    "address"
  );

  // Collapse duplicate adjacent placeholders (e.g. "[PATIENT] [PATIENT]")
  text = text.replace(/(\[PATIENT\](?:\s+\[PATIENT\])+)/g, "[PATIENT]");

  return {
    sanitizedText: text,
    scrubbedCount,
    categories: Array.from(categories)
  };
}

/**
 * Builds strictly de-identified encounter metadata suitable for Cloud Firestore persistence.
 * Never persists raw patient name, DOB, or raw MRN strings.
 */
export function buildSanitizedPatientMetadata(activeCase) {
  if (!activeCase?.patient) {
    return {
      label: "De-Identified Patient",
      specialty: "General Clinical Consultation",
      mrn: "[REDACTED]",
      deIdentified: true
    };
  }

  const meta = {
    label: `De-Identified Patient (${activeCase.specialty?.split("/")[0]?.trim() || "Clinical"})`,
    specialty: activeCase.specialty || "General",
    mrn: "[REDACTED]",
    deIdentified: true
  };
  if (typeof activeCase.patient.age === "number") {
    meta.ageGroup = `${Math.floor(activeCase.patient.age / 10) * 10}s`;
  }
  if (activeCase.patient.gender) {
    meta.gender = activeCase.patient.gender;
  }
  return meta;
}
