const jwt = require("jsonwebtoken");
require("dotenv").config();
const { secret, tokenLife } = require("../config/keys").jwt;

const auth = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Authorization header missing or invalid.");
    return res.status(401).json({ error: "Authorization header is missing." });
  }

  const token = authHeader.split(" ")[1];
  console.log("Received Token:", token);

  try {
    console.log("Using Secret Key:", process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.roleId) {
      console.log("Role check failed: User or roleId is undefined.");
      return res.status(403).json({ error: "Unauthorized: Missing roleId." });
    }

    console.log("Decoded Token:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

const generateToken = (user) => {
  const payload = {
    userId: user.userId,
    roleId: user.roleId,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
  };
  console.log(payload);
  return jwt.sign(payload, secret, { expiresIn: tokenLife });
};
module.exports = { auth, generateToken };
