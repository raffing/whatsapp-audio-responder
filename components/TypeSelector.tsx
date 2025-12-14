import React from 'react';
import { AudioType } from '../types';
import { WhatsAppIcon, NoteIcon, PhoneIcon, MeetingIcon } from './icons';

interface TypeSelectorProps {
    onTypeSelect: (type: AudioType) => void;
}

const TypeButton: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center text-center p-6 bg-stone-800 rounded-xl border border-stone-700 hover:bg-stone-750 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-amber-500 group"
    >
        <div className="mb-4 text-stone-400 group-hover:text-amber-500 transition-colors duration-300">{icon}</div>
        <h3 className="font-bold text-base text-stone-200 mb-1 group-hover:text-amber-100">{title}</h3>
        <p className="text-sm text-stone-500 group-hover:text-stone-400">{description}</p>
    </button>
);


const TypeSelector: React.FC<TypeSelectorProps> = ({ onTypeSelect }) => {
    return (
        <div className="w-full">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <TypeButton
                    icon={<WhatsAppIcon className="w-10 h-10" />}
                    title="WhatsApp"
                    description="Risposte intelligenti"
                    onClick={() => onTypeSelect(AudioType.WhatsApp)}
                />
                 <TypeButton
                    icon={<NoteIcon className="w-10 h-10" />}
                    title="Nota Vocale"
                    description="Riassunti rapidi"
                    onClick={() => onTypeSelect(AudioType.PersonalNote)}
                />
                 <TypeButton
                    icon={<PhoneIcon className="w-10 h-10" />}
                    title="Chiamata"
                    description="Punti salienti"
                    onClick={() => onTypeSelect(AudioType.CallRecording)}
                />
                 <TypeButton
                    icon={<MeetingIcon className="w-10 h-10" />}
                    title="Riunione"
                    description="Report completo"
                    onClick={() => onTypeSelect(AudioType.MeetingRecording)}
                />
            </div>
        </div>
    );
};

export default TypeSelector;