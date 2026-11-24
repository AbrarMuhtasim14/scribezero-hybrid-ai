import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase.js";

const ENCOUNTERS_COLLECTION = "encounters";
const LOCAL_STORAGE_KEY = "scribezero_encounters_cache_v1";
let memoryCache = [];

function getLocalCache() {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("[FirestoreCache] Could not read local cache:", e);
      return memoryCache;
    }
  }
  return memoryCache;
}

function setLocalCache(encounters) {
  memoryCache = encounters;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(encounters));
    } catch (e) {
      console.warn("[FirestoreCache] Could not write local cache:", e);
    }
  }
}

/**
 * Recursively strips `undefined` properties because Cloud Firestore rejects `undefined`.
 */
function stripUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  }
  if (obj && typeof obj === "object" && !(obj instanceof Date)) {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = stripUndefined(v);
      }
    }
    return clean;
  }
  return obj;
}

/**
 * Saves a de-identified clinical encounter to Cloud Firestore.
 * Uses local persistent cache strictly as an explicit offline queue when offline or unconfigured.
 */
export async function saveEncounter(encounterData, options = {}) {
  const { isOffline = false } = options;
  const localId = `enc_local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  const cleanData = stripUndefined(encounterData);
  const payload = {
    ...cleanData,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncedAt: timestamp
  };

  if (isOffline || !db || (typeof navigator !== "undefined" && !navigator.onLine)) {
    const offlineDoc = {
      ...payload,
      id: localId,
      syncedToCloud: false,
      cloudSyncNote: "Queued locally while offline"
    };
    const existing = getLocalCache();
    setLocalCache([offlineDoc, ...existing]);
    return offlineDoc;
  }

  try {
    const encountersRef = collection(db, ENCOUNTERS_COLLECTION);
    const docRef = await addDoc(encountersRef, {
      ...payload,
      syncedToCloud: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const savedDoc = {
      ...payload,
      id: docRef.id,
      syncedToCloud: true
    };

    const existing = getLocalCache();
    setLocalCache([savedDoc, ...existing.filter((e) => e.id !== docRef.id)]);

    return savedDoc;
  } catch (error) {
    console.warn("[Firestore] Cloud sync paused; saving to local persistent store:", error?.message || error);

    const fallbackDoc = {
      ...payload,
      id: localId,
      syncedToCloud: false,
      cloudSyncNote: error?.message || "Saved locally (cloud sync pending)"
    };

    const existing = getLocalCache();
    setLocalCache([fallbackDoc, ...existing]);

    return fallbackDoc;
  }
}

/**
 * Subscribes to real-time updates for patient encounters.
 */
export function subscribeEncounters(onUpdate, onError, onStatusChange) {
  const initialCache = getLocalCache();
  if (initialCache.length > 0) {
    onUpdate(initialCache);
  }

  if (!db) {
    if (onStatusChange) onStatusChange(false);
    onUpdate(initialCache);
    return () => {};
  }

  try {
    const encountersRef = collection(db, ENCOUNTERS_COLLECTION);
    const q = query(encountersRef, orderBy("createdAt", "desc"));

    return onSnapshot(
      q,
      (snapshot) => {
        if (onStatusChange) onStatusChange(true);
        const cloudEncounters = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString()
              : data.syncedAt || new Date().toISOString(),
            syncedToCloud: true
          };
        });

        const localOnly = getLocalCache().filter(
          (local) => local.syncedToCloud === false && !cloudEncounters.some((cloud) => cloud.id === local.id)
        );
        const combined = [...localOnly, ...cloudEncounters];
        setLocalCache(combined);
        onUpdate(combined);
      },
      (error) => {
        console.warn("[Firestore] Live listener notice (using local cache):", error?.message || error);
        if (onStatusChange) onStatusChange(false);
        onUpdate(getLocalCache());
        if (onError) onError(error);
      }
    );
  } catch (error) {
    console.warn("[Firestore] Failed to attach snapshot listener:", error);
    if (onStatusChange) onStatusChange(false);
    onUpdate(getLocalCache());
    if (onError) onError(error);
    return () => {};
  }
}

export async function getEncounters() {
  if (!db) return getLocalCache();
  try {
    const encountersRef = collection(db, ENCOUNTERS_COLLECTION);
    const q = query(encountersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const cloudEncounters = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : data.syncedAt || new Date().toISOString(),
        syncedToCloud: true
      };
    });

    const localOnly = getLocalCache().filter(
      (local) => local.syncedToCloud === false && !cloudEncounters.some((c) => c.id === local.id)
    );
    const combined = [...localOnly, ...cloudEncounters];
    setLocalCache(combined);
    return combined;
  } catch (error) {
    console.warn("[Firestore] Direct fetch fallback to cache:", error?.message || error);
    return getLocalCache();
  }
}

export async function deleteEncounter(encounterId) {
  const existing = getLocalCache();
  setLocalCache(existing.filter((e) => e.id !== encounterId));

  if (!db || String(encounterId).startsWith("enc_")) return;
  try {
    const docRef = doc(db, ENCOUNTERS_COLLECTION, encounterId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("[Firestore] Error deleting from cloud (deleted locally):", error?.message || error);
  }
}
