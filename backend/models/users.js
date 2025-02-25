const { DataTypes, Op } = require("sequelize");
const sequelize = require("../config/database"); // Sequelize instance
const { ROLES } = require("../config/constant");

const User = sequelize.define(
  "User",
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: true },
    email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    mobileNumber: { type: DataTypes.STRING(20), allowNull: true },

    roles: {
      type: DataTypes.STRING, // Store roles as a comma-separated string
      allowNull: false,
      defaultValue: ROLES.Users, // Default role is "users"
      get() {
        return this.getDataValue("roles")?.split(",") || [];
      },
      set(value) {
        this.setDataValue("roles", Array.isArray(value) ? value.join(",") : value);
      },
    },

    status: {
      type: DataTypes.ENUM("active", "inactive", "restricted"),
      allowNull: false,
      defaultValue: "inactive",
    },

    password: { type: DataTypes.STRING, allowNull: false },

    role_id: { type: DataTypes.UUID, allowNull: true },
  },
  { timestamps: true }
);

// Ensure only one SuperAdmin exists
User.beforeCreate(async (user) => {
  if (user.roles.includes(ROLES.SuperAdmin)) {
    const existingSuperAdmin = await User.findOne({
      where: {
        roles: { [Op.like]: `%${ROLES.SuperAdmin}%` }, // Use LIKE for search
      },
    });

    if (existingSuperAdmin) {
      throw new Error("A SuperAdmin already exists");
    }
  }
});

module.exports = User;
