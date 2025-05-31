const mongoose = require("mongoose");
const Item = require("./models/item"); // adjust path as needed

mongoose.connect("mongodb+srv://admin:oMgQ0fvXylYUq3St@inventoryloggerdb.qpu2ivi.mongodb.net/inventory?retryWrites=true&w=majority&appName=InventoryLoggerDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateItems = async () => {
  try {
    const result = await Item.updateMany(
      {
        $or: [
          { maintenance: { $exists: false } },
          { archive: { $exists: false } }
        ]
      },
      {
        $set: {
          maintenance: false,
          archive: false
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} items.`);
    mongoose.disconnect();
  } catch (err) {
    console.error("Error updating items:", err);
    mongoose.disconnect();
  }
};

updateItems();
