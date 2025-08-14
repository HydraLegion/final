import { db } from "../../lib/firebaseServer.js";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export default async function handler(req, res) {
  try {
    // Query datasets, newest first
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

    res.status(200).json({ success: true, datasets });
  } catch (error) {
    console.error("Error fetching datasets:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
