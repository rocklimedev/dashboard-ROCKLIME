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

  if (!token) {
    return res.status(401).json({ error: "Token is missing." });
  }

  try {
    console.log("JWT Secret:", secret);
    const decoded = jwt.verify(token, secret);
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
    role: user.role,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, secret, { expiresIn: tokenLife });
};
module.exports = { auth, generateToken };
