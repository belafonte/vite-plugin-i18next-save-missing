import { NextFunction } from "express";
import { IncomingMessage, ServerResponse } from "http";
import { ViteDevServer } from "vite";
import path from "path";
import process from "process";
import bodyparser from "body-parser";
import { saveMissing } from "./saveMissing.js";
import fs from "fs";

type Config = {
  locales: string[];
  path: string;
  namespace?: string;
  translate?: boolean;
};

// Extend the ServerResponse interface with body from bodyparser
declare module "http" {
  interface IncomingMessage {
    body?: any;
  }
}

function handleI18NextRequest(config: Config) {
  return {
    name: "vite-plugin-i18next-save-missing",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(bodyparser.json());
      server.middlewares.use(
        "/locales/add/",
        async (
          req: IncomingMessage,
          res: ServerResponse,
          next: NextFunction,
        ) => {
          if (req.method === "POST") {
            await Promise.all(
              config.locales.map(async (locale) => {
                const pathSegments = config.path.split("/");

                const args = [
                  process.cwd(),
                  ...pathSegments,
                  locale,
                  `${config.namespace || "translate"}.json`,
                ];

                const filePath = path.join(...args);

                const fileExists = await fs.promises
                  .access(filePath, fs.constants.F_OK)
                  .then(() => true)
                  .catch(() => false);

                if (!fileExists) {
                  try {
                    // Get the directory name from the file path
                    const dir = path.dirname(filePath);
                    // Create the directory if it doesn't exist (recursive: true allows creating nested directories)
                    await fs.promises.mkdir(dir, { recursive: true });
                    // Write the file
                    await fs.promises.writeFile(
                      filePath,
                      JSON.stringify({}),
                      "utf8",
                    );
                    console.log(
                      `Translation file has been created at: ${filePath}`,
                    );
                  } catch (error) {
                    console.error("Error creating file:", error);
                  }
                }

                await saveMissing(filePath, req.body, locale)
                  .then((response) => {
                    res.statusCode = response.statusCode;
                    res.end(response.statsMessage);
                  })
                  .catch((err) => {
                    res.statusCode = err.statusCode;
                    res.end(err.statsMessage);
                  });
              }),
            );
          } else {
            next();
          }
        },
      );
    },
  };
}

export { handleI18NextRequest };
