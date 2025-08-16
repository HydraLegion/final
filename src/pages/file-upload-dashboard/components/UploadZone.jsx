import React, { useState, useRef } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
} from "firebase/storage";

// Firebase config
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

const UploadZone = ({ setDatasets }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const supportedFormats = [".xlsx", ".xls", ".csv"];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

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

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileSelection(files);
  };

  const handleFileSelection = async (files) => {
    const validFiles = files.filter(
      (file) =>
        supportedFormats.includes("." + file.name.split(".").pop().toLowerCase()) &&
        file.size <= maxFileSize
    );

    if (validFiles.length > 0) {
      for (const file of validFiles) {
        try {
          setUploading(true);

          // Upload to Firebase Storage
          const storageRef = ref(storage, `datasets/${file.name}`);
          await uploadBytes(storageRef, file);

          console.log(`✅ Uploaded ${file.name}`);

          // Refresh datasets list from API
          const res = await fetch("/api/datasets");
          const data = await res.json();
          if (data.success) {
            setDatasets(data.datasets);
          }
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
        } finally {
          setUploading(false);
        }
      }
    }
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-muted/30"
        } ${uploading ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="flex justify-center mb-6">
          <div
            className={`p-6 rounded-full transition-all duration-300 ${
              isDragOver ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <Icon name="FileSpreadsheet" size={48} />
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-2">
          {isDragOver ? "Drop your Excel files here" : "Upload Excel Files"}
        </h3>
        <p className="text-muted-foreground mb-6">
          Drag and drop Excel files here, or click to browse.
        </p>

        <Button
          variant="default"
          size="lg"
          iconName="Upload"
          loading={uploading}
          disabled={uploading}
          onClick={(e) => {
            e.stopPropagation();
            openFileDialog();
          }}
        >
          {uploading ? "Processing..." : "Choose Files"}
        </Button>

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
