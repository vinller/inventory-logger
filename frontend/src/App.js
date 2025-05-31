// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import EMSDashboard from "./pages/EMSDashboard";
import UserDashboard from "./pages/UserDashboard";
import UserCreationForm from "./pages/UserCreationForm";
import ManageUsers from "./pages/ManageUsers";
import ManageItemsFinal from "./pages/ManageItemsFinal";
import ItemHistory from "./pages/ItemHistory";
import ProtectedRoute from "./components/ProtectedRoute";
import ScanPage from "./pages/ScanPage";
import UserHistory from "./pages/UserHistory";
import Faq from "./pages/FaqPage";
import UpdateItemStatus from "./pages/UpdateItemStatus";
import ItemStatus from "./pages/ItemStatus";
import SystemLogs from "./pages/SystemLogs";
import AdminGenerateCodes from "./pages/AdminGenerateCodes";
import AdminLookupCode from "./pages/AdminLookupCode";
import Lookup from "./pages/Lookup"; // ✅ matches case
import EventList from "./pages/EventList";
import MyProfile from "./pages/MyProfile";
import ShiftChecklist from "./pages/ShiftChecklist";
import VerificationLogs from "./pages/VerificationLogs";
import ClientOptions from "./pages/ClientOptions";
import ClientCheckin from "./pages/ClientCheckIn";
import ClientCheckout from "./pages/ClientCheckout";
import ClientNoShow from "./pages/ClientNoShow";
import TablingLogs from "./pages/TablingLogs";

import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
  path="/tabling-logs"
  element={
    <ProtectedRoute requiredRole={["ems", "admin"]}>
      <TablingLogs />
    </ProtectedRoute>
  }
/>
        <Route
  path="/client-options"
  element={
    <ProtectedRoute requiredRole={["user", "admin"]}>
      <ClientOptions />
    </ProtectedRoute>
  }
/>
<Route
  path="/checkin"
  element={
    <ProtectedRoute requiredRole={["user", "admin"]}>
      <ClientCheckin />
    </ProtectedRoute>
  }
/>
<Route
  path="/checkout"
  element={
    <ProtectedRoute requiredRole={["user", "admin"]}>
      <ClientCheckout />
    </ProtectedRoute>
  }
/>
<Route
  path="/noshow"
  element={
    <ProtectedRoute requiredRole={["user", "admin"]}>
      <ClientNoShow />
    </ProtectedRoute>
  }
/>



        <Route
  path="/admin-dashboard/generate-codes"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminGenerateCodes />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-dashboard/barcodes"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminLookupCode />
    </ProtectedRoute>
  }
/>

<Route
  path="/my-profile"
  element={
      <MyProfile />
  }
/>

        <Route
  path="/admin-dashboard/system-logs"
  element={
    <ProtectedRoute requiredRole="admin">
      <SystemLogs />
    </ProtectedRoute>
  }
/>

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard/manage-users"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserCreationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
  path="/admin-dashboard/items"
  element={
    <ProtectedRoute requiredRole="admin">
      <ManageItemsFinal />
    </ProtectedRoute>
  }
/>
        <Route
          path="/admin-dashboard/items/:barcode"
          element={
            <ProtectedRoute requiredRole="admin">
              <ItemHistory />
            </ProtectedRoute>
          }
        />
  <Route path="/item-status" element={
            <ProtectedRoute requiredRole="admin">
              <ItemStatus />
            </ProtectedRoute>
          } />

<Route path="/admin-dashboard/verification-logs" element={
  <ProtectedRoute requiredRole="admin">
    <VerificationLogs />
  </ProtectedRoute>
} />

        <Route
          path="/ems-dashboard"
          element={
            <ProtectedRoute requiredRole="ems">
              <EMSDashboard />
            </ProtectedRoute>
          }
        />
        <Route
  path="/scan"
  element={
    <ProtectedRoute requiredRole={["user", "admin"]}>
      <ScanPage />
    </ProtectedRoute>
  }
/>
<Route path="/events" element={<EventList />} />

<Route
  path="/user-history"
  element={
    <ProtectedRoute requiredRole="user">
      <UserHistory />
    </ProtectedRoute>
  }
/>

<Route
  path="/faq"
  element={
    <ProtectedRoute requiredRole="user">
      <Faq />
    </ProtectedRoute>
  }
/>
<Route
  path="/update-item"
  element={
    <ProtectedRoute requiredRole="user">
      <UpdateItemStatus />
    </ProtectedRoute>
  }
/>

<Route
  path="/item-lookup"
  element={
    <ProtectedRoute requiredRole={["admin", "user"]}>
      <Lookup />
    </ProtectedRoute>
  }
/>
<Route
          path="/shift-checklist"
          element={
            <ProtectedRoute requiredRole="user">
              <ShiftChecklist />
            </ProtectedRoute>
          }
        />

        {/* User Route */}
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
