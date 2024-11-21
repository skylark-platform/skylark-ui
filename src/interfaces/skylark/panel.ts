import {
  AddedSkylarkObjectContentObject,
  ParsedSkylarkRelationshipConfig,
  SkylarkObject,
  SkylarkObjectContentObject,
} from "./parsedObjects";
import { GQLSkylarkOrderDirections } from "./responses";

export interface ModifiedRelationship {
  added: SkylarkObject[];
  removed: string[];
  config: Partial<ParsedSkylarkRelationshipConfig>;
}

export type ModifiedRelationshipsObject = Record<
  string,
  {
    added: SkylarkObject[];
    removed: string[];
    config: Partial<ParsedSkylarkRelationshipConfig>;
  }
>;

export type ModifiedContents = {
  original: SkylarkObjectContentObject[] | null;
  updated: AddedSkylarkObjectContentObject[] | null;
  config: {
    contentSortField: string | null;
    contentSortDirection: GQLSkylarkOrderDirections;
    contentLimit: number | null;
  } | null;
};
