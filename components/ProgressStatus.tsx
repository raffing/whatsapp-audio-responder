
import React from 'react';
import Spinner from './Spinner';

interface ProgressStatusProps {
  progress: number;
  label: string;
  sublabel?: string;
}

const ProgressStatus: React.FC<ProgressStatusProps> = ({ progress, label, sublabel }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-md animate-fade-in">
      <div className="mb-6 relative">
          <Spinner className="w-16 h-16" />
          <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-amber-500">{progress}%</span>
          </div>
      </div>
      
      <h3 className="text-xl font-bold text-stone-200 mb-2">{label}</h3>
      {sublabel && <p className="text-sm text-stone-500 mb-8 truncate w-full">{sublabel}</p>}
      
      <div className="w-full bg-stone-800 rounded-full h-2 mb-2 overflow-hidden border border-stone-700">
        <div 
          className="bg-gradient-to-r from-amber-600 to-orange-400 h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between w-full text-[10px] uppercase tracking-widest font-bold text-stone-600">
          <span>Inizio</span>
          <span>In elaborazione</span>
          <span>Quasi fatto</span>
      </div>
    </div>
  );
};

export default ProgressStatus;
