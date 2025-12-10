const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");

const brandId = "acbe7061-9b76-47d1-a509-e4b1f982a36f";
const rawData = require("./colston.json");

const parentMap = new Map();
const categoryMap = new Map();
const parentCategories = [];
const categories = [];

let currentParentId = null;
let currentCategoryId = null;

const transformedData = [];

for (const item of rawData) {
  const { parentcategories, row } = item;

  // ✅ New Parent Category
  if (parentcategories) {
    const normalizedParent = parentcategories.trim().toLowerCase();
    if (!parentMap.has(normalizedParent)) {
      const id = uuidv4();
      const slug = slugify(normalizedParent, { lower: true });
      parentMap.set(normalizedParent, id);
      parentCategories.push({
        id,
        name: parentcategories,
        slug,
      });
    }
    currentParentId = parentMap.get(normalizedParent);
  }

  // ✅ New Category
  if (row.length === 1 && typeof row[0] === "string") {
    const categoryName = row[0].trim().toLowerCase();
    const key = `${categoryName}::${currentParentId}`;
    if (!categoryMap.has(key)) {
      const id = uuidv4();
      const slug = slugify(categoryName, { lower: true });
      categoryMap.set(key, id);
      categories.push({
        id,
        name: row[0],
        slug,
        parentCategoryId: currentParentId,
        brandId,
      });
    }
    currentCategoryId = categoryMap.get(key);
    continue;
  }

  // ✅ Product row (replace category info with UUIDs)
  if (row.length === 5) {
    transformedData.push({
      parentCategoryId: currentParentId,
      categoryId: currentCategoryId,
      row,
    });
  }
}

// ✅ Save files
fs.writeFileSync(
  "parentCategories.json",
  JSON.stringify(parentCategories, null, 2)
);
fs.writeFileSync("categories.json", JSON.stringify(categories, null, 2));
fs.writeFileSync(
  "transformedData.json",
  JSON.stringify(transformedData, null, 2)
);

console.log(
  "✅ Done: Extracted parent categories, categories, and transformed raw data."
);
