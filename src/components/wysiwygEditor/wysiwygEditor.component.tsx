import { Editor } from "@tinymce/tinymce-react";
import React, { useState } from "react";
import { RawEditorOptions } from "tinymce";

import { Skeleton } from "src/components/skeleton";

interface WYSIWYGEditorProps {
  id?: string;
  value?: string;
  onEditorChange?: (value: string) => void;
  withSkeletonLoading?: boolean;
}

const WYSIWYG_DEFAULT_HEIGHT = 500;

const WYSIWYG_INIT: RawEditorOptions & {
  selector?: undefined;
  target?: undefined;
} = {
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
  quickbars_insert_toolbar: "quickimage quicktable | hr pagebreak",
};

export const WYSIWYGEditor = ({
  id,
  value,
  withSkeletonLoading,
  onEditorChange,
}: WYSIWYGEditorProps) => {
  const [isLoaded, setIsLoaded] = useState(withSkeletonLoading ? false : true);

  return (
    <div className="relative">
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        id={id}
        onInit={() => {
          if (!isLoaded) setIsLoaded(true);
        }}
        init={WYSIWYG_INIT}
        value={value}
        onEditorChange={onEditorChange}
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
