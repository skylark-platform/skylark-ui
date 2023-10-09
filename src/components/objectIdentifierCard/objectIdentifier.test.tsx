import { fireEvent, render, screen } from "src/__tests__/utils/test-utils";
import {
  AvailabilityStatus,
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";

import { ObjectIdentifierCard } from "./objectIdentifier.component";

const defaultObject: ParsedSkylarkObject = {
  uid: "123",
  objectType: "SkylarkSet",
  config: {
    objectTypeDisplayName: "CustomObjectTypeName",
  },
  metadata: {
    uid: "set-1",
    external_id: "my-set",
    title: "my episode",
  },
  meta: {
    language: "en-GB",
    availableLanguages: ["en-GB"],
    availabilityStatus: AvailabilityStatus.Active,
  },
  availability: {
    status: AvailabilityStatus.Active,
    objects: [],
  },
};

test("displays the Object's display_name when one is given", () => {
  render(<ObjectIdentifierCard object={defaultObject} />);

  expect(screen.getByText("CustomObjectTypeName")).toBeInTheDocument();
  expect(screen.queryByText("SkylarkSet")).not.toBeInTheDocument();
});

test("displays the Object's objectType when no display_name is given", () => {
  const object = {
    ...defaultObject,
    config: {
      objectTypeDisplayName: null,
    },
  } as unknown as ParsedSkylarkObject;
  render(<ObjectIdentifierCard object={object} />);

  expect(screen.getByText("SkylarkSet")).toBeInTheDocument();
});

test("renders children", () => {
  render(
    <ObjectIdentifierCard object={defaultObject}>
      <div>children</div>
    </ObjectIdentifierCard>,
  );

  expect(screen.getByText("children")).toBeInTheDocument();
});

test("displays arrow when onForwardClick is passed as a prop and calls onForwardClick when clicked", () => {
  const onForwardClick = jest.fn();

  render(
    <ObjectIdentifierCard
      object={defaultObject}
      onForwardClick={onForwardClick}
    />,
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

test("displays AvailabilityStatus icon by default (Active)", () => {
  render(<ObjectIdentifierCard object={defaultObject} />);

  expect(
    screen.getByLabelText(
      "This object has at least one active Availability assigned.",
    ),
  ).toBeInTheDocument();
});

test("displays AvailabilityStatus icon by default (Future)", () => {
  render(
    <ObjectIdentifierCard
      object={{
        ...defaultObject,
        availability: { status: AvailabilityStatus.Future, objects: [] },
      }}
    />,
  );

  expect(
    screen.getByLabelText(
      "No active Availability assigned, at least one will be active in the future.",
    ),
  ).toBeInTheDocument();
});

test("hides AvailabilityStatus icon when hideAvailabilityStatus is passed", () => {
  render(
    <ObjectIdentifierCard object={defaultObject} hideAvailabilityStatus />,
  );

  expect(
    screen.queryByLabelText(
      "This object has at least one active Availability assigned.",
    ),
  ).not.toBeInTheDocument();
});

test("does not show AvailabilityStatus icon when object type is Availability", () => {
  render(
    <ObjectIdentifierCard
      object={{
        ...defaultObject,
        objectType: BuiltInSkylarkObjectType.Availability,
      }}
    />,
  );

  expect(
    screen.queryByLabelText(
      "This object has at least one active Availability assigned.",
    ),
  ).not.toBeInTheDocument();
});
