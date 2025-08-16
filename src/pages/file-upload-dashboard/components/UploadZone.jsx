// src/components/UploadZone.jsx
import React, { useState, useRef } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { storage, db } from "../../lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const supportedFormats = [".xlsx", ".xls", ".csv"];
const maxFileSize = 10 * 1024 * 1024; // 10MB

const UploadZone = ({ setDatasets }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const openFileDialog = () => fileInputRef.current?.click();

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
    const files = Array.from(e.dataTransfer.files || []);
    void handleFiles(files);
  };
  const handleInput = (e) => {
    const files = Array.from(e.target.files || []);
    void handleFiles(files);
    // reset input so same file can be uploaded again later
    e.target.value = "";
  };

  const handleFiles = async (files) => {
    const valid = files.filter((f) => {
      const ext = "." + f.name.split(".").pop().toLowerCase();
      return supportedFormats.includes(ext) && f.size <= maxFileSize;
    });

    if (!valid.length) return;

    setUploading(true);
    try {
      for (const file of valid) {
        // 1) Upload to Storage
        const storageRef = ref(storage, `datasets/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);

        const url = await getDownloadURL(storageRef);

        // 2) Write metadata to Firestore
        await addDoc(collection(db, "datasets"), {
          name: file.name,
          url,
          size: file.size,
          type: file.type || "application/octet-stream",
          createdAt: serverTimestamp(),
        });

        console.log(`✅ Uploaded ${file.name}`);
      }

      // 3) Refresh list via serverless API (admin reads)
      try {
        const r = await fetch("/api/datasets", { method: "GET" });
        if (!r.ok) {
          const txt = await r.text();
          console.warn("GET /api/datasets not OK:", r.status, txt);
          // fall back: don’t block UI
        } else {
          const json = await r.json();
          if (json?.success) setDatasets(json.datasets || []);
        }
      } catch (e) {
        console.warn("Failed to refresh datasets from /api/datasets:", e);
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert(
        err?.message ||
          "Upload failed. Check Firestore mode, rules, and env variables."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        } ${uploading ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        role="button"
        tabIndex={0}
      >
        <div className="flex justify-center mb-6">
          <div
            className={`p-6 rounded-full transition-all duration-300 ${
              isDragOver
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
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
            Drag & drop or click to browse (.xlsx, .xls, .csv — up to 10MB)
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
            {uploading ? "Uploading..." : "Choose Files"}
          </Button>
          <div className="text-sm text-muted-foreground">or drag & drop files here</div>
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
          onChange={handleInput}
          className="hidden"
        />

        {uploading && (
          <div className="absolute inset-0 bg-surface/80 rounded-xl flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin">
                <Icon name="Loader2" size={32} className="text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Uploading & saving…
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadZone;
