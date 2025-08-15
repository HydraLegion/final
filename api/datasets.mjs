// /api/datasets.js (or .mjs if using ESM)
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, orderBy, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  try {
    const q = query(collection(db, "datasets"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const datasets = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || "Unnamed file",
      url: doc.data().url || "",
      createdAt: doc.data().createdAt?.toDate?.().toISOString() || null
    }));

    res.status(200).json({ success: true, datasets });
  } catch (error) {
    console.error("Error fetching datasets:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
