import "@testing-library/jest-dom";
import { act } from "react-dom/test-utils";

import { render, screen } from "src/tests/utils/test-utils";

import { UserAvatar } from "./avatar.component";

beforeEach(() => {
  jest.useFakeTimers();
});

test("shows fallback when no src is given", async () => {
  render(<UserAvatar name="Skylark" src="" />);

  act(() => {
    jest.runAllTimers();
  });

  expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("S");
});
