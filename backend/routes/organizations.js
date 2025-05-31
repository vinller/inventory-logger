const express = require("express");
const router = express.Router();
const Organization = require("../models/Organization");
const Item = require("../models/item");

router.post("/checkin", async (req, res) => {
  const {
    clientName,
    organization,
    tablingSpot,
    eventNumber,
    checkInTime,
    rangeStart,
    rangeEnd,
    table = null,
    chairs = [],
    username,
  } = req.body;
  
  
    try {
      const tableItem = table?.barcode ? await Item.findOne({ barcode: table.barcode }) : null;
      const chairItems = await Promise.all(chairs.map((c) => Item.findOne({ barcode: c.barcode })));
  
      const reservation = {
        action: "check_in",
        clientName,
        tablingSpot,
        eventNumber,
        checkInTime: new Date(checkInTime),
        rangeStart: new Date(rangeStart),
        rangeEnd: new Date(rangeEnd),
        user: username,
        table: tableItem ? {
          barcode: tableItem.barcode,
          itemRef: tableItem._id,
        } : null,
        chairs: chairItems.filter(Boolean).map((c) => ({
          barcode: c.barcode,
          itemRef: c._id,
        })),
      };
      
  
      let org = await Organization.findOne({ name: organization });
      if (!org) {
        org = new Organization({
          name: organization,
          active: true,
          reservations: [reservation],
        });
      } else {
        org.reservations.push(reservation);
        org.active = true;
      }
      await org.save();
  
      const updates = [];
      if (tableItem) {
        tableItem.isAvailable = false;
        tableItem.logs.push({
          action: "check_out",
          user: username,
          clientName,
          room: tablingSpot,
          eventNumber,
          timestamp: new Date(),
        });
        updates.push(tableItem.save());
      }
  
      for (const chair of chairItems) {
        if (!chair) continue;
        chair.isAvailable = false;
        chair.logs.push({
          action: "check_out",
          user: username,
          clientName,
          room: tablingSpot,
          eventNumber,
          timestamp: new Date(),
        });
        updates.push(chair.save());
      }
  
      await Promise.all(updates);
  
      return res.status(200).json({ message: "Check-in logged." });
    } catch (err) {
      console.error("Error in check-in:", err);
      return res.status(500).json({ message: "Failed to log check-in." });
    }
  });
  
// POST /api/organizations/checkout
router.post("/checkout", async (req, res) => {
    const { organization, eventNumber, notes = "N/A", username = "System" } = req.body;
  
    try {
      const orgDoc = await Organization.findOne({ name: organization });
      if (!orgDoc) return res.status(404).json({ message: "Organization not found." });
  
      const reservation = orgDoc.reservations.find(
        (r) => r.eventNumber === eventNumber && r.action === "check_in" && !r.checkOutTime
      );
      if (!reservation) return res.status(404).json({ message: "Active reservation not found." });
  
      reservation.checkOutTime = new Date();
      reservation.notes = notes;
  
      const checkoutLog = {
        action: "check_out",
        clientName: reservation.clientName,
        tablingSpot: reservation.tablingSpot,
        eventNumber: reservation.eventNumber,
        checkOutTime: reservation.checkOutTime,
        notes,
        user: username,
      };
  
      if (reservation.table && reservation.table.barcode) {
        checkoutLog.table = reservation.table;
      }
  
      if (Array.isArray(reservation.chairs) && reservation.chairs.length > 0) {
        checkoutLog.chairs = reservation.chairs;
      }
  
      orgDoc.reservations.push(checkoutLog);
      orgDoc.active = false;
  
      const barcodes = [];
      if (reservation.table?.barcode) {
        barcodes.push(reservation.table.barcode);
      }
      if (Array.isArray(reservation.chairs) && reservation.chairs.length) {
        barcodes.push(...reservation.chairs.map((c) => c.barcode));
      }
  
      const updatePromises = barcodes.map(async (barcode) => {
        const item = await Item.findOne({ barcode });
        if (!item) return;
        item.isAvailable = true;
        item.logs.push({
          action: "check_in",
          user: username,
          clientName: reservation.clientName,
          room: reservation.tablingSpot,
          eventNumber,
          timestamp: new Date(),
        });
        await item.save();
      });
  
      await Promise.all(updatePromises);
      await orgDoc.save();
  
      res.status(200).json({ message: "Client checked out, items marked available." });
    } catch (err) {
      console.error("Check-out failed:", err);
      res.status(500).json({ message: "Server error during check-out." });
    }
  });
  
  // GET /api/organizations/active
  router.get("/active", async (req, res) => {
    try {
      const orgs = await Organization.find({ active: true });
      const names = orgs.map((org) => org.name);
      res.json(names);
    } catch (err) {
      console.error("Failed to fetch active organizations:", err);
      res.status(500).json({ message: "Failed to fetch active organizations." });
    }
  });
  
  // GET /api/organizations
  router.get("/", async (req, res) => {
    try {
      const orgs = await Organization.find({});
      const names = orgs.map((org) => org.name);
      res.json(names);
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
      res.status(500).json({ message: "Failed to fetch organizations." });
    }
  });

