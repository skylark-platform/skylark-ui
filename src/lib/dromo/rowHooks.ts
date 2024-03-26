import { IRowHookInput } from "dromo-uploader-react";
import { RequestDocument } from "graphql-request";

import { REQUEST_HEADERS } from "src/constants/skylark";
import { ObjectTypeWithConfig } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkGetObjectResponse,
  GQLSkylarkSearchResponse,
  SkylarkGraphQLObject,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createGetObjectGenericQuery,
  createSearchObjectsQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import { hasProperty } from "src/lib/utils";

const lookupViaUidOrExternalID = async (
  allObjectsMeta: SkylarkObjectMeta[],
  objectType: string,
  queryString: string,
) => {
  const query = createGetObjectGenericQuery(allObjectsMeta, {
    typesToRequest: [objectType],
  });

  if (query) {
    const response = await skylarkRequest<GQLSkylarkGetObjectResponse>(
      "query",
      query as RequestDocument,
      {
        uid: queryString,
        externalId: queryString,
        language: "en-GB",
        dimensions: [],
      },
      {},
      { [REQUEST_HEADERS.ignoreAvailability]: "true", "x-force-get": "true" },
    );

    const object = response.getObject;

    console.log({ data: object });

    const selectOption = {
      label: queryString,
      value: object.uid,
    };

    return [selectOption];
  }

  return [];
};

const search = async (
  allObjectsMeta: SkylarkObjectMeta[],
  objectTypesWithConfig: ObjectTypeWithConfig[],
  objectType: string,
  queryString: string,
) => {
  const query = createSearchObjectsQuery(allObjectsMeta, {
    typesToRequest: [objectType],
  });

  if (query) {
    const response = await skylarkRequest<GQLSkylarkSearchResponse>(
      "query",
      query as RequestDocument,
      {
        queryString,
        limit: 10,
        offset: 0,
        language: "en-gb" || null,
      },
      {},
      { [REQUEST_HEADERS.ignoreAvailability]: "true" },
    );

    const objects = response.search.objects
      .filter((object): object is SkylarkGraphQLObject => !!object)
      .map(removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>);

    console.log({ data: objects });

    const primaryField = objectTypesWithConfig?.find(
      (otc) => otc.objectType === objectType,
    )?.config.primaryField;

    const selectOptions = objects.map((object) => {
      const customLabel =
        primaryField && hasProperty(object, primaryField)
          ? `${object[primaryField]}`
          : null;
      const label = customLabel || object.external_id || object.uid;

      return {
        label,
        value: object.uid,
      };
    });

    return selectOptions;
  }

  return [];
};

const createLookupFieldHook =
  (
    objectOperations: SkylarkObjectMeta,
    allObjectsMeta: SkylarkObjectMeta[],
    objectTypesWithConfig?: ObjectTypeWithConfig[],
  ) =>
  async (record: IRowHookInput, type: "update" | "init") => {
    const newRecord = record;

    if (!objectOperations) {
      return newRecord;
    }

    console.log("HERE", record.index, { record, type });

    await Promise.all(
      objectOperations.relationships.map(
        async ({ relationshipName, objectType }) => {
          // const relationshipName: string = "episodes";
          if (hasProperty(newRecord.row, relationshipName)) {
            // const value = newRecord.row[relationshipName].value;
            const values = newRecord.row[relationshipName].manyToOne;

            if (!values) {
              return;
            }

            newRecord.row[relationshipName].manyToOne = await Promise.all(
              values.map(
                async ({ value, resultValue, selectOptions, ...rest }) => {
                  // If value is already valid, return the current configuration (reduces requests to Skylark)
                  if (
                    selectOptions?.find(
                      (option) => option.value === resultValue,
                    )
                  ) {
                    return {
                      ...rest,
                      value,
                      resultValue,
                      selectOptions,
                    };
                  }

                  try {
                    const selectOptions = await lookupViaUidOrExternalID(
                      allObjectsMeta,
                      objectType,
                      value,
                    );

                    console.log(record.index, relationshipName, {
                      selectOptions,
                    });
                    // TODO show primary field in info message - so they can see what the record is in Skylark without changing their values

                    return {
                      resultValue: value,
                      value,
                      info: [
                        {
                          message:
                            "Exact match found via UID/External ID lookup & automatically selected",
                          level: "info",
                        },
                      ],
                      selectOptions,
                    };
                  } catch {
                    // On an update, make a search request if the original get request fails
                    if (type === "update") {
                      const selectOptions = await search(
                        allObjectsMeta,
                        objectTypesWithConfig || [],
                        objectType,
                        value,
                      );

                      return {
                        resultValue: value,
                        value,
                        info: [
                          {
                            message: "Found via Search",
                            level: "info",
                          },
                        ],
                        selectOptions,
                      };
                    }

                    return {
                      resultValue,
                      value,
                      info: [
                        {
                          message: "Invalid External ID or UID",
                          level: "error",
                        },
                      ],
                      selectOptions: [],
                    };
                  }
                },
              ),
            );

            if (!values) {
              return;
            }

            // await Promise.all(values.map((value) => {

            // }))
          }
        },
      ),
    );

    console.log("record updated", record.index, newRecord);

    // if (record.index < 10) {
    // if (
    //   newRecord.row.episodes &&
    //   newRecord.row.episodes.manyToOne &&
    //   newRecord.row.episodes.manyToOne.length > 0
    // ) {
    //   newRecord.row.episodes.value = "0" + newRecord.row.email.value;
    //   newRecord.row.episodes.info = [
    //     {
    //       message: "Prepend 0 to value",
    //       level: "info",
    //     },
    //   ];
    // }

    // }
    return newRecord;
  };

export const createDromoRowHooks = (
  objectOperations: SkylarkObjectMeta,
  allObjectsMeta: SkylarkObjectMeta[],
  objectTypesWithConfig?: ObjectTypeWithConfig[],
) => [
  createLookupFieldHook(
    objectOperations,
    allObjectsMeta,
    objectTypesWithConfig,
  ),
];
