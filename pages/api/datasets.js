import { initializeApp } from "firebase/app";
import { adminDb } from "../../lib/firebaseserver";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
} from "firebase/storage";
  try {
    const snapshot = await adminDb
      .collection("datasets")
      .orderBy("createdAt", "desc")
      .get();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const datasets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));    

export default async function handler(req, res) {
  try {
    const storageRef = ref(storage, "datasets");
    const result = await listAll(storageRef);

    const files = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return { name: item.name, url };
      })
    );

    res.status(200).json({ success: true, datasets: files });
  } catch (error) {
    console.error("Error fetching datasets:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
