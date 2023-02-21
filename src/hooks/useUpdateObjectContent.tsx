import { useMutation } from "@apollo/client";

import {
  GQLSkylarkUpdateObjectContentResponse,
  ParsedSkylarkObjectContentObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { createUpdateObjectContentMutation } from "src/lib/graphql/skylark/dynamicMutations";
import { defaultValidBlankMutation } from "src/lib/graphql/skylark/dynamicQueries";

import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "./useSkylarkObjectTypes";

export const useUpdateObjectContent = (
  objectType: SkylarkObjectType,
  objectUid: string,
  currentContentObjects: ParsedSkylarkObjectContentObject[],
  updatedContentObjects: ParsedSkylarkObjectContentObject[],
) => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const { objects } = useAllObjectsMeta();

  const mutation = createUpdateObjectContentMutation(
    objectOperations,
    currentContentObjects,
    updatedContentObjects,
    objects,
  );

  const [updateObjectContentMutation, { data, loading }] =
    useMutation<GQLSkylarkUpdateObjectContentResponse>(
      mutation || defaultValidBlankMutation,
    );

  const updateObjectContent = () =>
    updateObjectContentMutation({
      variables: { uid: objectUid },
    });

  return {
    updateObjectContent,
    data,
    loading,
  };
};
