import React, { useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import IndentManagement from './components/IndentManagement/IndentManagement';
import VendorQuotation from './components/VendorQuotation/VendorQuotation';
import POManagement from './components/POManagement/POManagement';
import Reports from './components/Reports/Reports';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'indent':
        return <IndentManagement />;
      case 'quotation':
        return <VendorQuotation />;
      case 'po':
        return <POManagement />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;