import { createDeleteObjectMutation } from "./dynamicMutations";

describe("createDeleteObjectMutation", () => {
  test("returns null when the object doesn't have a delete operation", () => {
    const got = createDeleteObjectMutation(null);

    expect(got).toBeNull();
  });
});
