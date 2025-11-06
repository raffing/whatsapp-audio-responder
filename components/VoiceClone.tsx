import React, { useState, useRef, useCallback } from 'react';
import { saveClonedVoice } from '../services/voiceService';
import { MicrophoneIcon, StopIcon, SaveIcon } from './icons';

interface VoiceCloneProps {
  onCloningComplete: () => void;
}

const VoiceClone: React.FC<VoiceCloneProps> = ({ onCloningComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = useCallback(async () => {
    setError('');
    setRecordedAudioUrl(null);
    setRecordedAudioBlob(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Il tuo browser non supporta la registrazione audio.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError('Accesso al microfono negato. Per favore, abilita i permessi nel tuo browser.');
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleSaveVoice = useCallback(async () => {
    if (!recordedAudioBlob) return;
    try {
      await saveClonedVoice(recordedAudioBlob);
      alert('Voce salvata con successo!');
      onCloningComplete();
    } catch (err) {
      console.error("Error saving voice:", err);
      setError('Impossibile salvare la voce. Assicurati di avere abbastanza spazio.');
    }
  }, [recordedAudioBlob, onCloningComplete]);
  
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4 text-indigo-300">Crea la tua Impronta Vocale</h2>
      <p className="text-gray-400 mb-6">Registra una breve frase per permetterci di generare audio. La tua voce è salvata solo su questo dispositivo.</p>
      
      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="flex flex-col items-center space-y-4">
        {!isRecording ? (
          <button onClick={handleStartRecording} className="flex items-center justify-center w-24 h-24 bg-green-600 rounded-full text-white hover:bg-green-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50">
            <MicrophoneIcon className="w-10 h-10" />
          </button>
        ) : (
          <button onClick={handleStopRecording} className="flex items-center justify-center w-24 h-24 bg-red-600 rounded-full text-white hover:bg-red-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-400 focus:ring-opacity-50 animate-pulse">
            <StopIcon className="w-10 h-10" />
          </button>
        )}
        <p className="text-lg font-semibold">{isRecording ? "Registrazione in corso..." : "Clicca per registrare"}</p>
      </div>

      {recordedAudioUrl && (
        <div className="mt-8 animate-fade-in">
          <h3 className="text-lg font-semibold mb-2">Ascolta la tua registrazione</h3>
          <audio src={recordedAudioUrl} controls className="w-full max-w-sm mx-auto" />
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={handleSaveVoice} className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75">
                <SaveIcon className="w-5 h-5 mr-2" />
                Salva Voce
            </button>
             <button onClick={onCloningComplete} className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75">
                Indietro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceClone;
