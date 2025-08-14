import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export async function uploadExcelFile(file) {
  try {
    // 1. Upload file to Firebase Storage
    const storageRef = ref(storage, `datasets/${file.name}`);
    await uploadBytes(storageRef, file);

    // 2. Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // 3. Save metadata in Firestore
    await addDoc(collection(db, "datasets"), {
      name: file.name,
      url: downloadURL,
      createdAt: serverTimestamp()
    });

    console.log("File uploaded and metadata saved!");
  } catch (error) {
    console.error("Upload failed:", error);
  }
}
