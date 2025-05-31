const mongoose = require("mongoose");

const reservationLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ["check_in", "check_out", "no_show"],
    required: true,
  },
  clientName: String,
  tablingSpot: String,
  eventNumber: String,
  checkInTime: Date,
  checkOutTime: Date,
  user: String,
  table: {
    barcode: String,
    itemRef: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  },
  chairs: [
    {
      barcode: String,
      itemRef: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    },
  ],
  notes: String,
  noShow: Boolean,
  rangeStart: Date,
  rangeEnd: Date,
  timestamp: { type: Date, default: Date.now },
});

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  active: { type: Boolean },
  reservations: [reservationLogSchema],
});

module.exports = mongoose.model("Organization", OrganizationSchema);
