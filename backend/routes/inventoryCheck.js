// routes/inventoryChecks.js
const express = require("express");
const router = express.Router();
const InventoryCheck = require("../models/InventoryCheck");
const { authenticate } = require("../middleware/authMiddleware");

// POST /api/inventory-checks
router.post("/", authenticate, async (req, res) => {
  try {
    const { presentItems = [], missingItems = [], building, confirmed, notes = "N/A" } = req.body;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!building || !Array.isArray(presentItems) || !Array.isArray(missingItems)) {
      return res.status(400).json({ message: "Missing or invalid input fields" });
    }

    const check = new InventoryCheck({
        user: username,
        building,
        confirmed: Boolean(confirmed),
        presentItems,
        missingItems,
        notes,
      });      

    await check.save();
    res.status(201).json({ message: "Inventory check submitted", check });
  } catch (err) {
    console.error("Error saving inventory check:", err);
    res.status(500).json({ message: "Server error while saving inventory check" });
  }
});

// GET /api/inventory-checks
router.get("/", authenticate, async (req, res) => {
  try {
    const checks = await InventoryCheck.find().sort({ checkedAt: -1 });
    res.json(checks);
  } catch (err) {
    console.error("Error fetching inventory checks:", err);
    res.status(500).json({ message: "Server error while fetching inventory checks" });
  }
});

router.get("/public", async (req, res) => {
    try {
      const checks = await InventoryCheck.find().sort({ checkedAt: -1 });
      res.json(checks);
    } catch (err) {
      console.error("Error fetching verification logs:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  
module.exports = router;
