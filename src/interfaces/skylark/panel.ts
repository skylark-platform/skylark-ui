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

export type ModifiedRelationshipsObject = Record<string, ModifiedRelationship>;

export type ModifiedContents = {
  original: SkylarkObjectContentObject[] | null;
  updated: AddedSkylarkObjectContentObject[] | null;
  config: {
    contentSortField: string | null;
    contentSortDirection: GQLSkylarkOrderDirections;
    contentLimit: number | null;
  } | null;
};

export type ModifiedAvailability = {
  added: SkylarkObject[];
  removed: string[];
};

export type ModifiedAvailabilityDimensions = Record<
  string,
  {
    added: string[];
    removed: string[];
  }
>;

export type ModifiedAvailabilitySegments = {
  added: SkylarkObject[];
  removed: string[];
};
