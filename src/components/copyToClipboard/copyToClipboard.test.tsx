import { fireEvent, render, screen } from "src/__tests__/utils/test-utils";

import { CopyToClipboard } from "./copyToClipboard.component";

test("clicks the copy buttons", () => {
  render(<CopyToClipboard value="value" />);

  jest.spyOn(navigator.clipboard, "writeText");

  const copyToken = screen.getByLabelText("Copy value to clipboard");
  fireEvent.click(copyToken);

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith("value");
});
