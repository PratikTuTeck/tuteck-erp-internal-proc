import React, { useState } from 'react';
import { Eye, CheckCircle } from 'lucide-react';
import ViewCSDetailsModal from './ViewCSDetailsModal';

interface CSVendor {
  rfqNo: string;
  vendorNo: string;
  vendorName: string;
  contactNo: string;
  status: 'pending' | 'approved' | 'rejected';
  totalAmount: number;
  items: Array<{
    itemCode: string;
    itemName: string;
    requiredQty: number;
    canProvideQty: number;
    rate: number;
    qtySelected: number;
    totalAmount: number;
  }>;
}

const ApproveCSTab: React.FC = () => {
  const [selectedRFQ, setSelectedRFQ] = useState('');
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<CSVendor | null>(null);

  const rfqs = [
    { id: 'RFQ-001', name: 'RFQ-001' },
    { id: 'RFQ-002', name: 'RFQ-002' }
  ];

  const csVendors: CSVendor[] = [
    {
      rfqNo: 'RFQ-001',
      vendorNo: 'V001',
      vendorName: 'Vendor X',
      contactNo: '9876543210',
      status: 'pending',
      totalAmount: 17500,
      items: [
        {
          itemCode: 'ITM-001',
          itemName: 'Steel Rod',
          requiredQty: 100,
          canProvideQty: 100,
          rate: 350,
          qtySelected: 50,
          totalAmount: 17500
        }
      ]
    },
    {
      rfqNo: 'RFQ-001',
      vendorNo: 'V002',
      vendorName: 'Vendor Y',
      contactNo: '9876543211',
      status: 'approved',
      totalAmount: 17000,
      items: [
        {
          itemCode: 'ITM-001',
          itemName: 'Steel Rod',
          requiredQty: 100,
          canProvideQty: 80,
          rate: 340,
          qtySelected: 50,
          totalAmount: 17000
        }
      ]
    },
    {
      rfqNo: 'RFQ-002',
      vendorNo: 'V003',
      vendorName: 'Vendor A',
      contactNo: '9876543212',
      status: 'pending',
      totalAmount: 12500,
      items: [
        {
          itemCode: 'ITM-002',
          itemName: 'Steel Plate',
          requiredQty: 50,
          canProvideQty: 50,
          rate: 250,
          qtySelected: 50,
          totalAmount: 12500
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredVendors = csVendors.filter(vendor => 
    !selectedRFQ || vendor.rfqNo === selectedRFQ
  );

  const handleViewDetails = (vendor: CSVendor) => {
    setSelectedVendor(vendor);
    setShowViewDetails(true);
  };

  const handleApprove = (vendor: CSVendor) => {
    console.log('Approving CS for vendor:', vendor.vendorName);
    // Update vendor status logic here
  };

  const handleReject = (vendor: CSVendor) => {
    console.log('Rejecting CS for vendor:', vendor.vendorName);
    // Update vendor status logic here
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Approve Comparative Statement</h2>
        <p className="text-gray-600">Approve generated comparative statements per vendor.</p>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select RFQ <span className="text-red-500">*</span>
          </label>
          <select 
            value={selectedRFQ}
            onChange={(e) => setSelectedRFQ(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All RFQs</option>
            {rfqs.map(rfq => (
              <option key={rfq.id} value={rfq.id}>{rfq.name}</option>
            ))}
          </select>
        </div>

        {/* CS Vendor-Wise Summary Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CS Vendor-Wise Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">RFQ No.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Vendor No.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Vendor Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Contact No.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Total Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor, index) => (
                  <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">{vendor.rfqNo}</td>
                    <td className="py-4 px-4 text-gray-600">{vendor.vendorNo}</td>
                    <td className="py-4 px-4 text-gray-600">{vendor.vendorName}</td>
                    <td className="py-4 px-4 text-gray-600">{vendor.contactNo}</td>
                    <td className="py-4 px-4 font-medium text-gray-900">₹{vendor.totalAmount.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                        {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => handleViewDetails(vendor)}
                          className="flex items-center space-x-1 px-2 py-1 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {vendor.status === 'pending' && (
                            <button 
                              onClick={() => handleApprove(vendor)}
                              className="flex items-center space-x-1 px-2 py-1 text-green-600 hover:text-green-800 transition-colors text-sm"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredVendors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {selectedRFQ ? 'No comparative statements found for the selected RFQ.' : 'No comparative statements available.'}
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {showViewDetails && selectedVendor && (
        <ViewCSDetailsModal
          isOpen={showViewDetails}
          onClose={() => {
            setShowViewDetails(false);
            setSelectedVendor(null);
          }}
          vendor={selectedVendor}
        />
      )}
    </div>
  );
};

export default ApproveCSTab;