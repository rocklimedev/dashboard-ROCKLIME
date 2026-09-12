'use strict';

const mongoose = require('mongoose');

/**
 * High-frequency device event log (heartbeats, status changes, config
 * pushes, assignment changes, errors). Keyed by the human-facing
 * `deviceId` (e.g. "CM-PI-001"), not the MySQL UUID, so it stays queryable
 * even if the MySQL row is ever recreated during hardware replacement.
 */
const deviceEventSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['heartbeat', 'status_change', 'config_push', 'assignment_change', 'error'],
      required: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      required: false,
    },
    appVersion: {
      type: String,
      required: false,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      default: {},
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    // We manage `timestamp` ourselves; no need for createdAt/updatedAt too.
    timestamps: false,
    collection: 'device_events',
  }
);

// Fast "most recent events for this device" queries.
deviceEventSchema.index({ deviceId: 1, timestamp: -1 });

// Optional: auto-expire raw heartbeat noise after 90 days to keep the
// collection bounded. Non-heartbeat events (status/config/assignment
// changes) are worth keeping longer, so this only applies at the
// heartbeat-document level via a partial filter.
deviceEventSchema.index(
  { timestamp: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 90,
    partialFilterExpression: { type: 'heartbeat' },
  }
);

module.exports = mongoose.model('DeviceEvent', deviceEventSchema);
