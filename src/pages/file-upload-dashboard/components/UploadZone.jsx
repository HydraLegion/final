import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// Firebase config from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

export default function UploadZone() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!firebaseConfig.storageBucket) {
      setError("❌ Storage bucket is missing. Check .env VITE_FIREBASE_STORAGE_BUCKET");
      return;
    }

    try {
      setUploading(true);
      setError("");

      // Upload to storage
      const storageRef = ref(storage, `uploads/${file.name}`);
      await uploadBytes(storageRef, file);

      // Get file URL
      const url = await getDownloadURL(storageRef);

      // Save metadata in Firestore
      await addDoc(collection(db, "datasets"), {
         name: file.name,
         url,
  createdAt: serverTimestamp(),
  });
      // Fetch latest datasets and update UI
const res = await fetch("/api/datasets");
const data = await res.json();
console.log("Updated datasets:", data.datasets);
// Optionally pass this to your parent component's state



      alert(`✅ Uploaded: ${file.name}`);
    } catch (err) {
      console.error("Upload error:", err);
      setError(`❌ Failed to upload ${file.name}: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
