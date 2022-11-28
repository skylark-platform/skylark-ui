import { getSkylarkObjectTypes } from "./introspection";

jest.mock("src/lib/graphql/skylark/client", () => ({
  ...jest.requireActual("src/lib/graphql/skylark/client"),
  createSkylarkClient: jest.fn(),
}));

afterEach(() => {
  jest.resetAllMocks();
});

test("returns 501 when the method is not POST", async () => {
  // await getSkylarkObjectTypes();
});
