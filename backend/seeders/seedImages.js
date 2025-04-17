const fs = require("fs");
const path = require("path");
const ftp = require("ftp");
const sequelize = require("../config/database");
const Product = require("../models/product");

// FTP Credentials (BigRock via cPanel)
const ftpConfig = {
  host: "static.cmtradingco.com", // Or use IP if needed
  user: "spsyn8lm",
  password: "R0ckl!m3!@#2025",
};

// Paths
const LOCAL_FOLDER = path.join(__dirname, "../img");
const REMOTE_FOLDER = "/public_html/static.cmtradingco.com/product_images/"; // The correct path for images

// FTP Client
const ftpClient = new ftp();

// Get image by company_code from the local folder
function getLocalImage(company_code) {
  const extensions = [".jpg", ".jpeg", ".png", ".webp"];
  for (const ext of extensions) {
    const filePath = path.join(LOCAL_FOLDER, company_code + ext);
    if (fs.existsSync(filePath)) {
      return { path: filePath, ext };
    }
  }
  return null;
}

// Get size of remote file (if exists)
function getRemoteFileSize(remotePath) {
  return new Promise((resolve) => {
    ftpClient.size(remotePath, (err, size) => {
      if (err) return resolve(null); // File doesn't exist
      resolve(size);
    });
  });
}

// Upload image to remote server
function uploadImage(localPath, remoteName) {
  return new Promise((resolve, reject) => {
    ftpClient.put(localPath, REMOTE_FOLDER + remoteName, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Remove old images from remote server (for cleanup)
function deleteOldImage(remoteName) {
  return new Promise((resolve, reject) => {
    ftpClient.delete(REMOTE_FOLDER + remoteName, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Main function
async function run() {
  await sequelize.sync(); // Ensure DB connection

  ftpClient.on("ready", async () => {
    console.log("🔐 FTP Connected");

    const products = await Product.findAll();

    for (const product of products) {
      const imageData = getLocalImage(product.company_code);
      if (!imageData) {
        console.log(`❌ No image found for ${product.company_code}`);
        continue;
      }

      const localSize = fs.statSync(imageData.path).size;
      const remoteName = product.company_code + imageData.ext;
      const remoteURL = `https://static.cmtradingco.com/product_images/${remoteName}`;

      const remoteSize = await getRemoteFileSize(REMOTE_FOLDER + remoteName);

      if (remoteSize !== localSize) {
        console.log(`⬆️ Uploading ${remoteName} (new or changed)`);
        await uploadImage(imageData.path, remoteName);

        // Remove old image if it exists
        if (product.images && product.images[0]) {
          const oldImage = product.images[0].split("/").pop();
          await deleteOldImage(oldImage); // Delete the old image
        }

        // Update product with new image link
        product.images = [remoteURL];
        product.isFeatured = true;
        await product.save();
      } else if (!product.images || !product.images.includes(remoteURL)) {
        console.log(`🔁 DB image URL not synced for ${product.company_code}`);
        product.images = [remoteURL];
        product.isFeatured = true;
        await product.save();
      } else {
        console.log(`⏭ ${remoteName} is already up to date`);
      }
    }

    ftpClient.end();
    console.log("✅ Image sync + DB update complete");
  });

  ftpClient.connect(ftpConfig);
}

run().catch(console.error);
