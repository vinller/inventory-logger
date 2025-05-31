// src/pages/EMSDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

function EMSDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const dashboardCards = [
    {
      title: "Tabling Logs",
      description: "View all tabling reservation actions and search by organization, date, or client.",
      path: "/tabling-logs",
      icon: "🪑",
      tag: "Mall Reservations"
    },
    {
      title: "Today’s Mall Reservations",
      description: "Quickly view today’s scheduled tablings, setups, and equipment for all mall locations.",
      path: "https://asu-tempe.mymazevo.com/eventlistview?code=ZW9NSlBEM1pXNklLRXNuTDgyS3lwR3dqL21yLzJCanVLeFk5VVNjVDV4UG1Hb1ZiTHlLcVVCKzBrcHVyWkxsTkpNTmd1L3RvYWZ5blBwQk5kWWNMOCtjTEdOUWhWWnd6N0wyazdvcjV2cXlLMkhYeG9BRGR3d29xUHNhM3FSQW9QNzlFVzIxNkJMb0EzNVRrdHBxRENXZ01obCtia3hyblQ3Q1o2N05mdkNvPQ&st=0fgihr2g",
      icon: "📅",
      tag: "Today"
    }    
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
              onClick={() => {
                if (card.path.startsWith("http")) {
                  window.open(card.path, "_blank");
                } else {
                  navigate(card.path);
                }
              }}
              
              className="relative cursor-pointer bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-5 shadow-xl hover:scale-[1.02] transition duration-300 border border-gray-600"
            >
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

export default EMSDashboard;
