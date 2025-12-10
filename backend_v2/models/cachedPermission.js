const mongoose = require("mongoose");

const cachedPermissionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    roleId: {
      type: String,
      required: true,
      index: true,
    },
    roleName: {
      type: String,
    },
    permissions: [
      {
        permissionId: String,
        name: String,
        api: String,
        route: String,
        module: String,
      },
    ],
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// TTL index: automatically delete after 24 hours
cachedPermissionSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 86400 });

// Ensure no duplicates per user-role combo
cachedPermissionSchema.index({ userId: 1, roleId: 1 }, { unique: true });

const CachedPermission = mongoose.model(
  "CachedPermission",
  cachedPermissionSchema
);

module.exports = CachedPermission;
