import React from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  ShoppingCart,
  BarChart3,
  Package,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { hasAccess } = useAuth();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      accessName: "Dashboard",
    },
    {
      id: "indent",
      label: "Indent Management",
      icon: FileText,
      accessName: "Indent Management",
    },
    {
      id: "quotation",
      label: "Vendor Quotation Management",
      icon: Users,
      accessName: "Vendor Quotation Management",
    },
    {
      id: "po",
      label: "PO Management",
      icon: ShoppingCart,
      accessName: "PO Management",
    },
    { id: "reports", label: "Reports", icon: BarChart3, accessName: "Reports" },
  ];

  // Filter menu items based on user access
  const accessibleMenuItems = menuItems.filter((item) => {
    // Dashboard is always accessible if user is authenticated
    if (item.accessName === null) {
      return true;
    }
    console.log(
      "Checking access for menu:",
      item.accessName,
      hasAccess(item.accessName)
    );
    // Check if user has access to this specific menu
    return hasAccess(item.accessName);
  });

  console.log("Accessible Menu Items:", accessibleMenuItems);
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Procurement Pro</h1>
            <p className="text-sm text-gray-500">Management System</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {accessibleMenuItems.map((item) => {
            const Icon = item.icon;
            console.log("Rendering menu item:", item);
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
