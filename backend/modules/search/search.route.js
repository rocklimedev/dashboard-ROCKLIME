// File: routes/searchRoutes.js
const express = require("express");
const router = express.Router();
const searchController = require("./search.controller");
const { auth } = require("../../middleware/auth");
router.use(auth);
router.get("/", searchController.searchAll);

module.exports = router;
