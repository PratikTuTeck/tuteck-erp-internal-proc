import React from 'react';
import { Clock, CheckCircle, AlertCircle, FileText, User } from 'lucide-react';

const RecentActivity: React.FC = () => {
  const activities = [
    {
      type: 'approval',
      title: 'PO approved for IT Equipment',
      description: 'Purchase order #PO-2024-001 approved by Finance',
      time: '2 hours ago',
      icon: CheckCircle,
      iconColor: 'text-green-500'
    },
    {
      type: 'quotation',
      title: 'New quotation received',
      description: 'TechCorp submitted quote for Server Hardware',
      time: '4 hours ago',
      icon: FileText,
      iconColor: 'text-blue-500'
    },
    {
      type: 'indent',
      title: 'Indent created by Operations',
      description: 'New indent for Office Supplies - Priority: Medium',
      time: '6 hours ago',
      icon: User,
      iconColor: 'text-purple-500'
    },
    {
      type: 'alert',
      title: 'Vendor response overdue',
      description: 'ABC Corp has not responded to RFQ #RFQ-2024-015',
      time: '1 day ago',
      icon: AlertCircle,
      iconColor: 'text-orange-500'
    },
    {
      type: 'completion',
      title: 'Purchase order delivered',
      description: 'Delivery completed for PO #PO-2024-089',
      time: '2 days ago',
      icon: CheckCircle,
      iconColor: 'text-green-500'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div key={index} className="flex items-start space-x-3">
              <div className={`p-2 rounded-full bg-gray-50 ${activity.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-2">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all activities →
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;