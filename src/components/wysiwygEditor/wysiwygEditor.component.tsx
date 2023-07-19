import { Editor } from "@tinymce/tinymce-react";
import React, { useRef } from "react";

export const WYSIWYGEditor = () => {
  const editorRef = useRef<Editor | null>(null);
  const log = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };
  return (
    <>
      <Editor
        // tinymceScriptSrc={process.env.PUBLIC_URL + "/tinymce/tinymce.min.js"}
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        onInit={(evt, editor) => (editorRef.current = editor)}
        initialValue="<p>This is the initial content of the editor.</p>"
        init={{
          height: 500,
          menubar: true,
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
          ],
          toolbar:
            "undo redo | blocks | " +
            "bold italic forecolor | alignleft aligncenter " +
            "alignright alignjustify | bullist numlist outdent indent | " +
            "removeformat | help",
          content_style:
            "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
          quickbars_insert_toolbar: "quickimage quicktable | hr pagebreak",
        }}
        onEditorChange={console.log}
      />
      <button onClick={log}>Log editor content</button>
    </>
  );
};
