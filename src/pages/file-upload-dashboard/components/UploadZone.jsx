import React, { useState, useRef } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

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
const db = getFirestore(app);

const UploadZone = ({ isUploading, setDatasets }) => {
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

          // Get download URL
          const url = await getDownloadURL(storageRef);

          // Save metadata in Firestore
          await addDoc(collection(db, "datasets"), {
            name: file.name,
            url,
            createdAt: serverTimestamp(),
          });

          console.log(`✅ Uploaded ${file.name}`);

          // Fetch updated datasets from API
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

        <div className="space-y-3 mb-8">
          <h3 className="text-xl font-semibold text-foreground">
            {isDragOver ? "Drop your Excel files here" : "Upload Excel Files"}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Drag and drop your Excel files here, or click to browse and select files from your computer
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button
            variant="default"
            size="lg"
            iconName="Upload"
            iconPosition="left"
            loading={uploading}
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}
          >
            {uploading ? "Processing..." : "Choose Files"}
          </Button>
          <div className="text-sm text-muted-foreground">or drag and drop files here</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Icon name="FileType" size={16} />
            <span>Formats: {supportedFormats.join(", ")}</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Icon name="HardDrive" size={16} />
            <span>Max size: 10MB</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Icon name="Shield" size={16} />
            <span>Secure upload</span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {uploading && (
          <div className="absolute inset-0 bg-surface/80 rounded-xl flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin">
                <Icon name="Loader2" size={32} className="text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Processing files...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadZone;
