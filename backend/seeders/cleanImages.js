const axios = require("axios");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const Product = require("../models/product");

async function imageExistsInStatic(filename) {
  try {
    const url = `https://static.cmtradingco.com/product_images/${filename}`;
    const response = await axios.head(url, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function cleanProductImages() {
  try {
    console.log("Checking products...");

    const products = await Product.findAll({
      where: {
        images: {
          [Op.ne]: null,
        },
      },
    });

    console.log(`Found ${products.length} products with images.`);

    for (const product of products) {
      const images = product.images;

      if (!Array.isArray(images) || images.length === 0) continue;

      let hasValidImage = false;

      for (const img of images) {
        const filename = img.split("/").pop(); // just get the image name
        const exists = await imageExistsInStatic(filename);

        if (exists) {
          hasValidImage = true;
          break;
        }
      }

      if (!hasValidImage) {
        await Product.update(
          { images: [] },
          { where: { productId: product.productId } }
        );
        console.log(`Cleared images for productId ${product.productId}`);
      } else {
        console.log(`Valid image exists for productId ${product.productId}`);
      }
    }

    console.log("Image cleanup complete.");
  } catch (err) {
    console.error("Error during image cleanup:", err);
  } finally {
    await sequelize.close();
    console.log("Database connection closed.");
  }
}

cleanProductImages();
