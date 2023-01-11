import { renderHook, act } from "@testing-library/react";

import { usePanel } from "src/hooks/usePanel";

test("check initial state and toggle function", () => {
  const { result } = renderHook(() => usePanel());

  expect(result.current.objectInfo).toBe(null);
  expect(result.current.isPanelOpen).toBe(false);

  act(() => {
    result.current.togglePanel();
  });
  expect(result.current.isPanelOpen).toBe(true);
});

test("check adding panel data", () => {
  const { result } = renderHook(() => usePanel());

  expect(result.current.objectInfo).toBe(null);
  expect(result.current.isPanelOpen).toBe(false);

  act(() => {
    result.current.setPanelInfo("Episode", "xxxx-xxxx");
  });
  expect(result.current.isPanelOpen).toBe(true);
  expect(result.current.objectInfo).toStrictEqual({
    objectType: "Episode",
    uid: "xxxx-xxxx",
  });
});
