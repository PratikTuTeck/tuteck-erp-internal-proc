import React, { useState } from 'react';
import { Plus, Search, Eye, Edit, CheckCircle, FileText, Download } from 'lucide-react';
import RaiseIndentModal from './RaiseIndentModal';
import ViewIndentModal from './ViewIndentModal';
import ApproveIndentModal from './ApproveIndentModal';
import AggregateIndentModal from './AggregateIndentModal';

interface Indent {
  id: string;
  indentNumber: string;
  createdBy: string;
  requestedOn: string;
  warehouseName: string;
  expectedDate: string;
  approvedBy: string;
  approvedOn: string;
  status: 'pending' | 'approved' | 'rejected';
  aggregateStatus: 'not_aggregated' | 'aggregated';
  projectName: string;
  noOfItems: number;
  comment: string;
  items: Array<{
    hsnCode: string;
    itemCode: string;
    itemName: string;
    uom: string;
    requiredQty: number;
  }>;
}

const IndentManagement: React.FC = () => {
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showAggregateModal, setShowAggregateModal] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState<Indent | null>(null);
  const [selectedIndents, setSelectedIndents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const indents: Indent[] = [
    {
      id: '1',
      indentNumber: 'IND-001',
      createdBy: 'John Doe',
      requestedOn: '2024-07-10',
      warehouseName: 'Warehouse A',
      expectedDate: '2024-07-20',
      approvedBy: 'Jane Doe',
      approvedOn: '2024-07-12',
      status: 'approved',
      aggregateStatus: 'not_aggregated',
      projectName: 'Project Alpha',
      noOfItems: 3,
      comment: 'Urgent requirement for construction',
      items: [
        { hsnCode: '7215', itemCode: 'ITM-001', itemName: 'Steel Rod', uom: 'Kg', requiredQty: 100 },
        { hsnCode: '7216', itemCode: 'ITM-002', itemName: 'Steel Plate', uom: 'Kg', requiredQty: 50 },
        { hsnCode: '7217', itemCode: 'ITM-003', itemName: 'Steel Wire', uom: 'Meter', requiredQty: 200 }
      ]
    },
    {
      id: '2',
      indentNumber: 'IND-002',
      createdBy: 'Alice Smith',
      requestedOn: '2024-07-11',
      warehouseName: 'Warehouse B',
      expectedDate: '2024-07-25',
      approvedBy: 'Bob Wilson',
      approvedOn: '2024-07-13',
      status: 'approved',
      aggregateStatus: 'not_aggregated',
      projectName: 'Project Beta',
      noOfItems: 2,
      comment: 'Regular maintenance supplies',
      items: [
        { hsnCode: '8301', itemCode: 'ITM-004', itemName: 'Bolt M12', uom: 'Piece', requiredQty: 500 },
        { hsnCode: '8302', itemCode: 'ITM-005', itemName: 'Nut M12', uom: 'Piece', requiredQty: 500 }
      ]
    },
    {
      id: '3',
      indentNumber: 'IND-003',
      createdBy: 'Mike Johnson',
      requestedOn: '2024-07-12',
      warehouseName: 'Warehouse C',
      expectedDate: '2024-07-30',
      approvedBy: '',
      approvedOn: '',
      status: 'pending',
      aggregateStatus: 'not_aggregated',
      projectName: 'Project Gamma',
      noOfItems: 1,
      comment: 'New project requirement',
      items: [
        { hsnCode: '3901', itemCode: 'ITM-006', itemName: 'PVC Pipe', uom: 'Meter', requiredQty: 100 }
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

  const getAggregateStatusColor = (status: string) => {
    switch (status) {
      case 'aggregated': return 'bg-blue-100 text-blue-800';
      case 'not_aggregated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCheckboxChange = (indentId: string) => {
    setSelectedIndents(prev => 
      prev.includes(indentId) 
        ? prev.filter(id => id !== indentId)
        : [...prev, indentId]
    );
  };

  const handleSelectAll = () => {
    const approvedIndents = indents.filter(indent => indent.status === 'approved').map(indent => indent.id);
    setSelectedIndents(prev => 
      prev.length === approvedIndents.length ? [] : approvedIndents
    );
  };

  const handleViewIndent = (indent: Indent) => {
    setSelectedIndent(indent);
    setShowViewModal(true);
  };

  const handleApproveIndent = (indent: Indent) => {
    setSelectedIndent(indent);
    setShowApproveModal(true);
  };

  const handleAggregate = () => {
    const selectedIndentData = indents.filter(indent => selectedIndents.includes(indent.id));
    setShowAggregateModal(true);
  };

  const filteredIndents = indents.filter(indent =>
    indent.indentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indent.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indent.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indent.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approvedSelectedCount = selectedIndents.filter(id => 
    indents.find(indent => indent.id === id)?.status === 'approved'
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Indent Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage indents, approvals, and aggregations</p>
        </div>
      </div>

      {/* Top Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setShowRaiseModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Indent</span>
          </button>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Indents by number, warehouse, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Indent List Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIndents.length === indents.filter(i => i.status === 'approved').length && indents.filter(i => i.status === 'approved').length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Indent Number</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Created By</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Requested On</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Warehouse Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Expected Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Approved By</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Approved On</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Aggregate Status</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIndents.map((indent) => (
                <tr key={indent.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIndents.includes(indent.id)}
                      onChange={() => handleCheckboxChange(indent.id)}
                      disabled={indent.status !== 'approved'}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900">{indent.indentNumber}</td>
                  <td className="py-4 px-4 text-gray-600">{indent.createdBy}</td>
                  <td className="py-4 px-4 text-gray-600">{indent.requestedOn}</td>
                  <td className="py-4 px-4 text-gray-600">{indent.warehouseName}</td>
                  <td className="py-4 px-4 text-gray-600">{indent.expectedDate}</td>
                  <td className="py-4 px-4 text-gray-600">{indent.approvedBy || '-'}</td>
                  <td className="py-4 px-4 text-gray-600">{indent.approvedOn || '-'}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(indent.status)}`}>
                      {indent.status.charAt(0).toUpperCase() + indent.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAggregateStatusColor(indent.aggregateStatus)}`}>
                      {indent.aggregateStatus === 'not_aggregated' ? 'Not Aggregated' : 'Aggregated'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => handleViewIndent(indent)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {indent.status === 'pending' && (
                        <button 
                          onClick={() => handleApproveIndent(indent)}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
                        title="RFQ"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Below Table Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button 
            onClick={handleAggregate}
            disabled={approvedSelectedCount < 2}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              approvedSelectedCount >= 2
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Aggregate ({approvedSelectedCount} selected)
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Select 2 or more approved indents to enable aggregation
          </p>
        </div>
      </div>

      {/* Modals */}
      {showRaiseModal && (
        <RaiseIndentModal 
          isOpen={showRaiseModal} 
          onClose={() => setShowRaiseModal(false)} 
        />
      )}

      {showViewModal && selectedIndent && (
        <ViewIndentModal 
          isOpen={showViewModal} 
          onClose={() => {
            setShowViewModal(false);
            setSelectedIndent(null);
          }}
          indent={selectedIndent}
        />
      )}

      {showApproveModal && selectedIndent && (
        <ApproveIndentModal 
          isOpen={showApproveModal} 
          onClose={() => {
            setShowApproveModal(false);
            setSelectedIndent(null);
          }}
          indent={selectedIndent}
        />
      )}

      {showAggregateModal && (
        <AggregateIndentModal 
          isOpen={showAggregateModal} 
          onClose={() => setShowAggregateModal(false)}
          selectedIndents={indents.filter(indent => selectedIndents.includes(indent.id))}
        />
      )}
    </div>
  );
};

export default IndentManagement;