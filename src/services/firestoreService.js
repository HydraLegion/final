import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";

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

/**
 * Save dataset with file upload to Firebase Storage + Firestore
 * @param {Object} dataset - { file: File, [other metadata] }
 * @returns {Promise<string>} - Document ID
 */
export const saveDataset = async (dataset) => {
  let fileURL = null;

  // If a File object is provided, upload it
  if (dataset.file instanceof File) {
    const storageRef = ref(storage, `datasets/${dataset.file.name}`);
    await uploadBytes(storageRef, dataset.file);
    fileURL = await getDownloadURL(storageRef);
  }

  // Prepare Firestore doc
  const docData = {
    name: dataset.file?.name || dataset.name || "Untitled",
    url: fileURL || dataset.url || null,
    createdAt: serverTimestamp(),
    ...dataset, // keep any extra metadata
  };

  // Remove the File object before saving
  delete docData.file;

  // Save to Firestore
  const docRef = await addDoc(collection(db, "datasets"), docData);
  return docRef.id;
};

export const fetchDatasets = async () => {
  const querySnapshot = await getDocs(collection(db, "datasets"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
