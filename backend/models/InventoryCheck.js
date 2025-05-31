// models/InventoryCheck.js
const mongoose = require("mongoose");

const InventoryCheckSchema = new mongoose.Schema({
  user: {
    type: String, // changed from ObjectId to String
    required: true,
  },
  building: {
    type: String,
    enum: ["Memorial Union", "Student Pavilion"],
    required: true,
  },
  checkedAt: {
    type: Date,
    default: Date.now,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  presentItems: [String], // Array of barcodes
  missingItems: [String], // Array of barcodes
  notes: {
    type: String,
    default: "N/A"
  }
  
});

module.exports = mongoose.model("InventoryCheck", InventoryCheckSchema);
