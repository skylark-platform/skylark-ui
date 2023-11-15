import { screen, fireEvent, waitFor } from "@testing-library/react";

import { allObjectTypes, render } from "src/__tests__/utils/test-utils";

import { ObjectTypeNavigation } from "./contentModelNavigation.component";

test("renders the navigation and finds all Object Types", async () => {
  render(
    <ObjectTypeNavigation activeObjectType={null} setObjectType={jest.fn()} />,
  );

  await Promise.all(
    allObjectTypes.map(async (objectType) => {
      const text = await screen.findByText(objectType);
      expect(text).toBeInTheDocument();
    }),
  );
});

test("calls setObjectType on initial load when activeObjectType is null", async () => {
  const setObjectType = jest.fn();

  render(
    <ObjectTypeNavigation
      activeObjectType={null}
      setObjectType={setObjectType}
    />,
  );

  await waitFor(() => {
    expect(setObjectType).toHaveBeenCalledTimes(1);
  });

  expect(setObjectType).toHaveBeenCalledWith("SkylarkSet");
});

test("calls setObjectType when an object type is clicked", async () => {
  const setObjectType = jest.fn();

  render(
    <ObjectTypeNavigation
      activeObjectType={"SkylarkSet"}
      setObjectType={setObjectType}
    />,
  );

  const episode = await screen.findByText("Episode");
  fireEvent.click(episode);

  expect(setObjectType).toHaveBeenCalledTimes(1);
  expect(setObjectType).toHaveBeenCalledWith("Episode");
});