// routes/item.js
const express = require("express");
const router = express.Router();
const Item = require("../models/item");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");
const User = require("../models/user"); // for fetching admin emails

// Get all items (optionally filtered by building/category/barcode)
// /api/items (GET) – with optional filters for building, category, barcode, and status
router.get("/", async (req, res) => {
  const { building, category, barcode, status } = req.query;
  const filter = {};

  if (building) filter.building = building;
  if (category) filter.category = category;
  if (barcode) filter.barcode = barcode;

  // Handle availability logic
  if (status === "Available") {
    filter.archive = false;
    filter.maintenance = false;
    filter.isMissing = false;
    filter.isBroken = false;
    filter.isAvailable = true;
  }
  
  if (status === "CheckedOut") {
    filter.archive = false;
    filter.isAvailable = false;
  }
  

  try {
    const items = await Item.find(filter).populate(
      "techBagContents.hdmiCable techBagContents.clicker techBagContents.adapter mallChairRefs"
    );
    res.json(items);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ message: "Failed to fetch items" });
  }
});

router.get("/items", async (req, res) => {
  try {
    const barcodes = req.query.barcodes?.split(",");
    if (!barcodes || !barcodes.length) return res.json([]);
    const items = await Item.find({ barcode: { $in: barcodes } }, { name: 1, barcode: 1, _id: 0 });
    res.json(items);
  } catch (err) {
    console.error("Item lookup failed:", err);
    res.status(500).json({ message: "Item lookup error" });
  }
});


