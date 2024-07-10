export const SEGMENT_KEYS = {
  panel: {
    tabChange: "panel:tabChange",
    objectChange: "panel:objectChange",
    historyForward: "panel:historyForward",
    historyPrevious: "panel:historyPrevious",
    closed: "panel:closed",
    save: "panel:save",
    purgeCache: "panel:purgeCache",
    openInNewTab: "panel:openInNewTab",
    objectDelete: "panel:objectDelete",
    integrations: {
      imageUploaded: "panel:integrations:imageUploaded",
      videoUploaded: "panel:integrations:videoUploaded",
    },
  },
  object: {
    created: "object:created",
  },
  drag: {
    contentLibrary: {
      started: "drag:contentLibrary:started",
      ended: "drag:contentLibrary:ended",
    },
    panelReorder: {
      started: "drag:panelReorder:started",
      ended: "drag:panelReorder:ended",
    },
    modifyFrozenSearchColumns: {
      started: "drag:modifyFrozenSearchColumns:started",
      ended: "drag:modifyFrozenSearchColumns:ended",
    },
  },
  objectSearch: {
    activeTabModified: "objectSearch:activeTabModified",
    tabsModified: "objectSearch:tabsModified",
    tabCreated: "objectSearch:tabCreated",
    tabDeleted: "objectSearch:tabDeleted",
    search: {
      filtersChanged: "objectSearch:search:filtersChanged",
    },
  },
  modals: {
    graphqlQueryModal: {
      open: "modals:graphqlQueryModal:open",
    },
    createObject: {
      open: "modals:createObject:open",
      close: "modals:createObject:close",
      objectTypeSelected: "modals:createObject:objectTypeSelected",
      created: "modals:createObject:created",
    },
    createTranslation: {
      open: "modals:createTranslation:open",
      close: "modals:createTranslation:close",
      objectTypeSelected: "modals:createTranslation:objectTypeSelected",
      created: "modals:createTranslation:created",
    },
  },
  ai: {
    fieldSuggestions: {
      populateFormField: "ai:fieldSuggestions:populateFormField",
      generateValuesRequest: "ai:fieldSuggestions:generateValuesRequest",
    },
  },
};
