const express = require("express");
const serviceController = require("../controllers/service.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, serviceController.listServices);

module.exports = router;