// GET /api/items/my-logs
router.get("/my-logs", authenticate, authorize("user"), async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(400).json({ message: "Missing user context" });
    }

    const normalizedUsername = username.toLowerCase();

    const items = await Item.find({ "logs.user": { $exists: true } });

    const userLogs = items.flatMap((item) =>
      item.logs
        .filter((log) => log.user?.toLowerCase() === normalizedUsername)
        .map((log) => ({
          ...log.toObject(),
          barcode: item.barcode,
          itemName: item.name,
        }))
    );

    res.json(userLogs);
  } catch (err) {
    console.error("❌ Failed to fetch user logs:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/*router.post("/report-issue", authenticate, async (req, res) => {
  const { barcode, issueType, description } = req.body;
  const username = req.user.username;

  try {
    const admins = await User.find({ role: "admin" });
    const adminEmails = admins.map((admin) => admin.email);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlBody = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          margin: 40px auto;
          background-color: #f9f9f9;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #6C0018;
          color: #ffffff;
          text-align: center;
          padding: 20px;
        }
        .header img {
          max-width: 160px;
          margin-bottom: 10px;
        }
        .content {
          padding: 30px;
          text-align: left;
          color: #000000;
        }
        .content h2 {
          color: #6C0018;
        }
        .info-box {
          background-color: #d9d9d9;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .info-box p {
          margin: 8px 0;
        }
        .footer {
          background-color: #6C0018;
          color: #ffffff;
          font-size: 12px;
          padding: 15px;
          text-align: center;
        }
        .footer p:first-of-type {
          color: #F59701;
          font-weight: bold;
          margin-bottom: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://newamericanuniversity.asu.edu/modules/composer/webspark-module-asu_footer/img/ASU-EndorsedLogo.png" alt="ASU Logo">
          <h1>MU/STPV Inventory System</h1>
        </div>
      <div class="content">
          <h2>Item Issue Reported</h2>
          <p>An item issue has been reported by <strong>${username}</strong>. Please review the details below:</p>
        <div class="info-box">
            <p><strong>Item Barcode:</strong> ${barcode}</p>
            <p><strong>Issue Type:</strong> ${issueType}</p>
            <p><strong>Description:</strong><br>${description || "No additional details provided."}</p>
        </div>
          <p>This message was automatically sent to all system administrators.</p>
      </div>
      <div class="footer">
        <p style="color: #F59701; margin-bottom: 5px; font-weight: bold;">Memorial Union & Student Pavilion Inventory System <br>© Arizona State University</p>
        <p style="margin-top: 5px;">This email was generated and sent by an automated system and is not monitored. Kindly refrain from replying directly to this message.</p>
      </div>
      </div>
    </body>
    </html>
    `; // HTML string omitted for brevity

    const mailOptions = {
      from: `"Inventory Logger" <${process.env.EMAIL_USER}>`,
      to: adminEmails,
      subject: `Item Issue Report: ${issueType}`,
      html: htmlBody,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Report sent to admins." });
  } catch (err) {
    console.error("Email send failed:", err);
    res.status(500).json({ message: "Server error while sending email." });
  }
});*/

// ✅ Dedicated item fetch by barcode
router.get("/:barcode", async (req, res) => {
  const barcode = String(req.params.barcode);
  try {
    const item = await Item.findOne({ barcode }).populate("techBagContents.hdmiCable techBagContents.clicker techBagContents.adapter mallChairRefs");
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    console.error("Error fetching item:", err);
    res.status(500).json({ message: "Failed to fetch item" });
  }
});

// Add a new item
router.post("/", async (req, res) => {
  const { name, barcode, building, category, techBagContents, mallChairRefs, isMallTable } = req.body;

  try {
    const existing = await Item.findOne({ barcode });
    if (existing) return res.status(400).json({ message: "❌ Barcode already exists in the system" });

    const newItem = new Item({
      name,
      barcode,
      building,
      category,
      ...(category === "Tech Bag" && { techBagContents }),
      ...(category === "Mall Table" && { mallChairRefs, isMallTable: true })
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(400).json({ message: "Failed to create item" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { logs, ...rest } = req.body;

  try {
    // Check for barcode conflict
    if (rest.barcode) {
      const existing = await Item.findOne({ barcode: rest.barcode });
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({ message: "Barcode already in use" });
      }
    }

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // ✅ Apply updates to base fields
    Object.assign(item, rest);

    // ✅ CLEANUP: Remove missing/broken/maintenance if archive or maintenance is removed
    if (!rest.archive && item.archive) {
      item.isMissing = false;
      item.isBroken = false;
      item.maintenance = false;
    }

    if (!rest.maintenance && item.maintenance) {
      item.isMissing = false;
      item.isBroken = false;
    }

    // ✅ Append logs if present
    if (Array.isArray(logs)) {
      for (const log of logs) {
        item.logs.push({ ...log, timestamp: log.timestamp || new Date() });
      }
    }

    await item.save();
    res.json(item);
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).json({ message: "Failed to update item" });
  }
});


// Delete item
router.delete("/:id", async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ message: "Failed to delete item" });
  }
});

// Get log history
router.get("/:barcode/logs", async (req, res) => {
  const barcode = req.params.barcode;
  try {
    const item = await Item.findOne({ barcode });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const sortedLogs = [...item.logs].sort((a, b) => b.timestamp - a.timestamp);
    res.json(sortedLogs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ message: "Failed to fetch item logs" });
  }
});

// Add a log entry
router.post("/:barcode/log", async (req, res) => {
  const { barcode } = req.params;
  const { action, user, room, clientName, notes } = req.body;

  try {
    const item = await Item.findOne({ barcode });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const log = {
      action,
      user,
      room,
      clientName,
      notes,
      timestamp: new Date(),
    };

    item.logs.push(log);
    await item.save();
    res.status(201).json({ message: "Log added", log });
  } catch (err) {
    console.error("Error adding log:", err);
    res.status(500).json({ message: "Failed to add log" });
  }
});

// Check-Out
router.post("/check-out", async (req, res) => {
  const { barcode, username, room, clientName, eventNumber, techBagVerification, mallChairBarcodes } = req.body;

  try {
    const item = await Item.findOne({ barcode });
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.archive) {
      return res.status(403).json({ message: "This item is archived and cannot be checked in/out." });
    }
    if (item.maintenance) {
      return res.status(403).json({ message: "Item is under maintenance and cannot be checked in/out." });
    }

    if (item.isLost || item.isMissing || item.isBroken) {
      return res.status(400).json({
        message: `This item is marked as ${item.isLost ? "lost" : item.isMissing ? "missing" : "broken"} and is not available for checkout.`,
      });
    }    

    if (!item.isAvailable) {
      return res.status(400).json({ message: "Item is already checked out" });
    }

    // ✅ TECH BAG: verify and mark children unavailable
    if (item.category === "Tech Bag") {
      const contents = item.techBagContents;
      const required = [contents?.hdmiCable, contents?.clicker, contents?.adapter].filter(Boolean);
      const parts = await Item.find({ _id: { $in: required.map(part => part._id) } });

      for (const part of parts) {
        if (!part.isAvailable && techBagVerification[part.barcode] !== false) {
          return res.status(400).json({ message: `Cannot check out. ${part.name} (${part.barcode}) is not available.` });
        }
        if (!techBagVerification[part.barcode]) {
          return res.status(400).json({ message: `Please verify all tech bag contents.` });
        }
      }

      for (const part of parts) {
        part.isAvailable = false;
        part.checkedOutBy = username;
        part.belongsToTechBag = item.barcode;
        part.logs.push({
          action: "check_out",
          user: username,
          room,
          clientName,
          eventNumber,
          timestamp: new Date(),
        });
        await part.save();
      }
    }

    // ✅ MALL TABLE: verify chairs and check them out
    if (item.category === "Mall Table" && Array.isArray(mallChairBarcodes)) {
      const scannedChairs = await Item.find({ barcode: { $in: mallChairBarcodes } });

      if (scannedChairs.length !== mallChairBarcodes.length) {
        return res.status(400).json({ message: "One or more scanned chairs not found." });
      }

      for (const chair of scannedChairs) {
        if (chair.category !== "Mall Chair") {
          return res.status(400).json({ message: `${chair.barcode} is not a Mall Chair.` });
        }
        if (!chair.isAvailable) {
          return res.status(400).json({ message: `${chair.barcode} is already checked out.` });
        }

        chair.isAvailable = false;
        chair.checkedOutBy = username;
        chair.logs.push({
          action: "check_out",
          user: username,
          room,
          clientName,
          eventNumber,
          timestamp: new Date(),
        });

        await chair.save();
      }

      item.mallChairRefs = scannedChairs.map((c) => c._id);
    }

    // ✅ PRIMARY ITEM CHECKOUT
    item.isAvailable = false;
    item.checkedOutBy = username;
    item.logs.push({
      action: "check_out",
      user: username,
      room,
      clientName,
      eventNumber,
      timestamp: new Date(),
    });

    await item.save();
    res.status(200).json({ message: "Item checked out", item });
  } catch (err) {
    console.error("Error checking out item:", err);
    res.status(500).json({ message: "Failed to check out item" });
  }
});

// Check-In
router.post("/check-in", async (req, res) => {
  const { barcode, username, markMissing = [], markCheckedIn = [] } = req.body;

  try {
    if (!username) {
      return res.status(400).json({ message: "User ID is required for check-in" });
    }

    const item = await Item.findOne({ barcode }).populate("techBagContents.hdmiCable techBagContents.clicker techBagContents.adapter");
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.archive) {
      return res.status(403).json({ message: "This item is archived and cannot be checked in/out." });
    }
    if (item.maintenance) {
      return res.status(403).json({ message: "Item is under maintenance and cannot be checked in/out." });
    }

    if (item.isMissing || item.isLost) {
      // Email admins about the attempt
      const admins = await User.find({ role: "admin" });
      const adminEmails = admins.map((admin) => admin.email);
    
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>🚨 Attempted Check-In or Check-Out of Flagged Item</h2>
            <p><strong>User:</strong> ${username}</p>
            <p><strong>Barcode:</strong> ${barcode}</p>
            <p><strong>Item Name:</strong> ${item.name}</p>
            <p><strong>Current Status:</strong> ${item.isLost ? "Lost" : "Missing"}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <p>Please follow up to investigate or mark this item as found if it's returned.</p>
          </body>
        </html>
      `;
    
      await transporter.sendMail({
        from: `"Inventory Logger" <${process.env.EMAIL_USER}>`,
        to: adminEmails,
        subject: `⚠️ User tried to log a ${item.isLost ? "Lost" : "Missing"} item`,
        html,
      });
    
      return res.status(400).json({
        message: `This item is marked as ${item.isLost ? "lost" : "missing"}. Please report it as found to an admin.`,
      });
    }    

    if (item.belongsToTechBag) {
      return res.status(400).json({
        message: `This item is part of Tech Bag ${item.belongsToTechBag}. Please check in the entire Tech Bag.`,
      });
    }    

    if (item.isAvailable) {
      return res.status(400).json({ message: "Item is already checked in" });
    }  

    // ✅ Mark parent item (tech bag) as checked in
    item.isAvailable = true;
    item.checkedOutBy = null;
    item.logs.push({
      action: "check_in",
      user: username,
      timestamp: new Date(),
    });

    // 🧠 Smart check-in: use provided arrays if present
    const contents = [item.techBagContents?.hdmiCable, item.techBagContents?.clicker, item.techBagContents?.adapter];
    for (const part of contents) {
      if (!part) continue;

      if (markMissing.includes(part.barcode)) {
        part.isAvailable = false;
        part.isMissing = true; // ✅ using isMissing
        part.checkedOutBy = null;
        part.belongsToTechBag = null;
        part.logs.push({
          action: "marked_missing", // ✅ updated log action
          user: username,
          timestamp: new Date(),
        });
        await part.save();
      }       else if (markCheckedIn.includes(part.barcode)) {
        part.isAvailable = true;
        part.isMissing = false;
        part.checkedOutBy = null;
        part.logs.push({
          action: "check_in",
          user: username,
          timestamp: new Date(),
        });
        await part.save();
      }
    }

    await item.save();
    res.status(200).json({ message: "Tech bag processed", item });
  } catch (err) {
    console.error("Error checking in item:", err);
    res.status(500).json({ message: "Failed to check in item" });
  }
});


