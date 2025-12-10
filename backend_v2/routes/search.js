// File: routes/searchRoutes.js
const express = require("express");
const router = express.Router();
const searchController = require("../controller/searchController");

router.get("/", searchController.searchAll);

module.exports = router;
