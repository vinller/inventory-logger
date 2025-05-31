import React, { useState } from "react";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

// Generate time options like 12:00 AM, 12:30 AM, ..., 11:30 PM
const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h % 12 === 0 ? 12 : h % 12;
      const minute = m.toString().padStart(2, "0");
      const ampm = h < 12 ? "AM" : "PM";
      times.push(`${hour}:${minute} ${ampm}`);
    }
  }
  return times;
};

function ClientNoShow() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState("");
  const [tablingSpot, setTablingSpot] = useState("");
  const [eventNumber, setEventNumber] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");


  const generateTimeOptions = () => {
    const times = [];
    const start = 8 * 60;  // 8:00 AM
    const end = 17 * 60;   // 5:00 PM
  
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
  const timeOptions = generateTimeOptions();
  

  const convertToTodayDatetime = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const today = new Date();
    today.setHours(h, m, 0, 0);
    return today.toISOString();
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        organization,
        tablingSpot,
        eventNumber,
        rangeStart: convertToTodayDatetime(rangeStart),
        rangeEnd: convertToTodayDatetime(rangeEnd),
        username: user.username,
      };

      await axios.post("/api/organizations/noshow", payload);
      setFeedback("No-show logged successfully.");
      setError("");
      setOrganization("");
      setTablingSpot("");
      setEventNumber("");
      setRangeStart("");
      setRangeEnd("");
    } catch (err) {
      console.error("Error submitting no-show:", err);
      setError("Failed to log no-show.");
      setFeedback("");
    }
  };

  return (
    <>
      <TopBar />
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
        <h2 className="text-3xl font-bold text-asuGold mb-6 text-center">Client No-Show</h2>
        <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
          <input
            type="text"
            placeholder="Organization Name"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full p-3 rounded bg-gray-800 border border-gray-600"
            required
          />
          <input
            type="text"
            placeholder="Tabling Spot #"
            value={tablingSpot}
            onChange={(e) => setTablingSpot(e.target.value)}
            className="w-full p-3 rounded bg-gray-800 border border-gray-600"
            required
          />
          <input
            type="text"
            placeholder="Event #"
            value={eventNumber}
            onChange={(e) => setEventNumber(e.target.value)}
            className="w-full p-3 rounded bg-gray-800 border border-gray-600"
            required
          />

          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block mb-1 text-sm">Start Time</label>
              <select
  value={rangeStart}
  onChange={(e) => setRangeStart(e.target.value)}
  className="w-full p-2 rounded bg-gray-800 border border-gray-600"
  required
>
  <option value="">Select Start</option>
  {timeOptions.map((t) => (
    <option key={t.value} value={t.value}>{t.label}</option>
  ))}
</select>

            </div>

            <div className="w-1/2">
              <label className="block mb-1 text-sm">End Time</label>
              <select
  value={rangeEnd}
  onChange={(e) => setRangeEnd(e.target.value)}
  className="w-full p-2 rounded bg-gray-800 border border-gray-600"
  required
>
  <option value="">Select End</option>
  {timeOptions.map((t) => (
    <option key={t.value} value={t.value}>{t.label}</option>
  ))}
</select>

            </div>
          </div>

          {error && <p className="text-red-400 text-center">{error}</p>}
          {feedback && <p className="text-green-400 text-center">{feedback}</p>}

          <button type="submit" className="w-full bg-asuGold text-black font-bold py-3 rounded hover:brightness-110">
            Submit No-Show
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default ClientNoShow;
