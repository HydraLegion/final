import React, { useState, useRef } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// ✅ Firebase Config from .env
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const UploadZone = ({ isUploading: parentUploading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const supportedFormats = [".xlsx", ".xls", ".csv"];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  // Log bucket name for debugging
  console.log("✅ Storage bucket from env:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };

  const handleFileSelection = async (files) => {
    const validFiles = files.filter(file => {
      const extension = "." + file.name.split(".").pop().toLowerCase();
      return supportedFormats.includes(extension) && file.size <= maxFileSize;
    });

    if (validFiles.length === 0) {
      alert("No valid files selected.");
      return;
    }

    setIsUploading(true);
    for (const file of validFiles) {
      try {
        // Upload to Firebase Storage
        const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);

        // Get Download URL
        const downloadURL = await getDownloadURL(fileRef);

        // Save metadata to Firestore
        await addDoc(collection(db, "datasets"), {
          name: file.name,
          url: downloadURL,
          createdAt: serverTimestamp(),
        });

        console.log(`✅ Uploaded: ${file.name}`);
      } catch (error) {
        console.error(`❌ Failed to upload ${file.name}:`, error);
      }
    }
    setIsUploading(false);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileSelection(files);
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
          ${isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-muted/30"}
          ${isUploading || parentUploading ? "pointer-events-none opacity-60" : "cursor-pointer"}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`p-6 rounded-full ${isDragOver ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <Icon name="FileSpreadsheet" size={48} />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3 mb-8">
          <h3 className="text-xl font-semibold">
            {isDragOver ? "Drop your Excel files here" : "Upload Excel Files"}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Drag and drop or click to select files
          </p>
        </div>

        {/* Button */}
        <Button
          variant="default"
          size="lg"
          iconName="Upload"
          iconPosition="left"
          loading={isUploading}
          disabled={isUploading}
        >
          {isUploading ? "Processing..." : "Choose Files"}
        </Button>

        {/* Hidden Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default UploadZone;
