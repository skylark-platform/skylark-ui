import { useMutation } from "@apollo/client";

import { SkylarkObjectType } from "src/interfaces/skylark";
import { createDeleteObjectMutation } from "src/lib/graphql/skylark/dynamicMutations";
import { defaultValidBlankMutation } from "src/lib/graphql/skylark/dynamicQueries";

import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const useDeleteObject = (objectType: SkylarkObjectType) => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const deleteObjectMutation = createDeleteObjectMutation(objectOperations);

  return useMutation(deleteObjectMutation || defaultValidBlankMutation);
};
