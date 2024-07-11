import { watchRouteFiles } from "./fileWatcher";
import { analyzeRoutes } from "./routeAnalyzer";
import { inferSchemaChanges } from "./schemaInterface";
import { generateMigration } from "./migrationGenerator";

export function initMigrator(routesDir: string, prismaSchemaPath: string) {
  console.log("Express-Prisma-Migrator initialized.");
  console.log("Watching for route changes...");

  watchRouteFiles(routesDir, async (changedFiles) => {
    console.log("Detected changes in routes:", changedFiles);

    console.log("Analyzing routes...");
    const routeChanges = await analyzeRoutes(changedFiles);

    console.log("Inferring schema changes...");
    const schemaChanges = inferSchemaChanges(routeChanges);

    console.log("Generating migration...");
    await generateMigration(schemaChanges, prismaSchemaPath);

    console.log("Migration complete. Continuing to watch for changes...");
  });
}
