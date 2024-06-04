import { ChangeEvent, useState } from "react";

import { Button } from "src/components/button";

interface SimpleFileUploaderProps {
  uploadUrl: string;
  uploadType?: "body" | "form";
  onSuccess?: (name: string) => void;
  onError?: () => void;
}

export const SimpleFileUploader = ({
  uploadUrl,
  uploadType = "body",
  onSuccess,
  onError,
}: SimpleFileUploaderProps) => {
  const [file, setFile] = useState<File>();
  const [isUploading, setIsUploading] = useState(false);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e?.target?.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = () => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);

    fetch(uploadUrl, {
      method: "PUT",
      headers: {
        // "Content-Type": "application/json",
        // "Content-Type": "binary/octet-stream",
        "Content-Type": file.type,
      },
      body: uploadType === "form" ? formData : file,
    })
      .then(() => {
        onSuccess?.(file.name);
        setFile(undefined);
      })
      .catch(() => {
        onError?.();
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <div className="flex flex-col mt-12">
      <input
        type="file"
        onChange={onFileChange}
        className="text-sm text-stone-500
   file:mr-5 file:py-1 file:px-3 file:border-[1px]
   file:text-xs file:font-medium
   file:bg-stone-50 file:text-stone-700
   hover:file:cursor-pointer hover:file:bg-blue-50
   hover:file:text-blue-700"
      />
      <div className="mt-6">
        <Button
          variant="primary"
          disabled={!file}
          onClick={uploadFile}
          loading={isUploading}
        >
          Upload video
        </Button>
      </div>
    </div>
  );
};
