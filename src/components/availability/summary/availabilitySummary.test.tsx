import {
  renderWithMinimalProviders,
  waitFor,
} from "src/__tests__/utils/test-utils";
import { UTC_NAME } from "src/components/inputs/select";
import { SearchType } from "src/hooks/useSearchWithLookupType";
import { formatReadableDateTime } from "src/lib/skylark/availability";

import { AvailabilitySummary } from "./availabilitySummary.component";

const defaultProps: {
  searchType: SearchType;
  query: string;
  objectTypes: string[] | null;
  language?: string | null;
  availability: {
    dimensions: Record<string, string> | null;
    timeTravel: { datetime: string; timezone: string } | null;
  };
} = {
  searchType: SearchType.Search,
  query: "",
  objectTypes: null,
  language: undefined,
  availability: {
    dimensions: null,
    timeTravel: null,
  },
};

test("shows a default string when minimal props are given", () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary {...defaultProps} />,
  );

  expect(container).toHaveTextContent("All object types");
});

test("shows all object types when objectTypes are null (haven't been fetched yet)", () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary {...defaultProps} objectTypes={null} />,
  );

  expect(container).toHaveTextContent("All object types");
});

test("shows object types when under 10 are given", () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary
      {...defaultProps}
      objectTypes={["Episode", "SkylarkSet", "Movie"]}
    />,
  );

  expect(container).toHaveTextContent("Episode, SkylarkSet & Movie objects");
});

test("shows number of object types when over 10 are given", () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary
      {...defaultProps}
      objectTypes={[
        "Episode",
        "SkylarkSet",
        "Movie",
        "SkylarkTag",
        "SkylarkAsset",
        "Season",
        "Brand",
        "Genre",
        "Theme",
        "SkylarkEPG",
        "Availability",
      ]}
    />,
  );

  expect(container).toHaveTextContent("11 object types");
});

test("shows query string", () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary {...defaultProps} query="My search query" />,
  );

  expect(container).toHaveTextContent(
    "All object types filtered by query “My search query”",
  );
});

test("shows UID string when searchType is UID/ExternalID", () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary
      {...defaultProps}
      searchType={SearchType.UIDExtIDLookup}
      query="MYTESTUID"
    />,
  );

  expect(container).toHaveTextContent(
    "All object types filtered by UID or External ID “MYTESTUID”",
  );
});

test("shows language", () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary {...defaultProps} language={"en-GB"} />,
  );

  expect(container).toHaveTextContent("All object types translated to en-GB");
});

test("shows Availability dimensions", () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary
      {...defaultProps}
      availability={{
        dimensions: { "customer-types": "premium", "device-types": "pc" },
        timeTravel: null,
      }}
    />,
  );

  expect(container).toHaveTextContent(
    "All object types available to premium & pc users",
  );
});

test("shows Availability time travel", () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary
      {...defaultProps}
      availability={{
        dimensions: null,
        timeTravel: {
          datetime: "2022-10-30T10:30",
          timezone: UTC_NAME,
        },
      }}
    />,
  );

  expect(container).toHaveTextContent(
    `All object types available on ${formatReadableDateTime(
      "2022-10-30T10:30",
    )}`,
  );
});

test("shows Availability dimensions and time travel", () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary
      {...defaultProps}
      availability={{
        dimensions: { "customer-types": "premium", "device-types": "pc" },
        timeTravel: {
          datetime: "2022-10-30T10:30",
          timezone: UTC_NAME,
        },
      }}
    />,
  );

  expect(container).toHaveTextContent(
    `All object types available to premium & pc users on ${formatReadableDateTime(
      "2022-10-30T10:30",
    )}`,
  );
});

test("shows all props", () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary
      {...defaultProps}
      objectTypes={["Episode", "SkylarkSet", "Movie"]}
      query="My search query"
      language={"en-GB"}
      availability={{
        dimensions: { "customer-types": "premium", "device-types": "pc" },
        timeTravel: {
          datetime: "2022-10-30T10:30",
          timezone: UTC_NAME,
        },
      }}
    />,
  );

  expect(container).toHaveTextContent(
    `Episode, SkylarkSet & Movie objects filtered by query “My search query” available to premium & pc users on ${formatReadableDateTime(
      "2022-10-30T10:30",
    )}`,
  );
});

test("Loads the UI config and shows the display object type and Dimension titles", async () => {
  const { container } = renderWithMinimalProviders(
    <AvailabilitySummary
      {...defaultProps}
      objectTypes={["Episode", "SkylarkSet", "Movie"]}
      query="My search query"
      language={"en-GB"}
      availability={{
        dimensions: { "customer-types": "premium", "device-types": "pc" },
        timeTravel: { datetime: "2022-10-30T10:30", timezone: UTC_NAME },
      }}
    />,
  );

  await waitFor(() => {
    expect(container).toHaveTextContent(" Setˢˡ");
    expect(container).toHaveTextContent("Premium & PC");
  });

  expect(container).toHaveTextContent(
    `Episode, Setˢˡ & Movie objects filtered by query “My search query” available to Premium & PC users on ${formatReadableDateTime(
      "2022-10-30T10:30",
    )} (Etc/UTC)`,
  );
});
