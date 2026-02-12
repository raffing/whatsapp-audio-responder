
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, ReplyTone, ReplyLength, VoiceGender, SpeechSpeed, BackgroundSound, backgroundSoundUrls, AudioType, MeetingRecap, BatchMode, AudioResult } from './types';
import { transcribeAudio, generateWhatsAppFollowUp, generateReply, generateSpeech, generateSummary, generateKeyPoints, generateMeetingRecap, generateCleanTranscript, AudioInput } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audioUtils';
import { markdownToHtml, stripHtml } from './utils/textUtils';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import TypeSelector from './components/TypeSelector';
import ProgressStatus from './components/ProgressStatus';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SELECTING_TYPE);
  const [audioType, setAudioType] = useState<AudioType | null>(null);
  
  const [results, setResults] = useState<AudioResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  
  // Audio state common for the currently selected result
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(VoiceGender.Female);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [generatedAudioBuffer, setGeneratedAudioBuffer] = useState<AudioBuffer | null>(null);
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>(SpeechSpeed.Normal);
  const [backgroundSound, setBackgroundSound] = useState<BackgroundSound>(BackgroundSound.None);

  const audioContextRef = useRef<AudioContext | null>(null);
  const speechSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return () => {
        stopAllAudio();
        audioContextRef.current?.close().catch(console.error);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const startProgressSimulation = (maxProgress: number = 90, duration: number = 15000) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setProgress(0);
    const startTime = Date.now();
    progressIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const ratio = Math.min(elapsed / duration, 1);
        const currentProgress = Math.floor(maxProgress * (1 - Math.pow(1 - ratio, 2)));
        setProgress(currentProgress);
        if (ratio >= 1 && progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }, 100);
  };

  const completeProgress = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setProgress(100);
    setTimeout(() => setProgress(0), 500);
  };

  const stopAllAudio = useCallback(() => {
    if (speechSourceNodeRef.current) {
        try { speechSourceNodeRef.current.stop(); } catch (e) {}
        speechSourceNodeRef.current.disconnect();
        speechSourceNodeRef.current = null;
    }
  }, []);

  const playAudioWithEffects = useCallback(async (speechBuffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    stopAllAudio();
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    
    const speechSource = audioContextRef.current.createBufferSource();
    speechSource.buffer = speechBuffer;
    speechSource.playbackRate.value = speechSpeed;
    speechSource.connect(audioContextRef.current.destination);
    speechSource.start();
    speechSourceNodeRef.current = speechSource;
  }, [speechSpeed, stopAllAudio]);

  const resetState = useCallback(() => {
    setResults([]);
    setCurrentIndex(0);
    setError('');
    setGeneratedAudioBuffer(null);
    setProgress(0);
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File, type: AudioType): Promise<AudioResult> => {
    const base64 = await fileToBase64(file);
    const transcription = await transcribeAudio([{ base64Data: base64, mimeType: file.type }], type);
    
    let followUp: string[] = [];
    let initialReply: string = '';
    
    if (type === AudioType.WhatsApp) {
        followUp = await generateWhatsAppFollowUp(transcription);
        initialReply = await generateReply(transcription, ReplyTone.Neutral, ReplyLength.Medium, '');
    }

    return {
        id: Math.random().toString(36).substr(2, 9),
        fileName: file.name,
        transcription: markdownToHtml(transcription),
        followUpQuestions: followUp,
        reply: markdownToHtml(initialReply),
        summary: '',
        keyPoints: [],
        cleanTranscript: '',
        meetingRecap: null
    };
  };

  const handleFilesSelect = useCallback(async (selectedFiles: File[], mode: BatchMode) => {
    if (selectedFiles.length === 0) return;
    resetState();
    setAppState(AppState.TRANSCRIBING);
    
    try {
      if (mode === BatchMode.Sequential) {
        // Mode Successive: One big transcription
        startProgressSimulation(95, 25000);
        const inputs: AudioInput[] = await Promise.all(selectedFiles.map(async f => ({
            base64Data: await fileToBase64(f),
            mimeType: f.type
        })));
        
        const transcribedText = await transcribeAudio(inputs, audioType);
        const res = await processFile(new File([new Blob()], "Sessione Unificata"), audioType!);
        res.transcription = markdownToHtml(transcribedText);
        res.fileName = "Sessione Unificata (" + selectedFiles.length + " file)";
        
        setResults([res]);
        completeProgress();
        setAppState(AppState.ANALYSIS_COMPLETE);
      } else {
        // Mode Independent: Process one by one
        const processedResults: AudioResult[] = [];
        for (let i = 0; i < selectedFiles.length; i++) {
            setProgress(Math.floor((i / selectedFiles.length) * 100));
            const res = await processFile(selectedFiles[i], audioType!);
            processedResults.push(res);
            setResults([...processedResults]);
        }
        completeProgress();
        setAppState(AppState.ANALYSIS_COMPLETE);
      }
    } catch (e) {
      console.error(e);
      setError('Si è verificato un errore durante l\'elaborazione batch.');
      setAppState(AppState.ERROR);
    }
  }, [audioType, resetState]);

  // Handler helpers for specific results
  const updateCurrentResult = (updater: (res: AudioResult) => AudioResult) => {
      setResults(prev => {
          const newResults = [...prev];
          newResults[currentIndex] = updater(newResults[currentIndex]);
          return newResults;
      });
  };

  const handleGenerateReply = async () => {
    const current = results[currentIndex];
    setAppState(AppState.GENERATING_REPLY);
    startProgressSimulation(90, 8000);
    try {
      const generatedText = await generateReply(stripHtml(current.transcription), ReplyTone.Neutral, ReplyLength.Medium, '');
      updateCurrentResult(r => ({ ...r, reply: markdownToHtml(generatedText) }));
      completeProgress();
    } catch (e) { setError('Generazione fallita.'); }
    finally { setAppState(AppState.ANALYSIS_COMPLETE); }
  };

  const handleGenerateSummary = async () => {
    const current = results[currentIndex];
    setAppState(AppState.ANALYZING);
    startProgressSimulation(90, 8000);
    try {
        const result = await generateSummary(stripHtml(current.transcription));
        updateCurrentResult(r => ({ ...r, summary: markdownToHtml(result) }));
        completeProgress();
    } catch (e) { setError('Analisi fallita.'); }
    finally { setAppState(AppState.ANALYSIS_COMPLETE); }
  };

  const handleGenerateMeetingRecap = async () => {
      const current = results[currentIndex];
      setAppState(AppState.ANALYZING);
      startProgressSimulation(90, 12000);
      try {
          const result = await generateMeetingRecap(stripHtml(current.transcription));
          updateCurrentResult(r => ({ ...r, meetingRecap: {
            summary: markdownToHtml(result.summary),
            decisions: result.decisions.map(d => markdownToHtml(d)),
            actionItems: result.actionItems.map(i => markdownToHtml(i)),
          }}));
          completeProgress();
      } catch (e) { setError('Analisi fallita.'); }
      finally { setAppState(AppState.ANALYSIS_COMPLETE); }
  };

  const handleGenerateAudio = async () => {
    const current = results[currentIndex];
    if (!current.reply || !audioContextRef.current) return;
    setIsGeneratingAudio(true);
    try {
      const base64Audio = await generateSpeech(stripHtml(current.reply), voiceGender);
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
      setGeneratedAudioBuffer(audioBuffer);
      await playAudioWithEffects(audioBuffer);
    } catch(e) { setError('Generazione audio fallita.'); }
    finally { setIsGeneratingAudio(false); }
  };

  const handleReset = useCallback(() => {
    stopAllAudio();
    resetState();
    setAudioType(null);
    setAppState(AppState.SELECTING_TYPE);
  }, [stopAllAudio, resetState]);

  const renderContent = () => {
    switch (appState) {
      case AppState.SELECTING_TYPE: return <TypeSelector onTypeSelect={(t) => { setAudioType(t); setAppState(AppState.IDLE); }} />;
      case AppState.IDLE: return <FileUpload onFilesSelect={handleFilesSelect} />;
      case AppState.TRANSCRIBING: return <ProgressStatus progress={progress} label="Elaborazione Batch..." sublabel={`File ${results.length + 1}`} />;
      case AppState.ANALYZING: return <ProgressStatus progress={progress} label="Analisi dei contenuti..." />;
      case AppState.ANALYSIS_COMPLETE:
      case AppState.GENERATING_REPLY:
        if (results.length === 0) return null;
        const current = results[currentIndex];
        return (
          <div className="w-full flex flex-col space-y-4">
             {results.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {results.map((res, idx) => (
                        <button
                            key={res.id}
                            onClick={() => { setCurrentIndex(idx); setGeneratedAudioBuffer(null); }}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${currentIndex === idx ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}
                        >
                            {idx + 1}. {res.fileName.length > 15 ? res.fileName.substring(0, 15) + '...' : res.fileName}
                        </button>
                    ))}
                </div>
             )}
             <TranscriptionView
                fileName={current.fileName}
                transcription={current.transcription}
                onTranscriptionChange={(v) => updateCurrentResult(r => ({...r, transcription: v}))}
                isGenerating={appState === AppState.GENERATING_REPLY}
                onReset={handleReset}
                audioType={audioType!}
                followUpQuestions={current.followUpQuestions}
                reply={current.reply}
                onReplyChange={(v) => updateCurrentResult(r => ({...r, reply: v}))}
                onGenerateReply={handleGenerateReply}
                replyTone={ReplyTone.Neutral}
                onToneChange={() => {}}
                replyLength={ReplyLength.Medium}
                onLengthChange={() => {}}
                recipientName=""
                onRecipientNameChange={() => {}}
                onGenerateAudio={handleGenerateAudio}
                isGeneratingAudio={isGeneratingAudio}
                generatedAudioBuffer={generatedAudioBuffer}
                onPlayAudio={() => generatedAudioBuffer && playAudioWithEffects(generatedAudioBuffer)}
                voiceGender={voiceGender}
                onVoiceGenderChange={setVoiceGender}
                speechSpeed={speechSpeed}
                onSpeedChange={setSpeechSpeed}
                backgroundSound={backgroundSound}
                onBackgroundSoundChange={setBackgroundSound}
                summary={current.summary}
                onGenerateSummary={handleGenerateSummary}
                keyPoints={current.keyPoints}
                onGenerateKeyPoints={() => {}}
                cleanTranscript={current.cleanTranscript}
                onGenerateCleanTranscript={() => {}}
                meetingRecap={current.meetingRecap}
                onGenerateMeetingRecap={handleGenerateMeetingRecap}
            />
          </div>
        );
      case AppState.ERROR:
        return (
          <div className="text-center p-8 bg-red-950/20 border border-red-900/50 rounded-2xl">
            <h2 className="text-xl font-bold text-red-400 mb-2">Errore Batch</h2>
            <p className="text-red-300/70 mb-6">{error}</p>
            <button onClick={handleReset} className="px-6 py-2 bg-stone-800 text-white rounded-lg">Riprova</button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6 font-sans">
       <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-orange-300 to-amber-600">
                Assistente Audio AI
            </h1>
            <p className="mt-3 text-stone-400 font-medium">Potenziato dall'Intelligenza Artificiale per i tuoi audio</p>
        </header>
        <main className="bg-stone-900/80 backdrop-blur-md p-4 sm:p-8 rounded-2xl shadow-2xl border border-stone-800 min-h-[400px] flex items-center justify-center relative overflow-hidden">
            {renderContent()}
        </main>
       </div>
    </div>
  );
};

export default App;
