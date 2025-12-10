const { DataTypes, Op } = require("sequelize");
const sequelize = require("../config/database");

const ROLES = {
  Admin: "ADMIN",
  SuperAdmin: "SUPER_ADMIN",
  Accounts: "ACCOUNTS",
  Developer: "DEVELOPER",
  Users: "USERS",
  Sales: "SALES",
};

const User = sequelize.define(
  "User",
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },
    mobileNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    shiftFrom: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    shiftTo: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    bloodGroup: {
      type: DataTypes.ENUM("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"),
      allowNull: true,
    },

    emergencyNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[0-9+\-\s]*$/,
      },
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "roles",
        key: "roleId",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    roles: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ROLES.Users,
      get() {
        return this.getDataValue("roles")?.split(",") || [];
      },
      set(value) {
        this.setDataValue(
          "roles",
          Array.isArray(value) ? value.join(",") : value
        );
      },
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Newly added fields
    photo_thumbnail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    photo_original: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "restricted"),
      allowNull: false,
      defaultValue: "inactive",
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

// Ensure only one SuperAdmin exists
User.beforeCreate(async (user, options) => {
  if (user.roles.includes(ROLES.SuperAdmin)) {
    const existingSuperAdmin = await User.findOne({
      where: { roles: { [Op.like]: `%${ROLES.SuperAdmin}%` } },
      transaction: options.transaction,
    });
    if (existingSuperAdmin) {
      throw new Error("A SuperAdmin already exists");
    }
  }
});

module.exports = User;
