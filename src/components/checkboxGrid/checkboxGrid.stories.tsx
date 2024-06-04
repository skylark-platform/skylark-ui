import { CheckboxGrid, CheckboxOptionState } from "./checkboxGrid.component";

export default {
  title: "Components/CheckboxGrid",
  component: CheckboxGrid,
};

const options: CheckboxOptionState[] = Object.entries({
  Brand: true,
  Season: true,
  Episode: false,
  Person: false,
  Tag: false,
  Theme: false,
  Genre: false,
}).map(
  ([name, checked]): CheckboxOptionState => ({
    option: {
      label: name,
      value: name,
    },
    state: checked,
  }),
);

const allOptionsChecked = options.map(({ option: { value } }) => value);

export const Default = {
  args: {
    options,
    checkedOptions: [],
  },
};

export const DefaultChecked = {
  args: {
    options,
    checkedOptions: allOptionsChecked,
  },
};

export const WithLabel = {
  args: {
    label: "Checkbox Grid",
    options,
    checkedOptions: allOptionsChecked,
  },
};

export const WithToggleAll = {
  args: {
    withToggleAll: true,
    options,
    checkedOptions: allOptionsChecked,
  },
};
