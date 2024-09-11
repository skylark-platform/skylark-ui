import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import { NextRouter } from "next/router";

import {
  allObjectTypes,
  render,
  screen,
  fireEvent,
  waitFor,
} from "src/__tests__/utils/test-utils";

import { ObjectTypeSelectAndOverview } from "./contentModelNavigation.component";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const useRouter = jest.spyOn(require("next/router"), "useRouter");

test.skip("renders the navigation and finds all Object Types", async () => {
  const router = { push: jest.fn() };
  useRouter.mockReturnValue(router);

  render(<ObjectTypeSelectAndOverview activeObjectType={null} />);

  await Promise.all(
    allObjectTypes.map(async (objectType) => {
      const text = await screen.findByText(objectType);
      expect(text).toBeInTheDocument();
    }),
  );
});

test.skip("calls router.push on initial load when activeObjectType is null", async () => {
  const router = { push: jest.fn() };
  useRouter.mockReturnValue(router);

  render(<ObjectTypeSelectAndOverview activeObjectType={null} />);

  await waitFor(() => {
    expect(router.push).toHaveBeenCalledTimes(1);
  });

  expect(router.push).toHaveBeenCalledWith("/content-model/SkylarkSet");
});

test.skip("calls router.push when an object type is clicked", async () => {
  const router = { push: jest.fn() };

  render(
    <RouterContext.Provider value={router as unknown as NextRouter}>
      <ObjectTypeSelectAndOverview activeObjectType={"SkylarkSet"} />
    </RouterContext.Provider>,
  );

  const episode = await screen.findByText("Episode");
  fireEvent.click(episode);

  await waitFor(() => {
    expect(router.push).toHaveBeenCalledTimes(1);
  });
  expect(router.push).toHaveBeenCalledWith(
    "/content-model/Episode",
    expect.any(Object),
  );
});
