import { useState } from 'react';
import { QrCode, List, Users, School, Printer, LogOut } from 'lucide-react';
import ScannerView from './ScannerView';
import LogsView from './LogsView';
import StudentsView from './StudentsView';
import QRCodesView from './QRCodesView';

interface AdminPortalProps {
  onLogout: () => void;
}

export default function AdminPortal({ onLogout }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'scanner' | 'logs' | 'students' | 'qrcodes'>('scanner');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans print:bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <School className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">Control Escolar</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              <button
                onClick={() => setActiveTab('scanner')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'scanner' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Escanear
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'logs' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <List className="w-4 h-4 mr-2" />
                Registros
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'students' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Alumnos
              </button>
              <button
                onClick={() => setActiveTab('qrcodes')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'qrcodes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Printer className="w-4 h-4 mr-2" />
                Credenciales
              </button>
            </nav>

            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 print:p-0 print:m-0 print:max-w-none">
        {activeTab === 'scanner' && <ScannerView />}
        {activeTab === 'logs' && <LogsView />}
        {activeTab === 'students' && <StudentsView />}
        {activeTab === 'qrcodes' && <QRCodesView />}
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50 print:hidden">
        <div className="flex justify-around p-2">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex flex-col items-center p-2 rounded-lg flex-1 ${
              activeTab === 'scanner' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <QrCode className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Escanear</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center p-2 rounded-lg flex-1 ${
              activeTab === 'logs' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <List className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Registros</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex flex-col items-center p-2 rounded-lg flex-1 ${
              activeTab === 'students' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Alumnos</span>
          </button>
          <button
            onClick={() => setActiveTab('qrcodes')}
            className={`flex flex-col items-center p-2 rounded-lg flex-1 ${
              activeTab === 'qrcodes' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Printer className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Códigos</span>
          </button>
        </div>
      </div>
    </div>
  );
}
