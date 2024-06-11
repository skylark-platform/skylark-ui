import { GraphiQLPlugin, useHeadersEditorState } from "@graphiql/react";
import { useCallback } from "react";

import { InputLabel } from "src/components/inputs";
import { Checkbox } from "src/components/inputs/checkbox";
import { LanguageSelect, Select } from "src/components/inputs/select";
import { HREFS, REQUEST_HEADERS } from "src/constants/skylark";
import { useAvailabilityDimensionsWithValues } from "src/hooks/availability/useAvailabilityDimensionWithValues";
import { convertSlugToDimensionHeader, hasProperty } from "src/lib/utils";

const parseExistingHeaders = (
  existingHeaders: string,
): Record<string, string> => {
  try {
    const json = JSON.parse(existingHeaders);
    return json;
  } catch {
    return {};
  }
};

const mergeHeaders = (existingHeaders: string, newHeaders: object) => {
  return {
    ...parseExistingHeaders(existingHeaders),
    ...newHeaders,
  };
};

const SkylarkHeadersPlugin = () => {
  const { dimensions } = useAvailabilityDimensionsWithValues();

  const [headers, setHeaders] = useHeadersEditorState();

  const formatAndSetHeaders = useCallback(
    (json: object) => {
      const str = JSON.stringify(json, null, 2);
      setHeaders(str);
    },
    [setHeaders],
  );

  const jsonHeaders = parseExistingHeaders(headers);

  return (
    <div className="">
      <h2 className="text-3xl font-medium mt-1">Skylark Settings</h2>
      <a
        className="my-1 block text-brand-primary text-xs underline"
        href={HREFS.apiDocs.headers}
        target="_blank"
        rel="noreferrer"
      >
        Learn about request headers in Skylark
      </a>

      <h3 className="text-lg mt-8 mb-2 font-medium">Request options</h3>
      <LanguageSelect
        className="mb-2"
        variant="primary"
        rounded={false}
        useDefaultLanguage={false}
        name="language-select"
        selected={jsonHeaders?.[REQUEST_HEADERS.language]}
        onChange={(updatedValue) =>
          formatAndSetHeaders(
            mergeHeaders(headers, {
              [REQUEST_HEADERS.language]: updatedValue,
            }),
          )
        }
        onValueClear={() => {
          delete jsonHeaders[REQUEST_HEADERS.language];
          formatAndSetHeaders(jsonHeaders);
        }}
      />
      <Checkbox
        name="ignore-availability-header"
        label="Ignore Availability"
        className="text-manatee-600 text-sm"
        checked={Boolean(jsonHeaders?.[REQUEST_HEADERS.ignoreAvailability])}
        onCheckedChange={(checked) => {
          if (checked) {
            formatAndSetHeaders(
              mergeHeaders(headers, {
                [REQUEST_HEADERS.ignoreAvailability]: 1,
              }),
            );
          } else {
            delete jsonHeaders[REQUEST_HEADERS.ignoreAvailability];
            formatAndSetHeaders(jsonHeaders);
          }
        }}
      />
      <Checkbox
        name="ignore-time-header"
        label="Ignore Time"
        className="text-manatee-600 text-sm mt-2"
        checked={Boolean(jsonHeaders?.[REQUEST_HEADERS.ignoreTime])}
        onCheckedChange={(checked) => {
          if (checked) {
            formatAndSetHeaders(
              mergeHeaders(headers, {
                [REQUEST_HEADERS.ignoreTime]: 1,
              }),
            );
          } else {
            delete jsonHeaders[REQUEST_HEADERS.ignoreTime];
            formatAndSetHeaders(jsonHeaders);
          }
        }}
      />
      <Checkbox
        name="bypass-cache-header"
        label="Bypass Cache"
        className="text-manatee-600 text-sm mt-2"
        checked={hasProperty(jsonHeaders, REQUEST_HEADERS.bypassCache)}
        onCheckedChange={(checked) => {
          if (checked) {
            formatAndSetHeaders(
              mergeHeaders(headers, {
                [REQUEST_HEADERS.bypassCache]: 1,
              }),
            );
          } else {
            delete jsonHeaders[REQUEST_HEADERS.bypassCache];
            formatAndSetHeaders(jsonHeaders);
          }
        }}
      />
      <Checkbox
        name="get-draft-objects"
        label="Get Draft Versions"
        className="text-manatee-600 text-sm mt-2"
        checked={Boolean(jsonHeaders?.[REQUEST_HEADERS.draft])}
        onCheckedChange={(checked) => {
          if (checked) {
            formatAndSetHeaders(
              mergeHeaders(headers, {
                [REQUEST_HEADERS.draft]: 1,
              }),
            );
          } else {
            delete jsonHeaders[REQUEST_HEADERS.draft];
            formatAndSetHeaders(jsonHeaders);
          }
        }}
      />

      <h3 className="text-lg mt-8 mb-2 font-medium">Availability</h3>
      {dimensions?.map(({ title, slug, values }) => (
        <div key={slug} className="w-auto mt-2 mb-4 text-manatee-600 text-sm">
          <InputLabel formatText text={title || slug} />
          <Select
            variant="primary"
            options={values.map((value) => ({
              label: value.title || value.slug,
              value: value.slug,
            }))}
            selected={jsonHeaders?.[convertSlugToDimensionHeader(slug)]}
            onChange={(updatedValue) =>
              formatAndSetHeaders(
                mergeHeaders(headers, {
                  [convertSlugToDimensionHeader(slug)]: updatedValue,
                }),
              )
            }
            onValueClear={() => {
              delete jsonHeaders[convertSlugToDimensionHeader(slug)];
              formatAndSetHeaders(jsonHeaders);
            }}
            placeholder={`Select ${title || slug || "Dimension"} value`}
            className="mt-1"
            renderInPortal
          />
        </div>
      ))}

      <div className="w-auto mt-2 mb-4 text-manatee-600 text-sm">
        <InputLabel text="Time travel" htmlFor="time-travel-input" />
        <input
          onChange={(e) => {
            const value = e.target.value;
            if (value) {
              formatAndSetHeaders(
                mergeHeaders(headers, {
                  [REQUEST_HEADERS.timeTravel]: value,
                }),
              );
            } else {
              delete jsonHeaders[REQUEST_HEADERS.timeTravel];
              formatAndSetHeaders(jsonHeaders);
            }
          }}
          id="time-travel-input"
          value={jsonHeaders?.[REQUEST_HEADERS.timeTravel] || ""}
          type="datetime-local"
          step="1"
          className={"h-8 w-full rounded bg-manatee-50 px-4 md:h-10"}
        />
      </div>
    </div>
  );
};

