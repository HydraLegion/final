import React, { useState, useRef } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

// ✅ Use your centralized Firebase client
import { storage, db } from "../../lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const UploadZone = ({ isUploading: parentUploading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileSelection = async (files) => {
    const validFiles = files.filter((file) => {
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
        <div className="flex justify-center mb-6">
          <div className={`p-6 rounded-full ${isDragOver ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <Icon name="FileSpreadsheet" size={48} />
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <h3 className="text-xl font-semibold">
            {isDragOver ? "Drop your Excel files here" : "Upload Excel Files"}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Drag and drop or click to select files
          </p>
        </div>

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
