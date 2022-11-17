import { GQLInputField } from "src/interfaces/graphql/introspection";
import { SkylarkClient } from "src/lib/graphql/skylark/client";
import {
  GET_SKYLARK_OBJECT_INPUT_FIELDS,
  GET_SKYLARK_OBJECT_TYPES,
} from "src/lib/graphql/skylark/queries";

export const getSkylarkObjectInputFields = async (
  client: SkylarkClient,
  objectType: string,
): Promise<GQLInputField[]> => {
  const objectTypeInput = `${objectType}Input`;

  const { data } = await client.query<any>({
    query: GET_SKYLARK_OBJECT_INPUT_FIELDS,
    variables: { objectTypeInput },
  });

  return data?.__type?.inputFields;
};

export const getSkylarkObjectTypes = async (
  client: SkylarkClient,
): Promise<GQLInputField[]> => {
  const { data } = await client.query<any>({
    query: GET_SKYLARK_OBJECT_TYPES,
  });

  return data?.__schema?.types;
};
