import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: LucideIcon;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  iconColor 
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <div className="flex items-center mt-4">
            <span className={`text-sm font-medium ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'positive' ? '↗' : '↘'} {change} from last month
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;