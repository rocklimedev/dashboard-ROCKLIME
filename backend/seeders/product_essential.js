const fs = require("fs");
const products = require("../output.json");

// Function to clean up company codes
const cleanCompanyCodes = (products) => {
    return products.map(product => {
        // Ensure Company Code is populated
        if (!product["Company Code"] && product["Company Code_1"]) {
            product["Company Code"] = product["Company Code_1"];
        }
        
        // Remove Company Code_1
        delete product["Company Code_1"];

        return product;
    });
};

// Process Products
const cleanedProducts = cleanCompanyCodes(products);

// Write the cleaned data to cleaned.json
fs.writeFileSync("../cleaned.json", JSON.stringify(cleanedProducts, null, 2), "utf8");

console.log("✅ cleaned.json has been created with cleaned data!");
