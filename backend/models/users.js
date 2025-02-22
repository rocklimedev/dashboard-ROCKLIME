const { DataTypes } = require("sequelize");
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
      type: DataTypes.ARRAY(DataTypes.ENUM(...Object.values(ROLES))), // Multiple roles except SuperAdmin
      allowNull: false,
      defaultValue: [ROLES.Users], // Default role is USERS
    },

    status: {
      type: DataTypes.ENUM("active", "inactive", "restricted"),
      allowNull: false,
      defaultValue: "inactive", // If no roleId assigned within 7 days
    },

    password: { type: DataTypes.STRING, allowNull: false }, // Hashed password

    role_id: { type: DataTypes.UUID, allowNull: true }, // Assigned only if needed
  },
  { timestamps: true }
);

// Ensure only one SuperAdmin exists
User.beforeCreate(async (user) => {
  if (user.roles.includes(ROLES.SuperAdmin)) {
    const existingSuperAdmin = await User.findOne({
      where: { roles: { [sequelize.Op.contains]: [ROLES.SuperAdmin] } },
    });

    if (existingSuperAdmin) {
      throw new Error("A SuperAdmin already exists");
    }
  }
});

module.exports = User;
