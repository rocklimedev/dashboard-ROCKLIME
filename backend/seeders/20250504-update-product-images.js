"use strict";
const fs = require("fs").promises;
const path = require("path");
const ftp = require("basic-ftp");
const axios = require("axios");
const sequelize = require("../config/database");
require("dotenv").config();

async function updateProductImages(companyCode = null) {
  const IMAGE_DIR = path.resolve(__dirname, "../img");
  const IMAGE_SERVER_URL = "https://static.cmtradingco.com/product_images/";
  const FTP_HOST = "119.18.54.19";
  const FTP_USER = "spsyn8lm";
  const FTP_PASSWORD = "R0ckl!m3!@#2025";
  const FTP_DEST_DIR = "/public_html/product_images";

  // Check if image exists on server
  async function checkImageExists(companyCode, format = "png") {
    const url = `${IMAGE_SERVER_URL}${companyCode}.${format}`;
    try {
      const response = await axios.head(url);
      console.log(`Checked ${url}: Status ${response.status}`);
      return response.status === 200 ? url : null;
    } catch (error) {
      console.error(
        `⚠️ Failed to check image for ${companyCode}.${format}: ${
          error.response?.status || error.message
        }`
      );
      return null;
    }
  }

  // Upload image via FTP
  async function uploadImage(filePath, companyCode, format = "png") {
    const client = new ftp.Client();
    try {
      await client.access({
        host: FTP_HOST,
        user: FTP_USER,
        password: FTP_PASSWORD,
        secure: false, // Set to true for FTPS if required
      });
      const filename = `${companyCode}.${format}`;
      await client.ensureDir(FTP_DEST_DIR);
      await client.uploadFrom(filePath, `${FTP_DEST_DIR}/${filename}`);
      console.log(`✅ Uploaded ${filename} to ${FTP_DEST_DIR}`);
      return `${IMAGE_SERVER_URL}${filename}`;
    } catch (error) {
      console.error(
        `⚠️ Failed to upload image for ${companyCode}: ${error.message}`
      );
      return null;
    } finally {
      client.close();
    }
  }

  try {
    // Verify image directory
    try {
      await fs.access(IMAGE_DIR);
    } catch (error) {
      throw new Error(
        `Image directory ${IMAGE_DIR} does not exist or is inaccessible`
      );
    }

    // Read local images
    const files = await fs.readdir(IMAGE_DIR);
    const imageFiles = files.filter((file) => file.match(/\.(png|jpg|jpeg)$/i));
    console.log(`Found ${imageFiles.length} images in ${IMAGE_DIR}`);

    // Get products
    let products;
    if (companyCode) {
      products = await sequelize.query(
        "SELECT company_code FROM products WHERE company_code = :companyCode",
        {
          replacements: { companyCode },
          type: sequelize.QueryTypes.SELECT,
        }
      );
    } else {
      products = await sequelize.query("SELECT company_code FROM products", {
        type: sequelize.QueryTypes.SELECT,
      });
    }
    console.log(`Found ${products.length} products in database`);

    for (const product of products) {
      const companyCode = product.company_code;
      let imageUrl = null;

      // Check for local image
      const localImage = imageFiles.find((file) => {
        const baseName = file.split(".")[0];
        return (
          baseName === companyCode ||
          baseName.toLowerCase().includes(companyCode.toLowerCase())
        );
      });

      if (localImage) {
        const filePath = path.join(IMAGE_DIR, localImage);
        const format = path.extname(localImage).slice(1).toLowerCase();
        console.log(`Found local image for ${companyCode}: ${localImage}`);

        // Upload local image
        imageUrl = await uploadImage(filePath, companyCode, format);
      } else {
        // Check if image exists on server
        const formats = ["png", "jpg", "jpeg"];
        for (const format of formats) {
          imageUrl = await checkImageExists(companyCode, format);
          if (imageUrl) {
            console.log(`Found existing image for ${companyCode}: ${imageUrl}`);
            break;
          }
        }
      }

      // Update database
      if (imageUrl) {
        await sequelize.query(
          "UPDATE products SET images = :images WHERE company_code = :companyCode",
          {
            replacements: {
              images: JSON.stringify([imageUrl]),
              companyCode,
            },
            type: sequelize.QueryTypes.UPDATE,
          }
        );
        console.log(`✅ Updated product ${companyCode} with image ${imageUrl}`);
      } else {
        console.log(
          `⚠️ No image found for ${companyCode} locally or on server`
        );
      }
    }

    console.log("✅ Image update completed");
    return { status: "success", updated: products.length };
  } catch (error) {
    console.error(`⚠️ Image update failed: ${error.message}`);
    throw error;
  }
}

module.exports = updateProductImages;

// Run the function if executed directly
if (require.main === module) {
  (async () => {
    try {
      await updateProductImages();
      await sequelize.close();
    } catch (error) {
      console.error("Script execution failed:", error.message);
      process.exit(1);
    }
  })();
}
