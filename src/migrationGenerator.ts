import { SchemaChange } from "./types";
import { exec } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";

export async function generateMigration(
  schemaChanges: SchemaChange[],
  prismaSchemaPath: string
): Promise<void> {
  console.log(
    "Generating migration for schema changes:",
    JSON.stringify(schemaChanges, null, 2)
  );

  // Read existing schema
  let schemaContent = await fs.readFile(prismaSchemaPath, "utf-8");

  // Extract existing models
  const existingModels = schemaContent.match(/model\s+\w+\s*{[^}]*}/g) || [];
  const existingModelNames = existingModels
    .map((model) => model.match(/model\s+(\w+)/)?.[1])
    .filter(Boolean);

  console.log("Existing models:", existingModelNames);

  // Generate new model definitions
  const newSchemaContent = [
    schemaContent.split("model")[0].trim(), // Keep the header (generator, datasource)
    ...schemaChanges.map((change) => generateModelDefinition(change)),
  ].join("\n\n");

  console.log("Updated schema content:", newSchemaContent);

  // Write updated schema
  await fs.writeFile(prismaSchemaPath, newSchemaContent);

  // Run Prisma migration
  await runPrismaMigration(prismaSchemaPath);
}

function generateModelDefinition(change: SchemaChange): string {
  const hasIdField = change.fields.some((field) => field.name === "id");
  const fields = [
    ...(!hasIdField ? ["  id String @id @default(uuid())"] : []),
    ...change.fields.map(
      (field) =>
        `  ${field.name} ${field.type}${field.isOptional ? "?" : ""}${
          field.name === "id" ? " @id" : ""
        }`
    ),
  ].join("\n");

  return `model ${change.modelName} {\n${fields}\n}`;
}

async function runPrismaMigration(prismaSchemaPath: string): Promise<void> {
  const prismaClientPath = path.join(
    path.dirname(prismaSchemaPath),
    "..",
    "node_modules",
    ".prisma",
    "client"
  );

  // Generate Prisma client
  await new Promise<void>((resolve, reject) => {
    exec("npx prisma generate", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error generating Prisma client: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve();
    });
  });

  // Check if Prisma client was generated
  try {
    await fs.access(prismaClientPath);
  } catch (error) {
    console.error(
      "Prisma client not found. Make sure 'prisma generate' completed successfully."
    );
    throw error;
  }

  // Create a migration
  await new Promise<void>((resolve, reject) => {
    exec(
      "npx prisma migrate dev --create-only --name route_changes",
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error creating migration: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);
        resolve();
      }
    );
  });

  // Apply the migration
  return new Promise<void>((resolve, reject) => {
    exec("npx prisma migrate deploy", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve();
    });
  });
}
