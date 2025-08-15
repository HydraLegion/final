// api/datasets.js
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

// Read env from Vercel (server has no import.meta.env)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function getDb() {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

export default async function handler(req, res) {
  try {
    const db = getDb();
    const q = query(collection(db, "datasets"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const datasets = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || "Unnamed",
        url: data.url || null,
        path: data.path || null,
        size: data.size ?? null,
        contentType: data.contentType ?? null,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : null,
      };
    });

    res.status(200).json({ success: true, datasets });
  } catch (err) {
    console.error("GET /api/datasets failed:", err);
    res
      .status(500)
      .json({ success: false, error: err?.message || "Internal error" });
  }
}
