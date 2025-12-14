import React, { useState } from 'react';
import Spinner from './Spinner';
import { RefreshIcon, StartOverIcon, FileAudioIcon, MicrophoneIcon, PlayIcon, QuestionMarkCircleIcon, DownloadIcon, NoteIcon, PhoneIcon, MeetingIcon } from './icons';
import { ReplyTone, ReplyLength, VoiceGender, SpeechSpeed, BackgroundSound, AudioType, MeetingRecap } from '../types';
import RichTextArea from './RichTextArea';
import { downloadText, stripHtml } from '../utils/textUtils';

interface TranscriptionViewProps {
  fileName: string;
  transcription: string;
  onTranscriptionChange: (newTranscription: string) => void;
  isGenerating: boolean;
  onReset: () => void;
  audioType: AudioType;
  
  // WhatsApp props
  followUpQuestions: string[];
  reply: string;
  onReplyChange: (newReply: string) => void;
  onGenerateReply: () => void;
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
  speechSpeed: SpeechSpeed;
  onSpeedChange: (speed: SpeechSpeed) => void;
  backgroundSound: BackgroundSound;
  onBackgroundSoundChange: (sound: BackgroundSound) => void;

  // Other types props
  summary: string;
  onGenerateSummary: () => void;
  keyPoints: string[];
  onGenerateKeyPoints: () => void;
  cleanTranscript: string;
  onGenerateCleanTranscript: () => void;
  meetingRecap: MeetingRecap | null;
  onGenerateMeetingRecap: () => void;
}

const SettingSelect: React.FC<{
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
}> = ({ label, value, onChange, children }) => (
    <div className="flex flex-col space-y-1.5">
        <label className="text-xs uppercase tracking-wider font-bold text-stone-500">{label}</label>
        <div className="relative">
            <select 
                value={value} 
                onChange={onChange}
                className="w-full appearance-none bg-stone-800 border border-stone-700 text-stone-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 block transition-colors cursor-pointer hover:bg-stone-750"
            >
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    </div>
);

