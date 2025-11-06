import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, ReplyTone, ReplyLength, VoiceGender } from './types';
import { transcribeAudio, generateReply, generateSpeech } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audioUtils';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [reply, setReply] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [replyTone, setReplyTone] = useState<ReplyTone>(ReplyTone.Neutral);
  const [replyLength, setReplyLength] = useState<ReplyLength>(ReplyLength.Medium);
  const [recipientName, setRecipientName] = useState<string>('');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(VoiceGender.Female);

  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [generatedAudioBuffer, setGeneratedAudioBuffer] = useState<AudioBuffer | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on user interaction (or here, lazily)
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setTranscription('');
    setReply('');
    setGeneratedAudioBuffer(null);
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
            const transcribedText = await transcribeAudio(base64Audio, selectedFile.type);
            setTranscription(transcribedText);
            setAppState(AppState.TRANSCRIBED);
        } catch (e) {
            console.error(e);
            setError('Trascrizione fallita. Il modello potrebbe non supportare questo formato audio o si è verificato un errore API.');
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
  }, []);

  const handleGenerateReply = useCallback(async () => {
    if (!transcription) return;

    setAppState(AppState.GENERATING_REPLY);
    setReply('');
    setGeneratedAudioBuffer(null);
    setError('');

    try {
      const generatedText = await generateReply(transcription, replyTone, replyLength, recipientName);
      setReply(generatedText);
    } catch (e) {
      console.error(e);
      setError('Generazione della risposta fallita. Riprova.');
    } finally {
      setAppState(AppState.TRANSCRIBED);
    }
  }, [transcription, replyTone, replyLength, recipientName]);

  const playAudioBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  const handleGenerateAudio = useCallback(async () => {
    if (!reply || !audioContextRef.current) return;

    setIsGeneratingAudio(true);
    setError('');
    setGeneratedAudioBuffer(null);
    
    try {
      const base64Audio = await generateSpeech(reply, voiceGender);
      const decodedBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
      
      setGeneratedAudioBuffer(audioBuffer);
      playAudioBuffer(audioBuffer); // Autoplay on generation

    } catch(e) {
        console.error(e);
        setError('Generazione audio fallita. Riprova.');
    } finally {
        setIsGeneratingAudio(false);
    }
  }, [reply, voiceGender]);

  const handlePlayGeneratedAudio = useCallback(() => {
    if (generatedAudioBuffer) {
        playAudioBuffer(generatedAudioBuffer);
    }
  }, [generatedAudioBuffer]);

  const handleReset = useCallback(() => {
    setAppState(AppState.IDLE);
    setFile(null);
    setTranscription('');
    setReply('');
    setError('');
    setReplyTone(ReplyTone.Neutral);
    setReplyLength(ReplyLength.Medium);
    setRecipientName('');
    setGeneratedAudioBuffer(null);
    setVoiceGender(VoiceGender.Female);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.IDLE:
        return <FileUpload onFileSelect={handleFileSelect} />;
      case AppState.TRANSCRIBING:
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <Spinner />
            <p className="mt-4 text-lg text-gray-300 animate-pulse">Trascrizione in corso...</p>
            <p className="text-sm text-gray-500">{file?.name}</p>
          </div>
        );
      case AppState.TRANSCRIBED:
      case AppState.GENERATING_REPLY:
        return (
          <TranscriptionView
            fileName={file?.name || ''}
            transcription={transcription}
            reply={reply}
            isGenerating={appState === AppState.GENERATING_REPLY}
            onGenerateReply={handleGenerateReply}
            onReset={handleReset}
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
          />
        );
      case AppState.ERROR:
        return (
          <div className="text-center bg-red-900/20 border border-red-500 p-6 sm:p-8 rounded-lg">
            <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-4">Oops! Qualcosa è andato storto.</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
            >
              Riprova
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6">
       <div className="w-full max-w-3xl mx-auto">
        <header className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                Assistente Audio WhatsApp
            </h1>
            <p className="mt-2 text-base sm:text-lg text-gray-400">
                Trascrivi, rispondi e genera audio per i tuoi messaggi vocali.
            </p>
        </header>
        <main className="bg-gray-800/50 backdrop-blur-sm p-4 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
            {renderContent()}
        </main>
        <footer className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500">
            <p>Realizzato con React, Tailwind CSS e Gemini API</p>
        </footer>
       </div>
    </div>
  );
};

export default App;