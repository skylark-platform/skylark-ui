import { fireEvent } from "@storybook/testing-library";

import { render, screen } from "src/__tests__/utils/test-utils";

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

  expect(screen.getByRole("button")).toHaveTextContent("Language");
  await fireEvent.click(screen.getByRole("button"));

  const gotOptions = screen.queryAllByRole("option");
  gotOptions.forEach((_, i) => {
    expect(gotOptions[i]).toHaveTextContent(languages[i]);
  });

  await fireEvent.click(screen.getByText(languages[0]));

  expect(onChange).toHaveBeenCalledWith(languages[0]);
});
