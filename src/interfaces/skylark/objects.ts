export type SkylarkObjectType = { name: string };
export type SkylarkObjectTypes = SkylarkObjectType[];
// a or b

export interface SkylarkObjectMeta {
  name: SkylarkObjectType;
  operations: {
    [key in "create" | "update" | "get" | "list" | "delete"]: {
      type: "Query" | "Mutation";
      name: string; // createEpisode, updateEpisode, getEpisode, listEpisodes, removeEpisode
      fieldsToReturn: string[]; // yeah fields to return
      inputs?: any; // Only required if its a mutation, will different if update or create
    };
  };
}

export interface SkylarkObjectOperations {
  [SkylarkObjectTypeName: string]: {
    [key in "create" | "update" | "get" | "list" | "delete"]: {
      type: "Query" | "Mutation";
      name: string; // createEpisode, updateEpisode, getEpisode, listEpisodes, removeEpisode
      fieldsToReturn: string[]; // yeah fields to return
      inputs?: any; // Only required if its a mutation, will different if update or create
    };
  };
}
