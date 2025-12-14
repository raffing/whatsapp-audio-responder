import React, { useRef, useEffect, useState } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, BulletListIcon, NumberListIcon } from './icons';

interface RichTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
}

const RichTextArea: React.FC<RichTextAreaProps> = ({ value, onChange, placeholder, 'aria-label': ariaLabel }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<{ top: number; left: number; show: boolean }>({ top: 0, left: 0, show: false });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbar({
        top: rect.top + window.scrollY - 40,
        left: rect.left + window.scrollX + rect.width / 2,
        show: true,
      });
    } else {
      setToolbar(prev => ({ ...prev, show: false }));
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setTimeout(handleSelectionChange, 0);
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.includes('Arrow')) {
        setTimeout(handleSelectionChange, 0);
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput(); // Immediately update state after formatting
    }
  };

  const Toolbar = () => (
    <div
      style={{ top: `${toolbar.top}px`, left: `${toolbar.left}px`, transform: 'translateX(-50%)' }}
      className={`absolute z-10 flex items-center space-x-1 bg-stone-800 border border-stone-700 rounded-lg shadow-xl p-1 transition-opacity duration-200 ${
        toolbar.show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onMouseDown={e => e.preventDefault()} // Prevent editor from losing focus
    >
        <ToolbarButton onClick={() => applyFormat('bold')} aria-label="Grassetto"><BoldIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => applyFormat('italic')} aria-label="Corsivo"><ItalicIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => applyFormat('underline')} aria-label="Sottolineato"><UnderlineIcon className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-5 bg-stone-600 mx-1"></div>
        <ToolbarButton onClick={() => applyFormat('insertUnorderedList')} aria-label="Elenco puntato"><BulletListIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => applyFormat('insertOrderedList')} aria-label="Elenco numerato"><NumberListIcon className="w-4 h-4" /></ToolbarButton>
    </div>
  );

  const ToolbarButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
      <button {...props} className="p-1.5 text-stone-300 rounded hover:bg-stone-700 hover:text-white transition-colors" />
  );

  return (
    <div className="relative group">
      <Toolbar />
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        aria-label={ariaLabel}
        className="rich-text-area w-full bg-stone-800/50 p-4 rounded-xl min-h-[140px] text-stone-200 border-2 border-transparent focus:border-stone-700 hover:border-stone-800 text-sm sm:text-base focus:outline-none transition-all duration-300 overflow-y-auto leading-relaxed shadow-inner"
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
};

export default RichTextArea;