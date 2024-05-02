import { useState } from "react";

export const SimpleFileUploader = () => {
  const [file, setFile] = useState<File>();

  const onChange = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    fetch(
      "https://jwplayer-upload.s3-accelerate.amazonaws.com/QXnIIjDs?AWSAccessKeyId=AKIA5SWKMFCV3YLQ7LLR&Signature=nLRo03lhLqft3XrVIMWZAuvig5Y%3D&content-type=video%2Fmp4&Expires=1714496521",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: formData,
      },
    );
  };

  return (
    <input
      type="file"
      onChange={(e) => e?.target?.files?.[0] && onChange(e.target.files[0])}
    />
  );
};
