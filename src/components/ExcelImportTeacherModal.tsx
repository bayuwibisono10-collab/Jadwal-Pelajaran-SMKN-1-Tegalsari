import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText, 
  Clipboard, 
  ArrowRight,
  Info
} from 'lucide-react';
import { Teacher } from '../types/schedule';

interface ParsedTeacherRow {
  code: string;
  name: string;
  subject: string;
  isValid: boolean;
  notes?: string;
}

interface ExcelImportTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTeachers: (newTeachers: Teacher[], mode: 'merge' | 'replace') => void;
}

export const ExcelImportTeacherModal: React.FC<ExcelImportTeacherModalProps> = ({
  isOpen,
  onClose,
  onImportTeachers,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedTeacherRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [pasteContent, setPasteContent] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download Sample Excel Template (Tanpa No HP)
  const handleDownloadTemplate = () => {
    const wsData = [
      ['Kode Guru', 'Nama Guru', 'Mata Pelajaran'],
      ['BIG3', 'Bayu Wibisono, S.Pd.', 'Bahasa Inggris'],
      ['MT7', 'Dian Kusumawati, S.Pd.', 'Matematika'],
      ['OR3', 'Wahyu Santoso, S.Pd.', 'PJOK'],
      ['BIN7', 'Nurul Hidayati, S.Pd.', 'Bahasa Indonesia'],
      ['KN3', 'Bambang Prasetyo, M.Pd.', 'Pendidikan Pancasila'],
      ['SJ1', 'Eko Sulistyo, S.Pd.', 'Sejarah Indonesia'],
      ['PAI1', 'Ahmad Fauzi, S.Ag., M.Pd.I', 'Pendidikan Agama & Budi Pekerti'],
      ['SB2', 'Retno Wulandari, S.Sn.', 'Seni Budaya'],
      ['BK6', 'Siti Rahmawati, S.Psi.', 'Bimbingan Konseling'],
      ['BJ6', 'Slamet Widodo, S.Pd.', 'Bahasa Jawa'],
      ['DIN', 'Ustadz M. Maksum, S.Pd.I', 'Diniyah & Keagamaan'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Set column widths
    ws['!cols'] = [{ wch: 15 }, { wch: 35 }, { wch: 30 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Guru');
    XLSX.writeFile(wb, 'template-data-guru-smkn1tegalsari.xlsx');
  };

  // Helper to parse 2D array data into ParsedTeacherRow[]
  const processRawData = (rows: any[][]) => {
    if (!rows || rows.length === 0) {
      setErrorMessage('File atau teks tidak berisi data yang terbaca.');
      setParsedRows([]);
      return;
    }

    setErrorMessage(null);

    // Check if first row is a header
    let startIndex = 0;
    const firstRowStr = (rows[0] || []).map((c) => String(c || '').toLowerCase().trim()).join(' ');
    if (
      firstRowStr.includes('kode') ||
      firstRowStr.includes('nama') ||
      firstRowStr.includes('mapel') ||
      firstRowStr.includes('guru') ||
      firstRowStr.includes('pelajaran')
    ) {
      startIndex = 1;
    }

    const results: ParsedTeacherRow[] = [];

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const codeRaw = String(row[0] || '').trim();
      const nameRaw = String(row[1] || '').trim();
      const subjectRaw = String(row[2] || '').trim();

      // Skip completely empty rows
      if (!codeRaw && !nameRaw && !subjectRaw) continue;

      const code = codeRaw.toUpperCase();
      const name = nameRaw || `Guru (${code})`;
      const subject = subjectRaw || '-';

      const isValid = Boolean(code);

      results.push({
        code,
        name,
        subject,
        isValid,
        notes: isValid ? undefined : 'Kode Guru tidak boleh kosong',
      });
    }

    if (results.length === 0) {
      setErrorMessage('Tidak ada baris data guru yang dapat diekstrak.');
    }

    setParsedRows(results);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        processRawData(rawJson);
      } catch (err) {
        setErrorMessage('Gagal membaca file Excel. Pastikan format file adalah .xlsx, .xls, atau .csv');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Paste from Excel Handler
  const handleParsePastedText = () => {
    if (!pasteContent.trim()) {
      setErrorMessage('Tempelkan teks tabel dari Excel terlebih dahulu.');
      return;
    }

    // Split rows by newline
    const lines = pasteContent.trim().split(/\r?\n/);
    const rawData = lines.map((line) => {
      // Split by tab (Excel default copy) or comma or semicolon
      if (line.includes('\t')) {
        return line.split('\t');
      } else if (line.includes(';')) {
        return line.split(';');
      } else {
        return line.split(',');
      }
    });

    setFileName('Teks Hasil Salinan (Copy-Paste)');
    processRawData(rawData);
  };

  // Confirm and Apply Import
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('Tidak ada data guru yang valid untuk diimpor.');
      return;
    }

    const newTeachers: Teacher[] = validRows.map((r, idx) => ({
      id: `teacher-imp-${Date.now()}-${idx}`,
      code: r.code,
      name: r.name,
      subject: r.subject,
      color: '#059669',
    }));

    onImportTeachers(newTeachers, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Impor Data Guru dari Excel
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Format kolom: <strong>Kode Guru</strong>, <strong>Nama Guru</strong>, <strong>Mata Pelajaran</strong> (Tanpa No HP)
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

        {/* Info Banner: Format Tanpa No HP */}
        <div className="mt-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs flex items-start justify-between gap-3 text-emerald-950">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Format Kolom Spreadsheet (Sesuai Permintaan: Tanpa No HP):</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Kolom A: <strong>Kode Guru</strong> (misal BIG3) • Kolom B: <strong>Nama Guru</strong> (Bayu Wibisono, S.Pd.) • Kolom C: <strong>Mata Pelajaran</strong> (Bahasa Inggris).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
            title="Unduh contoh file excel siap pakai"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Template .xlsx</span>
          </button>
        </div>

        {/* Input Method Tabs */}
        <div className="mt-4 flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
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
            <span>Salin & Tempel Langsung dari Excel</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4">
          
          {/* Tab 1: File Upload */}
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
                  Klik untuk memilih file Excel atau seret file ke sini
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mendukung format .xlsx, .xls, dan .csv
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

          {/* Tab 2: Paste from Excel */}
          {activeTab === 'paste' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tempelkan (Paste) data dari Microsoft Excel atau Google Sheets:
              </label>
              <textarea
                rows={4}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Contoh salinan sel dari Excel:
BIG3	Bayu Wibisono, S.Pd.	Bahasa Inggris
MT7	Dian Kusumawati, S.Pd.	Matematika
OR3	Wahyu Santoso, S.Pd.	PJOK"
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

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview of Parsed Rows */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pratinjau Data ({parsedRows.length} Guru Terdeteksi):
                </span>
                
                {/* Import Mode: Merge vs Replace */}
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-700">
                    <input
                      type="radio"
                      name="importMode"
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
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Ganti Semua (Replace)</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">No</th>
                      <th className="py-2 px-3 w-24">Kode Guru</th>
                      <th className="py-2 px-3">Nama Lengkap</th>
                      <th className="py-2 px-3">Mata Pelajaran</th>
                      <th className="py-2 px-3 w-24 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">
                          {row.code || <span className="text-rose-500 italic">Kosong</span>}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {row.name}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {row.subject}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.isValid ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              ✓ Valid
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              ⚠️ Error
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
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan & Terapkan Data Guru ({parsedRows.filter((r) => r.isValid).length})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
