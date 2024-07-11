import { Command } from "commander";
import { initMigrator } from "./index";
import * as path from "path";

const program = new Command();

program
  .name("express-prisma-migrator")
  .description(
    "CLI to automatically generate Prisma migrations from Express route changes"
  )
  .version("1.0.0");

program
  .command("watch")
  .description(
    "Watch for changes in Express routes and generate Prisma migrations"
  )
  .option("-r, --routes <path>", "Path to the routes directory", "./routes")
  .option(
    "-s, --schema <path>",
    "Path to the Prisma schema file",
    "./prisma/schema.prisma"
  )
  .action((options) => {
    const routesPath = path.resolve(process.cwd(), options.routes);
    const schemaPath = path.resolve(process.cwd(), options.schema);
    console.log(`Watching for changes in ${routesPath}`);
    console.log(`Using Prisma schema at ${schemaPath}`);
    initMigrator(routesPath, schemaPath);
  });

program.parse(process.argv);
