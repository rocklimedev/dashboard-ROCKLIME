"use strict";

const express = require("express");
const router = express.Router();

const deviceController = require("./device.controller");

// Adjust these to match your existing auth/permission middleware.
// `auth` = verifies the logged-in admin user (JWT/session).
// `checkPermission(module, api)` = checks against permissions/rolepermissions.
const { auth } = require("../../middleware/auth");
// const { checkPermission } = require("../../../middleware/checkPermission");

// ---------------------------------------------------------------------
// Admin-facing routes — require a logged-in user with DEVICE permissions.
// Consumer: admin panel.
// ---------------------------------------------------------------------

router.post(
  "/register",
  auth,
  // checkPermission("DEVICE", "write"),
  deviceController.register,
);

router.post(
  "/:id/rotate-secret",
  auth,
  // checkPermission("DEVICE", "edit"),
  deviceController.rotateSecret,
);

router.get(
  "/",
  auth,
  // checkPermission("DEVICE", "view"),
  deviceController.list,
);

router.get(
  "/:id",
  auth,
  // checkPermission("DEVICE", "view"),
  deviceController.getOne,
);

router.put(
  "/:id/assign",
  auth,
  // checkPermission("DEVICE", "edit"),
  deviceController.assign,
);

router.put(
  "/:id/config",
  auth,
  // checkPermission("DEVICE", "edit"),
  deviceController.updateConfig,
);

router.get(
  "/:id/history",
  auth,
  // checkPermission("DEVICE", "view"),
  deviceController.history,
);

// ---------------------------------------------------------------------
// Pi kiosk-facing routes — NOT gated by user auth. authd instead
// via the `x-device-secret` header, verified inside the service layer.
// Consumer: the Raspberry Pi kiosk client.
// ---------------------------------------------------------------------

router.post("/:id/identify", deviceController.identify);
router.post("/:id/heartbeat", deviceController.heartbeat);

module.exports = router;
