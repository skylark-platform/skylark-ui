import { fireEvent, render, screen } from "src/__tests__/utils/test-utils";

import { CompareSchemaVersions } from "./compareSchemaVersions.component";

test("renders", async () => {
  render(
    <CompareSchemaVersions baseVersionNumber={1} updateVersionNumber={2} />,
  );

  expect(
    await screen.findByText("Brand - 1 relationship removed"),
  ).toBeInTheDocument();
});

test("changes tabs to view enums", async () => {
  render(
    <CompareSchemaVersions baseVersionNumber={1} updateVersionNumber={2} />,
  );

  const enumTab = await screen.findByText("Enums");
  fireEvent.click(enumTab);

  expect(screen.getByText("ImageType - 2 removed")).toBeInTheDocument();

  expect(screen.getByText("No enums removed.")).toBeInTheDocument();
});
