import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Play, 
  Clock, 
  Sparkles, 
  Flag, 
  Coffee, 
  Award,
  Calendar
} from 'lucide-react';
import { DayType } from '../types/schedule';
import { DAYS_LIST } from '../utils/timeHelper';

interface TimeSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSimulated: boolean;
  simulatedTime: Date;
  onApplySimulation: (time: Date) => void;
  onResetToLiveTime: () => void;
}

export const TimeSimulationModal: React.FC<TimeSimulationModalProps> = ({
  isOpen,
  onClose,
  isSimulated,
  simulatedTime,
  onApplySimulation,
  onResetToLiveTime,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(simulatedTime.getDay());
  const [timeStr, setTimeStr] = useState<string>(
    `${String(simulatedTime.getHours()).padStart(2, '0')}:${String(simulatedTime.getMinutes()).padStart(2, '0')}`
  );

  if (!isOpen) return null;

  const handleApplyCustom = () => {
    const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
    const newDate = new Date();
    // Adjust day of week (0 is Sunday, 1 is Monday ...)
    const currentDay = newDate.getDay();
    const diffDays = selectedDayIndex - currentDay;
    newDate.setDate(newDate.getDate() + diffDays);
    newDate.setHours(h, m, 0, 0);

    onApplySimulation(newDate);
    onClose();
  };

  const applyPreset = (dayIdx: number, hh: number, mm: number) => {
    const newDate = new Date();
    const currentDay = newDate.getDay();
    const diffDays = dayIdx - currentDay;
    newDate.setDate(newDate.getDate() + diffDays);
    newDate.setHours(hh, mm, 0, 0);

    onApplySimulation(newDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              Uji & Simulasi Waktu Real-Time
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Gunakan fitur ini untuk mensimulasikan hari dan jam sekolah guna melihat bagaimana antarmuka real-time bereaksi (contoh: Upacara Senin, Diniyah Kamis, Istigosah Jumat, waktu istirahat, dsb).
        </p>

        {/* Shortcut Presets */}
        <div className="mb-5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Pilihan Skenario Cepat:
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Senin Upacara */}
            <button
              onClick={() => applyPreset(1, 6, 55)}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-red-500" />
                Senin 06:55
              </div>
              <div className="text-[10px] text-slate-500">Upacara Bendera</div>
            </button>

            {/* Senin Jam Ke-2 */}
            <button
              onClick={() => applyPreset(1, 7, 30)}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Senin 07:30
              </div>
              <div className="text-[10px] text-slate-500">B. Inggris & PJOK</div>
            </button>

            {/* Kamis Diniyah */}
            <button
              onClick={() => applyPreset(4, 10, 20)}
              className="p-2.5 rounded-xl border border-pink-200 bg-pink-50/60 hover:bg-pink-100 hover:border-pink-300 text-left transition-all"
            >
              <div className="font-bold text-pink-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                Kamis 10:20
              </div>
              <div className="text-[10px] text-pink-700 font-semibold">Diniyah (Bar Merah Muda)</div>
            </button>

            {/* Jumat Istigosah */}
            <button
              onClick={() => applyPreset(5, 7, 0)}
              className="p-2.5 rounded-xl border border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100 hover:border-cyan-300 text-left transition-all"
            >
              <div className="font-bold text-cyan-950 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                Jumat 07:00
              </div>
              <div className="text-[10px] text-cyan-700 font-semibold">Istigosah Pagi (Bar Cyan)</div>
            </button>

            {/* Istirahat */}
            <button
              onClick={() => applyPreset(2, 9, 15)}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 hover:border-amber-300 text-left transition-all"
            >
              <div className="font-bold text-amber-900 flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5 text-amber-500" />
                Selasa 09:15
              </div>
              <div className="text-[10px] text-amber-700">Waktu Istirahat 1</div>
            </button>

            {/* Jumat Ekstrakurikuler */}
            <button
              onClick={() => applyPreset(5, 13, 0)}
              className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 hover:border-indigo-300 text-left transition-all"
            >
              <div className="font-bold text-indigo-900 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-indigo-500" />
                Jumat 13:00
              </div>
              <div className="text-[10px] text-indigo-700">Ekstrakurikuler</div>
            </button>
          </div>
        </div>

        {/* Custom Day and Time Picker */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-5 text-xs">
          <h4 className="font-bold text-slate-800 mb-3">Atur Waktu Khusus (Custom):</h4>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pilih Hari</label>
              <select
                value={selectedDayIndex}
                onChange={(e) => setSelectedDayIndex(parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
              >
                <option value={1}>Senin</option>
                <option value={2}>Selasa</option>
                <option value={3}>Rabu</option>
                <option value={4}>Kamis</option>
                <option value={5}>Jumat</option>
                <option value={6}>Sabtu (Libur)</option>
                <option value={0}>Minggu (Libur)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jam (HH:mm)</label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs"
              />
            </div>
          </div>

          <button
            onClick={handleApplyCustom}
            className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Terapkan Waktu Simulasi</span>
          </button>
        </div>

        {/* Return to Live Real-Time */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onResetToLiveTime();
              onClose();
            }}
            className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembalikan ke Waktu Nyata (Live Real-Time)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
