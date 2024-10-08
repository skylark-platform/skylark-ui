import {
  GraphiQLPlugin,
  useOperationsEditorState,
  useOptimisticState,
  useVariablesEditorState,
} from "@graphiql/react";
import { DocumentNode, Kind, OperationDefinitionNode, print } from "graphql";
import gql from "graphql-tag";
import { FiFilePlus } from "react-icons/fi";

import { ButtonWithDropdown } from "src/components/buttonWithDropdown";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import {
  BuiltInSkylarkObjectType,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import {
  createCreateObjectMutation,
  createDeleteObjectMutation,
  createUpdateObjectMetadataMutation,
} from "src/lib/graphql/skylark/dynamicMutations/objects";
import {
  createGetAllObjectsConfigQuery,
  createGetAllObjectsRelationshipConfigurationQuery,
  createGetObjectGenericQuery,
  createGetObjectQuery,
  createSearchObjectsQuery,
} from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_ACCOUNT_STATUS,
  GET_SKYLARK_OBJECT_TYPES,
  GET_USER_AND_ACCOUNT,
  LIST_OBJECT_TYPE_RELATIONSHIP_CONFIGURATION,
  SKYLARK_SCHEMA_INTROSPECTION_QUERY,
} from "src/lib/graphql/skylark/queries";

const generateQueries = (
  allObjectMeta: SkylarkObjectMeta[] | null,
): {
  queries: [string, DocumentNode | null, [string, DocumentNode | null][]][];
  mutations: [string, DocumentNode | null, [string, DocumentNode | null][]][];
} => {
  if (!allObjectMeta) {
    return {
      queries: [],
      mutations: [],
    };
  }

  const allObjectTypes = allObjectMeta
    ?.map(({ name }) => name)
    .filter((name) => name !== BuiltInSkylarkObjectType.SkylarkFavoriteList)
    .sort((name) => (name === BuiltInSkylarkObjectType.SkylarkAsset ? -1 : 1));

  // Search Queries
  const fullSearchQuery = createSearchObjectsQuery(allObjectMeta, {
    typesToRequest: [],
  });

  const objectTypeSearchQueries = allObjectTypes.map((objectType) => {
    const searchQuery = createSearchObjectsQuery(allObjectMeta, {
      typesToRequest: [objectType],
    });

    return [`Search ${objectType}`, searchQuery] as [
      string,
      DocumentNode | null,
    ];
  });

  // Get Object Queries
  const getGenericObjectQuery = createGetObjectGenericQuery(allObjectMeta, {
    typesToRequest: allObjectTypes,
  });

  const getObjectQueries = allObjectTypes.map((objectType) => {
    const objectMeta = allObjectMeta.find(
      ({ name }) => name === objectType,
    ) as SkylarkObjectMeta;

    const getObjectQuery = createGetObjectQuery(objectMeta, true);

    return [`Get ${objectType}`, getObjectQuery] as [
      string,
      DocumentNode | null,
    ];
  });

  // Create Object Mutations
  const createObjectMutations = allObjectTypes.map((objectType) => {
    const objectMeta = allObjectMeta.find(
      ({ name }) => name === objectType,
    ) as SkylarkObjectMeta;

    return [
      `Create ${objectType}`,
      createCreateObjectMutation(objectMeta, {}, true),
    ] as [string, DocumentNode | null];
  });

  // Update Object Mutations
  const updateObjectMutations = allObjectTypes.map((objectType) => {
    const objectMeta = allObjectMeta.find(
      ({ name }) => name === objectType,
    ) as SkylarkObjectMeta;

    return [
      `Update ${objectType}`,
      createUpdateObjectMetadataMutation(objectMeta, {}, true),
    ] as [string, DocumentNode | null];
  });

  // Delete Object Mutations
  const deleteObjectMutations = allObjectTypes.map((objectType) => {
    const objectMeta = allObjectMeta.find(
      ({ name }) => name === objectType,
    ) as SkylarkObjectMeta;

    return [
      `Delete ${objectType}`,
      createDeleteObjectMutation(objectMeta, true),
    ] as [string, DocumentNode | null];
  });

  const allObjectsConfigQuery = createGetAllObjectsConfigQuery(allObjectTypes);

  const allRelationshipConfigurationQuery =
    createGetAllObjectsRelationshipConfigurationQuery(
      allObjectTypes?.filter(
        (str) => str !== BuiltInSkylarkObjectType.SkylarkFavoriteList,
      ),
    );

  return {
    queries: [
      ["Search", fullSearchQuery, objectTypeSearchQueries],
      ["Get Object", getGenericObjectQuery, getObjectQueries],
      [
        "Account & User",
        GET_USER_AND_ACCOUNT,
        [
          ["Account Status", GET_ACCOUNT_STATUS],
          ["Object Types", GET_SKYLARK_OBJECT_TYPES],
          ["Introspection Query", gql(SKYLARK_SCHEMA_INTROSPECTION_QUERY)],
          ["All Objects Config", allObjectsConfigQuery],
          ["All Relationships Config", allRelationshipConfigurationQuery],
          [
            "Object Relationship Config",
            LIST_OBJECT_TYPE_RELATIONSHIP_CONFIGURATION,
          ],
        ],
      ],
    ],
    mutations: [
      [
        createObjectMutations[0][0],
        createObjectMutations[0][1],
        createObjectMutations.slice(1),
      ],
      [
        updateObjectMutations[0][0],
        updateObjectMutations[0][1],
        updateObjectMutations.slice(1),
      ],
      [
        deleteObjectMutations[0][0],
        deleteObjectMutations[0][1],
        deleteObjectMutations.slice(1),
      ],
    ],
  };
};

