const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

const ROLES = {
  Admin: "ADMIN",
  SuperAdmin: "SUPER_ADMIN",
  Accounts: "ACCOUNTS",
  Developer: "DEVELOPER",
  Users: "USERS",
  Sales: "SALES",
};

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      userId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
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
        validate: { isDate: true },
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

      addressId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "addresses", key: "addressId" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      emergencyNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: { is: /^[0-9+\-\s]*$/ },
      },

      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "roles", key: "roleId" },
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
            Array.isArray(value) ? value.join(",") : value,
          );
        },
      },

      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

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
    },
  );

  // Lifecycle hooks
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

  User.ROLES = ROLES;

  // -------------------------------
  // Associations
  // -------------------------------
  User.associate = (models) => {
    // Role
    User.belongsTo(models.Role, { foreignKey: "roleId", as: "role" });
    User.hasMany(models.PurchaseOrder, {
      foreignKey: "userId",
      as: "purchaseOrders",
    });

    User.hasMany(models.FieldGuidedSheet, {
      foreignKey: "userId",
      as: "fieldGuidedSheets",
    });
    // Address
    User.hasOne(models.Address, {
      foreignKey: "userId",
      as: "address",
      onDelete: "SET NULL",
      constraints: false,
    });

    // Teams (M:N)
    User.belongsToMany(models.Team, {
      through: models.TeamMember,
      foreignKey: "userId",
      otherKey: "teamId",
      as: "teams",
    });

    // Orders created / assigned / secondary
    User.hasMany(models.Order, {
      foreignKey: "createdBy",
      as: "createdOrders",
    });
    User.hasMany(models.Order, {
      foreignKey: "assignedUserId",
      as: "assignedOrders",
    });
    User.hasMany(models.Order, {
      foreignKey: "secondaryUserId",
      as: "secondaryOrders",
    });

    // Quotation
    User.hasMany(models.Quotation, {
      foreignKey: "createdBy",
      as: "quotations",
    });
  };

  return User;
};
