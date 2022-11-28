import { useQuery } from "@apollo/client";

import { GQLSkylarkObjectTypesResponse } from "src/interfaces/graphql/introspection";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

export const useSkylarkObjectTypes = () =>
  useQuery<GQLSkylarkObjectTypesResponse>(GET_SKYLARK_OBJECT_TYPES);

// Returns the operations for a given object (createEpisode etc for Episode)
// Should be fast as it'll keep hitting the Apollo cache both requests noice
export const useSkylarkObjectOperations = () => "";
