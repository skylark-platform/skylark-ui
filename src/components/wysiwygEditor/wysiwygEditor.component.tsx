import { Editor } from "@tinymce/tinymce-react";
import React, { useCallback, useState } from "react";

import { Skeleton } from "src/components/skeleton";

interface WYSIWYGEditorProps {
  id?: string;
  value?: string;
  onEditorChange?: (value: string) => void;
  withSkeletonLoading?: boolean;
  disabled?: boolean;
}

const WYSIWYG_DEFAULT_HEIGHT = 500;

const WYSIWYG_INIT = {
  height: WYSIWYG_DEFAULT_HEIGHT,
  promotion: false,
  menubar: "file edit view insert format table",
  removed_menuitems: "newdocument restoredraft",
  skin: "oxide",
  plugins: [
    "advlist",
    "autolink",
    "lists",
    "link",
    "image",
    "charmap",
    "anchor",
    "searchreplace",
    "visualblocks",
    "code",
    "fullscreen",
    "insertdatetime",
    "media",
    "table",
    "preview",
    "help",
    "wordcount",
    "quickbars",
    "directionality",
    "emoticons",
  ],
  toolbar:
    "undo redo | blocks | " +
    "bold italic forecolor | alignleft aligncenter " +
    "alignright alignjustify | bullist numlist outdent indent | " +
    "ltr rtl | fullscreen",
  content_style:
    "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
  quickbars_insert_toolbar: "image quicktable | hr pagebreak",
  style_formats: [
    {
      title: "Image Left",
      selector: "img",
      styles: {
        float: "left",
        margin: "0 10px 0 10px",
      },
    },
    {
      title: "Image Right",
      selector: "img",
      styles: {
        float: "right",
        margin: "0 0 10px 10px",
      },
    },
  ],
  relative_urls: false,
  extended_valid_elements: "script[language|type|src|async|charset]",
};

export const WYSIWYGEditor = ({
  id,
  value,
  withSkeletonLoading,
  disabled,
  onEditorChange,
}: WYSIWYGEditorProps) => {
  const [isLoaded, setIsLoaded] = useState(withSkeletonLoading ? false : true);

  const onEditorChangeWrapper = useCallback(
    (newValue: string) => {
      if (onEditorChange && isLoaded) {
        onEditorChange(newValue);
      }
    },
    [isLoaded, onEditorChange],
  );

  return (
    <div className="relative" data-testid="wysiwyg-editor">
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        id={id}
        onInit={() => {
          if (!isLoaded) setIsLoaded(true);
        }}
        init={WYSIWYG_INIT}
        value={value}
        onEditorChange={onEditorChangeWrapper}
        disabled={disabled}
      />
      {!isLoaded && (
        <div
          style={{ height: WYSIWYG_DEFAULT_HEIGHT }}
          data-testid="wysiwyg-skeleton"
          className="absolute top-0 z-10 h-full w-full bg-white"
        >
          <Skeleton className={`h-full w-full`} />
        </div>
      )}
    </div>
  );
};
