"use client";

import { Upload } from "lucide-react";
import { useRef } from "react";

interface FileUploadProps {
  onFileContent: (content: string, fileName: string) => void;
  label: string;
  multiple?: boolean;
}

export default function FileUpload({
  onFileContent,
  label,
  multiple = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      onFileContent(text, file.name);
    }

    // Reset input to allow re-uploading same file if needed
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.md,.csv,.json"
        multiple={multiple}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md border border-blue-200 flex items-center gap-2 transition-colors"
      >
        <Upload size={16} />
        {label}
      </button>
    </div>
  );
}
