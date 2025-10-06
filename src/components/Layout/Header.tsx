import React from "react";
import { Search, Bell, User, Home, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests, vendors, POs..."
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            // onClick={() => window.history.back()}
            onClick={() => (window.location.href = `${import.meta.env.VITE_AUTH_UI_BASE_URL}/dashboard`)}
            className="relative text-gray-400 hover:text-gray-700"
          >
            <Home className="h-6 w-6" />
          </button>

          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center space-x-3 border-l pl-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user
                  ? `Welcome, ${user.name.split(" ")[0]}!`
                  : "Welcome back!"}
              </p>
              <p className="text-xs text-gray-500">
                {user ? user.role : "Procurement Manager"}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("auth_token");

                window.location.href = `${import.meta.env.VITE_AUTH_UI_BASE_URL}/signin`;
              }}
              className="px-3 py-1 text-sm text-black rounded"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
