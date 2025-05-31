import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";

function ClientOptions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Mall Reservation Check-In",
      description: "Log an organization’s arrival and record any tables or chairs they take for their tabling reservation.",
      path: "/checkin",
      color: "from-green-900 to-green-700",
      tag: "Check In",
      tagColor: "bg-green-600 text-white"
    },
    {
      title: "Mall Reservation Check-Out",
      description: "Check out an organization and log the return of all assigned equipment, that include tables and chairs.",
      path: "/checkout",
      color: "from-blue-900 to-blue-700",
      tag: "Check Out",
      tagColor: "bg-blue-600 text-white"
    },
    {
      title: "Mall Reservation No-Show",
      description: "Report an organization that did not show up for their scheduled tabling reservation.",
      path: "/noshow",
      color: "from-red-900 to-red-700",
      tag: "No Show",
      tagColor: "bg-red-600 text-white"
    },
  ];
  
  return (
    <>
      <TopBar />
      <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
        <h2 className="text-3xl font-bold text-center text-asuGold mb-8">
          Mall Reservation Tabling Options
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className={`relative cursor-pointer bg-gradient-to-br ${card.color} rounded-2xl p-5 shadow-xl hover:scale-[1.02] transition duration-300 border border-gray-600`}

            >
              <div className="text-sm text-gray-400 mb-1">{card.date}</div>
              <h3 className="text-xl font-bold text-white mb-1">{card.title}</h3>
              <p className="text-gray-300 text-sm mb-4">{card.description}</p>

              <div className="flex justify-between items-center">
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${card.tagColor}`}>
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

export default ClientOptions;
