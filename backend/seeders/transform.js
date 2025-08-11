const fs = require("fs");
const path = require("path");
const Category = require("../models/category");
const sequelize = require("../config/database");

const inputFile = path.join(__dirname, "../transformed.json");
const outputFile = path.join(__dirname, "transformed2.json");

fs.readFile(inputFile, "utf8", async (err, data) => {
  if (err) {
    console.error("Error reading input file:", err);
    return;
  }

  let products;
  try {
    products = JSON.parse(data);
  } catch (parseError) {
    console.error("Error parsing JSON:", parseError);
    return;
  }

  try {
    await sequelize.authenticate();

    // 1. Collect all unique category names
    const categoryNames = [...new Set(products.map((p) => p.category))];

    // 2. Fetch matching categories from DB
    const categories = await Category.findAll({
      where: { name: categoryNames },
    });

    // 3. Build name → categoryId map
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.name] = cat.categoryId;
    });

    // 4. Replace category name with categoryId
    const updatedProducts = products.map((p) => ({
      ...p,
      category: categoryMap[p.category] || p.category, // Replace with UUID if found
    }));

    // 5. Save updated JSON
    fs.writeFile(
      outputFile,
      JSON.stringify(updatedProducts, null, 2),
      (writeErr) => {
        if (writeErr) {
          console.error("Error writing output file:", writeErr);
        } else {
          console.log(
            `✅ File saved as '${outputFile}' with category replaced by categoryId.`
          );
        }
      }
    );

    await sequelize.close();
  } catch (dbError) {
    console.error("Error fetching category IDs:", dbError);
  }
});
