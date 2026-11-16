import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickTaskModal: React.FC<QuickTaskModalProps> = ({ isOpen, onClose }) => {
  const { pickups, contacts, setActiveTab } = useData();

  const overduePickups = pickups.filter(p => p.status === 'Terlambat');
  const unscreened = contacts.filter(c => !c.sudahDiskrining && !c.dataSkriningTidakTersedia);
  const waitingNakes = contacts.filter(c => c.status === 'Menunggu keputusan petugas');
  const notStartedTpt = contacts.filter(c => c.status === 'TPT belum dimulai');

  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const tasks = [
    {
      id: 'task-1',
      title: 'Tindak Lanjut Pasien Terlambat Ambil OAT',
      desc: `${overduePickups.length} pasien terlambat jadwal obat. Segera hubungi via WA atau kunjungan rumah.`,
      urgent: overduePickups.length > 0,
      linkTab: 'monitoring' as const,
      badge: `${overduePickups.length} Pasien`
    },
    {
      id: 'task-2',
      title: 'Skrining Kontak Erat Baru',
      desc: `${unscreened.length} kontak keluarga belum diskrining 4 gejala kardinal TB.`,
      urgent: unscreened.length > 0,
      linkTab: 'screening' as const,
      badge: `${unscreened.length} Kontak`
    },
    {
      id: 'task-3',
      title: 'Koordinasi Keputusan Medis TPT Dokter',
      desc: `${waitingNakes.length} kontak telah diskrining aman & menunggu persetujuan regimen TPT dokter.`,
      urgent: waitingNakes.length > 0,
      linkTab: 'tpt' as const,
      badge: `${waitingNakes.length} Kontak`
    },
    {
      id: 'task-4',
      title: 'Inisiasi TPT Kontak yang Memenuhi Kriteria',
      desc: `${notStartedTpt.length} kontak sudah disetujui dokter namun belum mengambil dosis TPT pertama.`,
      urgent: notStartedTpt.length > 0,
      linkTab: 'tpt' as const,
      badge: `${notStartedTpt.length} Kontak`
    },
    {
      id: 'task-5',
      title: 'KIE & Konseling Kepatuhan Keluarga',
      desc: 'Kirimkan leaflet edukasi atau pesan WA motivasi kepada keluarga pendamping minum obat (PMO).',
      urgent: false,
      linkTab: 'education' as const,
      badge: 'Rutin'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#FBE6C9] overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
        
        {/* Header with Mascot */}
        <div className="p-5 bg-gradient-to-r from-[#1C5456] via-[#33736A] to-[#35907D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#F9D059] bg-white shrink-0 flex items-center justify-center p-0.5">
              <img 
                src="/assets/aistudio/d794295c-1550-4dd4-a5c0-0c23c3ce3a7b_b675b9b1.jpeg" 
                alt="Maskot Kapten TPT" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-base text-[#F9D059]">Daftar Tugas Petugas TB</span>
                <Sparkles className="w-4 h-4 text-[#F9D059]" />
              </div>
              <p className="text-xs text-[#D1E6D9]">Panduan Tindak Lanjut Harian & Mingguan Puskesmas Pauh</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task List */}
        <div className="p-5 space-y-2.5 overflow-y-auto max-h-[70vh] text-xs">
          {tasks.map(task => {
            const isDone = completedTasks.includes(task.id);
            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isDone 
                    ? 'bg-slate-50 border-slate-200 opacity-60' 
                    : task.urgent 
                      ? 'bg-red-50/60 border-red-200 shadow-xs' 
                      : 'bg-white border-[#FBE6C9] hover:bg-[#FDF5EB]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-[#35907D] cursor-pointer shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#58904A]" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {task.title}
                        </span>
                        <span className={`px-2 py-0.2 text-[10px] font-bold rounded-md ${
                          task.urgent ? 'bg-[#CE5924] text-white' : 'bg-[#FAEEE0] text-[#1C5456]'
                        }`}>
                          {task.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {task.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab(task.linkTab);
                      onClose();
                    }}
                    className="p-1.5 rounded-lg bg-white border border-[#FBE6C9] text-[#1C5456] hover:bg-[#35907D] hover:text-white transition-all shrink-0 cursor-pointer"
                    title="Buka Halaman Terkait"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAEEE0] border-t border-[#FBE6C9] flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-600 font-medium">
            Terselesaikan: <strong>{completedTasks.length}</strong> dari {tasks.length} tugas
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1C5456] text-white font-bold hover:bg-[#35907D] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
