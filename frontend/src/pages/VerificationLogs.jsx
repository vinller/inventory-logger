import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TopBar from "../components/TopBar";
import dayjs from "dayjs";
import Footer from "../components/Footer";


// ✅ Utility function
function getShift(timestamp) {
  const hour = dayjs(timestamp).hour();
  if (hour >= 6 && hour < 11) return "Open";
  if (hour >= 11 && hour < 15) return "First Mid";
  if (hour >= 15 && hour < 19) return "Second Mid";
  if (hour >= 19 && hour < 23) return "Close";
  return "Off Hours";
}

function VerificationLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);

  const [searchText, setSearchText] = useState("");
const [shiftFilter, setShiftFilter] = useState(""); // ✅ ADD THIS
const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));


  useEffect(() => {
    axios.get("/api/inventory-checks/public")
      .then((res) => {
        setLogs(res.data);
        setFilteredLogs(res.data);
      })
      .catch((err) => console.error("Error fetching verification logs:", err));
  }, []);

  useEffect(() => {
    const lowerSearch = searchText.toLowerCase();
  
    const filtered = logs.filter((log) => {
      const matchesSearch =
        log.user?.toLowerCase().includes(lowerSearch) ||
        log.notes?.toLowerCase().includes(lowerSearch);
  
      const matchesShift = shiftFilter ? getShift(log.checkedAt) === shiftFilter : true;
  
      const logDate = dayjs(log.checkedAt).format("YYYY-MM-DD");
      const matchesDate = selectedDate ? logDate === selectedDate : true;
  
      return matchesSearch && matchesShift && matchesDate;
    });
  
    setFilteredLogs(filtered);
  }, [searchText, shiftFilter, selectedDate, logs]);
  

  const generatePDF = async (log) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });
  
    const maroon = "#8C1D40";
    const gold = "#F59701";
    const now = dayjs();
    const exportDate = now.format("MMMM D, YYYY");
    const exportTime = now.format("h:mm A");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  
    // Load logo
    const logo = await new Promise((resolve) => {
      const img = new Image();
      img.src = "/images/asu-logo.png";
      img.onload = () => resolve(img);
    });
  
    // Fetch item names
    const allBarcodes = [...log.presentItems, ...log.missingItems];
    const uniqueBarcodes = [...new Set(allBarcodes.map((b) => (typeof b === "string" ? b : b.barcode)))];
    const itemsRes = await axios.get(`/api/items?barcodes=${uniqueBarcodes.join(",")}`);
    const itemMap = {};
    (itemsRes.data || []).forEach((item) => {
      itemMap[item.barcode] = item.name;
    });
  
    // Universal footer
    const drawFooter = (doc) => {
      const footerY = pageHeight - 60;
      doc.setDrawColor(150);
      doc.setLineWidth(1);
      doc.line(40, footerY, pageWidth - 40, footerY);
      doc.setFontSize(10);
      doc.setTextColor(60);
      doc.text(`Exported on: ${exportDate}, at ${exportTime}`, pageWidth / 2, footerY + 15, { align: "center" });
      doc.text("Memorial Union & Student Pavilion Operations", pageWidth / 2, footerY + 30, { align: "center" });
      doc.text("Arizona State University", pageWidth / 2, footerY + 45, { align: "center" });
    };
  
    // Header (first page)
    doc.addImage(logo, "PNG", 40, 20, 80, 40);
    doc.setFontSize(18);
    doc.setTextColor(maroon);
    doc.text("MU/STPV Inventory Verification Log", pageWidth / 2, 45, { align: "center" });
  
    doc.setFontSize(11);
    doc.setTextColor("#000000");
    doc.text(`User: ${log.user}`, 50, 80);
    doc.text(`Building: ${log.building}`, 50, 100);
    doc.text(`Date: ${dayjs(log.checkedAt).format("MMM D, YYYY")}`, 50, 120);
    doc.text(`Time: ${dayjs(log.checkedAt).format("h:mm A")}`, 50, 140);
    doc.text(`Shift: ${getShift(log.checkedAt)}`, 50, 160);
    doc.text(`Confirmed: ${log.confirmed ? "Yes" : "No"}`, 50, 180);
    doc.text(`Notes: ${log.notes || "N/A"}`, 50, 200);
  
    let y = 230;
  
    const formatTable = (title, barcodes, yStart) => {
      if (!barcodes?.length) return yStart;
  
      autoTable(doc, {
        startY: yStart,
        head: [[title, "Barcode"]],
        body: barcodes.map((code) => {
          const barcode = typeof code === "string" ? code : code.barcode;
          return [itemMap[barcode] || "-", barcode];
        }),
        styles: {
          fontSize: 10,
          halign: "center",
          valign: "middle",
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: gold,
          textColor: "#000",
          fontStyle: "bold",
        },
        margin: { left: 50, right: 50 },
        didDrawPage: () => drawFooter(doc),
      });
  
      return doc.lastAutoTable.finalY + 20;
    };
  
    y = formatTable("Items Present", log.presentItems, y);
    y = formatTable("Items Missing", log.missingItems, y);
  
    doc.save(`Verification Log ${log.user} ${dayjs(log.checkedAt).format("MMM D YYYY")}.pdf`);
  };
  
  
  return (
    <>
      <TopBar />
      <div className="p-6 bg-gray-900 text-white min-h-screen">
        <h2 className="text-3xl font-bold mb-6 text-asuGold text-center">
          Verification Logs
        </h2>

        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <input
            type="text"
            placeholder="Search user or notes..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded w-64"
          />
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded"
          >
            <option value="">All Shifts</option>
            <option value="Open">Open</option>
            <option value="First Mid">First Mid</option>
            <option value="Second Mid">Second Mid</option>
            <option value="Close">Close</option>
            <option value="Off Hours">Off Hours</option>
          </select>
          <input
  type="date"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
  className="bg-gray-800 text-white px-3 py-2 rounded"
/>

        </div>

        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-700 text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="border border-gray-700 px-3 py-2">Date</th>
                <th className="border border-gray-700 px-3 py-2">Time</th>
                <th className="border border-gray-700 px-3 py-2">User</th>
                <th className="border border-gray-700 px-3 py-2">Shift</th>
                <th className="border border-gray-700 px-3 py-2">Building</th>
                <th className="border border-gray-700 px-3 py-2">Notes</th>
                <th className="border border-gray-700 px-3 py-2">Log</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => {
                const date = dayjs(log.checkedAt).format("MM/DD/YYYY");
                const time = dayjs(log.checkedAt).format("h:mm A");
                return (
                  <tr key={idx} className="hover:bg-gray-800">
                    <td className="border border-gray-700 px-3 py-1 text-center">{date}</td>
                    <td className="border border-gray-700 px-3 py-1 text-center">{time}</td>
                    <td className="border border-gray-700 px-3 py-1 text-center">{log.user}</td>
                    <td className="border border-gray-700 px-3 py-1 text-center">
  <span className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${
    getShift(log.checkedAt) === "Open" ? "bg-pink-600" :
    getShift(log.checkedAt) === "First Mid" ? "bg-teal-500" :
    getShift(log.checkedAt) === "Second Mid" ? "bg-green-600" :
    getShift(log.checkedAt) === "Close" ? "bg-purple-600" :
    "bg-red-600"
  }`}>
    {getShift(log.checkedAt)}
  </span>
</td>
<td className="border border-gray-700 px-3 py-1 text-center">
  <span className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${
    log.building === "Memorial Union" ? "bg-asuGold !text-black" :
    log.building === "Student Pavilion" ? "bg-asuMaroon" : "bg-gray-600"
  }`}>
    {log.building || "N/A"}
  </span>
</td>

                    <td className="border border-gray-700 px-3 py-1 text-center max-w-xs truncate">{log.notes || "N/A"}</td>
                    <td className="border border-gray-700 px-3 py-1 text-center">
                      <button
                        onClick={() => generatePDF(log)}
                        className="text-blue-400 underline hover:text-blue-300"
                      >
                        View Log
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default VerificationLogs;
