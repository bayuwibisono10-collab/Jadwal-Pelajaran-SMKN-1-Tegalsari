import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clipboard, 
  ArrowRight,
  Layers,
  HelpCircle,
  Table
} from 'lucide-react';
import { ScheduleSlot, SchoolClass, Teacher, DayType, SlotType, WeekRotationType } from '../types/schedule';
import { DAYS_LIST } from '../utils/timeHelper';

interface ExcelImportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  onImportSchedule: (
    newSlots: ScheduleSlot[],
    mode: 'merge' | 'replace' | 'replace_day',
    targetClassIds?: string[]
  ) => void;
}

interface ParsedSlotRow {
  day: DayType;
  periodNumber?: string;
  timeStart: string;
  timeEnd: string;
  type: SlotType;
  title?: string;
  subject?: string;
  teacherCode?: string;
  room?: string;
  isValid: boolean;
  error?: string;
}

export const ExcelImportScheduleModal: React.FC<ExcelImportScheduleModalProps> = ({
  isOpen,
  onClose,
  classes,
  onImportSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [targetClassId, setTargetClassId] = useState<string>(classes[0]?.id || 'xk1');
  const [targetWeekType, setTargetWeekType] = useState<WeekRotationType | 'ALL'>('ALL');
  const [parsedRows, setParsedRows] = useState<ParsedSlotRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [pasteContent, setPasteContent] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace_day' | 'replace'>('merge');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const targetClassObj = classes.find((c) => c.id === targetClassId) || classes[0];
  const targetClassName = targetClassObj?.name || 'X KULINER 1';

  // Download Template Excel 1 Kolom Saja Per Kelas
  const handleDownloadSingleClassTemplate = () => {
    const wsData = [
      ['HARI', 'JAM', 'PUKUL', 'MATA_PELAJARAN', 'KODE_GURU', 'RUANG'],
      ['(SENIN/SELASA/...)', '(1, 2, ...)', '(07:20 - 07:55)', `Jadwal ${targetClassName}`, 'Kode Guru', `Ruang (Default: ${targetClassObj?.roomDefault || 'R.J1'})`],
      ['SENIN', '1', '06:45 - 07:20', 'UPACARA', '-', 'LAPANGAN'],
      ['SENIN', '2', '07:20 - 07:55', 'BAHASA INGGRIS', 'BIG3', targetClassObj?.roomDefault || 'R.J1'],
      ['SENIN', '3', '07:55 - 08:30', 'BAHASA INGGRIS', 'BIG3', targetClassObj?.roomDefault || 'R.J1'],
      ['SENIN', '4', '08:30 - 09:05', 'BAHASA INGGRIS', 'BIG3', targetClassObj?.roomDefault || 'R.J1'],
      ['SENIN', '',  '09:05 - 09:40', 'ISTIRAHAT', '-', '-'],
      ['SENIN', '5', '09:40 - 10:15', 'PENDIDIKAN PANCASILA', 'KN3', targetClassObj?.roomDefault || 'R.J1'],
      ['SENIN', '6', '10:15 - 10:50', 'PENDIDIKAN PANCASILA', 'KN3', targetClassObj?.roomDefault || 'R.J1'],
      ['SENIN', '7', '10:50 - 11:25', 'PENDIDIKAN PANCASILA', 'KN3', targetClassObj?.roomDefault || 'R.J1'],
      ['SENIN', '',  '11:25 - 12:25', 'ISTIRAHAT', '-', '-'],
      ['SENIN', '8', '12:25 - 13:00', 'PENDIDIKAN PANCASILA', 'KN3', targetClassObj?.roomDefault || 'R.J1'],
      ['SENIN', '9', '13:00 - 13:35', 'MATEMATIKA', 'MT7', targetClassObj?.roomDefault || 'R.J1'],
      ['SENIN', '10', '13:35 - 14:10', 'MATEMATIKA', 'MT7', targetClassObj?.roomDefault || 'R.J1'],
      ['SENIN', '11', '14:10 - 14:45', 'MATEMATIKA', 'MT7', targetClassObj?.roomDefault || 'R.J1'],
      ['KAMIS', '6', '10:15 - 10:50', 'DINIYAH', 'DIN', targetClassObj?.roomDefault || 'R.J1'],
      ['KAMIS', '7', '10:50 - 11:25', 'DINIYAH', 'DIN', targetClassObj?.roomDefault || 'R.J1'],
      ['JUMAT', '',  '06:45 - 07:30', 'ISTIGOSAH', '-', 'MASJID'],
      ['JUMAT', '1', '07:30 - 08:00', 'PJOK', 'OR3', 'LAPANGAN'],
      ['JUMAT', 'EKS', '12:30 - 14:45', 'EKSTRAKURIKULER', '-', 'AREA SMKN 1 TEGALSARI'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 12 }, { wch: 8 }, { wch: 18 },
      { wch: 28 }, { wch: 14 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Jadwal ${targetClassName.slice(0, 20)}`);
    XLSX.writeFile(wb, `template-jadwal-${targetClassName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.xlsx`);
  };

  // Helper to normalize day string
  const normalizeDay = (val: string): DayType | null => {
    const v = val.toUpperCase().trim();
    if (v.startsWith('(')) return null; // Skip explanatory row e.g. (SENIN/SELASA/...)
    if (v.includes('SENIN')) return 'SENIN';
    if (v.includes('SELASA')) return 'SELASA';
    if (v.includes('RABU')) return 'RABU';
    if (v.includes('KAMIS')) return 'KAMIS';
    if (v.includes('JUMAT')) return 'JUMAT';
    if (v.includes('SABTU')) return 'SABTU';
    return null;
  };

  // Helper to parse time string
  const parseTimeRange = (timeRaw: string): { start: string; end: string } => {
    const clean = timeRaw.replace(/\./g, ':').replace(/wib/gi, '').trim();
    const parts = clean.split(/[-–—]/);
    if (parts.length >= 2) {
      const s = parts[0].trim().padStart(5, '0').slice(0, 5);
      const e = parts[1].trim().padStart(5, '0').slice(0, 5);
      return { start: s, end: e };
    }
    return { start: '07:00', end: '07:45' };
  };

  // Process raw 2D array from Excel
  const processRawData = (rows: any[][]) => {
    if (!rows || rows.length === 0) {
      setErrorMessage('File atau teks tidak berisi data yang dapat dibaca.');
      setParsedRows([]);
      return;
    }

    setErrorMessage(null);

    let currentDayMemory: DayType = 'SENIN';
    const parsed: ParsedSlotRow[] = [];

    // Find first content row (skip header rows)
    let startIndex = 0;
    for (let r = 0; r < Math.min(6, rows.length); r++) {
      const rStr = (rows[r] || []).join(' ').toLowerCase();
      if (rStr.includes('hari') || rStr.includes('mapel') || rStr.includes('mata_pelajaran') || rStr.includes('pukul') || rStr.includes('jam')) {
        startIndex = r + 1;
      }
    }

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();
      const col2 = String(row[2] || '').trim();

      // Skip hint/explanation rows that start with parenthesis
      if (col0.startsWith('(') || col1.startsWith('(') || col2.startsWith('(')) continue;

      // Check if this row sets a new Day
      const detectedDay = normalizeDay(col0);
      if (detectedDay) {
        currentDayMemory = detectedDay;
      }

      // If all relevant columns are empty, skip
      if (!col0 && !col1 && !col2 && !row[3]) continue;

      // Detect time from col 2 or col 1
      const timeCandidate = (col2 && (col2.includes(':') || col2.includes('.') || col2.includes('-'))) ? col2 : col1;
      const timeRange = parseTimeRange(timeCandidate);
      const periodNum = col1 && !col1.includes(':') && !col1.includes('.') ? col1.toUpperCase() : '';

      const subject = String(row[3] || '').trim();
      const teacherCode = String(row[4] || '-').trim().toUpperCase();
      const room = String(row[5] || targetClassObj?.roomDefault || 'R.J1').trim().toUpperCase();

      // Determine slot type
      let type: SlotType = 'REGULAR';
      let title: string | undefined = undefined;

      const combinedText = `${col0} ${col1} ${subject}`.toUpperCase();

      if (combinedText.includes('ISTIRAHAT')) {
        type = 'BREAK';
        title = 'ISTIRAHAT';
      } else if (combinedText.includes('UPACARA')) {
        type = 'UPACARA';
        title = 'UPACARA BENDERA';
      } else if (combinedText.includes('ISTIGOSAH')) {
        type = 'ISTIGOSAH';
        title = 'ISTIGOSAH BERSAMA';
      } else if (combinedText.includes('DINIYAH')) {
        type = 'DINIYAH';
        title = 'DINIYAH';
      } else if (combinedText.includes('EKSTRAKURIKULER') || periodNum.includes('EKS')) {
        type = 'EKSTRAKURIKULER';
        title = 'EKSTRAKURIKULER';
      }

      const isValid = Boolean(timeRange.start && (subject || type !== 'REGULAR'));

      parsed.push({
        day: currentDayMemory,
        periodNumber: periodNum && !['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', '-'].includes(periodNum) ? periodNum : undefined,
        timeStart: timeRange.start,
        timeEnd: timeRange.end,
        type,
        title,
        subject: subject || title || '-',
        teacherCode,
        room,
        isValid,
        error: isValid ? undefined : 'Waktu atau Mapel tidak valid',
      });
    }

    if (parsed.length === 0) {
      setErrorMessage('Tidak ada baris jadwal yang valid terdeteksi. Silakan gunakan template resmi kami.');
    }

    setParsedRows(parsed);
  };

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        // Use first sheet or sheet named 'Jadwal'
        const sheetName = workbook.SheetNames.find((s) => s.toLowerCase().includes('jadwal')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        processRawData(rawJson);
      } catch (err) {
        setErrorMessage('Gagal membaca file Excel. Pastikan format file adalah .xlsx, .xls, atau .csv');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Parse pasted text handler
  const handleParsePastedText = () => {
    if (!pasteContent.trim()) {
      setErrorMessage('Tempelkan teks tabel dari Excel terlebih dahulu.');
      return;
    }

    const lines = pasteContent.trim().split(/\r?\n/);
    const rawData = lines.map((line) => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes(';')) return line.split(';');
      return line.split(',');
    });

    setFileName('Teks Hasil Salinan (Copy-Paste)');
    processRawData(rawData);
  };

  // Confirm and Apply Schedule Import
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('Tidak ada baris jadwal yang valid untuk diimpor.');
      return;
    }

    const newSlots: ScheduleSlot[] = validRows.map((r, index) => {
      const slotId = `slot-imp-${r.day.toLowerCase()}-${Date.now()}-${index}`;
      const classesAssignment: ScheduleSlot['classes'] = {
        [targetClassId]: {
          subject: r.subject || r.title || '-',
          teacherCode: r.teacherCode || '-',
          room: r.room || targetClassObj?.roomDefault || 'R.J1',
        },
      };

      return {
        id: slotId,
        day: r.day,
        periodNumber: r.periodNumber,
        timeStart: r.timeStart,
        timeEnd: r.timeEnd,
        type: r.type,
        title: r.title,
        weekType: targetWeekType === 'ALL' ? undefined : targetWeekType,
        classes: classesAssignment,
      };
    });

    onImportSchedule(newSlots, importMode, [targetClassId]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Table className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Impor Jadwal Pelajaran
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Impor jadwal pelajaran via file Excel atau salinan tabel untuk kelas yang dipilih.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Configuration Row: Class Target Selection & Template Download */}
        <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-emerald-950">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="font-extrabold text-emerald-900 flex items-center gap-1.5 shrink-0 text-sm">
              <Layers className="w-4 h-4 text-emerald-700" />
              Target Kelas:
            </span>
            <div className="flex items-center gap-2">
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl font-bold text-xs text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-emerald-700 font-medium">
                (Ruang default: <strong>{targetClassObj?.roomDefault || 'R.J1'}</strong>)
              </span>
            </div>

            {/* Target Rotating Week Selection */}
            <div className="flex items-center gap-2 pt-1 sm:pt-0 sm:border-l sm:border-emerald-300/80 sm:pl-3">
              <span className="font-extrabold text-emerald-900 shrink-0 text-xs">
                Siklus Pekan:
              </span>
              <select
                value={targetWeekType}
                onChange={(e) => setTargetWeekType(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl font-bold text-xs text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Pekan (ALL)</option>
                <option value="NORMADA_10_PRODUKTIF_11">Pekan Normada 10 & Produktif 11</option>
                <option value="PRODUKTIF_10_NORMADA_11">Pekan Produktif 10 & Normada 11</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadSingleClassTemplate}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              title={`Unduh template Excel 1 kolom untuk ${targetClassName}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template Excel 1 Kelas ({targetClassName})</span>
            </button>
          </div>
        </div>

        {/* Input Method Tabs */}
        <div className="mt-3 flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah File Excel (.xlsx / .xls / .csv)</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Salin & Tempel Sel Excel (Copy-Paste)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="py-3 overflow-y-auto flex-1 space-y-4">
          
          {/* Upload Dropzone */}
          {activeTab === 'upload' && (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 transition-all rounded-2xl p-6 text-center cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-6 h-6 text-emerald-700" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Klik untuk memilih file jadwal Excel 1 Kelas ({targetClassName})
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Format 6 kolom: <strong>HARI, JAM, PUKUL, MATA_PELAJARAN, KODE_GURU, RUANG</strong>.
                </p>
                {fileName && (
                  <p className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-100/70 inline-block px-3 py-1 rounded-lg">
                    📄 File terpilih: {fileName}
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Paste Input */}
          {activeTab === 'paste' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tempelkan baris sel tabel dari Microsoft Excel untuk kelas <strong>{targetClassName}</strong>:
              </label>
              <textarea
                rows={4}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="SENIN	2	07:20 - 07:55	BAHASA INGGRIS	BIG3	R.J1
SENIN	3	07:55 - 08:30	BAHASA INGGRIS	BIG3	R.J1
KAMIS	6	10:15 - 10:50	DINIYAH	DIN	R.J1"
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="button"
                onClick={handleParsePastedText}
                className="mt-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>Proses Data Salinan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview Parsed Data */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pratinjau Data ({parsedRows.length} Sesi Terbaca):
                </span>

                {/* Import Mode Options */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer font-bold transition-all ${
                    importMode === 'merge'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="schedImportMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>✓ Gabungkan Cerdas (Data Kelas Lain Tetap Aman)</span>
                  </label>

                  <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer font-bold transition-all ${
                    importMode === 'replace_day'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="schedImportMode"
                      value="replace_day"
                      checked={importMode === 'replace_day'}
                      onChange={() => setImportMode('replace_day')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Ganti Hanya Hari Ini</span>
                  </label>

                  <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border cursor-pointer font-semibold transition-all ${
                    importMode === 'replace'
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="schedImportMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-[11px]">Ganti Total Seluruh Jadwal</span>
                  </label>
                </div>
              </div>

              {/* Preview Table - 1 Column only */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-20">Hari</th>
                      <th className="py-2.5 px-2 text-center w-14">Jam</th>
                      <th className="py-2.5 px-3 text-center w-28">Pukul</th>
                      <th className="py-2.5 px-3 bg-emerald-50 text-emerald-900 border-l border-r border-emerald-200">
                        Mata Pelajaran ({targetClassName})
                      </th>
                      <th className="py-2.5 px-3 text-center w-24">Kode Guru</th>
                      <th className="py-2.5 px-3 text-center w-24">Ruang</th>
                      <th className="py-2.5 px-2 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-bold text-slate-800">
                          {row.day}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-600">
                          {row.periodNumber || '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {row.timeStart} - {row.timeEnd}
                        </td>
                        <td className="py-2 px-3 border-l border-r border-slate-100 font-bold text-slate-900">
                          {row.subject}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-emerald-700 font-bold">
                          {row.teacherCode && row.teacherCode !== '-' ? (
                            <span className="bg-emerald-100 px-2 py-0.5 rounded">
                              {row.teacherCode}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-600 font-medium">
                          {row.room || targetClassObj?.roomDefault || 'R.J1'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {row.isValid ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              ✓ OK
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                              ⚠️
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedRows.length === 0 || parsedRows.filter((r) => r.isValid).length === 0}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Terapkan Jadwal {targetClassName} ({parsedRows.filter((r) => r.isValid).length} Sesi)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
