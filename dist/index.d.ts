import { ViteDevServer } from "vite";
type Config = {
    locales: string[];
    path: string;
    namespace?: string;
    translate?: boolean;
};
declare module "http" {
    interface IncomingMessage {
        body?: unknown;
    }
}
declare function handleI18NextRequest(config: Config): {
    name: string;
    apply: string;
    configureServer(server: ViteDevServer): void;
};
export { handleI18NextRequest };
