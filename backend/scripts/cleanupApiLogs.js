const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const mime = require("mime-types");

// Project root (../ from scripts/)
const ROOT = path.resolve(__dirname, "../scripts");

// Paths
const INPUT_FILE = path.join(ROOT, "json-outputs", "all_sheets_data2.json");
const OUTPUT_FILE = path.join(ROOT, "products_with_media.json");
const IMAGE_FOLDER = path.join(ROOT, "images");

console.log("Project Root :", ROOT);
console.log("Input File   :", INPUT_FILE);
console.log("Output File  :", OUTPUT_FILE);
console.log("Image Folder :", IMAGE_FOLDER);

// Check input file
if (!fs.existsSync(INPUT_FILE)) {
  console.error("\n❌ Input file not found:");
  console.error(INPUT_FILE);
  process.exit(1);
}

// Create images folder
if (!fs.existsSync(IMAGE_FOLDER)) {
  fs.mkdirSync(IMAGE_FOLDER, { recursive: true });
}

async function downloadImage(url, filePath) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    timeout: 30000,
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    writer.on("finish", () => resolve(response.headers));
    writer.on("error", reject);
  });
}

async function getExtension(url) {
  let ext = path.extname(new URL(url).pathname);

  if (ext) {
    return ext.toLowerCase();
  }

  try {
    const head = await axios.head(url);
    const type = head.headers["content-type"];

    const guessed = mime.extension(type);

    if (guessed) {
      return "." + guessed;
    }
  } catch {}

  return ".jpg";
}

(async () => {
  try {
    const products = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

    console.log(`\nFound ${products.length} products.\n`);

    const updatedProducts = [];

    for (let i = 0; i < products.length; i++) {
      const product = { ...products[i] };

      console.log(`[${i + 1}/${products.length}] ${product.name}`);

      if (!product.image_url) {
        console.log("  -> No image URL");
        updatedProducts.push(product);
        continue;
      }

      try {
        const ext = await getExtension(product.image_url);

        const filename = `${uuidv4()}${ext}`;

        const savePath = path.join(IMAGE_FOLDER, filename);

        await downloadImage(product.image_url, savePath);

        product.image_url = `https://media.cmtradingco.com/product_images/${filename}`;

        updatedProducts.push(product);

        console.log(`  ✓ Saved ${filename}`);
      } catch (err) {
        console.log(`  ✗ Failed: ${err.message}`);
        updatedProducts.push(product);
      }
    }

    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(updatedProducts, null, 2),
      "utf8",
    );

    console.log("\n====================================");
    console.log("✅ Finished");
    console.log(`Images: ${IMAGE_FOLDER}`);
    console.log(`JSON:   ${OUTPUT_FILE}`);
    console.log("====================================");
  } catch (err) {
    console.error(err);
  }
})();
