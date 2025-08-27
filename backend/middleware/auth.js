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
    const decoded = jwt.verify(token, secret);
    console.log(decoded);
    if (!decoded.roles || decoded.roles.length === 0) {
      return res.status(403).json({ error: "Unauthorized: Missing roles." });
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
    roles: user.roles || ["USERS"], // Use roles array, default to ["USERS"]
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
  };
  console.log(payload);
  return jwt.sign(payload, secret, { expiresIn: tokenLife });
};

module.exports = { auth, generateToken };
