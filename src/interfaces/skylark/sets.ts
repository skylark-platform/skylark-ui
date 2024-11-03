import { SkylarkObjectType } from "./objectOperations";
import { ParsedSkylarkObject } from "./parsedObjects";

export interface DynamicSetObjectRule {
  objectType: SkylarkObjectType[];
  relationshipName: string;
  relatedUid?: string[]; // Last one has to have the UID included, previous ones are optional
  relatedObjects?: ParsedSkylarkObject[];
}

export interface DynamicSetRuleBlock {
  objectTypesToSearch: SkylarkObjectType[];
  objectRules: DynamicSetObjectRule[];
}

export interface DynamicSetConfig {
  objectTypes: SkylarkObjectType[];
  ruleBlocks: DynamicSetRuleBlock[];
}
