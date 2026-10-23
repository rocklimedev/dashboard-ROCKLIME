const mongoose = require('mongoose');

module.exports = new mongoose.Schema(
  {
    shareId: String,
    floorId: String,
    floorName: String,
    roomId: String,
    roomName: String,
    areaId: String,
    areaName: String,
    assignedQuantity: Number,
    priority: Number,
  },
  { _id: false },
);
