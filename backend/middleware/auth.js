const jwt = require("jsonwebtoken");
require("dotenv").config();
const { secret, tokenLife } = require("../config/keys").jwt;

const auth = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (process.env.NODE_ENV !== "production") {
      console.log("Authorization header missing or invalid.");
    }
    return res.status(401).json({
      error: "Authorization header is missing or improperly formatted.",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token is missing." });
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Debug log for development
    if (process.env.NODE_ENV !== "production") {
      console.log("Decoded token:", decoded);
    }

    req.user = decoded; // Attach user info (id, role, email)
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token has expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(403)
        .json({ error: "Invalid token. Please log in again." });
    }
    console.error("Token verification error:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};
const generateToken = (user) => {
  const payload = {
    id: user.id,
    role: user.role,
    email: user.email,
    iat: Math.floor(Date.now() / 1000), // Issued at time
  };

  return jwt.sign(payload, secret, { expiresIn: tokenLife });
};
module.exports = { auth, generateToken };
