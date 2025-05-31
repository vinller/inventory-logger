// src/pages/UserDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";


function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: "Log Items",
      description: "Check in or check out items using barcode scanning.",
      path: "/scan",
      icon: "📦",
      tag: "Check In/Out"
    },
    {
      title: "Mall Tablings",
      description: "Log tabling equipment for client reservations.",
      path: "/client-options",
      icon: "🪑",
      tag: "Mall Reservations"
    },
    {
      title: "Equipment Check",
      description: "Verify that all required items are present during your shift.",
      path: "/shift-checklist",
      icon: "✅",
      tag: "Verification"
    },
    {
      title: "Report Item Issue",
      description: "Report broken, missing, or unclean items directly to admins.",
      path: "/update-item",
      icon: "⚠️",
      tag: "Report"
    },
    {
      title: "Item Lookup",
      description: "Search and view current status of any inventory item.",
      path: "/item-lookup",
      icon: "🔍",
      tag: "Inventory"
    },
    {
      title: "My History",
      description: "Review your personal check-in/check-out activity logs.",
      path: "/user-history",
      icon: "📜",
      tag: "Logs"
    },
    {
      title: "FAQs",
      description: "Find answers to common questions and learn system tips.",
      path: "/faq",
      icon: "❓",
      tag: "Help"
    },
  ];
  
  return (
    <>
      <TopBar />
      <div className="p-6 min-h-screen bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center text-asuGold">
          Welcome, {user?.username}!
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (
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

export default UserDashboard;