import { Flatfile } from "@flatfile/sdk";

import { openFlatfileImportClient } from "./import";

jest.mock("@flatfile/sdk", () => {
  return {
    Flatfile: {
      requestDataFromUser: jest.fn(({ onComplete }) =>
        onComplete({ batchId: "batchId" }),
      ),
    },
  };
});

test("calls requestDataFromUser with expected arguments", async () => {
  await openFlatfileImportClient("embedId", "importToken", jest.fn());

  expect(Flatfile.requestDataFromUser).toHaveBeenCalledWith(
    expect.objectContaining({
      embedId: "embedId",
      token: "importToken",
    }),
  );
});

test("calls onComplete argument when Flatfile has completed", async () => {
  const onComplete = jest.fn();

  await openFlatfileImportClient("embedId", "importToken", onComplete);

  expect(Flatfile.requestDataFromUser).toHaveBeenCalled();
  expect(onComplete).toHaveBeenCalledWith("batchId");
});
