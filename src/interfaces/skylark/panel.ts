import {
  ParsedSkylarkRelationshipConfig,
  SkylarkObjectIdentifier,
} from "./parsedObjects";

export interface ModifiedRelationship {
  added: SkylarkObjectIdentifier[];
  removed: string[];
  config: Partial<ParsedSkylarkRelationshipConfig>;
}

export type ModifiedRelationshipsObject = Record<
  string,
  {
    added: SkylarkObjectIdentifier[];
    removed: string[];
    config: Partial<ParsedSkylarkRelationshipConfig>;
  }
>;
