const Permission = require("../models/permisson");

// Create a new permission with HTTP methods
const createPermission = async (req, res) => {
  const { action, methods } = req.body;

  // Validate methods
  if (!methods || typeof methods !== "object") {
    return res.status(400).json({ message: "Methods must be an object" });
  }

  try {
    const newPermission = await Permission.create({
      action,
      methods,
    });

    res.status(201).json(newPermission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating permission" });
  }
};

// Get all permissions
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();
    res.status(200).json(permissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving permissions" });
  }
};

// Update a permission (methods like POST, GET, PUT, DELETE)
const updatePermission = async (req, res) => {
  const { permissionId } = req.params;
  const { methods } = req.body; // Methods is an object { POST: true, GET: false, etc. }

  if (!methods || typeof methods !== "object") {
    return res.status(400).json({ message: "Methods must be an object" });
  }

  try {
    const permission = await Permission.findByPk(permissionId);

    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    // Update the permission methods
    permission.methods = methods;
    await permission.save();

    res.status(200).json(permission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating permission" });
  }
};

// Delete a permission
const deletePermission = async (req, res) => {
  const { permissionId } = req.params;

  try {
    const permission = await Permission.findByPk(permissionId);

    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    await permission.destroy();
    res.status(200).json({ message: "Permission deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting permission" });
  }
};

module.exports = {
  createPermission,
  getAllPermissions,
  updatePermission,
  deletePermission,
};
