// src/pages/ItemLookup.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import dayjs from "dayjs";
import Footer from "../components/Footer";


function Lookup() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Checked Out");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get("/api/items");
        setItems(res.data || []);
      } catch (err) {
        console.error("Failed to fetch items", err);
      }
    };
    fetchItems();
  }, []);

  const getStatus = (item) => {
    const latestIssue = item.logs?.slice().reverse().find(log => log.action === "report_issue");
    if (!item.isAvailable) return { status: "Checked Out", color: "bg-red-600 text-red-200", icon: "❌" };
    if (item.archive) return { status: "Archived", color: "bg-gray-500 text-gray-300", icon: "📦" };
    if (item.maintenance) return { status: "Maintenance", color: "bg-orange-600 text-orange-200", icon: "🛠️" };
    if (item.isBroken) return { status: "Broken", color: "bg-red-600 text-red-200", icon: "🚨" };
    if (item.isMissing) return { status: "Missing", color: "bg-yellow-600 text-yellow-100", icon: "❗" };
    return { status: "Available", color: "bg-gray-800 text-green-400", icon: "✅" };
  };

  const filtered = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.barcode.toLowerCase().includes(search.toLowerCase());
    const currentStatus = getStatus(item)?.status;
    const matchesStatus = statusFilter ? currentStatus === statusFilter : true;
    const matchesBuilding = buildingFilter ? item.building === buildingFilter : true;
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    return matchesSearch && matchesStatus && matchesBuilding && matchesCategory;
  });

  const renderCheckoutModal = () => {
    if (!modalOpen || !checkoutInfo) return null;
    const { name, barcode, user, room = "-", clientName = "-", eventNumber = "-", timestamp } = checkoutInfo;
    const formattedTime = timestamp ? new Date(timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "-";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg text-white">
          <h3 className="text-xl font-bold mb-4 text-asuGold">Checked Out Info</h3>
          <p><strong>Item:</strong> {name}</p>
          <p><strong>Barcode:</strong> {barcode}</p>
          <p><strong>Checked Out By:</strong> {user}</p>
          <p><strong>Room:</strong> {room}</p>
          <p><strong>Client:</strong> {clientName}</p>
          <p><strong>Event #:</strong> {eventNumber}</p>
          <p><strong>Time:</strong> {formattedTime}</p>
          <div className="mt-4 text-right">
            <button onClick={() => { setModalOpen(false); setCheckoutInfo(null); }} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <TopBar />
      <div className="p-6 min-h-screen bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center text-asuGold">Item Lookup</h2>
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
  <input
    type="text"
    placeholder="Search by name or barcode..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-72 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder:text-gray-400 focus:outline-none"
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="w-72 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none"
  >
    <option value="">All Statuses</option>
    <option value="Checked Out">Checked Out</option>
    <option value="Available">Available</option>
    <option value="Broken">Broken</option>
    <option value="Missing">Missing</option>
    <option value="Maintenance">Maintenance</option>
    <option value="Archived">Archived</option>
  </select>

  <select
    value={buildingFilter}
    onChange={(e) => setBuildingFilter(e.target.value)}
    className="w-72 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none"
  >
    <option value="">All Buildings</option>
    <option value="Memorial Union">Memorial Union</option>
    <option value="Student Pavilion">Student Pavilion</option>
  </select>

  <select
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
    className="w-72 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none"
  >
    <option value="">All Types</option>
    <option value="Mic">Mic</option>
    <option value="Lavaliers">Lavaliers</option>
    <option value="Tech Bag">Tech Bag</option>
    <option value="HDMI Cable">HDMI Cable</option>
    <option value="Clicker">Clicker</option>
    <option value="Type C Adapters">Type C Adapters</option>
    <option value="Mall Table">Mall Table</option>
    <option value="Mall Chair">Mall Chair</option>
    <option value="Easels">Easels</option>
  </select>
</div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const statusObj = getStatus(item);
            const latestCheckoutLog = [...item.logs].reverse().find(log => log.action === "check_out");

            return (
              <div
  key={item._id}
  className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02] cursor-pointer border border-gray-600"
  onClick={() => {
    if (latestCheckoutLog) {
      setCheckoutInfo({ ...latestCheckoutLog, name: item.name, barcode: item.barcode });
      setModalOpen(true);
    }
  }}
>
  {/* Barcode Label */}
  <p className="text-[11px] text-white/50 font-medium mb-1 uppercase tracking-wide">Barcode</p>
  <p className="text-sm font-bold font-mono text-asuGold mb-3">#{item.barcode}</p>

  {/* Item Name and Status Dot */}
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-lg font-semibold text-white">{item.name}</h3>
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${
        statusObj.status === "Available" ? "bg-green-400"
        : statusObj.status === "Broken" ? "bg-red-400"
        : statusObj.status === "Missing" ? "bg-yellow-300"
        : statusObj.status === "Maintenance" ? "bg-orange-400"
        : statusObj.status === "Archived" ? "bg-gray-400"
        : statusObj.status === "Checked Out" ? "bg-red-600"
        : "bg-blue-400"
      }`} />
      <span className="text-sm text-white/70">{statusObj.status}</span>
    </div>
  </div>
</div>

            );
          })}
        </div>

        {renderCheckoutModal()}
      </div>
      <Footer />
    </>
  );
}

export default Lookup;
