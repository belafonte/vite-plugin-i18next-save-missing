import { NextFunction } from "express";
import { IncomingMessage, ServerResponse } from "http";
import { ViteDevServer } from "vite";
import path from "path";
import process from "process";
import bodyparser from "body-parser";
import { saveMissing } from "./saveMissing";

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
                const filePath = path.join(
                  process.cwd(),
                  "resources",
                  "public",
                  "inventory",
                  "static",
                  "locales",
                  locale,
                  "translation.json",
                );

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