// POST /api/items/report-issue
router.post("/report-issue", authenticate, async (req, res) => {
  const { barcode, issueType, description } = req.body;
  const username = req.user?.username || "Unknown";

  try {
    const item = await Item.findOne({ barcode });
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Flag updates
    if (issueType.toLowerCase() === "missing") item.isMissing = true;
    if (issueType.toLowerCase() === "broken") item.isBroken = true;

    // ✅ Add to logs
    item.logs.push({
      action: "report_issue",
      user: username,
      notes: `${issueType}: ${description}`, // ← stores reason
      timestamp: new Date(),
    });

    await item.save();

    res.status(200).json({ message: "Issue reported and logged" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to report issue" });
  }
});


// POST /api/items/resolve-issue
router.post("/resolve-issue", authenticate, authorize("admin"), async (req, res) => {
  const { barcode, resolutionType } = req.body;
  const username = req.user?.username || "Admin";

  try {
    const item = await Item.findOne({ barcode });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const now = new Date();

    // ✅ Remove old report_issue logs before resolving
    item.logs = item.logs.filter(log => log.action !== "report_issue");

    if (resolutionType === "found") {
      item.set({
        isMissing: false,
        isAvailable: true,
        checkedOutBy: null,
      });

      item.logs.push(
        { action: "marked_found", user: username, timestamp: now },
        { action: "check_in", user: username, timestamp: now }
      );
    } else if (resolutionType === "fixed") {
      item.set({
        isBroken: false,
        isAvailable: true,
        checkedOutBy: null,
      });

      item.logs.push(
        { action: "mark_fixed", user: username, timestamp: now },
        { action: "check_in", user: username, timestamp: now }
      );
    } else {
      return res.status(400).json({ message: "Invalid resolution type" });
    }

    await item.save(); // ✅ important!
    res.status(200).json({ message: "Item resolved successfully" });
  } catch (err) {
    console.error("Failed to resolve issue:", err);
    res.status(500).json({ message: "Failed to resolve item" });
  }
});




module.exports = router;
