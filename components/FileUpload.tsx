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
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${
          isDragging ? 'border-amber-500 bg-stone-800' : 'border-stone-700 bg-stone-900/50 hover:bg-stone-800 hover:border-stone-600'
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <UploadIcon className={`w-12 h-12 mb-4 transition-transform duration-300 ${isDragging ? 'scale-110 text-amber-500' : 'text-stone-500'}`} />
          <p className="mb-2 text-sm text-stone-400">
            <span className="font-bold text-amber-500 hover:underline">Clicca per caricare</span> o trascina il file qui
          </p>
          <p className="text-xs text-stone-600">Supporta: .opus, .ogg, .mp3, .wav, .m4a</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" accept=".opus,.ogg,.mp3,.wav,.m4a,audio/mp4,audio/x-m4a" onChange={handleChange} />
      </label>
    </div>
  );
};

export default FileUpload;