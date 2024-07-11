import {
  RouteChange,
  SchemaChange,
  SchemaField,
  SchemaRelation,
} from "./types";

export function inferSchemaChanges(
  routeChanges: RouteChange[]
): SchemaChange[] {
  console.log("Route changes:", JSON.stringify(routeChanges, null, 2));

  const schemaChangeMap = new Map<string, SchemaChange>();

  for (const route of routeChanges) {
    const modelName = inferModelName(route.path);
    let schemaChange = schemaChangeMap.get(modelName) || {
      modelName,
      fields: [],
      relations: [],
    };

    // Infer fields from path params
    const paramFields = route.params.map((param) => ({
      name: param,
      type: "String",
      isOptional: false,
      isUnique: false,
    }));

    // Infer fields from request body
    const bodyFields = route.requestBody
      ? Object.entries(route.requestBody).map(([key, value]) => ({
          name: key,
          type: inferFieldType(value),
          isOptional: true,
          isUnique: false,
        }))
      : [];

    // Infer fields from response body
    const responseFields = route.responseBody
      ? Object.entries(route.responseBody).map(([key, value]) => ({
          name: key,
          type: inferFieldType(value),
          isOptional: true,
          isUnique: false,
        }))
      : [];

    // Combine all fields
    const allFields = [...paramFields, ...bodyFields, ...responseFields];

    // Infer relations (this is a simplified approach and might need refinement)
    const relations: SchemaRelation[] = allFields
      .filter((field) => field.type === "Object")
      .map((field) => ({
        name: field.name,
        type: "hasOne",
        relatedModel: capitalizeFirstLetter(field.name),
        isOptional: field.isOptional,
      }));

    // Remove fields that became relations
    const fields = allFields.filter((field) => field.type !== "Object");

    // Merge fields and remove duplicates
    schemaChange.fields = mergeFields(schemaChange.fields, fields);
    schemaChange.relations = mergeRelations(schemaChange.relations, relations);

    if (!schemaChange.fields.some((field) => field.name === "id")) {
      schemaChange.fields.unshift({
        name: "id",
        type: "String",
        isOptional: false,
        isUnique: true,
      });
    }

    schemaChangeMap.set(modelName, schemaChange);
  }

  const result = Array.from(schemaChangeMap.values());
  console.log("Inferred schema changes:", JSON.stringify(result, null, 2));
  return result;
}

function inferModelName(path: string): string {
  const segments = path
    .split("/")
    .filter((segment) => segment && !segment.startsWith(":"));
  const baseName =
    segments.length > 0 ? segments[segments.length - 1] : "Custom";
  return `${capitalizeFirstLetter(baseName)}Model`;
}

function inferFieldType(value: any): string {
  if (typeof value === "string") return "String";
  if (typeof value === "number") return "Int";
  if (typeof value === "boolean") return "Boolean";
  if (value instanceof Date) return "DateTime";
  if (typeof value === "object" && value !== null) return "Object";
  return "String"; // Default to String for complex types
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function mergeFields(
  existingFields: SchemaField[],
  newFields: SchemaField[]
): SchemaField[] {
  const fieldMap = new Map<string, SchemaField>();

  [...existingFields, ...newFields].forEach((field) => {
    if (fieldMap.has(field.name)) {
      const existingField = fieldMap.get(field.name)!;
      fieldMap.set(field.name, {
        ...existingField,
        isOptional: existingField.isOptional && field.isOptional,
        isUnique: existingField.isUnique || field.isUnique,
      });
    } else {
      fieldMap.set(field.name, field);
    }
  });

  return Array.from(fieldMap.values());
}

function mergeRelations(
  existingRelations: SchemaRelation[],
  newRelations: SchemaRelation[]
): SchemaRelation[] {
  const relationMap = new Map<string, SchemaRelation>();

  [...existingRelations, ...newRelations].forEach((relation) => {
    if (relationMap.has(relation.name)) {
      const existingRelation = relationMap.get(relation.name)!;
      relationMap.set(relation.name, {
        ...existingRelation,
        isOptional: existingRelation.isOptional && relation.isOptional,
      });
    } else {
      relationMap.set(relation.name, relation);
    }
  });

  return Array.from(relationMap.values());
}
