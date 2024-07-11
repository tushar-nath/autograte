export interface RouteChange {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  params: string[];
  requestBody?: Record<string, any>;
  responseBody?: Record<string, any>;
}

export interface SchemaChange {
  modelName: string;
  fields: SchemaField[];
  relations: SchemaRelation[];
}

export interface SchemaField {
  name: string;
  type: string;
  isOptional: boolean;
  isUnique: boolean;
  defaultValue?: string | number | boolean;
}

export interface SchemaRelation {
  name: string;
  type: "hasOne" | "hasMany" | "belongsTo" | "manyToMany";
  relatedModel: string;
  isOptional: boolean;
}

export interface PrismaSchemaConfig {
  datasource: {
    provider: string;
    url: string;
  };
  generator: {
    provider: string;
    output?: string;
  };
}

export interface MigrationOptions {
  name?: string;
  dryRun?: boolean;
}

export interface FileWatcherOptions {
  ignored?: string | string[];
  persistent?: boolean;
}

export interface AnalyzerOptions {
  parseTypeScript?: boolean;
  includeComments?: boolean;
}

export interface InferenceOptions {
  defaultOptional?: boolean;
  inferRelations?: boolean;
}
