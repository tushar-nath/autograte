// src/migrator/routeAnalyzer.ts

import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as fs from "fs/promises";
import { RouteChange } from "./types";

export async function analyzeRoutes(files: string[]): Promise<RouteChange[]> {
  const routeChanges: RouteChange[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    const ast = parse(content, {
      sourceType: "module",
      plugins: ["typescript"],
    });

    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.type === "MemberExpression") {
          const { object, property } = path.node.callee;
          if (
            object.type === "Identifier" &&
            (object.name === "app" || object.name === "router") &&
            property.type === "Identifier" &&
            ["get", "post", "put", "delete"].includes(property.name)
          ) {
            const [routePath, handler] = path.node.arguments;
            if (routePath.type === "StringLiteral") {
              const routeChange: RouteChange = {
                path: routePath.value,
                method: property.name.toUpperCase() as
                  | "GET"
                  | "POST"
                  | "PUT"
                  | "DELETE",
                params: [],
                requestBody: {},
                responseBody: {},
              };

              // Extract params from path
              routeChange.params = routePath.value
                .split("/")
                .filter((segment) => segment.startsWith(":"))
                .map((param) => param.slice(1));

              // Analyze handler function for request and response body
              if (
                handler.type === "ArrowFunctionExpression" ||
                handler.type === "FunctionExpression"
              ) {
                traverse(
                  handler.body,
                  {
                    MemberExpression(innerPath) {
                      if (
                        innerPath.node.object.type === "Identifier" &&
                        innerPath.node.object.name === "req" &&
                        innerPath.node.property.type === "Identifier" &&
                        innerPath.node.property.name === "body"
                      ) {
                        routeChange.requestBody = {}; // Simplified: In reality, you'd need to analyze the usage of req.body
                      }
                      if (
                        innerPath.node.object.type === "Identifier" &&
                        innerPath.node.object.name === "res" &&
                        innerPath.node.property.type === "Identifier" &&
                        innerPath.node.property.name === "json"
                      ) {
                        routeChange.responseBody = {}; // Simplified: In reality, you'd need to analyze the argument of res.json()
                      }
                    },
                  },
                  path.scope,
                  path
                );
              }

              routeChanges.push(routeChange);
            }
          }
        }
      },
    });
  }

  return routeChanges;
}
