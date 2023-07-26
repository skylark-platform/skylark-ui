import { render, screen } from "src/__tests__/utils/test-utils";

import { WYSIWYGEditor } from "./wysiwygEditor.component";

test("renders the WYSIWYG Editor", async () => {
  render(<WYSIWYGEditor id="my-editor" />);

  // The actual editor won't load here
  expect(screen.getByTestId("wysiwyg-editor")).toBeInTheDocument();
  expect(screen.getByTestId("wysiwyg-editor").children[0]).toHaveAttribute(
    "id",
    "my-editor",
  );
});
