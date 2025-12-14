import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, ReplyTone, ReplyLength, VoiceGender, SpeechSpeed, BackgroundSound, backgroundSoundUrls, AudioType, MeetingRecap } from './types';
import { transcribeAudio, generateWhatsAppFollowUp, generateReply, generateSpeech, generateSummary, generateKeyPoints, generateMeetingRecap, generateCleanTranscript } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audioUtils';
import { markdownToHtml, stripHtml, plainTextToHtml } from './utils/textUtils';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import Spinner from './components/Spinner';
import TypeSelector from './components/TypeSelector';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SELECTING_TYPE);
  const [audioType, setAudioType] = useState<AudioType | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // WhatsApp-specific state
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [reply, setReply] = useState<string>('');
  const [replyTone, setReplyTone] = useState<ReplyTone>(ReplyTone.Neutral);
  const [replyLength, setReplyLength] = useState<ReplyLength>(ReplyLength.Medium);
  const [recipientName, setRecipientName] = useState<string>('');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(VoiceGender.Female);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [generatedAudioBuffer, setGeneratedAudioBuffer] = useState<AudioBuffer | null>(null);
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>(SpeechSpeed.Normal);
  const [backgroundSound, setBackgroundSound] = useState<BackgroundSound>(BackgroundSound.None);

  // Other audio types state
  const [summary, setSummary] = useState<string>('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [cleanTranscript, setCleanTranscript] = useState<string>(''); // For calls
  const [meetingRecap, setMeetingRecap] = useState<MeetingRecap | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const speechSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const backgroundSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const backgroundGainNodeRef = useRef<GainNode | null>(null);
  const backgroundAudioBufferCache = useRef<Partial<Record<BackgroundSound, AudioBuffer>>>({});

  useEffect(() => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return () => {
        stopAllAudio();
        audioContextRef.current?.close().catch(console.error);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTypeSelect = (type: AudioType) => {
    setAudioType(type);
    setAppState(AppState.IDLE);
  }

  const stopAllAudio = useCallback(() => {
    if (speechSourceNodeRef.current) {
        try { speechSourceNodeRef.current.stop(); } catch (e) { /* Already stopped */ }
        speechSourceNodeRef.current.disconnect();
        speechSourceNodeRef.current = null;
    }
    if (backgroundSourceNodeRef.current) {
        try { backgroundSourceNodeRef.current.stop(); } catch (e) { /* Already stopped */ }
        backgroundSourceNodeRef.current.disconnect();
        backgroundSourceNodeRef.current = null;
    }
    if (backgroundGainNodeRef.current) {
        backgroundGainNodeRef.current.disconnect();
        backgroundGainNodeRef.current = null;
    }
}, []);

  const playAudioWithEffects = useCallback(async (speechBuffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    stopAllAudio();
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    if (backgroundSound !== BackgroundSound.None) {
      try {
        let buffer = backgroundAudioBufferCache.current[backgroundSound];
        if (!buffer) {
          const soundUrl = backgroundSoundUrls[backgroundSound];
          const response = await fetch(soundUrl);
          const arrayBuffer = await response.arrayBuffer();
          buffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          backgroundAudioBufferCache.current[backgroundSound] = buffer;
        }
        const backgroundSource = audioContextRef.current.createBufferSource();
        backgroundSource.buffer = buffer;
        backgroundSource.loop = true;
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 0.2;
        backgroundSource.connect(gainNode).connect(audioContextRef.current.destination);
        backgroundSource.start();
        backgroundSourceNodeRef.current = backgroundSource;
        backgroundGainNodeRef.current = gainNode;
      } catch (e) {
        console.error("Failed to load background sound:", e);
        setError("Impossibile caricare il suono di sottofondo.");
      }
    }
    const speechSource = audioContextRef.current.createBufferSource();
    speechSource.buffer = speechBuffer;
    speechSource.playbackRate.value = speechSpeed;
    speechSource.connect(audioContextRef.current.destination);
    speechSource.start();
    speechSourceNodeRef.current = speechSource;
    speechSource.onended = () => {
      if (speechSourceNodeRef.current === speechSource) {
          stopAllAudio();
      }
    };
  }, [backgroundSound, speechSpeed, stopAllAudio]);

  const resetState = useCallback(() => {
    setFile(null);
    setError('');
    setTranscription('');
    setFollowUpQuestions([]);
    setReply('');
    setGeneratedAudioBuffer(null);
    setSummary('');
    setKeyPoints([]);
    setCleanTranscript('');
    setMeetingRecap(null);
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return;

    resetState();
    setFile(selectedFile);
    setAppState(AppState.TRANSCRIBING);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        if (!base64Audio) {
            setError('Errore nella lettura del file. Riprova.');
            setAppState(AppState.ERROR);
            return;
        }
        
        try {
            const transcribedText = await transcribeAudio(base64Audio, selectedFile.type, audioType);
            setTranscription(markdownToHtml(transcribedText));

            if (audioType === AudioType.WhatsApp) {
                setAppState(AppState.ANALYZING);
                
                // Parallelly generate questions and a neutral draft reply
                const [questions, initialReply] = await Promise.all([
                  generateWhatsAppFollowUp(transcribedText),
                  generateReply(transcribedText, ReplyTone.Neutral, ReplyLength.Medium, '')
                ]);
                
                setFollowUpQuestions(questions);
                setReply(markdownToHtml(initialReply));
                setReplyTone(ReplyTone.Neutral); // Ensure default tone matches generated reply
            }
            
            setAppState(AppState.ANALYSIS_COMPLETE);

        } catch (e) {
            console.error(e);
            setError('Trascrizione o analisi fallita. Il modello potrebbe non supportare questo formato audio o si è verificato un errore API.');
            setAppState(AppState.ERROR);
        }
      };
      reader.onerror = () => {
        setError('Errore nella lettura del file. Riprova.');
        setAppState(AppState.ERROR);
      };
      reader.readAsDataURL(selectedFile);
    } catch (e) {
      console.error(e);
      setError('Si è verificato un errore imprevisto. Riprova.');
      setAppState(AppState.ERROR);
    }
  }, [audioType, resetState]);

  const handleGenerateReply = useCallback(async () => {
    if (!transcription) return;

    setAppState(AppState.GENERATING_REPLY);
    setReply('');
    setGeneratedAudioBuffer(null);
    setError('');

    try {
      const plainTextTranscription = stripHtml(transcription);
      const generatedText = await generateReply(plainTextTranscription, replyTone, replyLength, recipientName);
      setReply(markdownToHtml(generatedText));
    } catch (e) {
      console.error(e);
      setError('Generazione della risposta fallita. Riprova.');
    } finally {
      setAppState(AppState.ANALYSIS_COMPLETE);
    }
  }, [transcription, replyTone, replyLength, recipientName]);
  
  const handleGenerateSummary = async () => {
    if (!transcription) return;
    setAppState(AppState.ANALYZING);
    setError('');
    try {
        const plainText = stripHtml(transcription);
        const result = await generateSummary(plainText);
        setSummary(markdownToHtml(result));
    } catch (e) {
        console.error(e);
        setError('Analisi fallita. Riprova.');
    } finally {
        setAppState(AppState.ANALYSIS_COMPLETE);
    }
  };

  const handleGenerateKeyPoints = async () => {
    if (!transcription) return;
    setAppState(AppState.ANALYZING);
    setError('');
    try {
        const plainText = stripHtml(transcription);
        const result = await generateKeyPoints(plainText);
        setKeyPoints(result);
    } catch (e) {
        console.error(e);
        setError('Analisi fallita. Riprova.');
    } finally {
        setAppState(AppState.ANALYSIS_COMPLETE);
    }
  };

  const handleGenerateCleanTranscript = async () => {
    if (!transcription) return;
    setAppState(AppState.ANALYZING);
    setError('');
    try {
        const plainText = stripHtml(transcription);
        const result = await generateCleanTranscript(plainText);
        setCleanTranscript(markdownToHtml(result));
    } catch (e) {
        console.error(e);
        setError('Analisi fallita. Riprova.');
    } finally {
        setAppState(AppState.ANALYSIS_COMPLETE);
    }
  };
  
  const handleGenerateMeetingRecap = async () => {
      if (!transcription) return;
      setAppState(AppState.ANALYZING);
      setError('');
      try {
          const plainText = stripHtml(transcription);
          const result = await generateMeetingRecap(plainText);
          setMeetingRecap({
            summary: markdownToHtml(result.summary),
            decisions: result.decisions.map(d => markdownToHtml(d)),
            actionItems: result.actionItems.map(i => markdownToHtml(i)),
          });
      } catch (e) {
          console.error(e);
          setError('Analisi fallita. Riprova.');
      } finally {
          setAppState(AppState.ANALYSIS_COMPLETE);
      }
  };

  const handleGenerateAudio = useCallback(async () => {
    if (!reply || !audioContextRef.current) return;
    setIsGeneratingAudio(true);
    setError('');
    try {
      const plainTextReply = stripHtml(reply);
      const base64Audio = await generateSpeech(plainTextReply, voiceGender);
      const decodedBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
      setGeneratedAudioBuffer(audioBuffer);
      await playAudioWithEffects(audioBuffer);
    } catch(e) {
        console.error(e);
        setError('Generazione audio fallita. Riprova.');
    } finally {
        setIsGeneratingAudio(false);
    }
  }, [reply, voiceGender, playAudioWithEffects]);

  const handlePlayGeneratedAudio = useCallback(() => {
    if (generatedAudioBuffer) {
        playAudioWithEffects(generatedAudioBuffer);
    }
  }, [generatedAudioBuffer, playAudioWithEffects]);

  const handleReset = useCallback(() => {
    stopAllAudio();
    resetState();
    setAudioType(null);
    setAppState(AppState.SELECTING_TYPE);
    setReplyTone(ReplyTone.Neutral);
    setReplyLength(ReplyLength.Medium);
    setRecipientName('');
    setVoiceGender(VoiceGender.Female);
    setSpeechSpeed(SpeechSpeed.Normal);
    setBackgroundSound(BackgroundSound.None);
  }, [stopAllAudio, resetState]);

  const renderContent = () => {
    switch (appState) {
      case AppState.SELECTING_TYPE:
          return <TypeSelector onTypeSelect={handleTypeSelect} />
      case AppState.IDLE:
        return <FileUpload onFileSelect={handleFileSelect} />;
      case AppState.TRANSCRIBING:
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <Spinner />
            <p className="mt-4 text-lg text-stone-300 animate-pulse">Trascrizione in corso...</p>
            <p className="text-sm text-stone-500">{file?.name}</p>
          </div>
        );
      case AppState.ANALYZING:
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <Spinner />
            <p className="mt-4 text-lg text-stone-300 animate-pulse">Analisi e generazione contenuti...</p>
             <p className="text-sm text-stone-500">{file?.name}</p>
          </div>
        );
      case AppState.ANALYSIS_COMPLETE:
      case AppState.GENERATING_REPLY:
        if (audioType === null) {
            handleReset();
            return null;
        }
        return (
          <TranscriptionView
            fileName={file?.name || ''}
            transcription={transcription}
            onTranscriptionChange={setTranscription}
            isGenerating={appState === AppState.GENERATING_REPLY}
            onReset={handleReset}
            audioType={audioType}
            // WhatsApp
            followUpQuestions={followUpQuestions}
            reply={reply}
            onReplyChange={setReply}
            onGenerateReply={handleGenerateReply}
            replyTone={replyTone}
            onToneChange={setReplyTone}
            replyLength={replyLength}
            onLengthChange={setReplyLength}
            recipientName={recipientName}
            onRecipientNameChange={setRecipientName}
            onGenerateAudio={handleGenerateAudio}
            isGeneratingAudio={isGeneratingAudio}
            generatedAudioBuffer={generatedAudioBuffer}
            onPlayAudio={handlePlayGeneratedAudio}
            voiceGender={voiceGender}
            onVoiceGenderChange={setVoiceGender}
            speechSpeed={speechSpeed}
            onSpeedChange={setSpeechSpeed}
            backgroundSound={backgroundSound}
            onBackgroundSoundChange={setBackgroundSound}
            // Other types
            summary={summary}
            onGenerateSummary={handleGenerateSummary}
            keyPoints={keyPoints}
            onGenerateKeyPoints={handleGenerateKeyPoints}
            cleanTranscript={cleanTranscript}
            onGenerateCleanTranscript={handleGenerateCleanTranscript}
            meetingRecap={meetingRecap}
            onGenerateMeetingRecap={handleGenerateMeetingRecap}
          />
        );
      case AppState.ERROR:
        return (
          <div className="text-center bg-red-950/30 border border-red-800 p-6 sm:p-8 rounded-lg">
            <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-4">Oops! Qualcosa è andato storto.</h2>
            <p className="text-red-300/80 mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-stone-700 text-stone-100 font-semibold rounded-lg hover:bg-stone-600 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-opacity-75"
            >
              Riprova
            </button>
          </div>
        );
      default:
        return null;
    }
  };
  
  const getTitle = () => {
    if (appState === AppState.SELECTING_TYPE || audioType === null) {
        return "Assistente Audio AI";
    }
    switch (audioType) {
        case AudioType.WhatsApp: return "Assistente Audio WhatsApp";
        case AudioType.PersonalNote: return "Assistente Note Vocali";
        case AudioType.CallRecording: return "Analisi Chiamate";
        case AudioType.MeetingRecording: return "Analisi Riunioni";
        default: return "Assistente Audio AI";
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6 font-sans">
       <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-orange-300 to-amber-600 drop-shadow-sm">
                {getTitle()}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-stone-400 font-medium tracking-wide">
                {appState === AppState.SELECTING_TYPE 
                    ? "Scegli il tipo di audio da analizzare per iniziare."
                    : "Trascrivi, analizza e genera contenuti intelligenti."
                }
            </p>
        </header>
        <main className="bg-stone-900/80 backdrop-blur-md p-4 sm:p-8 rounded-2xl shadow-2xl border border-stone-800 min-h-[300px] flex items-center justify-center relative overflow-hidden">
             {/* Decorative soft glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-800/30 to-transparent"></div>
            {renderContent()}
        </main>
        <footer className="text-center mt-8 text-xs sm:text-sm text-stone-600">
            <p>Realizzato con Gemini API</p>
        </footer>
       </div>
    </div>
  );
};

export default App;