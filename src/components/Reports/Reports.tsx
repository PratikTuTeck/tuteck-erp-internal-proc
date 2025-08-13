import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, Filter } from 'lucide-react';

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const reportData = {
    spending: [
      { category: 'IT Equipment', amount: 1250000, percentage: 35 },
      { category: 'Office Supplies', amount: 650000, percentage: 18 },
      { category: 'Facility Management', amount: 850000, percentage: 24 },
      { category: 'Professional Services', amount: 450000, percentage: 13 },
      { category: 'Marketing', amount: 350000, percentage: 10 }
    ],
    monthlyTrend: [
      { month: 'Jan', value: 2500000 },
      { month: 'Feb', value: 2800000 },
      { month: 'Mar', value: 3200000 },
      { month: 'Apr', value: 2900000 },
      { month: 'May', value: 3500000 },
      { month: 'Jun', value: 3800000 }
    ],
    vendorPerformance: [
      { vendor: 'TechCorp Solutions', orders: 45, onTime: 42, rating: 4.8 },
      { vendor: 'Innovate India Ltd', orders: 38, onTime: 35, rating: 4.6 },
      { vendor: 'Digital Enterprise', orders: 32, onTime: 28, rating: 4.2 },
      { vendor: 'Manufacturing Co', orders: 28, onTime: 26, rating: 4.7 }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive procurement insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="quarterly">This Quarter</option>
            <option value="yearly">This Year</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spend</p>
              <p className="text-2xl font-bold text-gray-900">₹3.55 Cr</p>
              <p className="text-sm text-green-600 mt-1">↗ +12.5% vs last month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Vendors</p>
              <p className="text-2xl font-bold text-gray-900">127</p>
              <p className="text-sm text-green-600 mt-1">↗ +8.2% vs last month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <PieChart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Processing Time</p>
              <p className="text-2xl font-bold text-gray-900">3.2 days</p>
              <p className="text-sm text-red-600 mt-1">↘ -0.8 days vs last month</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cost Savings</p>
              <p className="text-2xl font-bold text-gray-900">₹85.2 L</p>
              <p className="text-sm text-green-600 mt-1">↗ +15.3% vs last month</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Spending by Category</h3>
          <div className="space-y-4">
            {reportData.spending.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full" style={{ 
                    backgroundColor: `hsl(${index * 60}, 70%, 60%)` 
                  }}></div>
                  <span className="text-sm font-medium text-gray-900">{item.category}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">₹{(item.amount / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-gray-500">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Spending Trend</h3>
          <div className="space-y-4">
            {reportData.monthlyTrend.map((item, index) => (
              <div key={item.month} className="flex items-center">
                <span className="w-8 text-sm text-gray-600">{item.month}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full" 
                      style={{ width: `${(item.value / 4000000) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ₹{(item.value / 100000).toFixed(1)}L
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Performance */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Vendor Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Vendor</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Total Orders</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">On-Time Delivery</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Performance Rate</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Overall Rating</th>
              </tr>
            </thead>
            <tbody>
              {reportData.vendorPerformance.map((vendor, index) => (
                <tr key={vendor.vendor} className="border-b border-gray-200">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {vendor.vendor.split(' ').map(w => w[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{vendor.vendor}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{vendor.orders}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900">{vendor.onTime}/{vendor.orders}</span>
                      <span className="text-sm text-gray-500">
                        ({Math.round((vendor.onTime / vendor.orders) * 100)}%)
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(vendor.onTime / vendor.orders) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">★</span>
                      <span className="font-medium text-gray-900">{vendor.rating}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;