"use strict";

const deviceService = require("./device.service");

function handleError(res, err) {
  if (err instanceof deviceService.DeviceServiceError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }
  // eslint-disable-next-line no-console
  console.error("[device-controller]", err);
  return res
    .status(500)
    .json({ success: false, message: "Internal server error" });
}

// --- Admin-facing (authenticated via existing user/session auth) ---

async function register(req, res) {
  try {
    const {
      deviceId,
      assetTag,
      warehouseId,
      function: fn,
      screen,
      route,
      config,
    } = req.body;
    if (!deviceId) {
      return res
        .status(400)
        .json({ success: false, message: "deviceId is required" });
    }

    const registeredBy = req.user ? req.user.userId : null; // matches existing auth middleware convention
    const result = await deviceService.registerDevice({
      deviceId,
      assetTag,
      warehouseId,
      function: fn,
      screen,
      route,
      config,
      registeredBy,
    });

    // secret is returned once — the response is the only time it's ever visible
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return handleError(res, err);
  }
}

async function rotateSecret(req, res) {
  try {
    const performedBy = req.user ? req.user.userId : null;
    const result = await deviceService.rotateSecret(req.params.id, performedBy);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return handleError(res, err);
  }
}

async function list(req, res) {
  try {
    const { warehouseId, function: fn, status } = req.query;
    const devices = await deviceService.listDevices({
      warehouseId,
      function: fn,
      status,
    });
    return res.status(200).json({ success: true, data: devices });
  } catch (err) {
    return handleError(res, err);
  }
}

async function getOne(req, res) {
  try {
    const device = await deviceService.getDevice(req.params.id);
    return res.status(200).json({ success: true, data: device });
  } catch (err) {
    return handleError(res, err);
  }
}

async function assign(req, res) {
  try {
    const performedBy = req.user ? req.user.userId : null;
    const { warehouseId, function: fn, screen, route } = req.body;
    const device = await deviceService.assignDevice(
      req.params.id,
      { warehouseId, function: fn, screen, route },
      performedBy,
    );
    return res.status(200).json({ success: true, data: device });
  } catch (err) {
    return handleError(res, err);
  }
}

async function updateConfig(req, res) {
  try {
    const performedBy = req.user ? req.user.userId : null;
    const device = await deviceService.updateConfig(
      req.params.id,
      req.body || {},
      performedBy,
    );
    return res.status(200).json({ success: true, data: device });
  } catch (err) {
    return handleError(res, err);
  }
}

async function history(req, res) {
  try {
    const { limit, type } = req.query;
    const events = await deviceService.getDeviceHistory(req.params.id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
    });
    return res.status(200).json({ success: true, data: events });
  } catch (err) {
    return handleError(res, err);
  }
}

// --- Pi kiosk-facing (authenticated via device secret, not user session) ---

async function identify(req, res) {
  try {
    const secret = req.headers["x-device-secret"];
    const result = await deviceService.identifyDevice(req.params.id, secret);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return handleError(res, err);
  }
}

async function heartbeat(req, res) {
  try {
    const secret = req.headers["x-device-secret"];
    const { appVersion, meta } = req.body || {};
    const result = await deviceService.recordHeartbeat(req.params.id, secret, {
      appVersion,
      meta,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return handleError(res, err);
  }
}

module.exports = {
  register,
  rotateSecret,
  list,
  getOne,
  assign,
  updateConfig,
  history,
  identify,
  heartbeat,
};
