const ExcelJS = require("exceljs");
const AdmZip = require("adm-zip");
const fs = require("fs").promises;
const path = require("path");

// Config
const EXCEL_PATH = path.join(__dirname, "OnePager New MRP.xlsx");
const OUTPUT_IMAGE_DIR = path.join(__dirname, "../img");
const OUTPUT_JSON_PATH = path.join(__dirname, "../output.json");
const IMAGE_COLUMN = "A";
const EXTERNAL_IMAGE_DIR = "images";

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(OUTPUT_IMAGE_DIR, { recursive: true });
  await fs.mkdir(EXTERNAL_IMAGE_DIR, { recursive: true });
  console.log(`✅ Output directory ${OUTPUT_IMAGE_DIR} is writable`);
}

// Extract images from Excel (xl/media/)
async function extractImagesFromXlsx(xlsxPath) {
  const imageMap = {};
  try {
    const zip = new AdmZip(xlsxPath);
    const entries = zip.getEntries();
    const imageFiles = entries.filter((entry) =>
      entry.entryName.startsWith("xl/media/")
    );
    console.log(`Found ${imageFiles.length} image files in Excel`);

    imageFiles.forEach((entry, idx) => {
      try {
        const imgData = entry.getData();
        if (imgData.length > 0) {
          imageMap[idx + 1] = imgData;
          console.log(
            `Extracted image ${idx + 1}: ${entry.entryName}, size=${
              imgData.length
            } bytes`
          );
        } else {
          console.log(`⚠️ Empty image data for ${entry.entryName}`);
        }
      } catch (e) {
        console.log(
          `⚠️ Failed to extract image ${entry.entryName}: ${e.message}`
        );
      }
    });

    if (Object.keys(imageMap).length > 0) {
      const testImgData = Object.values(imageMap)[0];
      const testPath = path.join(OUTPUT_IMAGE_DIR, "test_image.png");
      await fs.writeFile(testPath, testImgData);
      console.log(`✅ Saved test image to ${testPath}`);
    }
    console.log(`✅ Total images extracted: ${Object.keys(imageMap).length}`);
  } catch (e) {
    console.log(`⚠️ Failed to process Excel as ZIP: ${e.message}`);
  }
  return imageMap;
}

// Clean and format price
function cleanPrice(price) {
  if (typeof price === "string") {
    const cleaned = price.replace("₹", "").replace(/,/g, "").trim();
    const value = parseFloat(cleaned);
    return isNaN(value) ? price : value;
  }
  return price;
}

// Save image to disk
async function saveImage(imgBytes, code, outputDir) {
  try {
    if (!imgBytes || imgBytes.length < 100) {
      console.log(
        `⚠️ Invalid image data for code ${code}: ${imgBytes.length} bytes`
      );
      return null;
    }
    const ext = "png"; // Adjust based on actual image type if needed
    const filename = `${code}.${ext}`;
    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, imgBytes);
    if (
      await fs
        .access(filepath)
        .then(() => true)
        .catch(() => false)
    ) {
      console.log(`✅ Saved image for code ${code}: ${filepath}`);
      return `./images/${filename}`;
    } else {
      console.log(`⚠️ Image file not found after saving: ${filepath}`);
      return null;
    }
  } catch (e) {
    console.log(`⚠️ Failed to save image for code ${code}: ${e.message}`);
    return null;
  }
}

