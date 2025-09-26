import React from "react";
import StatCard from "./StatCard";
import RecentActivity from "./RecentActivity";
import {
  DollarSign,
  FileText,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: "Total Procurement Value",
      value: "₹45,32,000",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
      iconColor: "bg-green-500",
    },
    {
      title: "Active Indents",
      value: "234",
      change: "+8.2%",
      changeType: "positive" as const,
      icon: FileText,
      iconColor: "bg-blue-500",
    },
    {
      title: "Vendor Response Rate",
      value: "78.4%",
      change: "-2.1%",
      changeType: "negative" as const,
      icon: Users,
      iconColor: "bg-purple-500",
    },
    {
      title: "POs Generated",
      value: "1,247",
      change: "+15.3%",
      changeType: "positive" as const,
      icon: ShoppingCart,
      iconColor: "bg-orange-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Procurement Performance
            </h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => (
              <div key={month} className="flex items-center">
                <span className="w-8 text-sm text-gray-600">{month}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${65 + index * 5}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ₹{65 + index * 10}L
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total procurement this quarter:{" "}
              <span className="font-semibold text-gray-900">₹4.5 Crores</span>
            </p>
          </div>
        </div>

        <RecentActivity />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Vendors</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
              {
                name: "TechCorp Solutions",
                value: "₹12,50,000",
                change: "+18%",
                status: "excellent",
              },
              {
                name: "Innovate India Ltd",
                value: "₹11,80,000",
                change: "+15%",
                status: "good",
              },
              {
                name: "Digital Enterprise",
                value: "₹9,20,000",
                change: "+8%",
                status: "good",
              },
            ].map((vendor, index) => (
              <div
                key={vendor.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {vendor.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{vendor.name}</p>
                    <p className="text-sm text-gray-500">{vendor.value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-green-600 text-sm font-medium">
                    {vendor.change}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">#{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Approvals
            </h3>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="space-y-4">
            {[
              {
                title: "Office Equipment Purchase",
                amount: "₹2,50,000",
                priority: "high",
                days: 2,
              },
              {
                title: "IT Infrastructure Upgrade",
                amount: "₹8,75,000",
                priority: "medium",
                days: 5,
              },
              {
                title: "Facility Maintenance Contract",
                amount: "₹1,20,000",
                priority: "low",
                days: 8,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : item.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.amount}</p>
                <p className="text-xs text-gray-500">
                  Pending for {item.days} days
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
