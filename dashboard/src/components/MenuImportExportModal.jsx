import { useState } from 'react';
import { apiService } from '../services/api';
import { Download, FileSpreadsheet, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MenuImportExportModal({ outletId, onClose, onSuccess }) {
  console.log('MenuImportExportModal rendered', { outletId });
  const [file, setFile] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('upload');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setDryRunResult(null);
    setStep('upload');
  };

  const handleDryRun = async () => {
    if (!file) return toast.error('Select a CSV file');
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('outletId', outletId);
    try {
      const res = await apiService.menuImportDryRun(formData);
      setDryRunResult(res.data);
      setStep('preview');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Dry run failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('outletId', outletId);
    try {
      await apiService.menuImportConfirm(formData);
      toast.success('Import completed');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await apiService.menuExport(outletId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menu_${outletId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const downloadSample = async () => {
    try {
      const blob = await apiService.menuSample();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menu_sample.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download sample');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Import / Export Menu</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={handleExport} className="px-3 py-1 bg-gray-100 rounded text-sm">
            <Download className="h-4 w-4 inline mr-1" /> Export CSV
          </button>
          <button onClick={downloadSample} className="px-3 py-1 bg-gray-100 rounded text-sm">
            <FileSpreadsheet className="h-4 w-4 inline mr-1" /> Sample CSV
          </button>
        </div>

        <div className="border-2 border-dashed rounded p-4 text-center">
          <input type="file" accept=".csv" onChange={handleFileChange} className="mb-2" />
          {step === 'upload' && (
            <button onClick={handleDryRun} disabled={!file || loading} className="bg-indigo-500 text-white px-4 py-2 rounded">
              {loading ? 'Processing...' : 'Dry Run'}
            </button>
          )}
        </div>

        {step === 'preview' && dryRunResult && (
          <div className="bg-gray-50 p-4 rounded mt-4">
            <h3 className="font-semibold">Preview Results</h3>
            <div className="text-sm space-y-1 mt-2">
              <div>✅ Valid rows: {dryRunResult.validRowsCount}</div>
              <div>📝 To create: {dryRunResult.toCreateCount}</div>
              <div>🔄 To update: {dryRunResult.toUpdateCount}</div>
              {dryRunResult.warnings?.length > 0 && (
                <div className="text-yellow-600">⚠️ Warnings: {dryRunResult.warnings.join(', ')}</div>
              )}
              {dryRunResult.errors?.length > 0 && (
                <div className="text-red-600">❌ Errors: {dryRunResult.errors.length} rows have issues.</div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleConfirmImport} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
                Confirm Import
              </button>
              <button onClick={() => setStep('upload')} className="border px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}