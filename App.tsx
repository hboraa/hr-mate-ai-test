import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import { CURRENT_USER } from './constants';
import { LayoutGrid, MessageSquare, FileText, UserCircle, Settings } from 'lucide-react';

function App() {
  // Tabs: 'personal' (Home), 'policy' (Docs), 'onboarding', 'admin'
  const [activeTab, setActiveTab] = useState<'personal' | 'policy' | 'admin' | 'onboarding'>('personal');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | undefined>(undefined);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(true); // For mobile toggle

  // Automatically switch to onboarding if user is new (simulated)
  useEffect(() => {
    const joinDate = new Date(CURRENT_USER.joinDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays < 30) {
      // It's a new joiner, default to onboarding tab or notify
      // setActiveTab('onboarding'); // Optional auto-switch
    }
  }, []);

  const handleOpenPolicy = (id: string) => {
    setSelectedPolicyId(id);
    setActiveTab('policy');
    // On mobile, we might want to close chat to see policy
    if (window.innerWidth < 768) {
      setIsMobileChatOpen(false);
    }
  };

  const handleDraftAction = (data: any) => {
    console.log("Action Drafted:", data);
  };

  const handleSelectPolicy = (id: string) => {
    if (id === '') {
        // Clear selection to go back to list
        setSelectedPolicyId(undefined);
    } else {
        setSelectedPolicyId(id);
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      
      {/* Sidebar Navigation (Narrow) */}
      <nav className="w-16 md:w-20 bg-slate-900 flex flex-col items-center py-6 gap-8 z-50 shadow-xl">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
          H
        </div>
        
        <div className="flex flex-col gap-6 w-full items-center">
          <NavButton 
            active={activeTab === 'personal'} 
            onClick={() => setActiveTab('personal')} 
            icon={<UserCircle size={24} />} 
            label="MY"
          />
          <NavButton 
            active={activeTab === 'onboarding'} 
            onClick={() => setActiveTab('onboarding')} 
            icon={<LayoutGrid size={24} />} 
            label="Start"
          />
          <NavButton 
            active={activeTab === 'policy'} 
            onClick={() => { setActiveTab('policy'); setSelectedPolicyId(undefined); }} 
            icon={<FileText size={24} />} 
            label="Rule"
          />
          {CURRENT_USER.role !== 'EMPLOYEE' || true /* Demo: show admin for everyone */ ? (
             <NavButton 
             active={activeTab === 'admin'} 
             onClick={() => setActiveTab('admin')} 
             icon={<Settings size={24} />} 
             label="Admin"
           />
          ) : null}
        </div>

        <div className="mt-auto">
          {/* Mobile toggle for Chat view */}
          <button 
            className="md:hidden text-slate-400 hover:text-white p-2"
            onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
          >
            <MessageSquare />
          </button>
        </div>
      </nav>

      {/* Main Content Area (Split View) */}
      <main className="flex-1 flex relative overflow-hidden">
        
        {/* Left: Chat Interface */}
        {/* On Mobile: Toggled via z-index or visibility. On Desktop: Always visible taking 40-50% width */}
        <div className={`
          absolute inset-0 md:static md:w-[450px] lg:w-[500px] bg-white z-20 transition-transform duration-300 ease-in-out shadow-xl md:shadow-none border-r border-slate-200
          ${isMobileChatOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <ChatInterface 
            user={CURRENT_USER} 
            onOpenPolicy={handleOpenPolicy} 
            onDraftAction={handleDraftAction}
          />
          
          {/* Mobile Close Handle */}
          <button 
            onClick={() => setIsMobileChatOpen(false)}
            className="md:hidden absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500"
          >
            ✕
          </button>
        </div>

        {/* Right: Dashboard / Detail View */}
        <div className="flex-1 h-full w-full bg-slate-50 relative">
          <Dashboard 
            user={CURRENT_USER} 
            activeTab={activeTab} 
            selectedPolicyId={selectedPolicyId}
            onSelectPolicy={handleSelectPolicy}
          />
          
          {/* Mobile Floating Action Button to open Chat */}
          {!isMobileChatOpen && (
             <button 
               onClick={() => setIsMobileChatOpen(true)}
               className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-30"
             >
               <MessageSquare size={24} />
             </button>
          )}
        </div>

      </main>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 group ${
      active ? 'text-blue-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;