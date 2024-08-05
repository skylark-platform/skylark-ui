import {
  ParsedSkylarkObject,
  ParsedSkylarkRelationshipConfig,
} from "./parsedObjects";

export interface ModifiedRelationship {
  added: ParsedSkylarkObject[];
  removed: string[];
  config: Partial<ParsedSkylarkRelationshipConfig>;
}

export type ModifiedRelationshipsObject = Record<
  string,
  {
    added: ParsedSkylarkObject[];
    removed: string[];
    config: Partial<ParsedSkylarkRelationshipConfig>;
  }
>;
