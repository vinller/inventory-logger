import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/mazevo/auto-fetch-events");
        setEvents(res.data?.events || res.data?.data?.events || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load events.");
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <>
      <TopBar />
      <div className="p-6 min-h-screen bg-gray-900 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center text-asuGold">Mazevo Events</h2>

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {!loading && events.length === 0 && <p className="text-center">No events found.</p>}

        {events.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-600 bg-gray-800 text-white">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-4 py-2 border border-gray-600">Event Name</th>
                  <th className="px-4 py-2 border border-gray-600">Location</th>
                  <th className="px-4 py-2 border border-gray-600">Start</th>
                  <th className="px-4 py-2 border border-gray-600">End</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={index} className="hover:bg-gray-700">
                    <td className="px-4 py-2 border border-gray-600">{event.eventName}</td>
                    <td className="px-4 py-2 border border-gray-600">{event.roomName}</td>
                    <td className="px-4 py-2 border border-gray-600">{event.startTime}</td>
                    <td className="px-4 py-2 border border-gray-600">{event.endTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default EventList;
