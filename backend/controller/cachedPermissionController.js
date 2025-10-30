const CachedPermission = require("../models/cachedPermission");

// Fetch all cached permissions
exports.getAllCachedPermissions = async (req, res) => {
  try {
    const data = await CachedPermission.find().sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching CachedPermission:", err);
    res.status(500).json({ error: "Failed to fetch cached permissions" });
  }
};

// Fetch by Role ID
exports.getCachedPermissionByRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const cached = await CachedPermission.findOne({ roleId });
    if (!cached)
      return res.status(404).json({ message: "No cached permission found" });

    res.status(200).json(cached);
  } catch (err) {
    console.error("Error fetching CachedPermission by role:", err);
    res.status(500).json({ error: "Failed to fetch cached permission" });
  }
};
