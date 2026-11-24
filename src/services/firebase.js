import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  ReCaptchaEnterpriseProvider,
  CustomProvider,
  getToken
} from "firebase/app-check";
import { getFirestore } from "firebase/firestore";
import {
  getAI,
  GoogleAIBackend,
  InferenceMode,
  InferenceSource,
  Schema
} from "firebase/ai";

export { InferenceMode, InferenceSource, Schema };

// Read Firebase project configuration strictly from environment variables.
// Set these in `.env.local` for local dev / build (see `.env.example`).
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

// Initialize Firebase App only when configured
export const app = isFirebaseConfigured
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

// Initialize Cloud Firestore
export const db = app ? getFirestore(app) : null;

// Configure Firebase App Check without committing any debug token secrets to source code.
let appCheckInstance = null;
let appCheckInitMode = "unconfigured";

if (app && typeof window !== "undefined") {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";
  const recaptchaProviderType = import.meta.env.VITE_RECAPTCHA_PROVIDER || "v3";

  try {
    if (recaptchaSiteKey) {
      // Production & configured local testing with real reCAPTCHA attestation
      const provider =
        recaptchaProviderType === "enterprise"
          ? new ReCaptchaEnterpriseProvider(recaptchaSiteKey)
          : new ReCaptchaV3Provider(recaptchaSiteKey);

      appCheckInstance = initializeAppCheck(app, {
        provider,
        isTokenAutoRefreshEnabled: true
      });
      appCheckInitMode = recaptchaProviderType === "enterprise" ? "recaptcha-enterprise" : "recaptcha-v3";
    } else if (import.meta.env.DEV) {
      // Development-only debug mode (tree-shaken out of production `dist/` builds).
      // Reads optional token from `.env.local` (gitignored) or auto-generates one via Firebase SDK (`true`).
      const envDebugToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
      const debugValue = envDebugToken && envDebugToken.trim() ? envDebugToken.trim() : true;
      if (typeof self !== "undefined") {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugValue;
      }
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = debugValue;

      appCheckInstance = initializeAppCheck(app, {
        provider: new CustomProvider({
          getToken: async () => {
            throw new Error(
              "App Check debug exchange requires a registered debug token or reCAPTCHA site key."
            );
          }
        }),
        isTokenAutoRefreshEnabled: true
      });
      appCheckInitMode = "debug-dev";
    }
  } catch (acErr) {
    console.warn("[AppCheck] Initialization warning:", acErr?.message || acErr);
    appCheckInitMode = "error";
  }
}

export const appCheck = appCheckInstance;

/**
 * Verifies live App Check token acquisition instead of assuming verification.
 * @returns {Promise<{ verified: boolean, mode: string, error?: string }>}
 */
export async function verifyAppCheckStatus() {
  if (!appCheckInstance) {
    return {
      verified: false,
      mode: appCheckInitMode,
      error: import.meta.env.PROD
        ? "VITE_RECAPTCHA_SITE_KEY not configured for production Hosting"
        : "App Check not initialized"
    };
  }
  try {
    const tokenResult = await getToken(appCheckInstance, false);
    return {
      verified: Boolean(tokenResult?.token),
      mode: appCheckInitMode
    };
  } catch (err) {
    return {
      verified: false,
      mode: appCheckInitMode,
      error: err?.message || "App Check token exchange failed"
    };
  }
}

// Initialize Firebase AI Logic (Gemini Developer API via GoogleAIBackend)
let aiInstance = null;
if (app) {
  try {
    aiInstance = getAI(app, { backend: new GoogleAIBackend() });
  } catch (err) {
    console.warn("[FirebaseAI] GoogleAIBackend init fallback:", err?.message || err);
    try {
      aiInstance = getAI(app);
    } catch (innerErr) {
      console.error("[FirebaseAI] Could not initialize getAI:", innerErr);
    }
  }
}
export const ai = aiInstance;