export const skylarkHeadersPlugin = (): GraphiQLPlugin => {
  return {
    title: "Skylark Settings",
    icon: () => (
      <svg
        viewBox="-4 0 90 70"
        fill="none"
        strokeWidth="5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 24C12 17.6348 14.5286 11.5303 19.0294 7.02944C23.5303 2.52856 29.6348 0 36 0H84C84 6.3652 81.4714 12.4697 76.9706 16.9706C72.4697 21.4714 66.3652 24 60 24H36C42.3652 24 48.4697 26.5286 52.9706 31.0294C57.4714 35.5303 60 41.6348 60 48H36C29.6348 48 23.5303 45.4714 19.0294 40.9706C14.5286 36.4697 12 30.3652 12 24Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M60 72H0C0 65.6348 2.52856 59.5303 7.02944 55.0294C11.5303 50.5286 17.6348 48 24 48H60L60 60Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M60 72C66.3652 72 72.4697 69.4714 76.9706 64.9706C81.4714 60.4697 84 54.3652 84 48C84 41.6348 81.4714 35.5303 76.9706 31.0294C72.4697 26.5286 66.3652 24 60 24H36C42.3652 24 48.4697 26.5286 52.9706 31.0294C57.4714 35.5303 60 41.6348 60 48V72Z"
        />
      </svg>
    ),
    content: () => <SkylarkHeadersPlugin />,
  };
};
