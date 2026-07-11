const { Op } = require("sequelize");
const { User, Address } = require("../models");
const sequelize = require("../config/database");

const excludeSensitiveFields = {
  attributes: {
    exclude: ["password", "createdAt", "updatedAt"],
  },
};

/**
 * Update user profile (by the user themselves)
 */
exports.updateProfile = async (userId, profileData) => {
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
  } = profileData;

  const updatedUser = await sequelize.transaction(async (t) => {
    const user = await User.findByPk(userId, { transaction: t });
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
    if (address) {
      if (user.addressId) {
        await Address.update(address, {
          where: { addressId: user.addressId },
          transaction: t,
        });
      } else {
        const newAddr = await Address.create(
          {
            ...address,
            userId: user.userId,
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

  return updatedUser;
};

/**
 * Update user (by admin)
 */
exports.updateUser = async (userId, updateData, requesterRoles) => {
  const {
    username,
    name,
    email,
    mobileNumber,
    roleId,
    dateOfBirth,
    bloodGroup,
    emergencyNumber,
    shiftFrom,
    shiftTo,
    addressId,
    status,
    isEmailVerified,
    about,
  } = updateData;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // === 1. Check duplicate username/email ===
  if (username || email) {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          username ? { username } : null,
          email ? { email } : null,
        ].filter(Boolean),
        userId: { [Op.ne]: userId },
      },
    });
    if (existingUser) {
      throw new Error("Username or Email already exists");
    }
  }

  // === 2. Validate addressId ===
  if (addressId) {
    const address = await Address.findByPk(addressId);
    if (!address) {
      throw new Error("Invalid address ID");
    }
  }

  // === 3. Update basic fields ===
  if (username !== undefined) user.username = username;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (mobileNumber !== undefined) user.mobileNumber = mobileNumber || null;
  if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth || null;
  if (bloodGroup !== undefined) user.bloodGroup = bloodGroup || null;
  if (emergencyNumber !== undefined)
    user.emergencyNumber = emergencyNumber || null;
  if (shiftFrom !== undefined) user.shiftFrom = shiftFrom || null;
  if (shiftTo !== undefined) user.shiftTo = shiftTo || null;
  if (addressId !== undefined) user.addressId = addressId || null;
  if (about !== undefined) user.about = about || null;

  // === 4. Update Status ===
  if (status !== undefined) {
    const validStatuses = ["active", "inactive", "restricted"];
    if (!validStatuses.includes(status)) {
      throw new Error(
        "Invalid status. Must be: active, inactive, or restricted",
      );
    }

    if (
      user.roles.includes("SUPER_ADMIN") &&
      status !== "active" &&
      (await User.count({
        where: { roles: { [Op.like]: "%SUPER_ADMIN%" } },
      })) <= 1
    ) {
      throw new Error("Cannot deactivate the only remaining SuperAdmin");
    }

    user.status = status;
  }

  // === 5. Update Email Verification (Admin/SuperAdmin only) ===
  if (isEmailVerified !== undefined) {
    if (!["ADMIN", "SUPER_ADMIN", "DEVELOPER"].includes(requesterRoles)) {
      throw new Error(
        "Only Admin or SuperAdmin or Developer can change email verification status",
      );
    }
    user.isEmailVerified = Boolean(isEmailVerified);
  }

  await user.save();

  return await User.findByPk(user.userId, {
    ...excludeSensitiveFields,
    include: [
      {
        model: Address,
        as: "address",
        attributes: ["street", "city", "state", "country", "postalCode"],
      },
    ],
  });
};
