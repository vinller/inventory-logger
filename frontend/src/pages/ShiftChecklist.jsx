// frontend/src/pages/ShiftChecklist.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";


function ShiftChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [building, setBuilding] = useState("");
  const [items, setItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (building) {
      axios
        .get(`/api/items?building=${encodeURIComponent(building)}&status=Available`)
        .then((res) => setItems(res.data))
        .catch((err) => console.error("Error fetching items:", err));
    }
  }, [building]);

  const handleToggle = (barcode) => {
    setCheckedItems((prev) =>
      prev.includes(barcode) ? prev.filter((b) => b !== barcode) : [...prev, barcode]
    );
  };

  const handleSubmit = async () => {
    if (!notes.trim()) return;
    const token = localStorage.getItem("token");
    const presentItems = checkedItems;
    const missingItems = items.map((item) => item.barcode).filter((b) => !checkedItems.includes(b));
    const noteContent = notes.trim();
  
    if (!token) {
      alert("You're not logged in. Please log in again.");
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      await axios.post(
        "/api/inventory-checks",
        { building, presentItems, missingItems, confirmed: true, notes: noteContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      await axios.post(
        "/api/notifications/inventory-check",
        {
          user: user.username,
          building,
          time: new Date().toISOString(),
          presentItems,
          missingItems,
          notes: noteContent,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setCheckedItems([]);
      setNotes("");
      setBuilding("");
      setConfirmationChecked(false);
      setSubmitted(true);
      alert("Inventory check submitted successfully!");
      navigate("/user-dashboard");
    } catch (err) {
      console.error("Failed to submit inventory check:", err);
      alert("Something went wrong while submitting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  const [confirmationChecked, setConfirmationChecked] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

// Group items by category
const categorizedItems = items.reduce((acc, item) => {
  if (!acc[item.category]) acc[item.category] = [];
  acc[item.category].push(item);
  return acc;
}, {});

const handleCategoryToggle = (category) => {
  const categoryBarcodes = categorizedItems[category].map((item) => item.barcode);
  const allChecked = categoryBarcodes.every((barcode) => checkedItems.includes(barcode));

  setCheckedItems((prev) => {
    if (allChecked) {
      return prev.filter((barcode) => !categoryBarcodes.includes(barcode));
    } else {
      const newSet = new Set([...prev, ...categoryBarcodes]);
      return Array.from(newSet);
    }
  });
};
const [noteError, setNoteError] = useState("");
const [confirmError, setConfirmError] = useState("");
const canSubmit = notes.trim() !== "" && confirmationChecked;



  return (
    <>
      <TopBar />
      <div className="p-6 min-h-screen bg-gray-900 text-white">
  <h2 className="text-3xl font-bold mb-6 text-center text-asuGold">Equipment Check</h2>

  {!building ? (
    <div className="max-w-md mx-auto mb-10">
      <label className="block mb-2 text-lg">Select Building</label>
      <select
        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
        value={building}
        onChange={(e) => setBuilding(e.target.value)}
      >
        <option value="">Choose</option>
        <option value="Memorial Union">Memorial Union</option>
        <option value="Student Pavilion">Student Pavilion</option>
      </select>
    </div>
  ) : (
    <>
      <div className="mb-4 text-sm text-gray-400">{items.length} items available</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {Object.keys(categorizedItems).map((category) => (
    <div key={category} className="bg-gray-700 rounded-lg p-4 shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white">{category}</h3>
        <button
  type="button"
  onClick={() => handleCategoryToggle(category)}
  className="text-xs font-medium text-yellow-400 hover:text-yellow-300 bg-transparent border border-yellow-400 hover:border-yellow-300 px-2 py-1 rounded transition"
>
  {categorizedItems[category].every((item) =>
    checkedItems.includes(item.barcode)
  )
    ? "Uncheck All"
    : "Check All"}
</button>

      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {categorizedItems[category].map((item) => (
          <div
            key={item.barcode}
            onClick={() => handleToggle(item.barcode)}
            className={`rounded-md border px-3 py-2 cursor-pointer transition text-sm ${
              checkedItems.includes(item.barcode)
                ? "bg-green-700 border-green-500 text-white"
                : "bg-gray-800 border-gray-600 text-white/80"
            }`}
          >
            <div className="font-semibold">{item.name}</div>
            <div className="text-xs text-gray-300">#{item.barcode}</div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>

<div className="mt-8 mx-auto">
  <label className="block mb-2 text-sm font-medium text-white/80">
    Notes <span className="text-red-500">*</span>
  </label>
  <textarea
    rows="3"
    value={notes}
    onChange={(e) => {
      setNotes(e.target.value);
      if (e.target.value.trim()) setNoteError("");
    }}
    placeholder="Enter notes here.."
    className="w-full p-3 rounded bg-gray-800 border border-gray-600 text-white"
  />
  {noteError && <p className="text-red-400 text-sm mt-1">{noteError}</p>}
</div>


<div className="mt-6 w-full max-w-xl mx-auto">
  <div
    onClick={() => {
      setConfirmationChecked(!confirmationChecked);
      if (!confirmationChecked) setConfirmError(""); // clear on check
    }}
    className={`rounded-md border p-4 text-center cursor-pointer transition ${
      confirmationChecked
        ? "bg-green-700 border-green-500 text-white"
        : "bg-gray-800 border-gray-600 text-white/70"
    }`}
  >
    <p className="font-medium">
      I confirm that the checked items are present in the closet.
    </p>
  </div>
  {confirmError && <p className="text-red-400 text-sm mt-2 text-center">{confirmError}</p>}
</div>


<div className="text-center mt-6">
  <button
    onClick={() => {
      let hasError = false;

      if (!notes.trim()) {
        setNoteError("Please enter notes before submitting.");
        hasError = true;
      } else {
        setNoteError("");
      }

      if (!confirmationChecked) {
        setConfirmError("Please confirm that all marked items are present.");
        hasError = true;
      } else {
        setConfirmError("");
      }

      if (!hasError) handleSubmit();
    }}
    disabled={isSubmitting}
    className={`px-6 py-2 rounded font-semibold transition-colors ${
      isSubmitting
        ? "bg-gray-600 cursor-not-allowed"
        : canSubmit
        ? "bg-green-600 hover:bg-green-700 text-white"
        : "bg-yellow-500 hover:bg-red-600 hover:text-white text-black"
    }`}
  >
    {isSubmitting ? "Submitting..." : "Submit Checklist"}
  </button>
</div>


    </>
  )}
</div>
<Footer />
    </>
  );
}

export default ShiftChecklist;