const QuerySelectors = ({
  queries,
  onQuerySelect,
}: {
  queries: [string, DocumentNode | null, [string, DocumentNode | null][]][];
  onQuerySelect: (query: DocumentNode | null) => void;
}) =>
  queries.map(([name, query, alternatives]) => (
    <ButtonWithDropdown
      key={name}
      variant="neutral"
      className="w-[90%] max-w-80"
      onClick={() => {
        onQuerySelect(query);
      }}
      options={alternatives.map(([alternativeName, alternativeQuery]) => ({
        id: alternativeName,
        text: alternativeName,
        onClick: () => onQuerySelect(alternativeQuery),
      }))}
    >
      {name}
    </ButtonWithDropdown>
  ));

const SkylarkQueriesPlugin = () => {
  const { objects } = useAllObjectsMeta();
  const { queries, mutations } = generateQueries(objects);

  const [, handleEditOperations] = useOptimisticState(
    useOperationsEditorState(),
  );

  const [, handleEditVariables] = useOptimisticState(useVariablesEditorState());

  const handleQueryWithSingleOperation = (query?: DocumentNode | null) => {
    if (query) {
      handleEditOperations(print(query));

      const operationDefinition = query.definitions?.find(
        (def) => def.kind === Kind.OPERATION_DEFINITION,
      ) as OperationDefinitionNode | undefined;
      const variableDefinitions = operationDefinition?.variableDefinitions;

      if (variableDefinitions) {
        const variables = variableDefinitions.map((def) => ({
          name: def.variable.name.value,
          type:
            def.type.kind === Kind.NON_NULL_TYPE &&
            def.type.type.kind === Kind.NAMED_TYPE &&
            def.type.type.name.value,
          isRequired: def.type.kind === Kind.NON_NULL_TYPE,
        }));

        const variablesJson = variables.reduce(
          (prev, variable) => ({
            ...prev,
            [variable.name]: variable.isRequired ? "" : null,
          }),
          {},
        );

        handleEditVariables(JSON.stringify(variablesJson, null, 2));
      }
    }
  };

  return (
    <div className="">
      <h2 className="text-3xl font-medium mt-1">Skylark UI Queries</h2>
      <p className="my-1 block text-brand-primary text-xs underline">
        Load Queries used in the Skylark UI
      </p>
      <div className="my-8 flex flex-col gap-4 w-full">
        <h3 className="text-lg font-medium">Queries</h3>
        <QuerySelectors
          queries={queries}
          onQuerySelect={handleQueryWithSingleOperation}
        />

        <h3 className="mt-6 text-lg font-medium">Mutations</h3>
        <QuerySelectors
          queries={mutations}
          onQuerySelect={handleQueryWithSingleOperation}
        />
      </div>
    </div>
  );
};

export const skylarkQueriesPlugin = (): GraphiQLPlugin => {
  return {
    title: "Skylark Queries",
    icon: () => <FiFilePlus stroke="currentColor" strokeWidth="1.2" />,
    content: () => <SkylarkQueriesPlugin />,
  };
};
