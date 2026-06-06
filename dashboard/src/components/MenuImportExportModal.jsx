// dashboard/src/components/MenuImportExportModal.jsx
import { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export default function MenuImportExportModal({ outletId, onClose, onSuccess }) {
  const [step, setStep] = useState('upload'); // 'upload', 'preview', 'importing'
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast.error('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleDryRun = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('outletId', outletId);
    try {
      const response = await apiService.menuImportDryRun(formData);
      if (response.data.success) {
        setPreviewData(response.data);
        setStep('preview');
      } else {
        toast.error('Dry run failed');
      }
    } catch (err) {
      console.error('Dry run error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to process CSV';
      toast.error(errorMsg);
      // If the response is plain text, show it in a scrollable div
      if (typeof err.response?.data === 'string') {
        toast.error('Server returned unexpected format. Check console.');
        console.error('Raw response:', err.response.data);
      }
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('outletId', outletId);
    try {
      const response = await apiService.menuImportConfirm(formData);
      if (response.data.success) {
        toast.success(response.data.message || 'Import completed successfully');
        onSuccess?.(); // Refresh menu list
        onClose();
      } else {
        toast.error(response.data.error || 'Import failed');
      }
    } catch (err) {
      console.error('Import error:', err);
      const errorMsg = err.response?.data?.error || 'Import failed';
      toast.error(errorMsg);
    } finally {
      setImporting(false);
    }
  };

  const resetAndClose = () => {
    setFile(null);
    setPreviewData(null);
    setStep('upload');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {step === 'upload' && 'Import Menu CSV'}
            {step === 'preview' && 'Preview Import'}
            {step === 'importing' && 'Importing...'}
          </h3>
          <button
            onClick={resetAndClose}
            disabled={importing}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Only CSV files accepted. Use the sample template for correct format.
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-green-600 font-medium">Valid rows</div>
                  <div className="text-2xl font-bold">{previewData.validRowsCount || 0}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-blue-600 font-medium">To create</div>
                  <div className="text-2xl font-bold">{previewData.toCreateCount || 0}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-yellow-600 font-medium">To update</div>
                  <div className="text-2xl font-bold">{previewData.toUpdateCount || 0}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-red-600 font-medium">Errors</div>
                  <div className="text-2xl font-bold">{previewData.errors?.length || 0}</div>
                </div>
              </div>

              {/* Warnings - scrollable */}
              {previewData.warnings && previewData.warnings.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">⚠️ Warnings</label>
                  <div className="bg-yellow-50 p-3 rounded text-sm font-mono max-h-48 overflow-y-auto border border-yellow-200">
                    {previewData.warnings.map((warning, i) => (
                      <div key={i} className="text-yellow-800 text-xs py-0.5">{warning}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors - scrollable */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">❌ Errors</label>
                  <div className="bg-red-50 p-3 rounded text-sm font-mono max-h-48 overflow-y-auto border border-red-200">
                    {previewData.errors.map((error, i) => (
                      <div key={i} className="text-red-700 text-xs py-0.5">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <button
            onClick={resetAndClose}
            disabled={importing}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          {step === 'upload' && (
            <button
              onClick={handleDryRun}
              disabled={!file || importing}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {importing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              Preview Import
            </button>
          )}
          {step === 'preview' && (
            <button
              onClick={handleConfirmImport}
              disabled={importing || (previewData.errors && previewData.errors.length > 0)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {importing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              Confirm Import
            </button>
          )}
        </div>
      </div>
    </div>
  );
}