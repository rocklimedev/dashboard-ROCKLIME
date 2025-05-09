const jwt = require("jsonwebtoken");
require("dotenv").config();
const { secret, tokenLife } = require("../config/keys").jwt;

const auth = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header is missing." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.roleId) {
      return res.status(403).json({ error: "Unauthorized: Missing roleId." });
    }

    req.user = decoded;
    next();
  } catch (error) {
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

  return jwt.sign(payload, secret, { expiresIn: tokenLife });
};
module.exports = { auth, generateToken };