const ActionButton: React.FC<{
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
    icon: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'green';
}> = ({ onClick, disabled, children, icon, variant = 'primary' }) => {
    let baseClasses = "flex-1 inline-flex items-center justify-center px-4 py-3 sm:px-6 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]";
    let colorClasses = "";

    if (variant === 'primary') {
        colorClasses = "bg-amber-600 text-white hover:bg-amber-500 focus:ring-amber-400 disabled:bg-stone-700";
    } else if (variant === 'green') {
        colorClasses = "bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-400 disabled:bg-stone-700";
    } else {
        colorClasses = "bg-stone-700 text-stone-200 hover:bg-stone-600 focus:ring-stone-500";
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${colorClasses}`}
        >
            {disabled ? (
                <>
                <Spinner className="w-5 h-5 mr-3 text-current" />
                Elaborazione...
                </>
            ) : (
                <>
                {icon}
                {children}
                </>
            )}
        </button>
    );
};


const TranscriptionView: React.FC<TranscriptionViewProps> = (props) => {
  const {
    fileName, transcription, onTranscriptionChange, isGenerating, onReset, audioType,
    followUpQuestions, reply, onReplyChange, onGenerateReply, replyTone, onToneChange,
    replyLength, onLengthChange, recipientName, onRecipientNameChange, onGenerateAudio,
    isGeneratingAudio, generatedAudioBuffer, onPlayAudio, voiceGender, onVoiceGenderChange,
    speechSpeed, onSpeedChange, backgroundSound, onBackgroundSoundChange,
    summary, onGenerateSummary, keyPoints, onGenerateKeyPoints, cleanTranscript, onGenerateCleanTranscript, meetingRecap, onGenerateMeetingRecap
  } = props;

  // Local state for tab switching in WhatsApp view and Call view
  const [activeTab, setActiveTab] = useState<'content' | 'audio'>('content');
  const [activeCallTab, setActiveCallTab] = useState<'keyPoints' | 'transcript'>('keyPoints');

  const renderWhatsAppContent = () => {
    const canGenerateAudio = !!reply && !isGeneratingAudio;

    return (
        <div className="space-y-6 w-full">
            {followUpQuestions && followUpQuestions.length > 0 && (
                <div className="animate-fade-in bg-stone-800/40 border border-stone-800 p-4 rounded-xl">
                    <div className="flex items-center mb-3">
                        <QuestionMarkCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 text-amber-500" />
                        <h2 className="text-base font-bold text-stone-200 uppercase tracking-wide">Domande Suggerite</h2>
                    </div>
                    <ul className="list-disc list-inside text-stone-400 text-sm space-y-1.5 ml-1">
                    {followUpQuestions.map((question, index) => (
                        <li key={index} className="leading-relaxed">{question}</li>
                    ))}
                    </ul>
                </div>
            )}
            
            {reply && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-end mb-2">
                         <div className="flex items-center gap-2">
                             <h2 className="text-lg font-bold text-emerald-400 tracking-tight">Risposta</h2>
                             {generatedAudioBuffer && (
                                <span className="flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-900/50 text-emerald-400 border border-emerald-800">
                                    Audio Pronto
                                </span>
                             )}
                         </div>
                        <div className="flex space-x-2">
                             <button
                                onClick={() => downloadText(stripHtml(reply), `${fileName.split('.')[0]}_risposta.txt`)}
                                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-800 hover:text-stone-200 transition-colors"
                                title="Scarica risposta"
                             >
                                <DownloadIcon className="w-4 h-4" />
                            </button>
                             {generatedAudioBuffer && (
                                <button 
                                    onClick={onPlayAudio} 
                                    className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-900/30 transition-colors"
                                    title="Riproduci audio"
                                >
                                    <PlayIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <RichTextArea
                        value={reply}
                        onChange={onReplyChange}
                        placeholder="Modifica la risposta qui..."
                        aria-label="Risposta suggerita modificabile"
                    />
                </div>
            )}

            {/* Settings Panel - Clean & Tabbed */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
                {/* Tabs */}
                <div className="flex border-b border-stone-800">
                    <button 
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'content' ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}
                    >
                        Impostazioni Testo
                    </button>
                    <button 
                         onClick={() => setActiveTab('audio')}
                         className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'audio' ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}
                    >
                        Impostazioni Audio
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-5">
                    {activeTab === 'content' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                            <SettingSelect 
                                label="Tono" 
                                value={replyTone} 
                                onChange={(e) => onToneChange(e.target.value as ReplyTone)}
                            >
                                <option value={ReplyTone.Neutral}>Neutro</option>
                                <option value={ReplyTone.Agree}>Concorde</option>
                                <option value={ReplyTone.Disagree}>Discorde</option>
                            </SettingSelect>

                            <SettingSelect 
                                label="Lunghezza" 
                                value={replyLength} 
                                onChange={(e) => onLengthChange(e.target.value as ReplyLength)}
                            >
                                <option value={ReplyLength.Short}>Breve</option>
                                <option value={ReplyLength.Medium}>Media</option>
                                <option value={ReplyLength.Long}>Lunga</option>
                            </SettingSelect>

                            <div className="flex flex-col space-y-1.5">
                                <label className="text-xs uppercase tracking-wider font-bold text-stone-500">Mittente (Opz.)</label>
                                <input 
                                    type="text"
                                    value={recipientName}
                                    onChange={(e) => onRecipientNameChange(e.target.value)}
                                    placeholder="Es: Mario"
                                    className="w-full bg-stone-800 border border-stone-700 text-stone-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder-stone-600 transition-colors"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                             <SettingSelect 
                                label="Voce" 
                                value={voiceGender} 
                                onChange={(e) => onVoiceGenderChange(e.target.value as VoiceGender)}
                            >
                                <option value={VoiceGender.Female}>Donna</option>
                                <option value={VoiceGender.Male}>Uomo</option>
                            </SettingSelect>

                            <SettingSelect 
                                label="Velocità" 
                                value={speechSpeed} 
                                onChange={(e) => onSpeedChange(parseFloat(e.target.value) as SpeechSpeed)}
                            >
                                <option value={SpeechSpeed.Slow}>Lenta (0.85x)</option>
                                <option value={SpeechSpeed.Normal}>Normale (1.0x)</option>
                                <option value={SpeechSpeed.Fast}>Veloce (1.15x)</option>
                            </SettingSelect>

                            <SettingSelect 
                                label="Sottofondo" 
                                value={backgroundSound} 
                                onChange={(e) => onBackgroundSoundChange(e.target.value as BackgroundSound)}
                            >
                                <option value={BackgroundSound.None}>Nessuno</option>
                                <option value={BackgroundSound.Cafe}>Caffetteria</option>
                                <option value={BackgroundSound.Rain}>Pioggia</option>
                            </SettingSelect>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <ActionButton onClick={onGenerateReply} disabled={isGenerating} icon={<RefreshIcon className="w-5 h-5 mr-2" />} variant="primary">
                    {reply ? 'Rigenera Risposta' : 'Genera Risposta'}
                </ActionButton>
                <ActionButton 
                    onClick={onGenerateAudio} 
                    disabled={!canGenerateAudio} 
                    icon={<MicrophoneIcon className="w-5 h-5 mr-2" />}
                    variant="green"
                >
                    {isGeneratingAudio ? 'Creazione Audio...' : (generatedAudioBuffer ? 'Rigenera Audio' : 'Genera Audio')}
                </ActionButton>
            </div>
        </div>
    );
  }

  const renderAnalysisContent = (title: string, icon: React.ReactNode, onGenerate: () => void, result: React.ReactNode, buttonText: string) => (
      <div className="space-y-6 w-full">
          {result}
          <div className="pt-4 border-t border-stone-800">
              <ActionButton onClick={onGenerate} disabled={isGenerating} icon={icon} variant="primary">
                  {buttonText}
              </ActionButton>
          </div>
      </div>
  );
  
  const FormattedContent: React.FC<{html: string}> = ({html}) => (
      <div className="bg-stone-900/50 p-4 rounded-xl text-stone-300 prose prose-invert prose-stone prose-sm sm:prose-base max-w-none border border-stone-800/50" dangerouslySetInnerHTML={{ __html: html }} />
  );

  const FormattedList: React.FC<{items: string[]}> = ({items}) => (
      <div className="bg-stone-900/50 p-4 rounded-xl border border-stone-800/50">
          <ul className="list-disc list-inside text-stone-300 text-sm sm:text-base space-y-2">
              {items.map((item, index) => <li key={index} dangerouslySetInnerHTML={{ __html: item }} />)}
          </ul>
      </div>
  );

  const renderCallContent = () => {
      return (
          <div className="space-y-6 w-full">
              <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
                  {/* Tabs */}
                  <div className="flex border-b border-stone-800">
                      <button 
                          onClick={() => setActiveCallTab('keyPoints')}
                          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeCallTab === 'keyPoints' ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}
                      >
                          Punti Salienti
                      </button>
                      <button 
                          onClick={() => setActiveCallTab('transcript')}
                          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeCallTab === 'transcript' ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}`}
                      >
                          Trascrizione Completa
                      </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-5">
                      {activeCallTab === 'keyPoints' ? (
                          <div className="animate-fade-in">
                              {keyPoints.length > 0 ? (
                                  <div className="space-y-2">
                                       <div className="flex justify-between items-center mb-2">
                                          <h2 className="text-lg font-bold text-amber-500">Sintesi</h2>
                                          <button
                                              onClick={() => {
                                                  const content = keyPoints.map(p => `• ${stripHtml(p)}`).join('\n\n');
                                                  downloadText(content, `${fileName.split('.')[0]}_punti_salienti.txt`);
                                              }}
                                              className="p-2 rounded-lg text-stone-500 hover:bg-stone-800 hover:text-stone-200 transition-colors"
                                              title="Scarica Punti Salienti"
                                          >
                                              <DownloadIcon className="w-5 h-5" />
                                          </button>
                                      </div>
                                      <FormattedList items={keyPoints} />
                                  </div>
                              ) : (
                                  <div className="text-center text-stone-500 py-8 italic">
                                      Nessun punto saliente generato ancora.
                                  </div>
                              )}
                              <div className="mt-4">
                                  <ActionButton onClick={onGenerateKeyPoints} disabled={isGenerating} icon={<PhoneIcon className="w-5 h-5 mr-2"/>} variant="primary">
                                      {keyPoints.length > 0 ? 'Rigenera Punti Salienti' : 'Estrai Punti Salienti'}
                                  </ActionButton>
                              </div>
                          </div>
                      ) : (
                          <div className="animate-fade-in">
                              {cleanTranscript ? (
                                  <div className="space-y-2">
                                      <div className="flex justify-between items-center mb-2">
                                          <h2 className="text-lg font-bold text-amber-500">Trascrizione Pulita</h2>
                                           <button
                                              onClick={() => downloadText(stripHtml(cleanTranscript), `${fileName.split('.')[0]}_copione.txt`)}
                                              className="p-2 rounded-lg text-stone-500 hover:bg-stone-800 hover:text-stone-200 transition-colors"
                                              title="Scarica Copione"
                                          >
                                              <DownloadIcon className="w-5 h-5" />
                                          </button>
                                      </div>
                                      <FormattedContent html={cleanTranscript} />
                                  </div>
                              ) : (
                                   <div className="text-center text-stone-500 py-8 italic">
                                      Nessuna trascrizione pulita generata.
                                  </div>
                              )}
                              <div className="mt-4">
                                  <ActionButton onClick={onGenerateCleanTranscript} disabled={isGenerating} icon={<NoteIcon className="w-5 h-5 mr-2"/>} variant="primary">
                                      {cleanTranscript ? 'Rigenera Copione' : 'Genera Copione Completo'}
                                  </ActionButton>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  const renderContent = () => {
    switch (audioType) {
        case AudioType.WhatsApp:
            return renderWhatsAppContent();
        case AudioType.PersonalNote:
            return renderAnalysisContent(
                "Riassunto Nota",
                <NoteIcon className="w-5 h-5 mr-2"/>,
                onGenerateSummary,
                summary ? (
                    <div className="animate-fade-in space-y-2">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-amber-500">Riassunto</h2>
                            <button
                                onClick={() => downloadText(stripHtml(summary), `${fileName.split('.')[0]}_riassunto.txt`)}
                                className="p-2 rounded-lg text-stone-500 hover:bg-stone-800 hover:text-stone-200 transition-colors"
                            >
                                <DownloadIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <FormattedContent html={summary} />
                    </div>
                ) : null,
                "Genera Riassunto"
            );
        case AudioType.CallRecording:
            return renderCallContent();
        case AudioType.MeetingRecording:
             return renderAnalysisContent(
                "Riepilogo Riunione",
                <MeetingIcon className="w-5 h-5 mr-2"/>,
                onGenerateMeetingRecap,
                meetingRecap ? (
                    <div className="space-y-6 animate-fade-in">
                         <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-amber-500">Riassunto</h2>
                                <button
                                    onClick={() => downloadText(stripHtml(meetingRecap.summary), `${fileName.split('.')[0]}_riassunto_riunione.txt`)}
                                    className="p-2 rounded-lg text-stone-500 hover:bg-stone-800 hover:text-stone-200 transition-colors"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <FormattedContent html={meetingRecap.summary} />
                         </div>
                         {meetingRecap.decisions?.length > 0 && <div className="space-y-2">
                             <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-amber-500">Decisioni Prese</h2>
                                <button
                                    onClick={() => {
                                        const content = meetingRecap.decisions.map(d => `• ${stripHtml(d)}`).join('\n\n');
                                        downloadText(content, `${fileName.split('.')[0]}_decisioni_riunione.txt`);
                                    }}
                                    className="p-2 rounded-lg text-stone-500 hover:bg-stone-800 hover:text-stone-200 transition-colors"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <FormattedList items={meetingRecap.decisions} />
                         </div>}
                         {meetingRecap.actionItems?.length > 0 && <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-amber-500">Azioni da Intraprendere</h2>
                                <button
                                    onClick={() => {
                                        const content = meetingRecap.actionItems.map(i => `• ${stripHtml(i)}`).join('\n\n');
                                        downloadText(content, `${fileName.split('.')[0]}_azioni_riunione.txt`);
                                    }}
                                    className="p-2 rounded-lg text-stone-500 hover:bg-stone-800 hover:text-stone-200 transition-colors"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <FormattedList items={meetingRecap.actionItems} />
                         </div>}
                    </div>
                ) : null,
                "Genera Riepilogo Riunione"
            );
        default:
            return null;
    }
  }


  return (
    <div className="flex flex-col space-y-6 w-full max-w-4xl mx-auto">
      <div className="bg-stone-900/50 p-4 rounded-xl border border-stone-800/50">
        <div className="flex items-center text-stone-500 mb-3 truncate">
            <FileAudioIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="font-mono text-sm truncate tracking-wide">{fileName}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-stone-200">Trascrizione Originale</h2>
            {transcription && (
                <button
                    onClick={() => downloadText(stripHtml(transcription), `${fileName.split('.')[0]}_trascrizione.txt`)}
                    className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-800 hover:text-stone-200 transition-colors"
                    title="Scarica trascrizione"
                >
                    <DownloadIcon className="w-5 h-5" />
                </button>
            )}
        </div>
        <RichTextArea 
            value={transcription}
            onChange={onTranscriptionChange}
            placeholder="La trascrizione apparirà qui..."
            aria-label="Trascrizione modificabile"
        />
      </div>
      
      {renderContent()}

      <div className="pt-8 border-t border-stone-800/50 flex justify-center">
        <button
            onClick={onReset}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-transparent border border-stone-700 text-stone-400 font-medium rounded-lg hover:bg-stone-800 hover:text-stone-200 transition-all focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-opacity-50 text-sm"
            >
            <StartOverIcon className="w-4 h-4 mr-2" />
            Torna alla Home
        </button>
      </div>
    </div>
  );
};

export default TranscriptionView;