import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={`flex items-center justify-center w-full transition-all duration-300`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <label
        htmlFor="dropzone-file"
        className={`flex flex-col items-center justify-center w-full h-56 sm:h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${
          isDragging ? 'border-indigo-500 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:bg-gray-700/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-2">
          <UploadIcon className={`w-8 h-8 sm:w-10 sm:h-10 mb-4 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`} />
          <p className="mb-2 text-xs sm:text-sm text-gray-400">
            <span className="font-semibold text-indigo-400">Trascina e rilascia</span> o clicca per caricare
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500">File audio supportati: .opus, .ogg</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" accept=".opus,.ogg" onChange={handleChange} />
      </label>
    </div>
  );
};

export default FileUpload;