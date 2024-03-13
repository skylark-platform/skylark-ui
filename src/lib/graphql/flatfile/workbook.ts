import { Flatfile } from "@flatfile/api";

import {
  NormalizedObjectField,
  SkylarkObjectMeta,
  SkylarkObjectRelationship,
  SkylarkSystemField,
} from "src/interfaces/skylark";

export const workbook: Flatfile.CreateWorkbookConfig = {
  name: "All Data",
  labels: ["pinned"],
  sheets: [
    {
      name: "Contacts",
      slug: "contacts",
      fields: [
        {
          key: "firstName",
          type: "string",
          label: "First Name",
        },
        {
          key: "lastName",
          type: "string",
          label: "Last Name",
        },
        {
          key: "email",
          type: "string",
          label: "Email",
        },
      ],
    },
  ],
  actions: [
    {
      operation: "submitActionFg",
      mode: "foreground",
      label: "Submit foreground",
      description: "Submit data to webhook.site",
      primary: true,
    },
  ],
};

const convertObjectInputFieldToFlatfileProperty = (
  field: NormalizedObjectField,
) => {
  const defaultField: Flatfile.Property = {
    key: field.name,
    label: field.name,
    type: "string",
  };

  if (field.name === SkylarkSystemField.ExternalID) {
    defaultField.constraints = [
      {
        type: "unique",
      },
    ];
  }

  if (field.name === SkylarkSystemField.UID) {
    defaultField.readonly = true;
  }

  if (field.type === "enum") {
    const options: Flatfile.EnumPropertyOption[] =
      field.enumValues?.map((value) => ({ label: value, value })) || [];
    return {
      ...defaultField,
      type: "enum",
      config: {
        options,
      },
    } satisfies Flatfile.Property.Enum;
  }

  switch (field.type) {
    case "int":
    case "float":
      return {
        ...defaultField,
        type: "number",
        config: {
          decimalPlaces: field.type === "int" ? 0 : undefined,
        },
      } satisfies Flatfile.Property.Number;

    case "boolean":
      return {
        ...defaultField,
        config: {
          allowIndeterminate: false,
        },
        type: "boolean",
      } satisfies Flatfile.Property.Boolean;

    // case "phone":
    //   return {
    //     label: field?.name,
    //     type: "string",
    //     format: "phone",
    //   } as Flatfile.Property.String;

    // case "email":
    //   return {
    //     label: field?.name,
    //     type: "string",
    //     format: "email",
    //   } as Flatfile.Property.String;

    // case "url":
    //   return {
    //     label: field?.name,
    //     type: "string",
    //     regexp: {
    //       pattern: INPUT_REGEX.url,
    //       flags: "isg",
    //       ignoreBlanks: true,
    //     },
    //   } as Flatfile.Property.String;

    // case "ipaddress":
    //   return {
    //     label: field?.name,
    //     type: "string",
    //     regexp: {
    //       pattern: INPUT_REGEX.ipaddress,
    //       flags: "isg",
    //       ignoreBlanks: true,
    //     },
    //   } as Flatfile.Property.String;

    default:
      return {
        ...defaultField,
        type: "string",
      } satisfies Flatfile.Property.String;
  }
};

const convertRelationshipToReferenceField = (
  relationship: SkylarkObjectRelationship,
) => {
  return {
    label: relationship.relationshipName,
    key: relationship.relationshipName,
    type: "reference",
    config: {
      // id: relationship.relationshipName,
      // key: relationship.relationshipName,
      key: SkylarkSystemField.ExternalID,
      relationship: "has-many",
      ref: relationship.objectType,
    },
  } satisfies Flatfile.Property.Reference;
};

export const createObjectsWorkbook = (allObjectsMeta: SkylarkObjectMeta[]) => {
  const sheets = allObjectsMeta.map(
    ({ name, fields, relationships }): Flatfile.SheetConfig => {
      const sheetFields = [
        ...fields.map(convertObjectInputFieldToFlatfileProperty),
        ...relationships.map(convertRelationshipToReferenceField),
      ];

      return {
        name,
        slug: name,
        fields: sheetFields,
      };
    },
  );

  console.log({ sheets });

  const objectsWorkbook: Flatfile.CreateWorkbookConfig = {
    name: "Skylark Objects",
    sheets,
    actions: [
      {
        operation: "submitActionFg",
        mode: "foreground",
        label: "Sync with Skylark",
        description: "Submit data to webhook.site",
        primary: true,
      },
    ],
  };

  return objectsWorkbook;
};
