"use strict";

const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Adjust these requires to match your project's actual paths/exports.
const { Device, Warehouse } = require("../../models"); // Sequelize models index
const DeviceEvent = require("./models/deviceEvent.model");

const SALT_ROUNDS = 10;

// Defaults per the module brief — override via env vars.
const HEARTBEAT_INTERVAL_SECONDS = parseInt(
  process.env.DEVICE_HEARTBEAT_INTERVAL_SECONDS || "30",
  10,
);
const OFFLINE_THRESHOLD_SECONDS = parseInt(
  process.env.DEVICE_OFFLINE_THRESHOLD_SECONDS || "90",
  10,
);

class DeviceServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "DeviceServiceError";
    this.statusCode = statusCode;
  }
}

function generatePlaintextSecret() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Derives online/offline on read from lastHeartbeatAt, rather than relying
 * solely on the stored `status` column, since delivery is polling-only and
 * there's no background sweep flipping stale devices to offline.
 */
function deriveStatus(device) {
  if (!device.lastHeartbeatAt) return "offline";
  const ageSeconds =
    (Date.now() - new Date(device.lastHeartbeatAt).getTime()) / 1000;
  return ageSeconds <= OFFLINE_THRESHOLD_SECONDS ? "online" : "offline";
}

function toPublicDevice(device) {
  const plain = device.toJSON ? device.toJSON() : device;
  delete plain.deviceSecretHash;
  plain.status = deriveStatus(plain);
  return plain;
}

async function logEvent(deviceId, type, extra = {}) {
  try {
    await DeviceEvent.create({
      deviceId,
      type,
      timestamp: new Date(),
      ...extra,
    });
  } catch (err) {
    // Event logging must never break the primary request flow.
    // eslint-disable-next-line no-console
    console.error(
      `[device-events] failed to log ${type} for ${deviceId}:`,
      err.message,
    );
  }
}

/**
 * Register a new terminal and issue its device secret.
 * The plaintext secret is returned ONCE — callers must persist it now.
 */
async function registerDevice({
  deviceId,
  assetTag,
  warehouseId,
  function: fn,
  screen,
  route,
  config,
  registeredBy,
}) {
  const existing = await Device.findOne({ where: { deviceId } });
  if (existing) {
    throw new DeviceServiceError(
      `Device ${deviceId} is already registered`,
      409,
    );
  }

  if (warehouseId) {
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) {
      throw new DeviceServiceError(`Warehouse ${warehouseId} not found`, 404);
    }
  }

  const plaintextSecret = generatePlaintextSecret();
  const deviceSecretHash = await bcrypt.hash(plaintextSecret, SALT_ROUNDS);

  const device = await Device.create({
    deviceId,
    assetTag: assetTag || null,
    warehouseId: warehouseId || null,
    function: fn || null,
    screen: screen || null,
    route: route || null,
    config: config || {},
    deviceSecretHash,
    secretIssuedAt: new Date(),
    status: "offline",
    registeredBy: registeredBy || null,
  });

  await logEvent(deviceId, "status_change", { meta: { action: "registered" } });

  return {
    device: toPublicDevice(device),
    secret: plaintextSecret, // show once — the caller is responsible for handing this to the physical Pi
  };
}

/**
 * Re-register an existing deviceId against a new physical Pi (hardware
 * replacement). Issues a fresh secret; assignment/config are untouched.
 */
async function rotateSecret(deviceId, performedBy) {
  const device = await Device.findOne({ where: { deviceId } });
  if (!device)
    throw new DeviceServiceError(`Device ${deviceId} not found`, 404);

  const plaintextSecret = generatePlaintextSecret();
  device.deviceSecretHash = await bcrypt.hash(plaintextSecret, SALT_ROUNDS);
  device.secretIssuedAt = new Date();
  await device.save();

  await logEvent(deviceId, "status_change", {
    meta: { action: "secret_rotated", performedBy: performedBy || null },
  });

  return { device: toPublicDevice(device), secret: plaintextSecret };
}

async function verifyDeviceSecret(deviceId, plaintextSecret) {
  const device = await Device.findOne({ where: { deviceId } });
  if (!device)
    throw new DeviceServiceError("Device not found or not authorized", 401);

  const matches = await bcrypt.compare(
    plaintextSecret || "",
    device.deviceSecretHash,
  );
  if (!matches)
    throw new DeviceServiceError("Device not found or not authorized", 401);

  return device;
}

