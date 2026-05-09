const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");

const products = require("./json-outputs/all_sheets_data.json");

// ---------------------------------------------------
// CONFIG
// ---------------------------------------------------
const BRAND_ID = "acbe7061-9b76-47d1-a509-e4b1f982a36f";

// ---------------------------------------------------
// STORAGE
// ---------------------------------------------------
const categoryMap = new Map();

const keywordMap = new Map();

const transformedProducts = [];

const productKeywords = [];

// prevent duplicate product-keyword mappings
const productKeywordSet = new Set();

// ---------------------------------------------------
// FIRST PASS → CREATE CATEGORY UUIDS
// ---------------------------------------------------
for (const item of products) {
  const categoryName = item.categoryId?.trim();

  if (!categoryName) continue;

  if (!categoryMap.has(categoryName)) {
    categoryMap.set(categoryName, {
      categoryId: uuidv4(),
      name: categoryName,
      slug: slugify(categoryName, {
        lower: true,
        strict: true,
      }),
      brandId: BRAND_ID,
      parentCategoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// ---------------------------------------------------
// SECOND PASS → CREATE PRODUCTS + KEYWORDS + MAPPINGS
// ---------------------------------------------------
for (const item of products) {
  const categoryName = item.categoryId?.trim();

  const category = categoryMap.get(categoryName);

  // ---------------------------------------------------
  // GENERATE PRODUCT ID
  // ---------------------------------------------------
  const productId = uuidv4();

  // ---------------------------------------------------
  // TRANSFORM PRODUCT
  // ---------------------------------------------------
  const transformedProduct = {
    ...item,

    productId,

    // replace category string with UUID
    categoryId: category?.categoryId || null,

    // optional for debugging
    categoryName: categoryName || null,
  };

  transformedProducts.push(transformedProduct);

  // ---------------------------------------------------
  // KEYWORDS
  // ---------------------------------------------------
  if (item.keywords && category) {
    item.keywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)
      .forEach((keywordName) => {
        // ---------------------------------------------------
        // CREATE KEYWORD ONCE
        // ---------------------------------------------------
        if (!keywordMap.has(keywordName)) {
          keywordMap.set(keywordName, {
            id: uuidv4(),
            keyword: keywordName,
            categoryId: category.categoryId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        const keyword = keywordMap.get(keywordName);

        // ---------------------------------------------------
        // CREATE PRODUCT KEYWORD RELATION
        // ---------------------------------------------------
        const relationKey = `${productId}-${keyword.id}`;

        if (!productKeywordSet.has(relationKey)) {
          productKeywordSet.add(relationKey);

          productKeywords.push({
            productId,
            keywordId: keyword.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
  }
}

// ---------------------------------------------------
// FINAL DATA
// ---------------------------------------------------
const result = {
  categories: [...categoryMap.values()],
  keywords: [...keywordMap.values()],
  products: transformedProducts,
  productKeywords,
};

// ---------------------------------------------------
// SAVE
// ---------------------------------------------------
fs.writeFileSync(
  path.join(__dirname, "seedable-data.json"),
  JSON.stringify(result, null, 2),
);

console.log("✅ Seedable data generated");

console.log(`
Categories: ${result.categories.length}
Keywords: ${result.keywords.length}
Products: ${result.products.length}
ProductKeyword Relations: ${result.productKeywords.length}
`);
