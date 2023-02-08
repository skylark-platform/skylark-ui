export interface FlatfileTokenExchangeResponse {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    type: string;
  };
}

export interface FlatfileGetPortalsResponse {
  getEmbeds: {
    data: {
      name: string;
      id: string;
    }[];
  };
}

export interface FlatfileUpdatePortalResponse {
  updateEmbed: {
    name: string;
    id: string;
    privateKey: { id: string; scope: string; key: string };
  };
}

export interface FlatfileCreatePortalResponse {
  createEmbed: {
    embed: {
      name: string;
      id: string;
      privateKey: { id: string; scope: string; key: string };
    };
  };
}

export interface FlatfileGetTemplatesResponse {
  getSchemas: { data: { name: string; id: string }[] };
}

export interface FlatfileUpdateTemplateResponse {
  updateSchema: { name: string; id: string };
}

export interface FlatfileCreateTemplateResponse {
  createSchema: { name: string; id: string };
}

export interface FlatfileRow {
  id: number;
  status: string;
  valid: boolean;
  data: Record<string, string | boolean | null>;
}

export interface FlatfileGetFinalDatabaseViewResponse {
  getFinalDatabaseView: {
    rows: FlatfileRow[];
  };
}

export interface FlatfileObjectsCreatedInSkylark {
  [key: string]: { uid: string; external_id: string };
}