/**
 * Boot / periodic handshake. Returns what the kiosk should render.
 * Does NOT update lastHeartbeatAt — that's the heartbeat endpoint's job.
 */
async function identifyDevice(deviceId, plaintextSecret) {
  const device = await verifyDeviceSecret(deviceId, plaintextSecret);
  const warehouse = device.warehouseId
    ? await Warehouse.findByPk(device.warehouseId)
    : null;

  return {
    location: warehouse ? warehouse.name : null,
    function: device.function,
    screen: device.screen,
    route: device.route,
    configuration: device.config || {},
    heartbeat: {
      intervalSeconds: HEARTBEAT_INTERVAL_SECONDS,
    },
  };
}

/**
 * Periodic liveness ping. Updates lastHeartbeatAt / status / appVersion and
 * logs a heartbeat event to Mongo.
 */
async function recordHeartbeat(
  deviceId,
  plaintextSecret,
  { appVersion, meta } = {},
) {
  const device = await verifyDeviceSecret(deviceId, plaintextSecret);

  device.lastHeartbeatAt = new Date();
  device.status = "online";
  if (appVersion) device.appVersion = appVersion;
  await device.save();

  await logEvent(deviceId, "heartbeat", { status: "online", appVersion, meta });

  return {
    acknowledged: true,
    nextHeartbeatInSeconds: HEARTBEAT_INTERVAL_SECONDS,
  };
}

async function listDevices({ warehouseId, function: fn, status } = {}) {
  const where = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (fn) where.function = fn;

  const devices = await Device.findAll({ where, order: [["deviceId", "ASC"]] });
  let result = devices.map(toPublicDevice);

  // status is derived, so filter after mapping rather than in the SQL query
  if (status) {
    result = result.filter((d) => d.status === status);
  }

  return result;
}

async function getDevice(deviceId) {
  const device = await Device.findOne({ where: { deviceId } });
  if (!device)
    throw new DeviceServiceError(`Device ${deviceId} not found`, 404);
  return toPublicDevice(device);
}

async function assignDevice(
  deviceId,
  { warehouseId, function: fn, screen, route },
  performedBy,
) {
  const device = await Device.findOne({ where: { deviceId } });
  if (!device)
    throw new DeviceServiceError(`Device ${deviceId} not found`, 404);

  if (warehouseId) {
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse)
      throw new DeviceServiceError(`Warehouse ${warehouseId} not found`, 404);
  }

  const oldValue = {
    warehouseId: device.warehouseId,
    function: device.function,
    screen: device.screen,
    route: device.route,
  };

  if (warehouseId !== undefined) device.warehouseId = warehouseId;
  if (fn !== undefined) device.function = fn;
  if (screen !== undefined) device.screen = screen;
  if (route !== undefined) device.route = route;
  await device.save();

  const newValue = {
    warehouseId: device.warehouseId,
    function: device.function,
    screen: device.screen,
    route: device.route,
  };
  await logEvent(deviceId, "assignment_change", {
    meta: { oldValue, newValue, performedBy: performedBy || null },
  });

  return toPublicDevice(device);
}

async function updateConfig(deviceId, configPatch, performedBy) {
  const device = await Device.findOne({ where: { deviceId } });
  if (!device)
    throw new DeviceServiceError(`Device ${deviceId} not found`, 404);

  const oldConfig = device.config || {};
  const newConfig = { ...oldConfig, ...configPatch };
  device.config = newConfig;
  await device.save();

  await logEvent(deviceId, "config_push", {
    meta: {
      oldValue: oldConfig,
      newValue: newConfig,
      performedBy: performedBy || null,
    },
  });

  return toPublicDevice(device);
}

async function getDeviceHistory(deviceId, { limit = 100, type } = {}) {
  const device = await Device.findOne({ where: { deviceId } });
  if (!device)
    throw new DeviceServiceError(`Device ${deviceId} not found`, 404);

  const query = { deviceId };
  if (type) query.type = type;

  return DeviceEvent.find(query)
    .sort({ timestamp: -1 })
    .limit(Math.min(limit, 500));
}

module.exports = {
  DeviceServiceError,
  registerDevice,
  rotateSecret,
  identifyDevice,
  recordHeartbeat,
  listDevices,
  getDevice,
  assignDevice,
  updateConfig,
  getDeviceHistory,
};
