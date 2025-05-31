const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user"); // This is correct
const itemRoutes = require("./routes/item");
const notificationsRoute = require("./routes/notifications");
const barcodeRoutes = require("./routes/barcodes");
const mazevoRoutes = require("./routes/mazevoapi");
const emailRoutes = require("./routes/email");
const inventoryChecksRoute = require("./routes/inventoryCheck");
const organizationRoutes = require("./routes/organizations");


const app = express();

app.use(cors());
app.use(express.json());

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // Only this line is needed
app.use("/api/items", itemRoutes);
app.use("/api/notifications", notificationsRoute);
app.use("/api/barcodes", barcodeRoutes);
app.use("/api/mazevo", mazevoRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/inventory-checks", inventoryChecksRoute);
app.use("/api/organizations", organizationRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error(err));
