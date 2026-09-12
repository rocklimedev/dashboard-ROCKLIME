const { v4: uuidv4 } = require("uuid");

function generateGroupId() {
  return "grp-" + uuidv4().slice(0, 8);
}

function generateFloorId() {
  return "fl_" + uuidv4().slice(0, 8);
}

function generateRoomId(floorId = "") {
  return (floorId ? floorId + "_" : "rm_") + uuidv4().slice(0, 8);
}

module.exports = {
  generateGroupId,
  generateFloorId,
  generateRoomId,
};
