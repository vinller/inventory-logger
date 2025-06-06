// src/pages/UserHistory.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Footer from "../components/Footer";


function UserHistory() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get("/api/items/my-logs", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to load user logs", err);
      }
    };
  
    fetchLogs();
  }, []);
  

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
  log.clientName?.toLowerCase().includes(search.toLowerCase()) ||
  log.room?.toLowerCase().includes(search.toLowerCase()) ||
  log.eventNumber?.toLowerCase().includes(search.toLowerCase()) ||
  log.itemName?.toLowerCase().includes(search.toLowerCase());



    const matchAction =
      filterAction === "all" ||
      (filterAction === "check_in" && log.action === "check_in") ||
      (filterAction === "check_out" && log.action === "check_out");

    const matchDate = selectedDate
      ? new Date(log.timestamp).toDateString() === selectedDate.toDateString()
      : true;

    return matchSearch && matchAction && matchDate;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentLogs = [...filteredLogs]
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  .slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  return (
    <>
      <TopBar />
      <div className="p-6 text-white min-h-screen bg-gray-900">
        <h2 className="text-3xl font-bold mb-6 text-center text-asuGold">
          My Item Log History
        </h2>

        <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by client, event #, or room"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded md:w-1/3 w-full"
          />

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded md:w-1/4 w-full"
          >
            <option value="all">All</option>
            <option value="check_in">Check In</option>
            <option value="check_out">Check Out</option>
          </select>

          <div className="relative md:w-1/4 w-full flex items-center">
                    <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            placeholderText="Filter by date"
            className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded w-full"
            maxDate={new Date()}
            isClearable
          />
          
                    </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-auto w-full text-sm text-center">
            <thead className="bg-gray-700 text-gray-200">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Room</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Event #</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800">
              {currentLogs.map((log, index) => {
                const date = new Date(log.timestamp);
                return (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="px-4 py-2">{date.toLocaleDateString()}</td>
                    <td className="px-4 py-2">{date.toLocaleTimeString()}</td>
                    <td
                      className="px-4 py-2 font-semibold"
                      style={{ color: log.action === "check_in" ? "#4ade80" : "#f87171" }}
                    >
                      {log.action === "check_in" ? "Checked In" : "Checked Out"}
                    </td>
                    <td className="px-4 py-2">{log.itemName}</td>
                    <td className="px-4 py-2">{log.room || "—"}</td>
                    <td className="px-4 py-2">{log.clientName || "—"}</td>
                    <td className="px-4 py-2">{log.eventNumber || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-500 disabled:opacity-50"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-500 disabled:opacity-50"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default UserHistory;
