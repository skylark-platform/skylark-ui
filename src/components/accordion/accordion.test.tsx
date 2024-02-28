import { fireEvent, render, screen } from "src/__tests__/utils/test-utils";

import { Accordion } from "./accordion.component";

test("opens the accordion", async () => {
  render(
    <Accordion buttonText="My Accordion">
      <p>Example text</p>
    </Accordion>,
  );

  const accordion = await screen.findByText("My Accordion");

  expect(screen.queryByText("Example text")).not.toBeInTheDocument();

  await fireEvent.click(accordion);

  expect(screen.queryByText("Example text")).toBeInTheDocument();
});

test("closes an accordion that was open by default", async () => {
  render(
    <Accordion buttonText="My Accordion" defaultOpen>
      <p>Example text</p>
    </Accordion>,
  );

  const accordion = await screen.findByText("My Accordion");

  expect(screen.queryByText("Example text")).toBeInTheDocument();

  await fireEvent.click(accordion);

  expect(screen.queryByText("Example text")).not.toBeInTheDocument();
});
