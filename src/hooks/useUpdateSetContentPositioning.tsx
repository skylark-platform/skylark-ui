import { useMutation } from "@apollo/client";

import {
  ParsedSkylarkObjectContent,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { createUpdateSetContentPositionMutation } from "src/lib/graphql/skylark/dynamicMutations";
import { defaultValidBlankMutation } from "src/lib/graphql/skylark/dynamicQueries";

import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const useUpdateObjectContentPositioning = (
  objectType: SkylarkObjectType,
  contentObjects: ParsedSkylarkObjectContent["objects"],
) => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const mutation = createUpdateSetContentPositionMutation(
    objectOperations,
    contentObjects,
  );

  return useMutation(mutation || defaultValidBlankMutation);
};
