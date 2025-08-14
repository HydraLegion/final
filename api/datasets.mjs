// api/datasets.mjs
import { getFirestore, collection, getDocs, orderBy, query } from "firebase/firestore";
import { app } from "../lib/firebaseServer.js"; // adjust path if needed

export default async function handler(req, res) {
  try {
    const db = getFirestore(app);

    // Fetch datasets ordered by newest first
    const q = query(collection(db, "datasets"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const datasets = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Unnamed file",
        url: data.url || null,
        createdAt: data.createdAt || null
      };
    });

    return res.status(200).json({ success: true, datasets });
  } catch (error) {
    console.error("❌ Error fetching datasets:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
