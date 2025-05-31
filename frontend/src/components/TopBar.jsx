import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";

const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case "admin":
        return "/admin-dashboard";
      case "ems":
        return "/ems-dashboard";
      case "user":
        return "/user-dashboard";
      default:
        return "/";
    }
  };

  const getRoleStyles = () => {
    switch (user?.role) {
      case "admin":
        return "bg-purple-600 text-white"; // Pro Staff / Admin
      case "user":
        return "bg-blue-600 text-white";   // Building Manager
      case "ems":
        return "bg-green-600 text-white";  // EMS
      default:
        return "bg-gray-500 text-white";   // Fallback
    }
  };
  

  const getRoleLabel = () => {
    if (user?.role === "admin") return "Admin";
    if (user?.role === "user") return "Building Manager";
    if (user?.role === "ems") return "EMS";
    return user?.role || "";
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 text-white">
      
      {/* Left: Back + Logo */}
      <div className="flex items-center gap-4">
        {location.pathname !== getDashboardPath() && (
          <button
          onClick={() => navigate(-1)}
          className="text-asuGold text-lg font-bold hover:opacity-80 transition"
          title="Go back"
        >
          ←
        </button>
        
        )}
        <Link to={getDashboardPath()}>
          <img
            src="https://newamericanuniversity.asu.edu/modules/composer/webspark-module-asu_footer/img/ASU-EndorsedLogo.png"
            alt="ASU Logo"
            className="h-10 hover:opacity-80 transition"
          />
        </Link>
      </div>

       { /*currentPage && (
        <div className="absolute left-1/2 transform -translate-x-1/2 text-sm font-medium text-white/80">
          {currentPage}
        </div>
      )*/} 

      {/* Right: User Info + Logout */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{user.username}</span>
          <span className={`${getRoleStyles()} px-2 py-0.5 rounded-full text-xs font-medium`}>
            {getRoleLabel()}
          </span>
        </div>
        
        )}
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default TopBar;
