const fs = require("fs");
const path = require("path");
// Example product data (replace with actual data source)
const products = require("./backup/products_backup_2025-08-22T06-45-50-132Z.json"); // Assume products.json is in the same directory

// Categories mapping (id → slug)
const categories = [
  {
    id: "158dd2fa-7421-11f0-9e84-52540021303b",
    name: "Plumbing",
    slug: "plumbing",
  },
  {
    id: "94b8daf8-d026-4983-a567-85381c8faded",
    name: "Chemicals & Adhesive",
    slug: "chemicals_and_adhesive",
  },
  {
    id: "a733afe9-78ee-11f0-9e84-52540021303b",
    name: "Accessories & Add Ons",
    slug: "accessories_and_add_ons",
  },
  {
    id: "a73fa5fa-78ee-11f0-9e84-52540021303b",
    name: "Stone",
    slug: "stone",
  },
  {
    id: "dfe98ae0-3437-4d6b-933d-e51623b7dc34",
    name: "Tiles",
    slug: "tiles",
  },
  {
    id: "f7940b5e-8d97-43be-b37b-0fd6b56e431a",
    name: "CP Fittings & Sanitary",
    slug: "cp_fittings_and_sanitary",
  },
];

// Make quick lookup map (id → slug)
const idToSlug = categories.reduce((acc, c) => {
  acc[c.id] = c.slug;
  return acc;
}, {});

// Group products by parent category
const grouped = products.reduce((acc, product) => {
  const key = product.brand_parentcategoriesId || "unknown";
  if (!acc[key]) {
    acc[key] = [];
  }
  acc[key].push(product);
  return acc;
}, {});

// Ensure output directory exists
const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Write grouped products into files named by slug
Object.entries(grouped).forEach(([id, productList]) => {
  const slug = idToSlug[id] || "unknown";
  const filePath = path.join(outputDir, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(productList, null, 2));
  console.log(`✅ File written: ${filePath}`);
});
