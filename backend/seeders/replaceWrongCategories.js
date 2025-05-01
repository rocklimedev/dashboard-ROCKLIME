const fs = require("fs");
const path = require("path");
const Product = require("../models/product");
const Category = require("../models/category");

const WRONG_CATEGORY_ID = "748a1b48-aa57-440f-9d85-f6a544b094d5"; // Ceramics
const META_JSON_PATH = path.join(__dirname, "../output.json");
//category
// "0e718b1d-a0ab-47a7-bb51-021e522b5596"	"Sanitary"

// "748a1b48-aa57-440f-9d85-f6a544b094d5"	"Ceramics"

// "e84647d5-98d8-46b5-bbae-43e140ff81f2"	"Kitchen"
async function getCategoryMatch(segment, group) {
  const allCategories = await Category.findAll({ raw: true });

  const keywords = [
    ...(segment?.split(/\s+/) || []),
    ...(group?.split(/\s+/) || []),
  ]
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  for (const category of allCategories) {
    const name = category.name.toLowerCase();
    if (keywords.some((keyword) => name.includes(keyword))) {
      return category;
    }
  }

  return null;
}

async function replaceCategoryFromMeta() {
  // Step 1: Load metadata
  if (!fs.existsSync(META_JSON_PATH)) {
    console.error("❌ Meta JSON not found.");
    return;
  }

  const metaData = JSON.parse(fs.readFileSync(META_JSON_PATH, "utf-8"));
  const metaMap = new Map();

  for (const item of metaData) {
    const code = String(item["Company Code"] || item["Company Code_1"]);
    metaMap.set(code, item);
  }

  // Step 2: Fetch all products with wrong category
  const products = await Product.findAll({
    where: { categoryId: WRONG_CATEGORY_ID },
    raw: false,
  });

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const code = String(product.company_code);
    const meta = metaMap.get(code);

    if (!meta) {
      console.warn(`🚫 No meta found for code: ${code}`);
      skipped++;
      continue;
    }

    const segment = meta["Product Segment"];
    const group = meta["Product group"];

    const matchedCategory = await getCategoryMatch(segment, group);

    if (matchedCategory) {
      product.categoryId = matchedCategory.categoryId;
      await product.save();
      updated++;
      console.log(`✅ Updated ${code} → Category: ${matchedCategory.name}`);
    } else {
      console.warn(`❌ No category matched for ${code}`);
      skipped++;
    }
  }

  console.log("\n🎉 DONE");
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️ Skipped: ${skipped}`);
}

// Run
replaceCategoryFromMeta()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
