import React, { useState } from 'react';
import { Plus, Search, Eye, Edit, CheckCircle, XCircle, FileText, Download, Filter } from 'lucide-react';
import CreatePOModal from './CreatePOModal';
import ViewPOModal from './ViewPOModal';
import EditPOModal from './EditPOModal';
import ApprovePOModal from './ApprovePOModal';
import AmendPOModal from './AmendPOModal';

interface PO {
  id: string;
  poNo: string;
  parentPO?: string;
  vendorName: string;
  contactNo: string;
  poDate: string;
  poAmount: number;
  approvedBy?: string;
  approvedOn?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'GRN_COMPLETE' | 'AMENDED';
  type: 'Quotation' | 'Indent';
  vendorAddress: string;
  warehouseName: string;
  gstNo: string;
  items: Array<{
    itemCode: string;
    itemName: string;
    categoryName: string;
    uom: string;
    hsnCode: string;
    rate: number;
    quantity: number;
    total: number;
  }>;
  vendorDetails: {
    bankName: string;
    accountNo: string;
    ifscCode: string;
    igst: number;
    sgst: number;
    cgst: number;
  };
  paymentTerms: Array<{
    terms: string;
    amount: string;
    reason: string;
  }>;
}

const POManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showViewPO, setShowViewPO] = useState(false);
  const [showEditPO, setShowEditPO] = useState(false);
  const [showApprovePO, setShowApprovePO] = useState(false);
  const [showAmendPO, setShowAmendPO] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PO | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const purchaseOrders: PO[] = [
    {
      id: '1',
      poNo: 'PO-2024-001',
      vendorName: 'TechCorp Solutions Pvt Ltd',
      contactNo: '9876543210',
      poDate: '2024-01-15',
      poAmount: 235000,
      approvedBy: 'John Doe',
      approvedOn: '2024-01-16',
      status: 'APPROVED',
      type: 'Quotation',
      vendorAddress: '123 Tech Street, Bangalore - 560001',
      warehouseName: 'Warehouse A',
      gstNo: '29ABCDE1234F1Z5',
      items: [
        {
          itemCode: 'ITM-001',
          itemName: 'Steel Rod',
          categoryName: 'Construction',
          uom: 'Kg',
          hsnCode: '7215',
          rate: 350,
          quantity: 100,
          total: 35000
        },
        {
          itemCode: 'ITM-002',
          itemName: 'Steel Plate',
          categoryName: 'Construction',
          uom: 'Kg',
          hsnCode: '7216',
          rate: 250,
          quantity: 80,
          total: 20000
        }
      ],
      vendorDetails: {
        bankName: 'HDFC Bank',
        accountNo: '1234567890',
        ifscCode: 'HDFC0001234',
        igst: 18,
        sgst: 9,
        cgst: 9
      },
      paymentTerms: [
        { terms: 'Advance', amount: '30%', reason: 'Material booking' },
        { terms: 'On Delivery', amount: '70%', reason: 'Final payment' }
      ]
    },
    {
      id: '2',
      poNo: 'PO-2024-002',
      vendorName: 'Innovate India Limited',
      contactNo: '9876543211',
      poDate: '2024-01-12',
      poAmount: 850000,
      status: 'PENDING',
      type: 'Indent',
      vendorAddress: '456 Innovation Hub, Mumbai - 400001',
      warehouseName: 'Warehouse B',
      gstNo: '27FGHIJ5678K2L6',
      items: [
        {
          itemCode: 'ITM-003',
          itemName: 'IT Equipment',
          categoryName: 'Technology',
          uom: 'Piece',
          hsnCode: '8471',
          rate: 85000,
          quantity: 10,
          total: 850000
        }
      ],
      vendorDetails: {
        bankName: 'ICICI Bank',
        accountNo: '0987654321',
        ifscCode: 'ICIC0000987',
        igst: 18,
        sgst: 9,
        cgst: 9
      },
      paymentTerms: [
        { terms: 'Advance', amount: '25%', reason: 'Order confirmation' },
        { terms: 'On Delivery', amount: '75%', reason: 'Final payment' }
      ]
    },
    {
      id: '3',
      poNo: 'PO-2024-003',
      parentPO: 'PO-2024-001',
      vendorName: 'TechCorp Solutions Pvt Ltd',
      contactNo: '9876543210',
      poDate: '2024-01-20',
      poAmount: 150000,
      approvedBy: 'Jane Smith',
      approvedOn: '2024-01-21',
      status: 'AMENDED',
      type: 'Quotation',
      vendorAddress: '123 Tech Street, Bangalore - 560001',
      warehouseName: 'Warehouse A',
      gstNo: '29ABCDE1234F1Z5',
      items: [
        {
          itemCode: 'ITM-004',
          itemName: 'Additional Steel Wire',
          categoryName: 'Construction',
          uom: 'Meter',
          hsnCode: '7217',
          rate: 15,
          quantity: 1000,
          total: 15000
        }
      ],
      vendorDetails: {
        bankName: 'HDFC Bank',
        accountNo: '1234567890',
        ifscCode: 'HDFC0001234',
        igst: 18,
        sgst: 9,
        cgst: 9
      },
      paymentTerms: [
        { terms: 'On Delivery', amount: '100%', reason: 'Amendment payment' }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'GRN_COMPLETE': return 'bg-blue-100 text-blue-800';
      case 'AMENDED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPOs = purchaseOrders.filter(po => {
    if (activeTab === 'all') return true;
    return po.status === activeTab.toUpperCase();
  }).filter(po =>
    po.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPO = (po: PO) => {
    setSelectedPO(po);
    setShowViewPO(true);
  };

  const handleEditPO = (po: PO) => {
    setSelectedPO(po);
    setShowEditPO(true);
  };

  const handleApprovePO = (po: PO) => {
    setSelectedPO(po);
    setShowApprovePO(true);
  };

  const handleAmendPO = (po: PO) => {
    setSelectedPO(po);
    setShowAmendPO(true);
  };

  const handleGeneratePDF = (po: PO) => {
    console.log('Generating PDF for PO:', po.poNo);
    // PDF generation logic here
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Order Management</h1>
          <p className="text-gray-600 mt-1">Create, view, approve, and manage purchase orders</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button 
            onClick={() => setShowCreatePO(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create PO</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'all', label: 'All POs', count: purchaseOrders.length },
              { id: 'pending', label: 'Pending', count: purchaseOrders.filter(po => po.status === 'PENDING').length },
              { id: 'approved', label: 'Approved', count: purchaseOrders.filter(po => po.status === 'APPROVED').length },
              { id: 'rejected', label: 'Rejected', count: purchaseOrders.filter(po => po.status === 'REJECTED').length },
              { id: 'amended', label: 'Amended', count: purchaseOrders.filter(po => po.status === 'AMENDED').length },
              { id: 'grn_complete', label: 'GRN Complete', count: purchaseOrders.filter(po => po.status === 'GRN_COMPLETE').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Purchase Orders</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search POs by number, vendor, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">PO No.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Parent PO</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Vendor Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Contact No</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">P.O. Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">P.O. Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Approved By</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Approved On</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.map((po) => (
                  <tr key={po.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">{po.poNo}</td>
                    <td className="py-4 px-4 text-gray-600">{po.parentPO || '-'}</td>
                    <td className="py-4 px-4 text-gray-600">{po.vendorName}</td>
                    <td className="py-4 px-4 text-gray-600">{po.contactNo}</td>
                    <td className="py-4 px-4 text-gray-600">{po.poDate}</td>
                    <td className="py-4 px-4 font-medium text-gray-900">₹{po.poAmount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-gray-600">{po.approvedBy || '-'}</td>
                    <td className="py-4 px-4 text-gray-600">{po.approvedOn || '-'}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                        {po.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => handleViewPO(po)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {po.status === 'PENDING' && (
                          <button 
                            onClick={() => handleEditPO(po)}
                            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {po.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleApprovePO(po)}
                              className="p-1 text-green-600 hover:text-green-800 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleApprovePO(po)}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {po.status === 'APPROVED' && (
                          <button 
                            onClick={() => handleAmendPO(po)}
                            className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
                            title="Amend"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {(po.status === 'APPROVED' || po.status === 'AMENDED') && (
                          <button 
                            onClick={() => handleGeneratePDF(po)}
                            className="p-1 text-orange-600 hover:text-orange-800 transition-colors"
                            title="Generate PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPOs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No purchase orders found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreatePO && (
        <CreatePOModal 
          isOpen={showCreatePO} 
          onClose={() => setShowCreatePO(false)} 
        />
      )}

      {showViewPO && selectedPO && (
        <ViewPOModal 
          isOpen={showViewPO} 
          onClose={() => {
            setShowViewPO(false);
            setSelectedPO(null);
          }}
          po={selectedPO}
        />
      )}

      {showEditPO && selectedPO && (
        <EditPOModal 
          isOpen={showEditPO} 
          onClose={() => {
            setShowEditPO(false);
            setSelectedPO(null);
          }}
          po={selectedPO}
        />
      )}

      {showApprovePO && selectedPO && (
        <ApprovePOModal 
          isOpen={showApprovePO} 
          onClose={() => {
            setShowApprovePO(false);
            setSelectedPO(null);
          }}
          po={selectedPO}
        />
      )}

      {showAmendPO && selectedPO && (
        <AmendPOModal 
          isOpen={showAmendPO} 
          onClose={() => {
            setShowAmendPO(false);
            setSelectedPO(null);
          }}
          po={selectedPO}
        />
      )}
    </div>
  );
};

export default POManagement;