import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);

function TablingLogs() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedOrg, setSelectedOrg] = useState("All");
  const [selectedAction, setSelectedAction] = useState("All");
  const [noShowFilter, setNoShowFilter] = useState("All");
  const [search, setSearch] = useState("");

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
      const matchesDate = selectedDate === logDate;
      const matchesOrg = selectedOrg === "All" || log.organization === selectedOrg;
      const matchesAction = selectedAction === "All" || log.action === selectedAction;
      const matchesNoShow =
        noShowFilter === "All" || (noShowFilter === "Yes" ? log.noShow : !log.noShow);
      const matchesSearch =
        log.clientName?.toLowerCase().includes(lowerSearch) ||
        log.eventNumber?.toLowerCase().includes(lowerSearch) ||
        log.tablingSpot?.toLowerCase().includes(lowerSearch) ||
        log.user?.toLowerCase().includes(lowerSearch) ||
        log.notes?.toLowerCase().includes(lowerSearch);
      return matchesDate && matchesOrg && matchesAction && matchesNoShow && matchesSearch;
    });

    setFiltered(filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  }, [logs, selectedDate, selectedOrg, selectedAction, noShowFilter, search]);

  return (
    <>
    <TopBar />
      <div className="min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-3xl font-bold text-center text-asuGold mb-6">Tabling Logs</h2>

      <div className="flex flex-wrap gap-4 mb-4 justify-center">
        <input
          type="date"
          className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-3 py-2">
          <option>All Organizations</option>
          {organizations.map((org) => (
            <option key={org}>{org}</option>
          ))}
        </select>
        <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-3 py-2">
          <option>All Actions</option>
          <option value="check_in">Check In</option>
          <option value="check_out">Check Out</option>
          <option value="no_show">No Show</option>
        </select>
        <input
          type="text"
          placeholder="Search client, event, spot..."
          className="bg-gray-800 border border-gray-600 rounded px-3 py-2 w-80"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-800 text-white uppercase text-xs">
            <tr>
              <th className="border border-gray-700 px-3 py-2">Date</th>
              <th className="border border-gray-700 px-3 py-2">Time</th>
              <th className="border border-gray-700 px-3 py-2">User</th>
              <th className="border border-gray-700 px-3 py-2">Org</th>
              <th className="border border-gray-700 px-3 py-2">Client</th>
              <th className="border border-gray-700 px-3 py-2">Event #</th>
              <th className="border border-gray-700 px-3 py-2">Spot</th>
              <th className="border border-gray-700 px-3 py-2">Check-In</th>
              <th className="border border-gray-700 px-3 py-2">Check-Out</th>
              <th className="border border-gray-700 px-3 py-2">No Show</th>
              <th className="border border-gray-700 px-3 py-2">Tables</th>
              <th className="border border-gray-700 px-3 py-2">Chairs</th>
              <th className="border border-gray-700 px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => {
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
                  <td className="border border-gray-700 px-3 py-2">{log.checkOutTime ? dayjs(log.checkOutTime).format("h:mm A") : "-"}</td>
                  <td className="border border-gray-700 px-3 py-2 text-center">{noShowBadge}</td>
                  <td className="border border-gray-700 px-3 py-2 whitespace-pre-line">
                    {log.table?.barcode ? `Yes\n1 Table (${log.table.barcode})` : "No"}
                  </td>
                  <td className="border border-gray-700 px-3 py-2 whitespace-pre-line">
                    {log.chairs?.length
                      ? `Yes\n${log.chairs.length} Chair${log.chairs.length > 1 ? "s" : ""} (${log.chairs.map(c => c.barcode).join(", ")})`
                      : "No"}
                  </td>
                  <td className="border border-gray-700 px-3 py-2">{log.notes || "-"}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="13" className="text-center text-gray-400 px-4 py-6">
                  No tabling logs match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

export default TablingLogs;
