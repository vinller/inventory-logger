import React, { useState, useEffect } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


function ClientCheckout() {
  const { user } = useAuth();
  const [orgList, setOrgList] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [tableCode, setTableCode] = useState("");
  const [reservation, setReservation] = useState(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();


  const playSound = (success) => {
    const audio = new Audio(success ? "/sounds/success.mp3" : "/sounds/fail.mp3");
    audio.play();
  };
  

  useEffect(() => {
    const fetchActiveOrgs = async () => {
      try {
        const res = await axios.get("/api/organizations/active");
        setOrgList(res.data);
      } catch (err) {
        console.error("Error fetching active orgs:", err);
      }
    };
    fetchActiveOrgs();
  }, []);

  const fetchReservation = async (orgName, barcode = null) => {
    try {
      const res = barcode
        ? await axios.get(`/api/organizations/by-table/${barcode}`)
        : await axios.get(`/api/organizations/${encodeURIComponent(orgName)}`);
  
      if (barcode) {
        setSelectedOrg(res.data.organization);
        setReservation(res.data.reservation);
      } else {
        const activeRes = res.data.reservation;
        if (!activeRes) throw new Error("No active reservation");
        setReservation(activeRes);
      }
      setError("");
    } catch {
      setReservation(null);
      setError("No active reservation found.");
    }
  };
  

  const handleOrgChange = (e) => {
    const org = e.target.value;
    setSelectedOrg(org);
    setTableCode("");
    fetchReservation(org);
  };

  const handleScan = () => {
    if (!tableCode.trim()) return;
    fetchReservation(null, tableCode.trim());
  };

  const handleSubmit = async () => {
    if (!reservation || !selectedOrg) return;
    try {
      await axios.post("/api/organizations/checkout", {
        organization: selectedOrg,
        eventNumber: reservation.eventNumber,
        username: user.username,
        notes: notes.trim() || "N/A",
      });
  
      setSuccess("Checkout successful.");
      setError("");
      setReservation(null);
      setTableCode("");
      setNotes("");
  
      playSound(true); // ✅ play success sound
  
      // Refresh orgs
      await axios.get("/api/organizations/active").then(res => setOrgList(res.data));
      setSelectedOrg("");
  
      // ✅ Redirect to dashboard based on role
      setTimeout(() => {
        if (user.role === "admin") {
          navigate("/admin-dashboard");
        } else if (user.role === "EMS") {
          navigate("/ems-dashboard");
        } else {
          navigate("/user-dashboard");
        }
      }, 1000);
  
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Checkout failed. Try again.");
      setSuccess("");
      playSound(false); // ✅ play fail sound
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <TopBar />
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center text-asuGold">Client Check-Out</h2>
  
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (tableCode.trim()) fetchReservation(null, tableCode.trim());
          }}
          className="mb-6"
        >
          <label className="block mb-2 text-center text-sm font-medium">Scan Barcode</label>
          <input
            type="text"
            className="bg-gray-800 border border-gray-600 px-3 py-2 rounded w-full"
            value={tableCode}
            onChange={(e) => setTableCode(e.target.value)}
            placeholder="Table Barcode"
            autoFocus
          />
        </form>
  
        <div className="text-center mb-2 text-sm">Or select an active organization</div>
        <select
          className="bg-gray-800 border border-gray-600 px-3 py-2 rounded w-full mb-6"
          value={selectedOrg}
          onChange={handleOrgChange}
        >
          <option value="">Select</option>
          {orgList.map((org) => (
            <option key={org} value={org}>
              {org}
            </option>
          ))}
        </select>
  
        {reservation ? (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-xl font-semibold mb-2 text-asuGold">Reservation Details</h3>
            <p><strong>Client:</strong> {reservation.clientName}</p>
            <p><strong>Event #:</strong> {reservation.eventNumber}</p>
            <p><strong>Tabling Spot:</strong> {reservation.tablingSpot}</p>
            <p><strong>Check-In:</strong> {new Date(reservation.checkInTime).toLocaleString()}</p>
            <p><strong>Table:</strong> {reservation.table?.barcode || "-"}</p>
            <p><strong>Chairs:</strong> {reservation.chairs?.map(c => c.barcode).join(", ") || "-"}</p>
  
            <textarea
              rows={4}
              placeholder="Notes..."
              className="bg-gray-800 border border-gray-600 px-3 py-2 rounded w-full mt-4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
  
            <button
              onClick={handleSubmit}
              className="mt-4 bg-asuGold text-black font-bold px-6 py-2 rounded"
            >
              Submit Check-Out
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-400 mt-6"></p>
        )}
  
        {success && <p className="mt-4 text-center text-green-400">{success}</p>}
      </div>
    </div>
  );
  
}

export default ClientCheckout;
