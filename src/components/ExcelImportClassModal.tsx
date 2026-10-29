import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Layers, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clipboard, 
  ArrowRight,
  Info
} from 'lucide-react';
import { SchoolClass } from '../types/schedule';

interface ParsedClassRow {
  name: string;
  department: string;
  grade: 'X' | 'XI' | 'XII';
  roomDefault?: string;
  isValid: boolean;
  notes?: string;
}

interface ExcelImportClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportClasses: (newClasses: SchoolClass[], mode: 'merge' | 'replace') => void;
}

export const ExcelImportClassModal: React.FC<ExcelImportClassModalProps> = ({
  isOpen,
  onClose,
  onImportClasses,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedClassRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [pasteContent, setPasteContent] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download Sample Template Data Kelas
  const handleDownloadTemplate = () => {
    const wsData = [
      ['Nama Kelas', 'Jurusan / Konsentrasi', 'Tingkat', 'Ruang Default'],
      ['X TKR 1', 'TKR (Teknik Kendaraan Ringan)', 'X', 'BENGKEL TKR'],
      ['X TSM 1', 'TSM (Teknik Sepeda Motor)', 'X', 'BENGKEL TSM'],
      ['X TPL 1', 'TPL (Teknik Pengelasan)', 'X', 'BENGKEL TPL'],
      ['X TKJ 1', 'TKJ (Teknik Komputer dan Jaringan)', 'X', 'LAB TKJ'],
      ['X AK 1', 'AK (Akuntansi)', 'X', 'LAB AK'],
      ['X DPB 1', 'DPB (Desain Produksi Busana)', 'X', 'LAB DPB'],
      ['X KL 1', 'KL (Kuliner)', 'X', 'R.J1'],
      ['X KL 2', 'KL (Kuliner)', 'X', 'R.J2'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 18 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Kelas');
    XLSX.writeFile(wb, 'template-data-kelas-smkn1tegalsari.xlsx');
  };

  const processRawData = (rows: any[][]) => {
    if (!rows || rows.length === 0) {
      setErrorMessage('File atau teks tidak berisi data kelas yang terbaca.');
      setParsedRows([]);
      return;
    }

    setErrorMessage(null);

    // Skip header row if present
    let startIndex = 0;
    const firstRowStr = (rows[0] || []).map((c) => String(c || '').toLowerCase().trim()).join(' ');
    if (firstRowStr.includes('nama') || firstRowStr.includes('kelas') || firstRowStr.includes('jurusan')) {
      startIndex = 1;
    }

    const results: ParsedClassRow[] = [];

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const nameRaw = String(row[0] || '').trim();
      const deptRaw = String(row[1] || 'Kuliner').trim();
      let gradeRaw = String(row[2] || 'X').trim().toUpperCase();
      const roomRaw = String(row[3] || 'R.J1').trim().toUpperCase();

      if (!nameRaw) continue;

      // Normalize grade
      let grade: 'X' | 'XI' | 'XII' = 'X';
      if (gradeRaw.includes('XII') || gradeRaw === '12') grade = 'XII';
      else if (gradeRaw.includes('XI') || gradeRaw === '11') grade = 'XI';
      else grade = 'X';

      results.push({
        name: nameRaw.toUpperCase(),
        department: deptRaw,
        grade,
        roomDefault: roomRaw,
        isValid: Boolean(nameRaw),
      });
    }

    if (results.length === 0) {
      setErrorMessage('Tidak ada data kelas yang dapat diekstrak.');
    }

    setParsedRows(results);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames.find((s) => s.toLowerCase().includes('kelas')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        processRawData(rawJson);
      } catch {
        setErrorMessage('Gagal membaca file Excel.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleParsePastedText = () => {
    if (!pasteContent.trim()) {
      setErrorMessage('Tempelkan teks tabel kelas dari Excel.');
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

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const newClasses: SchoolClass[] = validRows.map((r, idx) => {
      const slug = r.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return {
        id: slug || `cls-${Date.now()}-${idx}`,
        name: r.name,
        department: r.department,
        grade: r.grade,
        roomDefault: r.roomDefault,
      };
    });

    onImportClasses(newClasses, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Impor Data Rombel Kelas dari Excel
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Format kolom: <strong>Nama Kelas</strong>, <strong>Jurusan</strong>, <strong>Tingkat (X/XI/XII)</strong>, <strong>Ruang Default</strong>
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

        {/* Template download header */}
        <div className="mt-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs flex items-center justify-between gap-3 text-emerald-950">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Format: <strong>Nama Kelas</strong>, <strong>Jurusan</strong>, <strong>Tingkat</strong>, <strong>Ruang</strong></span>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Template Kelas (.xlsx)</span>
          </button>
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
            <span>Unggah File (.xlsx / .xls / .csv)</span>
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
            <span>Salin & Tempel dari Excel</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="py-3 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 transition-all rounded-2xl p-6 text-center cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                <Upload className="w-6 h-6 text-emerald-700" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Klik untuk memilih file Excel data kelas
              </p>
              {fileName && (
                <p className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-100/70 inline-block px-3 py-1 rounded-lg">
                  📄 File: {fileName}
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
          )}

          {activeTab === 'paste' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tempelkan baris kelas dari Excel:
              </label>
              <textarea
                rows={4}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="X KULINER 1	Kuliner	X	R.J1
X KULINER 2	Kuliner	X	R.J2
XI KULINER 1	Kuliner	XI	R.J3"
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

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pratinjau ({parsedRows.length} Kelas):
                </span>

                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700">
                    <input
                      type="radio"
                      name="clsMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Gabungkan (Merge)</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700">
                    <input
                      type="radio"
                      name="clsMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Ganti Semua (Replace)</span>
                  </label>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">No</th>
                      <th className="py-2 px-3">Nama Kelas</th>
                      <th className="py-2 px-3">Jurusan</th>
                      <th className="py-2 px-3 text-center">Tingkat</th>
                      <th className="py-2 px-3">Ruang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">{i + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{r.name}</td>
                        <td className="py-2 px-3 text-slate-700">{r.department}</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-700">{r.grade}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.roomDefault}</td>
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
            disabled={parsedRows.length === 0}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan Data Kelas ({parsedRows.length})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
