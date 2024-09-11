import path from "path";
import process from "process";
import bodyparser from "body-parser";
import { saveMissing } from "./saveMissing.js";
import fs from "fs";
import translate from "translate";
// implement basic queue to handle multiple requests
const queue = [];
let isProcessing = false;
async function processQueue() {
    if (isProcessing || queue.length === 0)
        return;
    // Mark as processing
    isProcessing = true;
    const task = queue.shift(); // Get the first task from the queue
    // Run the task (which is the async function that does the file processing)
    if (task) {
        await task();
    }
    else {
        console.error("Queue Empty!");
    }
    // Mark as done processing
    isProcessing = false;
    // Process the next task
    processQueue();
}
function handleI18NextRequest(config) {
    return {
        name: "vite-plugin-i18next-save-missing",
        apply: "serve",
        configureServer(server) {
            server.middlewares.use(bodyparser.json());
            server.middlewares.use("/locales/add/", async (req, res, next) => {
                if (req.method === "POST") {
                    // create task and add it to queue
                    const task = async () => {
                        for (const locale of config.locales) {
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
                                    await fs.promises.writeFile(filePath, JSON.stringify({}), "utf8");
                                    console.log(`Translation file has been created at: ${filePath}`);
                                }
                                catch (error) {
                                    console.error("Error creating file:", error);
                                    res.statusCode = 500;
                                    res.end("Error creating file - Translation file could not be created!");
                                }
                            }
                            // descructure the newTranslation object { key: value }
                            // TODO: validate with zod
                            const message = req.body;
                            const [arr] = Object.entries(message);
                            let [objPath, value] = arr;
                            if (config.translate) {
                                await translate(value, {
                                    to: locale.slice(0, 2),
                                    from: config.translateFrom || "en",
                                })
                                    .then((data) => {
                                    value = data;
                                })
                                    .catch((err) => {
                                    console.error(err);
                                    res.statusCode = 500;
                                    res.end("Error translating - Translation Service not reachable?");
                                });
                            }
                            await saveMissing(filePath, objPath, value)
                                .then((response) => {
                                res.statusCode = response.statusCode;
                                res.end(response.statsMessage);
                            })
                                .catch((err) => {
                                res.statusCode = err.statusCode;
                                res.end(err.statsMessage);
                            });
                        }
                    };
                    // Push the task into the queue
                    queue.push(task);
                    // Start processing the queue (if not already processing)
                    !isProcessing && processQueue();
                }
                else {
                    next();
                }
            });
        },
    };
}
export { handleI18NextRequest };
