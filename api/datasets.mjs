// api/datasets.mjs  (or /api/datasets.js in project root for Vercel)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { getEnv } from "../lib/getEnv.js"; // adjust relative path

const config = {
  apiKey: getEnv("FIREBASE_API_KEY") || getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN") || getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("FIREBASE_PROJECT_ID") || getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET") || getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID") || getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("FIREBASE_APP_ID") || getEnv("VITE_FIREBASE_APP_ID"),
  measurementId: getEnv("FIREBASE_MEASUREMENT_ID") || getEnv("VITE_FIREBASE_MEASUREMENT_ID"),
};

const app = getApps().length ? getApp() : initializeApp(config);
const db = getFirestore(app);

export default async function handler(req, res) {
  try {
    // If some docs are missing createdAt, orderBy will 400. So we use orderBy but you MUST write createdAt everywhere (see #4).
    const q = query(collection(db, "datasets"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const datasets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.status(200).json({ success: true, datasets });
  } catch (err) {
    console.error("API /datasets failed:", err);
    res.status(500).json({ success: false, error: String(err?.message || err) });
  }
}
