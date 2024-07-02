import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DocumentNode } from "graphql";
import { useCallback } from "react";

import { QueryKeys } from "src/enums/graphql";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectVersionsResponse,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectVersionsQuery } from "src/lib/graphql/skylark/dynamicQueries";

import { GetObjectOptions } from "./useGetObject";

type SkylarkObjectVersion = {
  version: number;
  date: string;
  user: string;
  type: "language" | "global";
  fields: Record<string, SkylarkObjectMetadataField>;
};

type ModifiedFieldDiff = {
  field: string;
  values: {
    old: SkylarkObjectMetadataField;
    new: SkylarkObjectMetadataField;
  };
};

type CombinedSkylarkObjectVersion = Omit<
  SkylarkObjectVersion,
  "type" | "version"
> & {
  isInitialVersion: boolean;
  id: string;
  global: number;
  language: number;
  modifiedFields?: ModifiedFieldDiff[];
};

const parseGQLSkylarkVersion = (
  {
    version,
    created: { date, user },
    ...fields
  }: GQLSkylarkGetObjectVersionsResponse["getObjectVersions"]["_meta"]["global_data"]["history"][0],
  type: SkylarkObjectVersion["type"],
): SkylarkObjectVersion => ({
  version,
  date,
  user,
  type,
  fields,
});

const calculateModifiedFields = (
  version: CombinedSkylarkObjectVersion,
  index: number,
  arr: CombinedSkylarkObjectVersion[],
): CombinedSkylarkObjectVersion & { modifiedFields: ModifiedFieldDiff[] } => {
  const hasPreviousVersion = index > 0;

  if (hasPreviousVersion) {
    const previousVersion = arr[index - 1];

    const allFieldNames = [
      ...Object.keys(version.fields),
      ...Object.keys(previousVersion.fields),
    ].filter(
      (field, index, arr) => arr.findIndex((f) => f === field) !== index,
    );

    const changedModifiedFields = allFieldNames
      .map((field): ModifiedFieldDiff | null => {
        const newValue = version.fields?.[field] || null;
        const oldValue = previousVersion.fields?.[field] || null;

        if (newValue === oldValue) {
          return null;
        }

        return {
          field,
          values: {
            old: oldValue,
            new: newValue,
          },
        };
      })
      .filter((diff): diff is ModifiedFieldDiff => diff !== null);

    return {
      ...version,
      modifiedFields: changedModifiedFields,
    };
  }

  const allNewModifiedFields = Object.entries(version.fields)
    .filter(([, value]) => value !== null)
    .map(
      ([field, value]): ModifiedFieldDiff => ({
        field,
        values: { old: null, new: value },
      }),
    );

  return {
    ...version,
    modifiedFields: allNewModifiedFields,
  };
};

export const createGetObjectMetadataHistoryKeyPrefix = ({
  objectType,
  uid,
  language,
}: {
  objectType: string;
  uid: string;
} & GetObjectOptions) => [
  QueryKeys.GetObjectMetadataHistory,
  uid,
  objectType,
  language,
];

export const useGetObjectVersions = (
  objectType: SkylarkObjectType,
  uid: string,
  { language }: GetObjectOptions,
) => {
  const { objectOperations: objectMeta, isError: isObjectMetaError } =
    useSkylarkObjectOperations(objectType);

  const query = createGetObjectVersionsQuery(objectMeta, !!language);
  const variables = { uid, language };

  const { data, error, isLoading, isError } = useQuery<
    GQLSkylarkGetObjectVersionsResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectVersionsResponse>,
    {
      language: SkylarkObjectVersion[];
      global: SkylarkObjectVersion[];
      combined: CombinedSkylarkObjectVersion[];
    }
  >({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: createGetObjectMetadataHistoryKeyPrefix({
      objectType,
      uid,
      language,
    }),
    queryFn: async () =>
      skylarkRequest("query", query as DocumentNode, variables, {
        noDraftHeader: true,
      }),
    enabled: query !== null,
    select: useCallback((data: GQLSkylarkGetObjectVersionsResponse) => {
      const language = data.getObjectVersions._meta.language_data.history.map(
        (version) => parseGQLSkylarkVersion(version, "language"),
      );

      const global = data.getObjectVersions._meta.global_data.history.map(
        (version) => parseGQLSkylarkVersion(version, "global"),
      );

      const combinedDateVersions = [...global, ...language]
        .sort((a, b) => (dayjs(a.date).isAfter(b.date) ? 1 : -1))
        .reduce(
          (prev, { version, type, user, date, fields }, i) => {
            const currentVersions = {
              ...prev.current,
              [type]: version,
            };

            const combinedVersion: CombinedSkylarkObjectVersion = {
              ...currentVersions,
              id: `G${currentVersions.global}_L${currentVersions.language}`,
              user,
              date,
              isInitialVersion: i === 0,
              fields: {
                ...prev.valuesForAllFields,
                ...fields,
              },
            };

            if (prev.versions?.[date]) {
              return {
                versions: {
                  ...prev.versions,
                  [date]: {
                    ...prev.versions[date],
                    ...combinedVersion,
                    fields: {
                      ...prev.versions[date].fields,
                      ...combinedVersion.fields,
                    },
                  },
                },
                current: currentVersions,
                valuesForAllFields: combinedVersion.fields,
              };
            }

            return {
              versions: {
                ...prev.versions,
                [date]: combinedVersion,
              },
              current: currentVersions,
              valuesForAllFields: combinedVersion.fields,
            };
          },
          {
            versions: {},
            current: { language: 0, global: 0 },
            valuesForAllFields: {},
          } as {
            versions: Record<string, CombinedSkylarkObjectVersion>;
            current: Pick<CombinedSkylarkObjectVersion, "language" | "global">;
            // Keep a running total for all fields in case the date for a language version does not have a matching global version (field won't exist in the previous version)
            valuesForAllFields: Record<string, SkylarkObjectMetadataField>;
          },
        );

      const combined = Object.values(combinedDateVersions.versions)
        .map(calculateModifiedFields)
        .reverse();

      return {
        language,
        global,
        combined,
      };
    }, []),
  });

  return {
    error,
    versions: data,
    objectMeta,
    isLoading: (isLoading || !query) && !isObjectMetaError,
    isError: isError || isObjectMetaError,
    query,
    variables,
  };
};
