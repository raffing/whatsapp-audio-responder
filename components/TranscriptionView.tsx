import React from 'react';
import Spinner from './Spinner';
import { RefreshIcon, StartOverIcon, FileAudioIcon, MicrophoneIcon, PlayIcon } from './icons';
import { ReplyTone, ReplyLength, VoiceGender } from '../types';

interface TranscriptionViewProps {
  fileName: string;
  transcription: string;
  reply: string;
  isGenerating: boolean;
  onGenerateReply: () => void;
  onReset: () => void;
  replyTone: ReplyTone;
  onToneChange: (tone: ReplyTone) => void;
  replyLength: ReplyLength;
  onLengthChange: (length: ReplyLength) => void;
  recipientName: string;
  onRecipientNameChange: (name: string) => void;
  onGenerateAudio: () => void;
  isGeneratingAudio: boolean;
  generatedAudioBuffer: AudioBuffer | null;
  onPlayAudio: () => void;
  voiceGender: VoiceGender;
  onVoiceGenderChange: (gender: VoiceGender) => void;
}

const OptionButton: React.FC<{
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-75 ${
      isActive
        ? 'bg-indigo-600 text-white focus:ring-indigo-400'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500'
    }`}
  >
    {children}
  </button>
);


const TranscriptionView: React.FC<TranscriptionViewProps> = ({
  fileName,
  transcription,
  reply,
  isGenerating,
  onGenerateReply,
  onReset,
  replyTone,
  onToneChange,
  replyLength,
  onLengthChange,
  recipientName,
  onRecipientNameChange,
  onGenerateAudio,
  isGeneratingAudio,
  generatedAudioBuffer,
  onPlayAudio,
  voiceGender,
  onVoiceGenderChange,
}) => {
  const canGenerateAudio = !!reply && !isGeneratingAudio;

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <div className="flex items-center text-gray-400 mb-2 truncate">
            <FileAudioIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="font-mono text-sm truncate">{fileName}</span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold mb-2 text-indigo-300">Trascrizione Ricevuta</h2>
        <div className="bg-gray-900/50 p-3 sm:p-4 rounded-lg min-h-[100px] text-gray-200 whitespace-pre-wrap border border-gray-700 text-sm sm:text-base">
            {transcription}
        </div>
      </div>
      
      {reply && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg sm:text-xl font-bold text-green-300">Risposta Suggerita</h2>
            {generatedAudioBuffer && (
                <button 
                    onClick={onPlayAudio} 
                    className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    title="Riproduci audio"
                    aria-label="Riproduci audio della risposta"
                >
                    <PlayIcon className="w-6 h-6" />
                </button>
            )}
          </div>
          <div className="bg-gray-900/50 p-3 sm:p-4 rounded-lg text-gray-200 whitespace-pre-wrap border border-gray-700 text-sm sm:text-base">
            {reply}
          </div>
        </div>
      )}

      <div className="pt-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-base sm:text-md font-semibold mb-3 text-gray-300">Tono della Risposta</h3>
                <div className="flex space-x-2">
                    <OptionButton onClick={() => onToneChange(ReplyTone.Agree)} isActive={replyTone === ReplyTone.Agree}>Concorde</OptionButton>
                    <OptionButton onClick={() => onToneChange(ReplyTone.Neutral)} isActive={replyTone === ReplyTone.Neutral}>Neutra</OptionButton>
                    <OptionButton onClick={() => onToneChange(ReplyTone.Disagree)} isActive={replyTone === ReplyTone.Disagree}>Discorde</OptionButton>
                </div>
            </div>
             <div>
                <h3 className="text-base sm:text-md font-semibold mb-3 text-gray-300">Lunghezza Risposta</h3>
                <div className="flex space-x-2">
                    <OptionButton onClick={() => onLengthChange(ReplyLength.Short)} isActive={replyLength === ReplyLength.Short}>Breve</OptionButton>
                    <OptionButton onClick={() => onLengthChange(ReplyLength.Medium)} isActive={replyLength === ReplyLength.Medium}>Media</OptionButton>
                    <OptionButton onClick={() => onLengthChange(ReplyLength.Long)} isActive={replyLength === ReplyLength.Long}>Lunga</OptionButton>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-base sm:text-md font-semibold mb-3 text-gray-300">Nome del mittente (opzionale)</h3>
                <input 
                    type="text"
                    value={recipientName}
                    onChange={(e) => onRecipientNameChange(e.target.value)}
                    placeholder="Es: Mario"
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-sm sm:text-base text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                />
            </div>
            <div>
                <h3 className="text-base sm:text-md font-semibold mb-3 text-gray-300">Voce della Risposta</h3>
                <div className="flex space-x-2">
                    <OptionButton onClick={() => onVoiceGenderChange(VoiceGender.Female)} isActive={voiceGender === VoiceGender.Female}>Donna</OptionButton>
                    <OptionButton onClick={() => onVoiceGenderChange(VoiceGender.Male)} isActive={voiceGender === VoiceGender.Male}>Uomo</OptionButton>
                </div>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-700">
            <button
            onClick={onGenerateReply}
            disabled={isGenerating}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 sm:px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:bg-indigo-800 disabled:cursor-not-allowed"
            >
            {isGenerating ? (
                <>
                <Spinner className="w-5 h-5 mr-3" />
                Generazione...
                </>
            ) : (
                <>
                <RefreshIcon className="w-5 h-5 mr-2" />
                {reply ? 'Rigenera Testo' : 'Genera Risposta'}
                </>
            )}
            </button>
            <button
            onClick={onGenerateAudio}
            disabled={!canGenerateAudio}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 sm:px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 disabled:bg-green-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            title={!reply ? "Devi prima generare una risposta testuale" : ""}
            >
             {isGeneratingAudio ? (
                <>
                <Spinner className="w-5 h-5 mr-3" />
                Creazione Audio...
                </>
            ) : (
                <>
                <MicrophoneIcon className="w-5 h-5 mr-2" />
                {generatedAudioBuffer ? 'Rigenera Audio' : 'Genera Audio'}
                </>
            )}
            </button>
        </div>
         <div className="flex">
            <button
                onClick={onReset}
                className="w-full inline-flex items-center justify-center px-4 py-3 sm:px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
                >
                <StartOverIcon className="w-5 h-5 mr-2" />
                Inizia da Capo
            </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;