import fs from "fs";
function setNestedProperty(obj, path, value) {
    const keys = path.split(".");
    keys.slice(0, -1).reduce((acc, key) => {
        if (!acc[key]) {
            acc[key] = {};
        }
        return acc[key];
    }, obj)[keys.at(-1)] = value;
    return obj;
}
export function saveMissing(filePath, path, value) {
    return new Promise(async (resolve, reject) => {
        // read input file
        const inputFile = await fs.promises
            .readFile(filePath, "utf8")
            .then((data) => {
            return { success: true, data: data };
        })
            .catch((err) => {
            console.error(err);
            return { success: false, data: null };
        });
        // and reject if it fails
        if (!inputFile.success || inputFile.data === null) {
            return reject({ statusCode: 500, statsMessage: "Error reading file" });
        }
        // parse the input file
        const parsedJson = (() => {
            try {
                const parsedData = JSON.parse(inputFile.data);
                return { success: true, data: parsedData };
            }
            catch (parseErr) {
                console.error(parseErr);
                return { success: false, data: null };
            }
        })();
        // and reject if it fails
        if (!parsedJson.success || parsedJson.data === null) {
            return reject({
                statusCode: 500,
                statsMessage: "Error parsing JSON",
            });
        }
        setNestedProperty(parsedJson.data, path, value);
        const data = await fs.promises
            .writeFile(filePath, JSON.stringify(parsedJson.data, null, 2), "utf8")
            .then((data) => {
            return { success: true, data: data };
        })
            .catch((writeErr) => {
            console.error(writeErr);
            return { success: false, data: null };
        });
        if (data.success) {
            console.log(`Added translation for ${path}`);
            return resolve({
                statusCode: 200,
                statsMessage: "Translation added successfully",
            });
        }
        else {
            return reject({
                statusCode: 500,
                statsMessage: "Error writing file",
            });
        }
    });
}