// routes/organization.js
router.get("/all-logs", async (req, res) => {
  try {
    const orgs = await Organization.find({});
    const mergedLogs = [];

    orgs.forEach((org) => {
      const combined = {};

      org.reservations.forEach((entry) => {
        const key = `${entry.clientName}-${entry.eventNumber}-${entry.tablingSpot}-${entry.user}-${entry.organization}`;

        if (!combined[key]) {
          combined[key] = {
            ...entry.toObject(),
            organization: org.name,
            checkInTime: null,
            checkOutTime: null,
          };
        }

        if (entry.action === "check_in") {
          combined[key] = {
            ...combined[key],
            ...entry.toObject(), // copy over table/chairs/notes
            checkInTime: entry.checkInTime,
          };
        } else if (entry.action === "check_out") {
          combined[key].checkOutTime = entry.checkOutTime;
        } else if (entry.action === "no_show") {
          combined[key].noShow = true;
        }
      });

      mergedLogs.push(...Object.values(combined));
    });

    res.status(200).json(mergedLogs);
  } catch (err) {
    console.error("Failed to fetch merged tabling logs:", err);
    res.status(500).json({ message: "Failed to fetch tabling logs." });
  }
});

 // GET /api/organizations/:orgName
router.get("/:orgName", async (req, res) => {
    try {
      const orgName = decodeURIComponent(req.params.orgName);
      const org = await Organization.findOne({ name: orgName });
      if (!org) return res.status(404).json({ message: "Organization not found" });
  
      const activeReservation = org.reservations.find(
        (r) => r.action === "check_in" && !r.checkOutTime
      );
  
      if (!activeReservation) return res.status(404).json({ message: "No active reservation found." });
  
      res.json({ organization: org.name, reservation: activeReservation });
    } catch (err) {
      console.error("Failed to fetch organization:", err);
      res.status(500).json({ message: "Failed to fetch organization." });
    }
  });
  
  // GET /api/organizations/by-table/:tableBarcode
  router.get("/by-table/:tableBarcode", async (req, res) => {
    try {
      const org = await Organization.findOne({
        reservations: {
          $elemMatch: {
            "table.barcode": req.params.tableBarcode,
            action: "check_in",
            checkOutTime: { $exists: false },
          },
        },
      });
  
      if (!org) return res.status(404).json({ message: "No active reservation found for table." });
  
      const activeReservation = org.reservations.find(
        (r) => r.table?.barcode === req.params.tableBarcode && r.action === "check_in" && !r.checkOutTime
      );
  
      res.json({ organization: org.name, reservation: activeReservation });
    } catch (err) {
      console.error("Failed to fetch reservation by table:", err);
      res.status(500).json({ message: "Failed to fetch reservation by table." });
    }
  });

  router.post("/noshow", async (req, res) => {
    const { organization, eventNumber, tablingSpot, rangeStart, rangeEnd, username } = req.body;
  
    try {
      const noShowLog = {
        action: "no_show",
        eventNumber,
        tablingSpot,
        rangeStart: new Date(rangeStart),
        rangeEnd: new Date(rangeEnd),
        user: username,
        noShow: true,
      };
  
      let orgDoc = await Organization.findOne({ name: { $regex: new RegExp(`^${organization}$`, "i") } });
      if (!orgDoc) {
        orgDoc = new Organization({
          name: organization,
          active: false,
          reservations: [noShowLog],
        });
      } else {
        orgDoc.reservations.push(noShowLog);
      }
  
      await orgDoc.save();
      res.status(200).json({ message: "No-show logged." });
    } catch (err) {
      console.error("Error logging no-show:", err);
      res.status(500).json({ message: "Failed to log no-show." });
    }
  });
module.exports = router;