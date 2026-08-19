const {
  Op,
  User,
  Address,
  sequelize,
  path,
  ftp,
  sharp,
  uuidv4,
  logActivity,
  ActivityLog,
  excludeSensitiveFields,
  bufferToStream,
} = require("./user.helpers");

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      ...excludeSensitiveFields,
      include: [
        {
          model: Address,
          as: "address", // ← Must match your association alias in setupDB.js
          attributes: ["street", "city", "state", "postalCode", "country"], // optional: only return needed fields
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// UPDATE PROFILE (MANAGED TRANSACTION - BEST ONE)
// ========================
exports.updateProfile = async (req, res) => {
  try {
    const {
      username,
      name,
      email,
      mobileNumber,
      dateOfBirth,
      bloodGroup,
      emergencyNumber,
      shiftFrom,
      shiftTo,
      address,
      photo_thumbnail,
      photo_original,
    } = req.body;

    const updatedUser = await sequelize.transaction(async (t) => {
      const user = await User.findByPk(req.user.userId, { transaction: t });
      if (!user) throw new Error("User not found");

      // Check duplicate username/email
      if (username || email) {
        const exists = await User.findOne({
          where: {
            [Op.or]: [
              username ? { username } : null,
              email ? { email } : null,
            ].filter(Boolean),
            userId: { [Op.ne]: user.userId },
          },
          transaction: t,
        });
        if (exists) throw new Error("Username or Email already exists");
      }

      // Update fields
      Object.assign(user, {
        username: username ?? user.username,
        name: name ?? user.name,
        email: email ?? user.email,
        mobileNumber: mobileNumber ?? user.mobileNumber,
        dateOfBirth: dateOfBirth ?? user.dateOfBirth,
        bloodGroup: bloodGroup ?? user.bloodGroup,
        emergencyNumber: emergencyNumber ?? user.emergencyNumber,
        shiftFrom: shiftFrom ?? user.shiftFrom,
        shiftTo: shiftTo ?? user.shiftTo,
        photo_thumbnail: photo_thumbnail || user.photo_thumbnail,
        photo_original: photo_original || user.photo_original,
      });

      // Handle address
      // Handle address
      if (address) {
        if (user.addressId) {
          await Address.update(address, {
            where: { addressId: user.addressId },
            transaction: t,
          });
        } else {
          // FIX: Pass userId explicitly when creating
          const newAddr = await Address.create(
            {
              ...address,
              userId: user.userId, // ← THIS WAS MISSING!
            },
            { transaction: t },
          );
          user.addressId = newAddr.addressId;
        }
      }
      await user.save({ transaction: t });

      return await User.findByPk(user.userId, {
        ...excludeSensitiveFields,
        include: [{ model: Address, as: "address" }],
        transaction: t,
      });
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    const status =
      err.message === "User not found"
        ? 404
        : err.message.includes("already exists")
          ? 400
          : 500;
    res.status(status).json({ message: err.message || "Server Error" });
  }
};

/**
 * POST /users/photo
 * Body: multipart/form-data → field "photo"
 * Auth: logged-in user (req.user.userId)
 */
exports.uploadUserPhoto = async (req, res) => {
  try {
    // 1. Validate file
    if (!req.file)
      return res.status(400).json({ message: "No photo uploaded" });

    const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMime.includes(req.file.mimetype)) {
      return res
        .status(400)
        .json({ message: "Only JPEG, PNG, or WEBP images are allowed" });
    }

    // 2. Generate unique filenames
    const ext = path.extname(req.file.originalname);
    const uid = uuidv4();
    const originalName = `${uid}${ext}`;
    const thumbName = `${uid}_thumb${ext}`;

    // 3. Prepare FTP client
    const client = new ftp.Client();
    client.ftp.verbose = process.env.NODE_ENV === "development";

    let originalUrl, thumbUrl;
    try {
      await client.access({
        host: process.env.FTP_HOST,
        port: process.env.FTP_PORT || 21,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: process.env.FTP_SECURE === "true",
      });

      const uploadDir = "/user_photos";
      await client.ensureDir(uploadDir);
      await client.cd(uploadDir);

      // ---- Upload original ----
      await client.uploadFrom(bufferToStream(req.file.buffer), originalName);
      // Make it readable by Nginx
      await client.send(`SITE CHMOD 644 ${originalName}`);
      originalUrl = `https://media.cmtradingco.com${uploadDir}/${originalName}`;

      // ---- Create & upload thumbnail ----
      const thumbBuffer = await sharp(req.file.buffer)
        .resize(200, 200, { fit: "cover", withoutEnlargement: true })
        .toBuffer();

      await client.uploadFrom(bufferToStream(thumbBuffer), thumbName);
      await client.send(`SITE CHMOD 644 ${thumbName}`);
      thumbUrl = `https://media.cmtradingco.com${uploadDir}/${thumbName}`;
    } catch (ftpErr) {
      return res
        .status(500)
        .json({ message: "FTP upload failed", error: ftpErr.message });
    } finally {
      client.close();
    }

    // 4. Update user record
    const user = await User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.photo_original = originalUrl;
    user.photo_thumbnail = thumbUrl;
    await user.save();

    // 5. Return updated user (exclude sensitive fields)
    const safeUser = await User.findByPk(user.userId, {
      attributes: { exclude: ["password", "createdAt", "updatedAt"] },
    });

    return res.status(200).json({
      message: "Photo uploaded successfully",
      photo_original: originalUrl,
      photo_thumbnail: thumbUrl,
      user: safeUser,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
