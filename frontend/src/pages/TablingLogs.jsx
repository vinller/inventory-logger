import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

dayjs.extend(localizedFormat);


function TablingLogs() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("All Organizations");
  const [selectedAction, setSelectedAction] = useState("All");
  const [noShowFilter, setNoShowFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const exportTablingLogsPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
  
    const asuMaroon = "#8C1D40";
    const asuGold = "#FFC627";
    const now = dayjs();
    const exportDate = now.format("MMMM D, YYYY");
    const exportTime = now.format("h:mm A");
    const title = `Tabling Logs`;
    const logo = new Image();
    logo.src = "/images/asu-logo.png";
  
    logo.onload = () => {
      const pageWidth = doc.internal.pageSize.getWidth();
  
      doc.addImage(logo, "PNG", 40, 20, 80, 40);
      doc.setFontSize(18);
      doc.setTextColor(asuMaroon);
      doc.text(title, pageWidth / 2, 45, { align: "center" });
  
      autoTable(doc, {
        startY: 70,
        head: [[
          "Date", "Time", "User", "Organization", "Client",
          "Event #", "Spot", "Check-In", "Check-Out",
          "No Show", "Table", "Chairs", "Notes"
        ]],
        body: filtered.map((log) => {
          const now = dayjs();
          const checkIn = log.checkInTime ? dayjs(log.checkInTime) : null;
          const overdue = checkIn && now.diff(checkIn, "hour") >= 6;
          const hasEquipment = log.table?.barcode || (log.chairs?.length ?? 0) > 0;
      
          const checkOutCell = log.checkOutTime
            ? dayjs(log.checkOutTime).format("h:mm A")
            : (overdue && hasEquipment ? "(Not checked out)" : "-");
      
          return [
            dayjs(log.checkInTime || log.checkOutTime || log.rangeStart).format("MM/DD/YYYY"),
            dayjs(log.checkInTime || log.checkOutTime || log.rangeStart).format("h:mm A"),
            log.user || "-",
            log.organization,
            log.clientName || "-",
            log.eventNumber || "-",
            log.tablingSpot || "-",
            log.checkInTime ? dayjs(log.checkInTime).format("h:mm A") : "-",
            checkOutCell,
            log.noShow ? "Yes" : "No",
            log.table?.barcode ? `1 Table (${log.table.barcode})` : "No",
            log.chairs?.length
              ? `${log.chairs.length} Chair${log.chairs.length > 1 ? "s" : ""} (${log.chairs.map(c => c.barcode).join(", ")})`
              : "No",
            log.notes || "-"
          ];
        }),
        styles: {
          fontSize: 9,
          cellPadding: 4,
          halign: "center",
          valign: "middle",
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: asuGold,
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
        },
        margin: { top: 70, bottom: 80 },
      
        // ✅ RED TEXT STYLE FOR "(Not checked out)"
        didParseCell: function (data) {
          if (
            data.section === 'body' &&
            data.column.index === 8 && // Check-Out column
            typeof data.cell.raw === "string" &&
            data.cell.raw.includes("Not checked out")
          ) {
            data.cell.styles.textColor = [200, 0, 0]; // red
            data.cell.styles.fontStyle = 'bold';
          }
        },
      
        didDrawPage: (data) => {
          const footerY = doc.internal.pageSize.getHeight() - 60;
          doc.setDrawColor(150);
          doc.setLineWidth(1);
          doc.line(40, footerY, pageWidth - 40, footerY);
      
          doc.setFontSize(10);
          doc.setTextColor(60);
          doc.text(`Exported on: ${exportDate} at ${exportTime}`, pageWidth / 2, footerY + 15, { align: "center" });
          doc.text("Memorial Union & Student Pavilion Operations", pageWidth / 2, footerY + 30, { align: "center" });
          doc.text("Arizona State University", pageWidth / 2, footerY + 45, { align: "center" });
        }
      });
      
  
      doc.save(`Tabling Logs ${now.format("MMM D YYYY")}.pdf`);
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("/api/organizations/all-logs");
      setLogs(res.data || []);
      const orgRes = await axios.get("/api/organizations");
      setOrganizations(orgRes.data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filteredLogs = logs.filter((log) => {
      const logDate = dayjs(log.checkInTime || log.checkOutTime || log.rangeStart).format("YYYY-MM-DD");
      const matchesDate = !selectedDate || selectedDate === logDate;
      const matchesOrg = selectedOrg === "All Organizations" || log.organization === selectedOrg;

      const now = dayjs();
      const checkIn = log.checkInTime ? dayjs(log.checkInTime) : null;
const checkOut = log.checkOutTime ? dayjs(log.checkOutTime) : null;

// ✅ Declare this BEFORE using it
const hasEquipment = log.table?.barcode || (log.chairs?.length ?? 0) > 0;

const overdue = checkIn && dayjs().diff(checkIn, "hour") >= 6;

/*const didNotCheckOut =
  hasEquipment &&
  checkIn &&
  !checkOut &&
  overdue;
*/
const didNotCheckOut =
!log.noShow && // ✅ Exclude no shows
log.rangeEnd &&
!log.checkOutTime &&
dayjs().diff(dayjs(log.rangeEnd), "hour") >= 6;

  const earlyCheckIn =
  log.checkInTime && log.rangeStart &&
  dayjs(log.rangeStart).diff(dayjs(log.checkInTime), "minute") > 15;

const lateCheckIn =
  log.checkInTime && log.rangeStart &&
  dayjs(log.checkInTime).diff(dayjs(log.rangeStart), "minute") > 15;

const earlyCheckOut =
  log.checkOutTime && log.rangeEnd &&
  dayjs(log.rangeEnd).diff(dayjs(log.checkOutTime), "minute") > 30;

const lateCheckOut =
  log.checkOutTime && log.rangeEnd &&
  dayjs(log.checkOutTime).diff(dayjs(log.rangeEnd), "minute") >= 15;


  const matchesAction =
  selectedAction === "All" ||
  (selectedAction === "no_show" && log.noShow) ||
  (selectedAction === "not_checked_out" && didNotCheckOut) ||
  (selectedAction === "early_checkin" && earlyCheckIn) ||
  (selectedAction === "late_checkin" && lateCheckIn) ||
  (selectedAction === "early_checkout" && earlyCheckOut) ||
  (selectedAction === "late_checkout" && lateCheckOut);


  


      const matchesNoShow = noShowFilter === "All" || (noShowFilter === "Yes" ? log.noShow : !log.noShow);
      const matchesSearch =
  log.clientName?.toLowerCase().includes(lowerSearch) ||
  log.eventNumber?.toLowerCase().includes(lowerSearch) ||
  log.tablingSpot?.toLowerCase().includes(lowerSearch) ||
  log.user?.toLowerCase().includes(lowerSearch) ||
  log.notes?.toLowerCase().includes(lowerSearch) ||
  (log.table?.barcode?.toLowerCase().includes(lowerSearch)) ||
  (log.chairs?.some((c) => c.barcode?.toLowerCase().includes(lowerSearch)));

      return matchesDate && matchesOrg && matchesAction && matchesNoShow && matchesSearch;
    });

    setFiltered(filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    setCurrentPage(1); // reset to first page on filter change
  }, [logs, selectedDate, selectedOrg, selectedAction, noShowFilter, search]);

  const currentLogs = filtered.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
  const totalPages = Math.ceil(filtered.length / logsPerPage);

  return (
    <>
      <TopBar />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <h2 className="text-3xl font-bold text-center text-asuGold mb-6">Tabling Logs</h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
        <input
  type="date"
  className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
  placeholder="mm/dd/yyyy"
/>

          <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-3 py-2">
            <option>All Organizations</option>
            {organizations.map((org) => (
              <option key={org}>{org}</option>
            ))}
          </select>
          <select
  value={selectedAction}
  onChange={(e) => setSelectedAction(e.target.value)}
  className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
>
  <option value="All">All</option>
  <option value="no_show">No Show</option>
  <option value="early_checkin">Early Check-In</option>
<option value="late_checkin">Late Check-In</option>
<option value="early_checkout">Early Check-Out</option>
<option value="late_checkout">Late Check-Out</option>
<option value="not_checked_out">Did Not Check Out</option>

</select>

          <input
            type="text"
            placeholder="Search client, event, spot..."
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 w-80"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
  <button
    onClick={exportTablingLogsPDF}
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
  >
    Export as PDF
  </button>

        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-800 text-white uppercase text-xs">
              <tr>
                {["Date", "Time", "User", "Org", "Client", "Event #", "Spot", "Check-In", "Check-Out", "No Show", "Tables", "Chairs", "Notes"].map((h) => (
                  <th key={h} className="border border-gray-700 px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentLogs.map((log, i) => {
                const date = dayjs(log.checkInTime || log.checkOutTime || log.rangeStart).format("MM/DD/YYYY");
                const time = dayjs(log.checkInTime || log.checkOutTime || log.rangeStart).format("h:mm A");
                const noShowBadge = (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.noShow ? "bg-green-600" : "bg-red-600"}`}>
                    {log.noShow ? "Yes" : "No"}
                  </span>
                );

                return (
                  <tr key={i} className="hover:bg-gray-800">
                    <td className="border border-gray-700 px-3 py-2">{date}</td>
                    <td className="border border-gray-700 px-3 py-2">{time}</td>
                    <td className="border border-gray-700 px-3 py-2">{log.user || "-"}</td>
                    <td className="border border-gray-700 px-3 py-2">{log.organization}</td>
                    <td className="border border-gray-700 px-3 py-2">{log.clientName || "-"}</td>
                    <td className="border border-gray-700 px-3 py-2">{log.eventNumber || "-"}</td>
                    <td className="border border-gray-700 px-3 py-2">{log.tablingSpot || "-"}</td>
                    <td className="border border-gray-700 px-3 py-2">{log.checkInTime ? dayjs(log.checkInTime).format("h:mm A") : "-"}</td>
                    <td className="border border-gray-700 px-3 py-2">
  {log.checkOutTime
    ? dayjs(log.checkOutTime).format("h:mm A")
    : (() => {
        const now = dayjs();
        const checkIn = log.checkInTime ? dayjs(log.checkInTime) : null;
        const overdue = checkIn && now.diff(checkIn, "hour") >= 6;
        const hasEquipment = log.table?.barcode || (log.chairs?.length ?? 0) > 0;

        if (overdue && hasEquipment) {
          return <span className="text-red-500 font-semibold">(Not checked out)</span>;
        }
        return "-";
      })()}
</td>

                    <td className="border border-gray-700 px-3 py-2 text-center">{noShowBadge}</td>
                    <td className="border border-gray-700 px-3 py-2 whitespace-pre-line">
                      {log.table?.barcode ? `Yes\n1 Table (${log.table.barcode})` : "No"}
                    </td>
                    <td className="border border-gray-700 px-3 py-2 whitespace-pre-line">
                      {log.chairs?.length
                        ? `Yes\n${log.chairs.length} Chair${log.chairs.length > 1 ? "s" : ""} (${log.chairs.map((c) => c.barcode).join(", ")})`
                        : "No"}
                    </td>
                    <td className="border border-gray-700 px-3 py-2">{log.notes || "-"}</td>
                  </tr>
                );
              })}
              {currentLogs.length === 0 && (
                <tr>
                  <td colSpan="13" className="text-center text-gray-400 px-4 py-6">
                    No tabling logs match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-4">
            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-1 rounded bg-gray-700 text-white disabled:opacity-50">
              Prev
            </button>
            <span className="text-white">{`Page ${currentPage} of ${totalPages}`}</span>
            <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-1 rounded bg-gray-700 text-white disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default TablingLogs;
