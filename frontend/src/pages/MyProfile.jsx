import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; // Assumes context is setup

function MyProfile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/users/${user._id}/change-password`, {
        currentPassword,
        newPassword,
      });
      setStatus({ success: true, message: res.data.message });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setStatus({ success: false, message: err.response?.data?.message || "Error" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">My Profile</h1>
      <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
        <input
          type="password"
          placeholder="Current Password"
          className="w-full p-2 rounded bg-gray-700"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password"
          className="w-full p-2 rounded bg-gray-700"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
          Change Password
        </button>
        {status && (
          <p className={`text-sm ${status.success ? "text-green-400" : "text-red-400"}`}>
            {status.message}
          </p>
        )}
      </form>
    </div>
  );
}

export default MyProfile;
