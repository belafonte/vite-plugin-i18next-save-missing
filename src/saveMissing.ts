import fs from "fs";
import translate from "translate";

export function saveMissing(
  filePath: string,
  newTranslation: { key: string },
  locale: string,
): Promise<{ statusCode: number; statsMessage: string }> {
  function setNestedProperty(
    obj: Record<string, any>,
    path: string,
    value: string,
  ): Record<string, any> {
    const keys = path.split(".");
    keys.slice(0, -1).reduce((acc: Record<string, any>, key: string) => {
      if (!acc[key]) {
        acc[key] = {};
      }
      return acc[key];
    }, obj)[keys.at(-1) as string] = value;

    return obj;
  }

  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", async (err, data) => {
      if (err) {
        console.error(err);
        reject({ statusCode: 500, statsMessage: "Error reading file" });
      }

      let namespace;
      try {
        namespace = JSON.parse(data);
      } catch (parseErr) {
        console.error(parseErr);
        reject({ statusCode: 500, statsMessage: "Error parsing JSON" });
      }

      const [arr] = Object.entries(newTranslation);
      const [key, value] = arr;

      const translated = await translate(value, locale).catch((err) => {
        console.error(err);
        reject({
          statusCode: 500,
          statsMessage:
            "Error translating - Translation Service not reachable?",
        });
        return "";
      });

      setNestedProperty(namespace, key, translated);

      fs.writeFile(
        filePath,
        JSON.stringify(namespace, null, 2),
        "utf8",
        (writeErr) => {
          if (writeErr) {
            console.error(writeErr);
            reject({ statusCode: 500, statsMessage: "Error writing file" });
          }

          console.log(`Added translation for key ${key}`);
          resolve({
            statusCode: 200,
            statsMessage: "Translation added successfully",
          });
        },
      );
    });
  });
}
