import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "src/__tests__/utils/test-utils";
import {
  NormalizedObjectField,
  NormalizedObjectFieldType,
  ParsedSkylarkObjectConfigFieldConfig,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

import { WYSIWYGEditor } from "./wysiwygEditor.component";

test("renders the WYSIWYG Editor", async () => {
  render(<WYSIWYGEditor id="wysiwyg-editor" />);

  // The actual editor won't load here
  expect(screen.getByTestId("lksjdf")).toBeInTheDocument();
});
