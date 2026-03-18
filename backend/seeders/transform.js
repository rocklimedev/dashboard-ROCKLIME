const fs = require("fs");
const path = require("path");

const UUID_KEYS = [
  "d11da9f9-3f2e-4536-8236-9671200cca4a",
  "9ba862ef-f993-4873-95ef-1fef10036aa5",
];

function normalize(data) {
  return data.map((item) => {
    let meta =
      item.meta && typeof item.meta === "object" ? { ...item.meta } : {};

    UUID_KEYS.forEach((key) => {
      // Case 1: value exists at root → move to meta
      if (item[key] !== undefined) {
        // convert first UUID value to string
        meta[key] = key === UUID_KEYS[0] ? String(item[key]) : item[key];

        delete item[key];
      }

      // Case 2: already inside meta → just normalize type
      if (meta[key] !== undefined && key === UUID_KEYS[0]) {
        meta[key] = String(meta[key]);
      }
    });

    return {
      ...item,
      meta,
    };
  });
}

// ---- FILE ----
const inputPath = path.join(__dirname, "./updated_products.json");
const outputPath = path.join(__dirname, "output.json");

const raw = fs.readFileSync(inputPath, "utf-8");
const parsed = JSON.parse(raw);

const result = normalize(parsed);

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log("Fixed and moved UUID fields into meta");
