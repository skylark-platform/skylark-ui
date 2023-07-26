import { fireEvent } from "@storybook/testing-library";

import GQLSkylarkUserAccountFixture from "src/__tests__/fixtures/skylark/queries/getUserAndAccount.json";
import { render, screen, waitFor } from "src/__tests__/utils/test-utils";

import { LanguageSelect } from "./languageSelect.component";

test("searches for en-GB", () => {
  const onChange = jest.fn();

  render(<LanguageSelect variant="primary" selected="" onChange={onChange} />);

  expect(screen.getByRole("combobox")).toHaveTextContent("");
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "en-G" },
  });

  const gotOptions = screen.queryAllByRole("option");
  expect(gotOptions.length).toBe(6);
  expect(gotOptions[0]).toHaveTextContent("en-GB");

  fireEvent.click(screen.getByText("en-GB"));

  expect(onChange).toHaveBeenCalledWith("en-GB");
});

test("lists only custom languages", async () => {
  const languages = ["en-GB", "pt-PT"];
  const onChange = jest.fn();

  render(
    <LanguageSelect
      variant="primary"
      selected=""
      onChange={onChange}
      languages={languages}
    />,
  );

  expect(screen.getByRole("combobox")).toHaveTextContent("");
  await fireEvent.click(screen.getByRole("button"));

  const gotOptions = screen.queryAllByRole("option");
  gotOptions.forEach((_, i) => {
    expect(gotOptions[i]).toHaveTextContent(languages[i]);
  });

  await fireEvent.click(screen.getByText(languages[0]));

  expect(onChange).toHaveBeenCalledWith(languages[0]);
});

test("changes to the user/account's default language when useDefaultLanguage is passed", async () => {
  const onChange = jest.fn();

  render(
    <LanguageSelect
      variant="primary"
      selected={undefined}
      onChange={onChange}
      useDefaultLanguage
    />,
  );

  await waitFor(() => {
    expect(onChange).toHaveBeenCalledWith(
      GQLSkylarkUserAccountFixture.data.getAccount.config.default_language,
    );
  });
});

test("does not change the selected value when when useDefaultLanguage is passed but selected is an empty string", async () => {
  const onChange = jest.fn();

  render(
    <LanguageSelect
      variant="primary"
      selected=""
      onChange={onChange}
      useDefaultLanguage
    />,
  );

  await waitFor(() => {
    expect(onChange).not.toHaveBeenCalledWith(
      GQLSkylarkUserAccountFixture.data.getAccount.config.default_language,
    );
  });
});
