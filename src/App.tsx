/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { PatientsView } from './components/views/PatientsView';
import { ContactsView } from './components/views/ContactsView';
import { ScreeningView } from './components/views/ScreeningView';
import { TptView } from './components/views/TptView';
import { MonitoringView } from './components/views/MonitoringView';
import { FollowupView } from './components/views/FollowupView';
import { WhatsAppCenterView } from './components/views/WhatsAppCenterView';
import { EducationView } from './components/views/EducationView';
import { ReportsView } from './components/views/ReportsView';
import { UserManagementView } from './components/views/UserManagementView';
import { SettingsView } from './components/views/SettingsView';

import { PatientDetailModal } from './components/modals/PatientDetailModal';
import { AddPatientModal } from './components/modals/AddPatientModal';
import { AddContactModal } from './components/modals/AddContactModal';
import { ScreeningModal } from './components/modals/ScreeningModal';
import { TptDecisionModal } from './components/modals/TptDecisionModal';
import { QuickTaskModal } from './components/modals/QuickTaskModal';
import { LoginView } from './components/auth/LoginView';

import { Sparkles, CheckSquare, Bell } from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    isAuthenticated,
    activeTab, 
    selectedPatientId, 
    setSelectedPatientId, 
    selectedContactId, 
    setSelectedContactId,
    pickups,
    contacts
  } = useData();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [addContactForPatientId, setAddContactForPatientId] = useState<string | null>(null);
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const [showTptModal, setShowTptModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // If not logged in, show warm friendly login screen with official mascot
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Urgent count for floating badge
  const urgentCount = pickups.filter(p => p.status === 'Terlambat').length +
                      contacts.filter(c => !c.sudahDiskrining && !c.dataSkriningTidakTersedia).length;

  const handleOpenPatientDetail = (patientId: string) => {
    setSelectedPatientId(patientId);
  };

  const handleOpenAddContactForPatient = (patientId: string) => {
    setAddContactForPatientId(patientId);
    setShowAddContactModal(true);
  };

  const handleOpenScreening = (contactId: string) => {
    setSelectedContactId(contactId);
    setShowScreeningModal(true);
  };

  const handleOpenTpt = (contactId: string) => {
    setSelectedContactId(contactId);
    setShowTptModal(true);
  };

  return (
    <div className="min-h-screen bg-[#FDF5EB] flex text-[#193F35]">
      {/* 1. Sidebar Nav */}
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        setMobileOpen={setMobileSidebarOpen} 
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header 
          setMobileOpen={setMobileSidebarOpen} 
          onOpenAddPatient={() => setShowAddPatientModal(true)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView onOpenAddPatient={() => setShowAddPatientModal(true)} />
          )}

          {activeTab === 'patients' && (
            <PatientsView 
              onOpenAddPatient={() => setShowAddPatientModal(true)}
              onOpenPatientDetail={handleOpenPatientDetail}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsView 
              onOpenAddContact={() => {
                setAddContactForPatientId(null);
                setShowAddContactModal(true);
              }}
              onOpenScreeningModal={handleOpenScreening}
              onOpenTptModal={handleOpenTpt}
              onOpenPatientDetail={handleOpenPatientDetail}
            />
          )}

          {activeTab === 'screening' && (
            <ScreeningView 
              onOpenScreeningModal={handleOpenScreening}
              onOpenTptModal={handleOpenTpt}
              onOpenPatientDetail={handleOpenPatientDetail}
            />
          )}

          {activeTab === 'tpt' && (
            <TptView 
              onOpenTptModal={handleOpenTpt}
              onOpenPatientDetail={handleOpenPatientDetail}
            />
          )}

          {activeTab === 'monitoring' && (
            <MonitoringView onOpenPatientDetail={handleOpenPatientDetail} />
          )}

          {activeTab === 'followup' && (
            <FollowupView />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppCenterView />
          )}

          {activeTab === 'education' && (
            <EducationView />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
          )}

          {activeTab === 'users' && (
            <UserManagementView />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Floating Mascot Helper Button */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={() => setShowTaskModal(true)}
          className="group flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#1C5456] hover:bg-[#35907D] text-white shadow-2xl border-2 border-[#F9D059] transition-all transform hover:scale-105 cursor-pointer"
          title="Tugas & Pengingat Petugas TB Puskesmas Pauh"
        >
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white shrink-0 border border-white flex items-center justify-center p-0.5">
            <img 
              src="/assets/aistudio/d794295c-1550-4dd4-a5c0-0c23c3ce3a7b_b675b9b1.jpeg" 
              alt="Kapten TPT" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#CE5924] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                {urgentCount}
              </span>
            )}
          </div>
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-[#F9D059]">Kapten TPT</span>
              <Sparkles className="w-3 h-3 text-[#F9D059]" />
            </div>
            <p className="text-[10px] text-[#D1E6D9]">Tugas & Peringatan Hari Ini</p>
          </div>
        </button>
      </div>

      {/* Modals Container */}
      <PatientDetailModal 
        patientId={selectedPatientId} 
        onClose={() => setSelectedPatientId(null)}
        onOpenAddContactForPatient={handleOpenAddContactForPatient}
        onOpenScreeningModal={handleOpenScreening}
        onOpenTptModal={handleOpenTpt}
      />

      <AddPatientModal 
        isOpen={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
      />

      <AddContactModal 
        isOpen={showAddContactModal}
        preselectedPatientId={addContactForPatientId}
        onClose={() => {
          setShowAddContactModal(false);
          setAddContactForPatientId(null);
        }}
      />

      <ScreeningModal 
        contactId={selectedContactId}
        onClose={() => {
          setShowScreeningModal(false);
          setSelectedContactId(null);
        }}
      />

      <TptDecisionModal 
        contactId={selectedContactId}
        onClose={() => {
          setShowTptModal(false);
          setSelectedContactId(null);
        }}
      />

      <QuickTaskModal 
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
