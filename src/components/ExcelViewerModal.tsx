import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, Download, Search, Maximize2, Minimize2, Copy, Check, 
  Printer, FileSpreadsheet, Plus, Trash2, Save, Calculator, 
  Edit3, Undo2, ZoomIn, ZoomOut, CheckCircle2, AlertCircle
} from 'lucide-react';
import { 
  ExcelSpreadsheetData, 
  exportBookingsToExcel, 
  calculateReferenceFee, 
  formatBookingStatusText 
} from '../utils/excelUtils';
import { useApp } from '../context/AppContext';
import { Booking } from '../types';
import * as XLSX from 'xlsx';

interface ExcelViewerModalProps {
  data: ExcelSpreadsheetData | null;
  onClose: () => void;
  onDownload?: () => void;
  onSave?: (updatedRows: (string | number)[][]) => Promise<void> | void;
}

// Convert 0 -> 'A', 1 -> 'B', 25 -> 'Z', 26 -> 'AA', etc.
function getColumnLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

const STATUS_OPTIONS = ['Confirmed', 'Checked In', 'Checked Out', 'Cancelled'];

export const ExcelViewerModal: React.FC<ExcelViewerModalProps> = ({ 
  data, 
  onClose, 
  onDownload, 
  onSave 
}) => {
  const { bookings, batchUpdateBookings, showToast } = useApp();

  // Local editable rows state
  const [gridRows, setGridRows] = useState<(string | number)[][]>(() => {
    return data?.rows ? data.rows.map(row => [...row]) : [];
  });
  
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Cell Selection & Inline Editing
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>({ row: 0, col: 0 });
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const [copiedCell, setCopiedCell] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const editInputRef = useRef<HTMLInputElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);

  // Sync rows if data prop changes fundamentally
  useEffect(() => {
    if (data?.rows) {
      setGridRows(data.rows.map(row => [...row]));
      setIsDirty(false);
    }
  }, [data]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  // Keep formula bar in sync with selected cell
  const currentCellValue = useMemo(() => {
    if (!selectedCell || !gridRows[selectedCell.row]) return '';
    return gridRows[selectedCell.row][selectedCell.col] ?? '';
  }, [selectedCell, gridRows]);

  // Dynamic calculated sums for Referral Fee (Col index 9) and Total Tariff (Col index 10)
  const { calculatedTotalFee, calculatedTotalTariff } = useMemo(() => {
    let feeSum = 0;
    let tariffSum = 0;
    gridRows.forEach(row => {
      const fee = typeof row[9] === 'number' ? row[9] : Number(String(row[9]).replace(/[^0-9.-]/g, '')) || 0;
      const tariff = typeof row[10] === 'number' ? row[10] : Number(String(row[10]).replace(/[^0-9.-]/g, '')) || 0;
      feeSum += fee;
      tariffSum += tariff;
    });
    return { calculatedTotalFee: feeSum, calculatedTotalTariff: tariffSum };
  }, [gridRows]);

  // Filter rows for search display
  const displayRowIndices = useMemo(() => {
    if (!searchQuery.trim()) {
      return gridRows.map((_, idx) => idx);
    }
    const q = searchQuery.toLowerCase().trim();
    const indices: number[] = [];
    gridRows.forEach((row, idx) => {
      if (row.some(val => String(val).toLowerCase().includes(q))) {
        indices.push(idx);
      }
    });
    return indices;
  }, [gridRows, searchQuery]);

  // Update specific cell value with automatic fee recalculation when referral or tariff changes
  const updateCellValue = (rowIdx: number, colIdx: number, rawVal: string | number) => {
    setGridRows(prev => {
      const newRows = prev.map((r, i) => (i === rowIdx ? [...r] : r));
      const targetRow = newRows[rowIdx];
      let valueToSet: string | number = rawVal;

      // Col 9: Referral Fee (BDT)
      // Col 10: Total Tariff (BDT)
      if (colIdx === 9 || colIdx === 10) {
        const cleaned = String(rawVal).replace(/[^0-9.-]/g, '');
        valueToSet = cleaned === '' ? 0 : Number(cleaned);
      }

      targetRow[colIdx] = valueToSet;

      // Business Rule: "reference fee under 1000=200/under 2000=300, and editable"
      // If user edits Referral Name (col 8):
      if (colIdx === 8) {
        const refName = String(valueToSet).trim();
        const tariff = Number(targetRow[10]) || 0;
        if (!refName || refName.toLowerCase() === 'direct' || refName.toLowerCase() === 'none' || refName === '-') {
          targetRow[9] = 0;
        } else {
          // Calculate reference fee using the rule
          targetRow[9] = calculateReferenceFee(tariff, refName);
        }
      }

      // If user edits Total Tariff (col 10):
      if (colIdx === 10) {
        const tariff = Number(valueToSet) || 0;
        const refName = String(targetRow[8] || '').trim();
        if (refName && refName.toLowerCase() !== 'direct' && refName.toLowerCase() !== 'none' && refName !== '-') {
          // Recalculate reference fee
          targetRow[9] = calculateReferenceFee(tariff, refName);
        }
      }

      return newRows;
    });

    setIsDirty(true);
  };

  // Start editing cell
  const handleStartEdit = (rowIdx: number, colIdx: number) => {
    setSelectedCell({ row: rowIdx, col: colIdx });
    setEditingCell({ row: rowIdx, col: colIdx });
    setEditValue(String(gridRows[rowIdx]?.[colIdx] ?? ''));
  };

  // Commit current edit
  const handleCommitEdit = () => {
    if (!editingCell) return;
    updateCellValue(editingCell.row, editingCell.col, editValue);
    setEditingCell(null);
  };

  // Cancel current edit
  const handleCancelEdit = () => {
    setEditingCell(null);
  };

  // Recalculate Reference Fees across all rows using the rule:
  // Under 1000 = 200, Under 2000 = 300, Direct = 0
  const handleRecalculateAllFees = () => {
    setGridRows(prev => {
      return prev.map(row => {
        const newRow = [...row];
        const refName = String(newRow[8] || '').trim();
        const tariff = Number(newRow[10]) || 0;
        newRow[9] = calculateReferenceFee(tariff, refName);
        return newRow;
      });
    });
    setIsDirty(true);
    showToast({
      type: 'success',
      message: '⚡ Reference fees recalculated: Under 1000 = ৳200 | Under 2000 = ৳300 | Direct = ৳0'
    });
  };

  // Add a new row to the ledger
  const handleAddRow = () => {
    const nextNum = gridRows.length + 101;
    const newRow: (string | number)[] = [
      `IGH-2026-${nextNum}`,
      'New Guest',
      '01700000000',
      '19900000000000000',
      '101',
      'Standard Double',
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      'Direct',
      0,
      3000,
      'Confirmed'
    ];
    setGridRows(prev => [...prev, newRow]);
    setIsDirty(true);
    setSelectedCell({ row: gridRows.length, col: 1 });
  };

  // Delete selected row
  const handleDeleteRow = () => {
    if (!selectedCell) return;
    const rowIdx = selectedCell.row;
    if (gridRows.length <= 1) {
      showToast({ type: 'warning', message: 'At least one row must remain in the ledger.' });
      return;
    }
    setGridRows(prev => prev.filter((_, i) => i !== rowIdx));
    setIsDirty(true);
    setSelectedCell(prev => prev ? { ...prev, row: Math.max(0, prev.row - 1) } : null);
  };

  // Save changes to System & Firebase
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(gridRows);
      }

      // Map rows back to bookings in AppContext
      if (batchUpdateBookings && bookings) {
        const updatedList: Booking[] = gridRows.map(row => {
          const bookingId = String(row[0]);
          const existing = bookings.find(b => b.id === bookingId);
          
          const rawStatus = String(row[11] || '').toLowerCase().replace(/\s+/g, '-');
          let cleanStatus: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' = 'confirmed';
          if (rawStatus.includes('check') && rawStatus.includes('in')) cleanStatus = 'checked-in';
          else if (rawStatus.includes('check') && rawStatus.includes('out')) cleanStatus = 'checked-out';
          else if (rawStatus.includes('cancel')) cleanStatus = 'cancelled';

          return {
            id: bookingId,
            roomId: String(row[4]),
            roomNumber: String(row[4]),
            roomType: String(row[5]),
            userId: existing?.userId || 'guest-user',
            guestName: String(row[1]),
            guestPhone: String(row[2]),
            guestEmail: existing?.guestEmail || `${String(row[1]).toLowerCase().replace(/\s+/g, '.')}@example.com`,
            nidNumber: String(row[3]),
            checkIn: String(row[6]),
            checkOut: String(row[7]),
            referenceName: String(row[8]),
            referenceFee: Number(row[9]) || 0,
            totalAmount: Number(row[10]) || 0,
            status: cleanStatus,
            notes: existing?.notes || 'Updated via Master Excel Spreadsheet',
            createdAt: existing?.createdAt || new Date().toISOString()
          };
        });

        await batchUpdateBookings(updatedList);
      }

      setIsDirty(false);
      showToast({
        type: 'success',
        message: '💾 Master Excel Ledger successfully saved to database & system!'
      });
    } catch (err) {
      console.error('Error saving excel data:', err);
      showToast({
        type: 'error',
        message: 'Failed to save spreadsheet updates.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Download .xlsx with exact layout
  const handleTriggerDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    exportBookingsToExcel(gridRows, data.filenamePrefix, data.headers);
    showToast({
      type: 'success',
      message: '📥 Master Excel spreadsheet downloaded successfully (.xlsx)!'
    });
  };

  // Copy cell value
  const handleCopyCell = () => {
    if (!selectedCell || !gridRows[selectedCell.row]) return;
    const val = gridRows[selectedCell.row][selectedCell.col];
    navigator.clipboard.writeText(String(val ?? ''));
    setCopiedCell(true);
    setTimeout(() => setCopiedCell(false), 2000);
  };

  // Copy full table as TSV
  const handleCopyTable = () => {
    const titleLine = `${data.title}\n${data.subtitle || ''}\n`;
    const headerLine = data.headers.join('\t');
    const rowLines = gridRows.map(r => r.join('\t')).join('\n');
    const totalLine = `Total\t\t\t\t\t\t\t\t\t${calculatedTotalFee}\t${calculatedTotalTariff}\t`;
    const fullText = `${titleLine}\n${headerLine}\n${rowLines}\n${totalLine}`;
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    showToast({
      type: 'info',
      message: '📋 Table copied to clipboard (TSV format, ready to paste in Excel)!'
    });
  };

  const selectedColLetter = selectedCell ? getColumnLetter(selectedCell.col) : 'A';
  const selectedRowDisplay = selectedCell ? selectedCell.row + 5 : 5; // Rows 1-3 title/blank, row 4 header, row 5+ data
  const cellAddress = `${selectedColLetter}${selectedRowDisplay}`;

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-300 transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-[98vw] xl:max-w-7xl max-h-[96vh] h-[880px]'
        }`}
      >
        {/* Top Window Bar matching authentic dark styling in Screenshot_16 */}
        <div className="bg-[#202124] text-white px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0 border-b border-slate-700 select-none">
          {/* Left: Close, Excel Icon, Filename */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-slate-700/80 rounded-md text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Excel Viewer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Excel Brand Icon */}
            <div className="w-6 h-6 bg-[#107c41] rounded flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0">
              X
            </div>

            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                {data.filenamePrefix}.xlsx
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-medium bg-emerald-950 text-emerald-300 rounded border border-emerald-700/50">
                Editable Spreadsheet
              </span>
              {isDirty && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50 animate-pulse">
                  ● Unsaved Edits
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Save Changes Button */}
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                isDirty 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 ring-2 ring-emerald-400' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600'
              }`}
              title="Save all edits back to Hotel Database"
            >
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>

            {/* Add Row Button */}
            <button
              type="button"
              onClick={handleAddRow}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1 border border-slate-600 cursor-pointer"
              title="Add a new row to ledger"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Add Row</span>
            </button>

            {/* Recalculate Fees Button (under 1000=200, under 2000=300) */}
            <button
              type="button"
              onClick={handleRecalculateAllFees}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-medium transition flex items-center gap-1 border border-slate-600 cursor-pointer"
              title="Apply business rule: Under 1000 = ৳200 | Under 2000 = ৳300 | Direct = ৳0"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Recalc Fees</span>
            </button>

            {/* Download .xlsx */}
            <button
              type="button"
              onClick={handleTriggerDownload}
              className="px-2.5 py-1.5 bg-[#107c41] hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
              title="Download Excel spreadsheet (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              title="Print Spreadsheet"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(prev => !prev)}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Formula Bar & Quick Info Strip */}
        <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left: Active Cell Box + fx + Formula Edit Input */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            {/* Coordinate Box (e.g. A4, J5) */}
            <div className="bg-white border border-slate-300 px-2 py-1 rounded font-mono font-bold text-xs text-slate-800 w-16 text-center shadow-inner">
              {cellAddress}
            </div>

            {/* fx icon */}
            <div className="text-slate-400 font-serif italic text-sm select-none">
              fx
            </div>

            {/* Formula Input for direct editing */}
            <div className="flex-1 relative">
              <input
                ref={formulaInputRef}
                type="text"
                value={editingCell ? editValue : String(currentCellValue)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (editingCell) {
                    setEditValue(val);
                  } else if (selectedCell) {
                    setEditingCell({ row: selectedCell.row, col: selectedCell.col });
                    setEditValue(val);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCommitEdit();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
                onBlur={() => {
                  if (editingCell) handleCommitEdit();
                }}
                placeholder="Click cell or type formula / text..."
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
              />
            </div>
          </div>

          {/* Center/Right: Quick Search & Rule Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Reference fee rule guideline pill */}
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Fee Rule: &lt;1000 = ৳200 | &lt;2000 = ৳300 | Direct = ৳0</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter row..."
                className="pl-7 pr-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 w-32 sm:w-44 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Copy Table */}
            <button
              type="button"
              onClick={handleCopyTable}
              className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-medium transition flex items-center gap-1 cursor-pointer"
              title="Copy entire sheet to clipboard"
            >
              {copiedAll ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
              <span>{copiedAll ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Delete Selected Row */}
            <button
              type="button"
              onClick={handleDeleteRow}
              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
              title="Delete active row"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Zoom */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 pl-1">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(80, prev - 10))}
                className="p-0.5 hover:bg-slate-200 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="w-8 text-center">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
                className="p-0.5 hover:bg-slate-200 rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Spreadsheet Canvas Container */}
        <div 
          className="flex-1 overflow-auto bg-white relative select-text" 
          style={{ fontSize: `${(zoomLevel / 100) * 12}px` }}
        >
          <table className="border-collapse w-full min-w-[1280px] text-left table-fixed">
            {/* Column Header Letters: A, B, C... */}
            <thead className="sticky top-0 z-20 shadow-xs bg-[#f8f9fa]">
              <tr className="border-b border-[#dadce0]">
                {/* Top-left corner cell */}
                <th className="w-12 bg-[#f8f9fa] border-r border-b border-[#dadce0] text-center py-1 text-[10px] font-mono text-slate-500 font-semibold sticky left-0 z-30 select-none">
                  #
                </th>
                {data.headers.map((_, colIdx) => {
                  const letter = getColumnLetter(colIdx);
                  const isColActive = selectedCell?.col === colIdx;
                  return (
                    <th
                      key={`col-${letter}`}
                      className={`border-r border-b border-[#dadce0] px-2 py-0.5 text-center font-mono text-[10px] font-semibold transition select-none ${
                        isColActive ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-[#f8f9fa] text-slate-600'
                      }`}
                      style={{ 
                        width: colIdx === 0 ? '130px' 
                             : colIdx === 1 ? '160px' 
                             : colIdx === 2 ? '130px' 
                             : colIdx === 3 ? '180px' 
                             : colIdx === 4 ? '110px' 
                             : colIdx === 5 ? '150px' 
                             : colIdx === 6 ? '110px' 
                             : colIdx === 7 ? '110px' 
                             : colIdx === 8 ? '140px' 
                             : colIdx === 9 ? '130px' 
                             : colIdx === 10 ? '135px' 
                             : '120px' 
                      }}
                    >
                      {letter}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {/* Row 1: Title Banner matching Screenshot_16 */}
              <tr className="bg-white border-b border-[#dadce0] hover:bg-slate-50/50">
                <td className="w-12 bg-[#f8f9fa] border-r border-[#dadce0] text-center py-1.5 font-mono text-[11px] text-slate-500 sticky left-0 z-10 select-none">
                  1
                </td>
                <td 
                  colSpan={data.headers.length} 
                  className="px-4 py-2 text-base sm:text-lg font-bold text-[#1b365d] border-r border-[#dadce0] tracking-tight bg-white select-text"
                >
                  Islamia Guest House — Master Reservation & Billing Ledger
                </td>
              </tr>

              {/* Row 2: Subtitle matching Screenshot_16 */}
              <tr className="bg-white border-b border-[#dadce0] hover:bg-slate-50/50">
                <td className="w-12 bg-[#f8f9fa] border-r border-[#dadce0] text-center py-1 font-mono text-[11px] text-slate-500 sticky left-0 z-10 select-none">
                  2
                </td>
                <td 
                  colSpan={data.headers.length} 
                  className="px-4 py-1 text-xs italic text-slate-600 border-r border-[#dadce0] bg-white select-text"
                >
                  Generated: System Export | Currency: BDT
                </td>
              </tr>

              {/* Row 3: Blank spacing row matching Screenshot_16 */}
              <tr className="bg-white border-b border-[#dadce0] h-6">
                <td className="w-12 bg-[#f8f9fa] border-r border-[#dadce0] text-center py-1 font-mono text-[11px] text-slate-400 sticky left-0 z-10 select-none">
                  3
                </td>
                {data.headers.map((_, i) => (
                  <td key={`blank-${i}`} className="border-r border-[#dadce0] bg-white"></td>
                ))}
              </tr>

              {/* Row 4: Solid Navy Blue Column Headers matching Screenshot_16 */}
              <tr className="bg-[#1b365d] text-white font-bold border-b border-slate-700 shadow-xs">
                <td className="w-12 bg-[#1b365d] border-r border-slate-700 text-center py-2 text-[11px] font-mono text-slate-300 sticky left-0 z-10 select-none">
                  4
                </td>
                {data.headers.map((header, colIdx) => (
                  <th
                    key={`header-name-${colIdx}`}
                    className="border-r border-slate-700/80 px-3 py-2 text-xs font-bold text-white tracking-wide whitespace-nowrap select-none"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{header}</span>
                    </div>
                  </th>
                ))}
              </tr>

              {/* Rows 5 to N: Editable Data Rows */}
              {displayRowIndices.map((realRowIdx, displayIdx) => {
                const actualRowNum = realRowIdx + 5; // Row 1 title, 2 subtitle, 3 blank, 4 header, 5+ data
                const row = gridRows[realRowIdx];
                const isRowSelected = selectedCell?.row === realRowIdx;

                return (
                  <tr 
                    key={`datarow-${realRowIdx}`}
                    className={`border-b border-[#dadce0] transition group ${
                      isRowSelected ? 'bg-emerald-50/40' : realRowIdx % 2 === 1 ? 'bg-[#fcfdfd]' : 'bg-white'
                    }`}
                  >
                    {/* Sticky Row Number */}
                    <td 
                      className={`w-12 border-r border-[#dadce0] text-center py-1 font-mono text-[11px] sticky left-0 z-10 transition select-none ${
                        isRowSelected ? 'bg-emerald-200 text-emerald-950 font-bold' : 'bg-[#f8f9fa] text-slate-500'
                      }`}
                    >
                      {actualRowNum}
                    </td>

                    {/* Data Cells */}
                    {row.map((cellVal, colIdx) => {
                      const isCellSelected = selectedCell?.row === realRowIdx && selectedCell?.col === colIdx;
                      const isEditing = editingCell?.row === realRowIdx && editingCell?.col === colIdx;
                      const isNumberCol = colIdx === 9 || colIdx === 10;
                      const isStatusCol = colIdx === 11;
                      const numVal = typeof cellVal === 'number' ? cellVal : Number(String(cellVal).replace(/[^0-9.-]/g, '')) || 0;

                      return (
                        <td
                          key={`cell-${realRowIdx}-${colIdx}`}
                          onClick={() => setSelectedCell({ row: realRowIdx, col: colIdx })}
                          onDoubleClick={() => handleStartEdit(realRowIdx, colIdx)}
                          className={`border-r border-[#dadce0] px-3 py-1.5 whitespace-nowrap truncate relative transition text-xs ${
                            isNumberCol ? 'text-right font-mono' : 'text-left'
                          } ${
                            isCellSelected 
                              ? 'outline outline-2 outline-emerald-600 bg-emerald-50/70 text-slate-950 z-10 shadow-xs' 
                              : 'text-slate-800'
                          }`}
                          title="Double-click to edit cell"
                        >
                          {isEditing ? (
                            isStatusCol ? (
                              <select
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCommitEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCommitEdit();
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                className="w-full bg-white border border-emerald-500 text-xs font-bold rounded px-1.5 py-0.5 outline-none shadow-sm"
                              >
                                {STATUS_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                ref={editInputRef}
                                type={isNumberCol ? 'number' : 'text'}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCommitEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCommitEdit();
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                className={`w-full bg-white border border-emerald-500 text-xs rounded px-1.5 py-0.5 outline-none shadow-sm ${
                                  isNumberCol ? 'text-right font-mono font-bold text-emerald-950' : 'text-left font-normal text-slate-900'
                                }`}
                              />
                            )
                          ) : (
                            /* Normal cell display */
                            isNumberCol ? (
                              <span className="font-semibold text-slate-900 font-mono">
                                {numVal.toLocaleString()}
                              </span>
                            ) : isStatusCol ? (
                              <span 
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                  String(cellVal).toLowerCase().includes('in')
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : String(cellVal).toLowerCase().includes('out')
                                    ? 'bg-slate-200 text-slate-700'
                                    : String(cellVal).toLowerCase().includes('cancel')
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {String(cellVal || 'Confirmed')}
                              </span>
                            ) : (
                              String(cellVal || '')
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Row N+1: Total Summary Row matching Screenshot_16 */}
              <tr className="bg-white border-t-2 border-b-2 border-slate-400 font-bold shadow-xs">
                <td className="w-12 bg-[#f8f9fa] border-r border-[#dadce0] text-center py-2 font-mono text-[11px] text-slate-700 sticky left-0 z-10 select-none font-bold">
                  {gridRows.length + 5}
                </td>
                {/* Col A: Total */}
                <td className="px-3 py-2 text-xs font-bold text-slate-900 border-r border-[#dadce0]">
                  Total
                </td>
                {/* Col B to I (indices 1 to 8): blank cells */}
                <td className="border-r border-[#dadce0]"></td>
                <td className="border-r border-[#dadce0]"></td>
                <td className="border-r border-[#dadce0]"></td>
                <td className="border-r border-[#dadce0]"></td>
                <td className="border-r border-[#dadce0]"></td>
                <td className="border-r border-[#dadce0]"></td>
                <td className="border-r border-[#dadce0]"></td>
                <td className="border-r border-[#dadce0]"></td>

                {/* Col J (index 9): Sum of Referral Fee */}
                <td className="px-3 py-2 text-xs font-bold text-right font-mono text-slate-900 border-r border-[#dadce0] bg-emerald-50/40">
                  {calculatedTotalFee.toLocaleString()}
                </td>

                {/* Col K (index 10): Sum of Total Tariff */}
                <td className="px-3 py-2 text-xs font-bold text-right font-mono text-slate-900 border-r border-[#dadce0] bg-emerald-50/40">
                  {calculatedTotalTariff.toLocaleString()}
                </td>

                {/* Col L: blank cell */}
                <td className="border-r border-[#dadce0]"></td>
              </tr>

              {/* Rows N+2 to 25+: Blank Spreadsheet Grid Rows for Authentic Excel Aesthetic */}
              {Array.from({ length: Math.max(5, 25 - (gridRows.length + 5)) }).map((_, emptyIdx) => {
                const rowNumber = gridRows.length + 6 + emptyIdx;
                return (
                  <tr key={`empty-grid-row-${emptyIdx}`} className="border-b border-[#dadce0] h-6 bg-white hover:bg-slate-50/30">
                    <td className="w-12 bg-[#f8f9fa] border-r border-[#dadce0] text-center py-1 font-mono text-[11px] text-slate-400 sticky left-0 z-10 select-none">
                      {rowNumber}
                    </td>
                    {data.headers.map((_, cIdx) => (
                      <td key={`empty-cell-${emptyIdx}-${cIdx}`} className="border-r border-[#dadce0] bg-white"></td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Status & Aggregations Bar matching Excel */}
        <div className="bg-[#f8f9fa] border-t border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 shrink-0 select-none">
          {/* Active Sheet Tab */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-t border-t-2 border-[#107c41] font-bold text-slate-800 text-xs shadow-xs border-x border-slate-200">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#107c41]" />
              <span>{data.sheetName}</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Ready • Double-click any cell to edit • Under 1000 = ৳200 / Under 2000 = ৳300
            </span>
          </div>

          {/* Quick Real-Time Aggregations */}
          <div className="flex items-center gap-3 sm:gap-5 text-[11px] font-medium text-slate-600 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Records:</span>
              <span className="font-bold text-slate-800">{gridRows.length} Rows</span>
            </div>

            <div className="flex items-center gap-1 bg-amber-50 text-amber-950 px-2 py-0.5 rounded border border-amber-200 font-medium">
              <span>Referral Fee Total:</span>
              <span className="font-bold font-mono">৳{calculatedTotalFee.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-950 px-2 py-0.5 rounded border border-emerald-200 font-medium">
              <span>Tariff Total:</span>
              <span className="font-bold font-mono">৳{calculatedTotalTariff.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-400">Selected:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">
                {cellAddress}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