// Main processing
async function main() {
  try {
    await ensureDirectories();

    // Load workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_PATH);

    // Check protection (limited support in exceljs)
    console.log(
      "⚠️ exceljs has limited protection detection. Check Excel manually for protection."
    );

    const imageMap = await extractImagesFromXlsx(EXCEL_PATH);
    const allData = [];

    // Load external images
    const externalImages = {};
    try {
      const files = await fs.readdir(EXTERNAL_IMAGE_DIR);
      files.forEach((file) => {
        if (file.match(/\.(png|jpg|jpeg)$/i)) {
          externalImages[file.split(".")[0]] = file;
        }
      });
      console.log(
        `Found ${
          Object.keys(externalImages).length
        } external images in ${EXTERNAL_IMAGE_DIR}`
      );
    } catch (e) {
      console.log(`⚠️ Failed to read external image directory: ${e.message}`);
    }

    for (const worksheet of workbook.worksheets) {
      let currentCategory = "";
      const imgCellMap = {};

      // Map images (exceljs doesn't directly support image anchors; use external images as primary)
      console.log(`Processing sheet: ${worksheet.name}`);

      for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
        const row = worksheet.getRow(rowNum);
        const rowValues = row.values || [];
        console.log(`Row ${rowNum} values: ${JSON.stringify(rowValues)}`);

        if (!rowValues.some((val) => val)) {
          console.log(`Skipping empty row ${rowNum}`);
          continue;
        }

        // Skip header rows
        if (
          rowValues.some(
            (val) =>
              typeof val === "string" &&
              ["NAME", "CODE", "PRICE"].includes(val.toUpperCase())
          )
        ) {
          console.log(
            `Skipping header row ${rowNum}: ${JSON.stringify(rowValues)}`
          );
          continue;
        }

        // Category detection
        if (
          rowValues[2] &&
          typeof rowValues[2] === "string" &&
          ["SHOWER TOILET", "E-BIDET", "TOILETS", "BIDET"].some((keyword) =>
            rowValues[2].toUpperCase().includes(keyword)
          )
        ) {
          currentCategory = rowValues[2];
          console.log(`Detected category in row ${rowNum}: ${currentCategory}`);
          continue;
        }

        // Extract data (columns B, C, D => index 2, 3, 4)
        const name = rowValues[2];
        const code = rowValues[3];
        const price = rowValues[4];

        if (!name || !code) {
          console.log(`Skipping row ${rowNum}: Missing name or code`);
          continue;
        }

        // Clean and format price
        const cleanedPrice = cleanPrice(price);
        const formattedPrice =
          typeof cleanedPrice === "number"
            ? `₹ ${cleanedPrice.toLocaleString("en-IN")}`
            : price;

        // Handle image
        let imagePath = null;

        // Try embedded image (simplified; exceljs image handling is limited)
        const key = `${rowNum}_1`;
        if (imageMap[Object.keys(imageMap)[rowNum - 1]]) {
          console.log(`Found embedded image for code ${code} at row ${rowNum}`);
          imagePath = await saveImage(
            imageMap[Object.keys(imageMap)[rowNum - 1]],
            code,
            OUTPUT_IMAGE_DIR
          );
        } else {
          console.log(
            `⚠️ No embedded image found for code ${code} at row ${rowNum}`
          );
        }

        // Try external image
        if (!imagePath) {
          const sanitizedCode = code
            .replace(/”/g, "")
            .replace(/ /g, "_")
            .replace(/\//g, "_");
          for (const variant of [code, sanitizedCode]) {
            if (externalImages[variant]) {
              const externalImgPath = path.join(
                EXTERNAL_IMAGE_DIR,
                externalImages[variant]
              );
              console.log(
                `Found external image for code ${code}: ${externalImgPath}`
              );
              const imgData = await fs.readFile(externalImgPath);
              imagePath = await saveImage(imgData, code, OUTPUT_IMAGE_DIR);
              break;
            }
          }
        }

        // Log column A content
        if (rowValues[1] != null) {
          console.log(`Column A content for code ${code}: ${rowValues[1]}`);
          if (rowValues[1] === "#VALUE!") {
            console.log(
              `⚠️ Column A contains #VALUE! for code ${code}, possibly due to a formula or protection`
            );
          }
        }

        // Push data
        allData.push({
          sheet: worksheet.name,
          category: currentCategory,
          name,
          code,
          price: formattedPrice,
          image_path: imagePath,
        });
      }
    }

    // Write JSON
    await fs.writeFile(
      OUTPUT_JSON_PATH,
      JSON.stringify(allData, null, 2),
      "utf-8"
    );
    console.log(
      `✅ Done. Extracted ${allData.length} items to ${OUTPUT_JSON_PATH}`
    );
  } catch (e) {
    console.error(`Fatal error: ${e.message}`);
    process.exit(1);
  }
}

main();
