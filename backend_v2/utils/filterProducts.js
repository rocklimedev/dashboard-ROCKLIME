const fs = require("fs").promises;
const path = require("path");

// Load your JSON data
const products = require("./products_backup.json");

// Raw company codes from your shared data
const rawCompanyCodes = [
  "26163001",
  "27577002",
  "27789002",
  "27788002",
  "23101000",
  "29062000",
  "27927001",
  "32743000",
  "29041000",
  "31368000",
  "36270000",
  "23802000",
  "27787002",
  "31234001",
  "29040000",
  "32856000",
  "29039000",
  "27786002",
  "32819000",
  "29042000",
  "32861000",
  "20197000",
  "27924001",
  "27794001",
  "23091000",
  "26021000",
  "28436002",
  "26018000",
  "37063000",
  "23605000",
  "2780310E",
  "29063000",
  "32734000",
  "20474000",
  "32747000",
  "32822000",
  "31221000",
  "20289000",
  "27578002",
  "23093000",
  "20237000",
  "23603000",
  "29081000",
  "32742000",
  "32857000",
  "27929002",
  "27575002",
  "27609001",
  "20471000",
  "27608001",
  "39377LS0",
  "27644001",
  "23090000",
  "28214003",
  "23586LS0",
  "29079000",
  "27796001",
  "26161001",
  "20473001",
  "26164001",
  "23636000",
  "26641000",
  "28286000",
  "128003",
  "27524000",
  "20292000",
  "27573002",
  "28636000",
  "26413000",
  "27475001",
  "36371000",
  "28405000",
  "27151000",
  "40374DA1",
  "20475000",
  "13139003",
  "26640000",
  "27594000",
  "28403000",
  "28620000",
  "20603SD0",
  "19796000",
  "28404000",
  "27273001",
  "26082002",
  "20286000",
  "27572002",
  "2338420E",
  "19998000",
  "13317001",
  "23741001",
  "42429000",
  "26329000",
  "28388000",
  "27272000",
  "26642000",
  "26333000",
  "28623000",
  "27849001",
  "26460000",
  "27467000",
  "26890000",
  "27597001",
  "3359230A",
  "23138AL0",
  "39374LS0",
  "23654000",
  "23656000",
  "27137000",
  "34565001",
  "34566001",
  "23058003",
  "19929000",
  "26085001",
  "28409001",
  "23658000",
  "46944001",
  "23303003",
  "39972000",
  "26450000",
  "39355SH0",
  "23310IG0",
  "28964001",
  "30215DC1",
  "13341IG0",
  "19929IG0",
  "23303003",
  "40966DL1",
  "19944IG0",
  "28155001",
  "26167000",
  "32043003",
  "28410001",
  "28626000",
  "23856DL1",
];

// Convert to a Set for faster lookups
const companyCodeSet = new Set(
  rawCompanyCodes.filter(Boolean).map((c) => c.toUpperCase())
);

// Filter products whose meta company code matches
const matchedProducts = products
  .filter((product) => {
    const code = product.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"];
    return code && companyCodeSet.has(code.toString().toUpperCase());
  })
  .map((product) => ({
    productId: product.productId,
    name: product.name,
    companyCode: product.meta["d11da9f9-3f2e-4536-8236-9671200cca4a"],
  }));

// Write the matched products to a JSON file
const outputFile = path.join(__dirname, "matched_products.json");

fs.writeFile(outputFile, JSON.stringify(matchedProducts, null, 2))
  .then(() =>
    console.log(
      `✅ Successfully wrote ${matchedProducts.length} products to matched_products.json`
    )
  )
  .catch((err) => console.error(err));
