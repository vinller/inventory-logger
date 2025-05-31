import React, { useState } from "react";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import moment from "moment";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


function ClientCheckin() {
  const { user } = useAuth();

  const [clientName, setClientName] = useState("");
  const [organization, setOrganization] = useState("");
  const [tablingSpot, setTablingSpot] = useState("");
  const [eventNumber, setEventNumber] = useState("");
  const [checkInTime] = useState(new Date().toISOString());

  const [requireTable, setRequireTable] = useState(false);
  const [tableBarcode, setTableBarcode] = useState("");
  const [tableError, setTableError] = useState(null);

  const [requireChairs, setRequireChairs] = useState(false);
  const [chairCount, setChairCount] = useState(0);
  const [chairBarcodes, setChairBarcodes] = useState(["", ""]);
  const [chairErrors, setChairErrors] = useState([null, null]);

  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();

  const [rangeStart, setRangeStart] = useState("");
const [rangeEnd, setRangeEnd] = useState("");

const generateTimeOptions = () => {
  const times = [];
  const start = 8 * 60; // 8:00 AM
  const end = 20 * 60;  // 5:00 PM

  for (let minutes = start; minutes <= end; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const label = `${hour12}:${minute.toString().padStart(2, "0")} ${suffix}`;
    const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    times.push({ label, value });
  }

  return times;
};

const [startTime, setStartTime] = useState("");
const [endTime, setEndTime] = useState("");



  const validateTableBarcode = async (barcode) => {
    try {
      const { data } = await axios.get(`/api/items/${barcode}`);
      if (data.category !== "Mall Table") {
        setTableError("Barcode is not a table.");
      } else if (!data.isAvailable) {
        setTableError("Table is already checked out.");
      } else {
        setTableError(null);
      }
    } catch {
      setTableError("Table not found.");
    }
  };

  const validateChairBarcode = async (barcode, index) => {
    try {
      const { data } = await axios.get(`/api/items/${barcode}`);
      const updated = [...chairErrors];
      if (data.category !== "Mall Chair") {
        updated[index] = "Barcode is not a chair.";
      } else if (!data.isAvailable) {
        updated[index] = "Chair is already checked out.";
      } else {
        updated[index] = null;
      }
      setChairErrors(updated);
    } catch {
      const updated = [...chairErrors];
      updated[index] = "Chair not found.";
      setChairErrors(updated);
    }
  };

  const handleSubmit = async () => {
    const today = new Date().toISOString().split("T")[0];
  
    const payload = {
      clientName,
      organization,
      tablingSpot,
      eventNumber,
      checkInTime,
      rangeStart: new Date(`${today}T${startTime}`).toISOString(),
      rangeEnd: new Date(`${today}T${endTime}`).toISOString(),
      table: requireTable && tableBarcode.trim() ? { barcode: tableBarcode } : null,
      chairs: requireChairs
        ? chairBarcodes.slice(0, chairCount).map((b) => ({ barcode: b }))
        : [],
      username: user.username,
    };
  
    try {
      await axios.post("/api/organizations/checkin", payload);
  
      // ✅ Play success sound
      const successSound = new Audio("/sounds/success.mp3");
      successSound.play();
  
      // ✅ Reset form
      setClientName("");
      setOrganization("");
      setTablingSpot("");
      setEventNumber("");
      setTableBarcode("");
      setChairBarcodes(["", ""]);
      setChairErrors([null, null]);
      setRequireTable(false);
      setRequireChairs(false);
      setChairCount(0);
  
      setFeedback("Check-in logged successfully.");
  
      // ✅ Redirect after a short delay
      setTimeout(() => {
        if (user.role === "EMS") navigate("/ems-dashboard");
        else if (user.role === "admin") navigate("/admin-dashboard");
        else navigate("/user-dashboard")
      }, 800);
  
    } catch (err) {
      console.error("Check-in failed:", err);
      setFeedback("Failed to check in. Please try again.");
  
      // ❌ Play fail sound
      const failSound = new Audio("/sounds/fail.mp3");
      failSound.play();
    }
  };

  return (
    <>
      <TopBar />
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-asuGold mb-8 text-center">Client Check-In</h2>
  
        <div className="w-full max-w-xl space-y-4 text-center">
          <input
            type="text"
            placeholder="Client Name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full p-3 rounded bg-gray-800 border border-gray-600"
          />
  
          <input
            type="text"
            placeholder="Organization Name"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full p-3 rounded bg-gray-800 border border-gray-600"
          />
  
          <input
            type="text"
            placeholder="Tabling Spot #"
            value={tablingSpot}
            onChange={(e) => setTablingSpot(e.target.value)}
            className="w-full p-3 rounded bg-gray-800 border border-gray-600"
          />
  
          <input
            type="text"
            placeholder="Event #"
            value={eventNumber}
            onChange={(e) => setEventNumber(e.target.value)}
            className="w-full p-3 rounded bg-gray-800 border border-gray-600"
          />
  
  <input
  type="text"
  value={`Check In Time - ${moment(checkInTime).format("hh:mm A")}`}
  readOnly
  className="w-full p-3 rounded bg-gray-700 border border-gray-500 text-white/70"
/>

          <select
  value={startTime}
  onChange={(e) => setStartTime(e.target.value)}
  className="w-full p-3 rounded bg-gray-800 border border-gray-600"
  style={{ maxHeight: "160px", overflowY: "auto" }}
>
  <option value="">Select Reservation Start Time</option>
  {generateTimeOptions().map((t) => (
    <option key={t.value} value={t.value}>{t.label}</option>
  ))}
</select>

<select
  value={endTime}
  onChange={(e) => setEndTime(e.target.value)}
  className="w-full p-3 rounded bg-gray-800 border border-gray-600"
>
  <option value="">Select Reservation End Time</option>
  {generateTimeOptions().map((t) => (
    <option key={t.value} value={t.value}>{t.label}</option>
  ))}
</select>



  
          {/* Table Card */}
<div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
  <p className="font-semibold text-asuGold mb-2">Do they require a table?</p>
  <div className="flex justify-center gap-4 mb-3">
    <button
      onClick={() => setRequireTable(true)}
      className={`px-6 py-2 rounded font-bold ${
        requireTable ? "bg-green-600" : "bg-gray-700"
      }`}
    >
      Yes
    </button>
    <button
      onClick={() => {
        setRequireTable(false);
        setTableBarcode("");
        setTableError(null);
      }}
      className={`px-6 py-2 rounded font-bold ${
        !requireTable ? "bg-red-600" : "bg-gray-700"
      }`}
    >
      No
    </button>
  </div>

  {requireTable && (
    <div className="w-full">
      <input
        type="text"
        placeholder="Table Barcode"
        value={tableBarcode}
        onChange={(e) => {
          setTableBarcode(e.target.value);
          validateTableBarcode(e.target.value);
        }}
        className="w-full p-2 rounded bg-gray-900 border border-gray-600"
      />
      {tableError && <p className="text-red-400 text-sm mt-1">{tableError}</p>}
    </div>
  )}
</div>

{/* Chairs Card */}
<div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
  <p className="font-semibold text-asuGold mb-2">Do they require chairs?</p>
  <div className="flex justify-center gap-4 mb-3">
    <button
      onClick={() => setRequireChairs(true)}
      className={`px-6 py-2 rounded font-bold ${
        requireChairs ? "bg-green-600" : "bg-gray-700"
      }`}
    >
      Yes
    </button>
    <button
      onClick={() => {
        setRequireChairs(false);
        setChairCount(0);
        setChairBarcodes(["", ""]);
        setChairErrors([null, null]);
      }}
      className={`px-6 py-2 rounded font-bold ${
        !requireChairs ? "bg-red-600" : "bg-gray-700"
      }`}
    >
      No
    </button>
  </div>

  {requireChairs && (
    <div className="w-full">
      <label className="block mb-1 font-medium text-left">How many chairs?</label>
      <select
        value={chairCount}
        onChange={(e) => {
          const count = parseInt(e.target.value);
          setChairCount(count);
          setChairBarcodes(Array(count).fill(""));
          setChairErrors(Array(count).fill(null));
        }}
        className="w-full p-2 mb-3 rounded bg-gray-900 border border-gray-600"
      >
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
      </select>

      {[...Array(chairCount)].map((_, i) => (
        <div key={i} className="mb-2">
          <input
            type="text"
            placeholder={`Chair ${i + 1} Barcode`}
            value={chairBarcodes[i] || ""}
            onChange={(e) => {
              const updated = [...chairBarcodes];
              updated[i] = e.target.value;
              setChairBarcodes(updated);
              validateChairBarcode(e.target.value, i);
            }}
            className="w-full p-2 rounded bg-gray-900 border border-gray-600"
          />
          {chairErrors[i] && (
            <p className="text-red-400 text-sm mt-1">{chairErrors[i]}</p>
          )}
        </div>
      ))}
    </div>
  )}
</div>

  
          {feedback && (
            <p className="mt-4 text-center font-semibold text-green-400">{feedback}</p>
          )}
  
          <button
            onClick={handleSubmit}
            className="mt-6 w-full bg-asuGold text-black py-3 font-bold rounded hover:brightness-110"
          >
            Submit Check-In
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
  
}

export default ClientCheckin;
