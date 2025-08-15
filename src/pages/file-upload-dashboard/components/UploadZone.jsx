import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// Firebase config (reads from .env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // ✅ must be airavat-75089.appspot.com
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

export default function UploadZone() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");
    setUploading(true);

    try {
      // Upload file to storage
      const storageRef = ref(storage, `uploads/${file.name}`);
      await uploadBytes(storageRef, file);
      const fileURL = await getDownloadURL(storageRef);

      // Save file info in Firestore
      await addDoc(collection(db, "datasets"), {
        name: file.name,
        url: fileURL,
        createdAt: serverTimestamp(),
      });

      alert("File uploaded successfully!");
      setFile(null);
    } catch (err) {
      console.error("Upload failed:", err);
      alert(`❌ Failed to upload ${file.name}: ${err.message}`);
    }

    setUploading(false);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
