import { fireEvent, render, screen } from "src/__tests__/utils/test-utils";
import { ParsedSkylarkObject } from "src/interfaces/skylark";

import { ObjectIdentifierCard } from "./objectIdentifier.component";

test("displays the Object's display_name when one is given", () => {
  const object = {
    uid: "123",
    objectType: "SkylarkSet",
    config: {
      objectTypeDisplayName: "CustomObjectTypeName",
    },
    metadata: {
      title: "my episode",
    },
  } as unknown as ParsedSkylarkObject;
  render(<ObjectIdentifierCard object={object} />);

  expect(screen.getByText("CustomObjectTypeName")).toBeInTheDocument();
  expect(screen.queryByText("SkylarkSet")).not.toBeInTheDocument();
});

test("displays the Object's objectType when no display_name is given", () => {
  const object = {
    uid: "123",
    objectType: "SkylarkSet",
    config: {
      objectTypeDisplayName: null,
    },
    metadata: {
      title: "my episode",
    },
  } as unknown as ParsedSkylarkObject;
  render(<ObjectIdentifierCard object={object} />);

  expect(screen.getByText("SkylarkSet")).toBeInTheDocument();
});

test("renders children", () => {
  const object = {
    uid: "123",
    objectType: "SkylarkSet",
    config: {
      objectTypeDisplayName: null,
    },
    metadata: {
      title: "my episode",
    },
  } as unknown as ParsedSkylarkObject;
  render(
    <ObjectIdentifierCard object={object}>
      <div>children</div>
    </ObjectIdentifierCard>,
  );

  expect(screen.getByText("children")).toBeInTheDocument();
});

test("displays arrow when onForwardClick is passed as a prop and calls onForwardClick when clicked", () => {
  const object = {
    uid: "123",
    objectType: "SkylarkSet",
    config: {
      objectTypeDisplayName: null,
    },
    meta: {
      language: "en-GB",
    },
    metadata: {
      title: "my episode",
    },
  } as unknown as ParsedSkylarkObject;

  const onForwardClick = jest.fn();

  render(
    <ObjectIdentifierCard object={object} onForwardClick={onForwardClick} />,
  );

  const forwardButton = screen.getByRole("button");

  expect(forwardButton).toBeInTheDocument();

  fireEvent.click(forwardButton);

  expect(onForwardClick).toHaveBeenCalledWith({
    uid: "123",
    objectType: "SkylarkSet",
    language: "en-GB",
  });
});
