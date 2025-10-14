import React, { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Sidebar from "./components/Layout/Sidebar";
import Header from "./components/Layout/Header";
import LoadingSpinner from "./components/Layout/LoadingSpinner";
import UnauthorizedAccess from "./components/Layout/UnauthorizedAccess";
import Dashboard from "./components/Dashboard/Dashboard";
import IndentManagement from "./components/IndentManagement/IndentManagement";
import VendorQuotation from "./components/VendorQuotation/VendorQuotation";
import POManagement from "./components/POManagement/POManagement";
import Reports from "./components/Reports/Reports";

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isLoading, isAuthenticated, hasAccess } = useAuth();

  // Show loading spinner while validating token
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Show error screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            You need to sign in to access this application.
          </p>
          <button
            onClick={() =>
              (window.location.href = `${import.meta.env.VITE_AUTH_UI_BASE_URL}/signin`)
            }
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show unauthorized access if no PROC module access
  if (!hasAccess("PROC")) {
    return <UnauthorizedAccess />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return hasAccess("Dashboard") ? <Dashboard /> : <UnauthorizedAccess />;
      case "indent":
        return hasAccess("Indent Management") ? (
          <IndentManagement />
        ) : (
          <UnauthorizedAccess />
        );
      case "quotation":
        return hasAccess("Vendor Quotation Management") ? (
          <VendorQuotation />
        ) : (
          <UnauthorizedAccess />
        );
      case "po":
        return hasAccess("PO Management") ? (
          <POManagement />
        ) : (
          <UnauthorizedAccess />
        );
      case "reports":
        return hasAccess("Reports") ? <Reports /> : <UnauthorizedAccess />;
      default:
        return hasAccess("Dashboard") ? <Dashboard /> : <UnauthorizedAccess />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
