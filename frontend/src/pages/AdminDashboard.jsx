// src/pages/AdminDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const adminDashboardCards = [
    {
      title: "Log Items",
      description: "Scan and manage inventory items by checking them in, or checking them out, and updating their status in real time.",
      path: "/scan",
      icon: "📦",
      tag: "Check In/Out"
    },
    {
      title: "Mall Tablings",
      description: "Manage organization tabling reservations by logging check-ins, check-outs, and no-shows, and tracking table and chair usage.",
      path: "/client-options",
      icon: "🪑",
      tag: "Mall Reservations"
    },
    {
      title: "Tabling Logs",
      description: "View all tabling reservation actions and search by organization, date, or client.",
      path: "/tabling-logs",
      icon: "🗂️",
      tag: "Mall Reservations"
    },
    {
      title: "Item Management",
      description: "View, add, edit, archive, or delete inventory by building and category.",
      path: "/admin-dashboard/items",
      icon: "📦",
      tag: "Inventory"
    },
    {
      title: "Generate Codes",
      description: "Generate and manage barcodes or QR codes for all inventory items.",
      path: "/admin-dashboard/generate-codes",
      icon: "➕",
      tag: "Tools"
    },
    {
      title: "Barcodes / QR Codes Lookup",
      description: "Search for barcode or QR code details and view assignment history.",
      path: "/admin-dashboard/barcodes",
      icon: "🔖",
      tag: "Lookup"
    },
    {
      title: "Verification Logs",
      description: "Access logs of equipment verification forms submitted by staff.",
      path: "/admin-dashboard/verification-logs",
      icon: "✅",
      tag: "Review"
    },
    {
      title: "System Logs",
      description: "View backend activity logs including item status changes and errors.",
      path: "/admin-dashboard/system-logs",
      icon: "📜",
      tag: "Audit"
    },
    {
      title: "User Management",
      description: "Create, modify, or remove users and assign roles or permissions.",
      path: "/admin-dashboard/users",
      icon: "👥",
      tag: "Accounts"
    }
  ];
   

  return (
    <>
      <TopBar />

      <div className="p-6 min-h-screen bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center text-asuGold">
          Welcome, {user?.username}!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminDashboardCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className="relative cursor-pointer bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-5 shadow-xl hover:scale-[1.02] transition duration-300 border border-gray-600"
            >
              <div className="text-sm text-gray-400 mb-1">{card.date}</div>
              <h3 className="text-xl font-bold text-white mb-1">{card.title}</h3>
              <p className="text-gray-300 text-sm mb-4">{card.description}</p>

              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70 bg-gray-600 rounded-full px-3 py-1 font-medium">
                  {card.tag}
                </span>
                <span className="text-2xl">{card.icon}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AdminDashboard;
