import { SkylarkObjectType } from "./objectOperations";

export interface DynamicSetObjectRule {
  objectType: SkylarkObjectType[];
  relationshipName: string;
  relatedUid?: string[]; // Last one has to have the UID included, previous ones are optional
}

export interface DynamicSetRuleBlock {
  objectTypesToSearch: SkylarkObjectType[];
  objectRules: DynamicSetObjectRule[];
}

export interface DynamicSetConfig {
  objectTypes: SkylarkObjectType[];
  ruleBlocks: DynamicSetRuleBlock[];
}
