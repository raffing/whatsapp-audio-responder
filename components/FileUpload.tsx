
import React, { useState, useCallback } from 'react';
import { UploadIcon, WhatsAppIcon, TrashIcon, SuccessiveIcon, IndependentIcon } from './icons';
import { BatchMode } from '../types';

interface FileUploadProps {
  onFilesSelect: (files: File[], mode: BatchMode) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchMode, setBatchMode] = useState<BatchMode>(BatchMode.Independent);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.includes('audio') || f.name.endsWith('.opus'));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = () => {
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles, batchMode);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div
        className="flex items-center justify-center w-full transition-all duration-300"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <label
          htmlFor="dropzone-file"
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
            isDragging 
              ? 'border-amber-500 bg-amber-500/5' 
              : 'border-stone-700 bg-stone-900/50 hover:bg-stone-800 hover:border-stone-600'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-6">
            <UploadIcon className={`w-10 h-10 mb-3 transition-transform duration-300 ${isDragging ? 'scale-110 text-amber-500' : 'text-stone-500'}`} />
            <p className="text-sm text-stone-300">
              <span className="font-bold text-amber-500">Trascina o seleziona</span> uno o più file audio
            </p>
          </div>
          <input id="dropzone-file" type="file" multiple className="hidden" accept=".opus,.ogg,.mp3,.wav,.m4a,audio/*" onChange={handleChange} />
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 max-h-48 overflow-y-auto">
             <h4 className="text-xs uppercase tracking-widest font-bold text-stone-500 mb-3">File Selezionati ({selectedFiles.length})</h4>
             <div className="grid grid-cols-1 gap-2">
                {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-stone-800 p-2 rounded-lg group">
                        <span className="text-xs text-stone-300 truncate pr-4">{file.name}</span>
                        <button onClick={() => removeFile(idx)} className="text-stone-500 hover:text-red-400 p-1">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
             </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-stone-500 mb-4">Modalità Elaborazione</h4>
              <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setBatchMode(BatchMode.Independent)}
                    className={`flex items-center p-3 rounded-xl border transition-all ${batchMode === BatchMode.Independent ? 'bg-amber-900/20 border-amber-600 text-amber-100' : 'bg-stone-800 border-stone-700 text-stone-500 hover:bg-stone-750'}`}
                  >
                      <IndependentIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                          <p className="text-xs font-bold">Indipendenti</p>
                          <p className="text-[10px] opacity-60">Trascrive ogni file separatamente.</p>
                      </div>
                  </button>
                  <button 
                    onClick={() => setBatchMode(BatchMode.Sequential)}
                    className={`flex items-center p-3 rounded-xl border transition-all ${batchMode === BatchMode.Sequential ? 'bg-amber-900/20 border-amber-600 text-amber-100' : 'bg-stone-800 border-stone-700 text-stone-500 hover:bg-stone-750'}`}
                  >
                      <SuccessiveIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                          <p className="text-xs font-bold">Sessione Unica</p>
                          <p className="text-[10px] opacity-60">Unisce i file in un unico flusso.</p>
                      </div>
                  </button>
              </div>
          </div>

          <button 
            onClick={handleProcess}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98]"
          >
            Inizia Elaborazione Batch
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
