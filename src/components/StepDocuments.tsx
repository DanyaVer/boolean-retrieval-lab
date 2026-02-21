"use client";

import { useLab } from "@/context/LabContext";
import { ArrowRight, FileText, Plus } from "lucide-react";
import { useState } from "react";
import FileUpload from "./ui/FileUpload";

export default function StepDocuments() {
  const { documents, addDocument, setStep, buildIndex, model } = useLab();
  const [docContent, setDocContent] = useState("");
  const stepNumber = model === "BOOLEAN" ? 3 : 2;

  const handleBulkUpload = (content: string, fileName: string) => {
    // Generate a mostly unique ID for file uploads
    const id = Math.floor(Date.now() + Math.random() * 1000);
    addDocument({
      id: id, // Simple unique ID generation
      name: fileName,
      content: content.trim(),
    });
  };

  const handleAdd = () => {
    if (!docContent.trim()) return;

    addDocument({
      id: documents.length + 1,
      name: `Document ${documents.length + 1}`,
      content: docContent,
    });
    setDocContent("");
  };

  const handleFinish = () => {
    if (documents.length === 0)
      return alert("Please add at least one document.");
    buildIndex(); // Compile the index (automatically builds vocabulary if Vector Model)
    setStep("SEARCH");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">
        Step {stepNumber}: Document Collection
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Add plain text documents to the collection manually or upload files.
      </p>

      {/* Dynamic Note depending on Model */}
      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
        <strong>Note:</strong> During indexing, document text is normalized to
        lowercase and punctuation is removed.
        {model === "VECTOR" ? (
          <span className="ml-1">
            Since you selected the Vector Space Model, the system will
            automatically extract all unique terms to form the basis of the
            vector space.
          </span>
        ) : (
          <span className="ml-1">
            Only the exact terms you defined in the previous step will be
            indexed.
          </span>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-2">
          <textarea
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            placeholder="Type document content here... (e.g., The quick brown fox...)"
            className="w-full h-32 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <button
            onClick={handleAdd}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} /> Add Manual Entry
          </button>
        </div>

        <div className="flex justify-between items-center border-t pt-4 border-slate-100">
          <span className="text-xs text-slate-400">Or bulk upload files:</span>
          <FileUpload
            label="Upload Text Files"
            onFileContent={handleBulkUpload}
            multiple={true}
          />
        </div>
      </div>

      <div className="space-y-2 mb-8">
        <h3 className="font-medium text-slate-700 flex justify-between items-center">
          <span>Added Documents ({documents.length})</span>
        </h3>
        <div className="max-h-60 overflow-y-auto space-y-2 border p-2 rounded bg-slate-50">
          {documents.length === 0 && (
            <p className="text-slate-400 text-sm p-4 text-center">
              Collection is empty.
            </p>
          )}
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-3 border rounded shadow-sm flex gap-3 group relative"
            >
              <FileText className="text-blue-500 shrink-0 mt-1" size={20} />
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{doc.name}</p>
                <p className="text-xs text-slate-500 truncate w-full max-w-md">
                  {doc.content.substring(0, 100)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleFinish}
          disabled={documents.length === 0}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          Build Index & Search <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
