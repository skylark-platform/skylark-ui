import { render, screen, waitFor } from "src/__tests__/utils/test-utils";

import { Tooltip } from "./tooltip.component";

test("renders children", async () => {
  render(
    <Tooltip tooltip={<></>}>
      <div>my text</div>
    </Tooltip>,
  );

  await waitFor(() => {
    expect(screen.getByText("my text")).toBeInTheDocument();
  });
});
