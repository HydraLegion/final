// api/datasets.js
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase admin env vars");
  }
  // Vercel stores \n escaped; ensure real newlines:
  if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export default async function handler(req, res) {
  try {
    initAdmin();
    const db = getFirestore();

    if (req.method === "GET") {
      const snap = await db
        .collection("datasets")
        .orderBy("createdAt", "desc")
        .get();

      const datasets = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data?.name ?? "Unnamed file",
          url: data?.url ?? null,
          createdAt: data?.createdAt?.toDate?.()?.toISOString?.() ?? null,
          size: data?.size ?? null,
          type: data?.type ?? null,
        };
      });

      return res.status(200).json({ success: true, datasets });
    }

    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err) {
    console.error("API /api/datasets error:", err);
    return res
      .status(500)
      .json({ success: false, error: err?.message || "Internal Error" });
  }
}
