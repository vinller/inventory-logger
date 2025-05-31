// ItemStatus.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";


dayjs.extend(duration);

function ItemStatus() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("checkedOut");


  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/items");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch items", err);
    }
  };

  const resolveIssue = async (barcode, resolutionType) => {
    try {
      await axios.post("/api/items/resolve-issue", { barcode, resolutionType }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      // ✅ Force update local item state
      setItems(prev =>
        prev.map(item =>
          item.barcode === barcode
            ? {
                ...item,
                isBroken: resolutionType === "fixed" ? false : item.isBroken,
                isMissing: resolutionType === "found" ? false : item.isMissing,
                isAvailable: true,
                checkedOutBy: null,
                logs: [
                  ...(item.logs || []),
                  {
                    action: resolutionType === "fixed" ? "mark_fixed" : "marked_found",
                    user: user?.username || "Admin",
                    timestamp: new Date(),
                  },
                  {
                    action: "check_in",
                    user: user?.username || "Admin",
                    timestamp: new Date(),
                  },
                ],
              }
            : item
        )
      );
  
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to resolve issue", err);
      alert("Failed to resolve issue.");
    }
  };
  


  const categorizeItems = () => {
    const checkedOut = items.filter(i => i.checkedOutBy && !i.isMissing && !i.isBroken && !i.archive && !i.maintenance);
    const missing = items.filter(i => i.isMissing && !i.archive);
    const broken = items.filter(i => i.isBroken && !i.archive);
    const maintenance = items.filter(i => i.maintenance && !i.archive);
    const archived = items.filter(i => i.archive);
  
    const reported = items.filter(i => {
      if (!i.logs || i.archive) return false;
  
      const latestIssue = [...i.logs].reverse().find(log => log.action === "report_issue");
      if (!latestIssue) return false;
  
      const issueTime = new Date(latestIssue.timestamp);
  
      const resolved = i.logs.some(log =>
        ["mark_fixed", "marked_found"].includes(log.action) &&
        new Date(log.timestamp) > issueTime
      );
  
      const currentlyResolved = !i.isBroken && !i.isMissing;
  
      return !resolved && !currentlyResolved;
    });
  
    return { checkedOut, missing, broken, reported, maintenance, archived };
  };
  

const handleArchive = async () => {
  const confirm = window.confirm("Are you sure you want to archive this item? This will also remove all issue statuses.");
  if (!confirm) return;

  try {
    // First: update archive + flags
    await axios.put(`http://localhost:5000/api/items/${selectedItem._id}`, {
      archive: true,
      isBroken: false,
      isMissing: false,
      isAvailable: false,
      maintenance: false,
    });

    // Second: log it as a separate entry
    await axios.post(`http://localhost:5000/api/items/${selectedItem.barcode}/log`, {
      action: "archived",
      user: user.username,
      notes: "Archived and reset all statuses",
    });    

    fetchItems();
    setModalOpen(false);
  } catch (err) {
    console.error("Failed to archive item:", err.response?.data || err.message);
    alert("Failed to archive this item.");
  }
};



  const getLatestLog = (item) => {
    return item.logs?.slice().reverse().find(log => log.action === "check_out") || null;
  };

  const timeSinceCheckout = (checkoutTime) => {
    if (!checkoutTime) return { text: "N/A", color: "text-white" };
    const now = dayjs();
    const checkedOut = dayjs(checkoutTime);
    const diffHours = now.diff(checkedOut, "hour");
    const diffMinutes = now.diff(checkedOut, "minute") % 60;
    return {
      text: `${diffHours}h ${diffMinutes}m`,
      color: diffHours >= 12 ? "text-red-500" : "text-green-400",
    };
  };

  const handleAction = async (item, action) => {
    const now = new Date();
    const username = user?.username || "Admin"; // ← use the top-level variable
    let updates = {};
  
    const createLog = (actionName) => ({
      action: actionName,
      user: username,
      timestamp: now,
    });
  
    if (action === "checkin") {
      updates = {
        isAvailable: true,
        checkedOutBy: null,
        logs: [createLog("check_in")],
      };
    } else if (action === "lost") {
      updates = {
        isMissing: true,
        logs: [createLog("marked_missing")],
      };
    } else if (action === "broken") {
      updates = {
        isBroken: true,
        logs: [createLog("mark_broken")],
      };
    } else if (action === "found") {
      updates = {
        isMissing: false,
        isAvailable: true,
        checkedOutBy: null,
        logs: [createLog("marked_found"), createLog("check_in")],
      };
    } else if (action === "fixed") {
      updates = {
        isBroken: false,
        isAvailable: true,
        checkedOutBy: null,
        logs: [createLog("mark_fixed"), createLog("check_in")],
      };
    }
  
    try {
      await axios.put(`http://localhost:5000/api/items/${item._id}`, updates);
      fetchItems();
      setModalOpen(false);
    } catch (err) {
      console.error("Action failed", err);
    }
  };
  

  const renderItemCard = (item) => {
    const latestIssue = item.logs?.slice().reverse().find(log => log.action === "report_issue");

    let cardBg = "bg-gray-800";
    let status = null;
    let statusColor = "";
    let dotColor = "bg-gray-500";

    if (item.archive) {
    //  cardBg = "bg-gray-700 opacity-50";
      status = "Archived";
      statusColor = "text-gray-300";
    } else if (item.maintenance) {
   //   cardBg = "bg-orange-600";
      status = "Maintenance";
      statusColor = "text-orange-200";
      dotColor = "bg-orange-400";
    } else if (item.isBroken) {
    //  cardBg = "bg-red-600";
      status = "Broken";
      statusColor = "text-red-200";
      dotColor = "bg-red-400";
    } else if (item.isMissing) {
    //  cardBg = "bg-yellow-600";
      status = "Missing";
      statusColor = "text-yellow-100";
      dotColor = "bg-yellow-300";
    } else if (latestIssue) {
     // cardBg = "bg-blue-600";
      status = "Reported";
      statusColor = "text-blue-200";
      dotColor = "bg-blue-300";
    } else if (item.isAvailable) {
      status = "Available";
      statusColor = "text-green-400";
      dotColor = "bg-green-400";
    }

    return (
      <div
        key={item._id}
        className={`${cardBg} rounded-xl p-5 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02] cursor-pointer border border-gray-600`}
        onClick={() => {
          setSelectedItem(item);
          setModalOpen(true);
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] text-white/50 font-medium mb-1 uppercase tracking-wide">Barcode</p>
            <p className="text-sm font-bold font-mono text-asuGold">#{item.barcode}</p>
          </div>
          {status && (
            <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${statusColor} bg-black/20 border border-white/10`}>{status}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white truncate max-w-[80%]">{item.name}</h3>
          <span className={`w-3 h-3 rounded-full ${dotColor}`} title={status} />
        </div>
      </div>
    );
  };
  
  

  

  const handleSendToEMS = async (item) => {
    const latestLog = getLatestLog(item);
    if (!latestLog) return;
  
    try {
      await axios.post("/api/notifications/send-ems-alert", {
        itemName: item.name,
        barcode: item.barcode,
        eventNumber: latestLog.eventNumber,
        room: latestLog.room,
        clientName: latestLog.clientName,
        checkedOutBy: latestLog.user,
        initiatedBy: "Admin", // Or replace with dynamic admin username if using auth
      });
  
      alert("EMS notification sent.");
    } catch (err) {
      console.error("Failed to notify EMS:", err);
      alert("Failed to send EMS notification.");
    }
  };

  const renderModal = () => {
    if (!selectedItem) return null;
    const latestLog = getLatestLog(selectedItem);
    const time = latestLog?.timestamp ? timeSinceCheckout(latestLog.timestamp) : null;
    const latestIssue = selectedItem.logs?.slice().reverse().find(log => log.action === "report_issue");

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-white/50 font-medium mb-1 uppercase tracking-wide">Barcode</p>
              <p className="text-base font-bold font-mono text-asuGold">#{selectedItem.barcode}</p>
              <h2 className="text-xl font-bold mt-2">{selectedItem.name}</h2>
            </div>
          </div>

          {latestLog && (
            <div className="mb-4 space-y-1">
              <p><span className="font-semibold">Client:</span> {latestLog.clientName}</p>
              <p><span className="font-semibold">Event #:</span> {latestLog.eventNumber}</p>
              <p><span className="font-semibold">User:</span> {latestLog.user}</p>
              <p><span className="font-semibold">Location:</span> {latestLog.room}</p>
              <p><span className="font-semibold">Date:</span> {dayjs(latestLog.timestamp).format("MMM D, YYYY [at] h:mm A")}</p>
              <p className={`font-bold ${time.color}`}><span className="font-semibold">Time Out:</span> {time.text}</p>
            </div>
          )}

          {latestIssue && (
            <div className="mb-4">
              <p className="text-sm italic text-yellow-400">Issue Report: {latestIssue.notes}</p>
            </div>
          )}

          {/* Buttons Section */}
          <div className="flex flex-wrap gap-3 mt-4">
            {selectedItem.checkedOutBy && !selectedItem.isMissing && !selectedItem.isBroken && !selectedItem.archive && !selectedItem.maintenance && (
              <>
                <button onClick={() => handleAction(selectedItem, "checkin")} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">Mark as Checked In</button>
                <button onClick={() => handleAction(selectedItem, "lost")} className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded">Mark as Lost</button>
                <button onClick={() => handleAction(selectedItem, "broken")} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Mark as Broken</button>
              </>
            )}

            {(activeTab === "reported" || selectedItem.isMissing || selectedItem.isBroken) && (
              <>
                {selectedItem.isMissing && (
                  <>
                    <button onClick={() => resolveIssue(selectedItem.barcode, "found")} className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded">Mark as Found</button>
                    <button onClick={() => handleSendToEMS(selectedItem)} className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded">Send to EMS</button>
                  </>
                )}
                {selectedItem.isBroken && (
                  <>
                    <button onClick={() => resolveIssue(selectedItem.barcode, "fixed")} className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded">Mark as Fixed</button>
                    <button onClick={() => handleSendToEMS(selectedItem)} className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded">Send to EMS</button>
                  </>
                )}
              </>
            )}

            {/* Admin Controls */}
            {user?.role === "admin" && !selectedItem.archive && (
              <button onClick={handleArchive} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">Archive Item</button>
            )}

            {user?.role === "admin" && selectedItem.archive && (
              <button
                onClick={async () => {
                  await axios.put(`http://localhost:5000/api/items/${selectedItem._id}`, {
                    archive: false,
                    logs: [{
                      action: "unarchived",
                      user: user.username,
                      timestamp: new Date(),
                      notes: "Manually unarchived",
                    }]
                  });
                  fetchItems();
                  setModalOpen(false);
                }}
                className="bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded"
              >
                Unarchive Item
              </button>
            )}

            {user?.role === "admin" && !selectedItem.maintenance && !selectedItem.archive && (
              <button
                onClick={async () => {
                  await axios.put(`http://localhost:5000/api/items/${selectedItem._id}`, {
                    maintenance: true,
                    logs: [{
                      action: "maintenance",
                      user: user.username,
                      timestamp: new Date(),
                      notes: "Marked as maintenance",
                    }]
                  });
                  fetchItems();
                  setModalOpen(false);
                }}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
              >
                Mark as Maintenance
              </button>
            )}

            {user?.role === "admin" && selectedItem.maintenance && (
              <button
                onClick={async () => {
                  await axios.put(`http://localhost:5000/api/items/${selectedItem._id}`, {
                    maintenance: false,
                    logs: [{
                      action: "unmaintenance",
                      user: user.username,
                      timestamp: new Date(),
                      notes: "Removed from maintenance",
                    }]
                  });
                  fetchItems();
                  setModalOpen(false);
                }}
                className="bg-orange-400 hover:bg-orange-500 px-4 py-2 rounded"
              >
                Remove Maintenance
              </button>
            )}

            <button onClick={() => setModalOpen(false)} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded ml-auto">Close</button>
          </div>
        </div>
      </div>
    );
  };

  const { checkedOut, missing, broken, reported, maintenance, archived } = categorizeItems();



  const tabs = [
    { id: "checkedOut", label: "Checked Out", items: checkedOut },
    { id: "missing", label: "Missing", items: missing },
    { id: "broken", label: "Broken", items: broken },
    { id: "reported", label: "Reported Issues", items: reported }, // ← new
    { id: "maintenance", label: "Maintenance", items: maintenance },
    { id: "archived", label: "Archived", items: archived },
  ];
  

  return (
    <>
      <TopBar />
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-3xl font-bold mb-6">Item Status Overview</h1>

        <div className="flex gap-4 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded ${activeTab === tab.id ? "bg-yellow-500" : "bg-gray-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {tabs.find(t => t.id === activeTab)?.items.map(renderItemCard)}
</div>
      </div>

      {modalOpen && renderModal()}
      <Footer />
    </>
    
  );
}

export default ItemStatus;