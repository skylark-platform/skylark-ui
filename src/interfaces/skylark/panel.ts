import {
  ParsedSkylarkRelationshipConfig,
  SkylarkObject,
} from "./parsedObjects";

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
