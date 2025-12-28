import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { 
  AudioType, 
  AppState, 
  transcribeAudio,
  setApiKey 
} from '@whatsapp-audio/core';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.SELECTING_TYPE);
  const [audioType, setAudioType] = useState<AudioType | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  // Initialize API key from Expo constants
  useEffect(() => {
    const apiKey = Constants.expoConfig?.extra?.geminiApiKey;
    if (apiKey) {
      setApiKey(apiKey);
    } else {
      Alert.alert(
        'API Key Missing',
        'Please set GEMINI_API_KEY in your .env.local file'
      );
    }
  }, []);

  const handleTypeSelect = (type: AudioType) => {
    setAudioType(type);
    setAppState(AppState.IDLE);
  };

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setFileName(file.name);
      setAppState(AppState.TRANSCRIBING);
      setError('');
      setTranscription('');

      // Read file as base64
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        if (!base64Audio) {
          setError('Errore nella lettura del file. Riprova.');
          setAppState(AppState.ERROR);
          return;
        }

        try {
          const transcribedText = await transcribeAudio(
            base64Audio,
            file.mimeType || 'audio/mp4',
            audioType
          );
          setTranscription(transcribedText);
          setAppState(AppState.ANALYSIS_COMPLETE);
        } catch (e) {
          console.error(e);
          setError('Trascrizione fallita. Verifica la connessione e la chiave API.');
          setAppState(AppState.ERROR);
        }
      };

      reader.onerror = () => {
        setError('Errore nella lettura del file.');
        setAppState(AppState.ERROR);
      };

      reader.readAsDataURL(blob);
    } catch (e) {
      console.error(e);
      setError('Errore nella selezione del file.');
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.SELECTING_TYPE);
    setAudioType(null);
    setTranscription('');
    setError('');
    setFileName('');
  };

  const getTypeLabel = (type: AudioType) => {
    switch (type) {
      case AudioType.WhatsApp:
        return 'Audio WhatsApp';
      case AudioType.PersonalNote:
        return 'Nota Vocale';
      case AudioType.CallRecording:
        return 'Chiamata';
      case AudioType.MeetingRecording:
        return 'Riunione';
      default:
        return 'Audio';
    }
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.SELECTING_TYPE:
        return (
          <View style={styles.typeSelector}>
            <Text style={styles.title}>Assistente Audio AI</Text>
            <Text style={styles.subtitle}>Scegli il tipo di audio da analizzare</Text>
            
            <TouchableOpacity
              style={styles.typeButton}
              onPress={() => handleTypeSelect(AudioType.WhatsApp)}
            >
              <Text style={styles.typeButtonText}>📱 Audio WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeButton}
              onPress={() => handleTypeSelect(AudioType.PersonalNote)}
            >
              <Text style={styles.typeButtonText}>🎤 Nota Vocale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeButton}
              onPress={() => handleTypeSelect(AudioType.CallRecording)}
            >
              <Text style={styles.typeButtonText}>📞 Chiamata</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeButton}
              onPress={() => handleTypeSelect(AudioType.MeetingRecording)}
            >
              <Text style={styles.typeButtonText}>👥 Riunione</Text>
            </TouchableOpacity>
          </View>
        );

      case AppState.IDLE:
        return (
          <View style={styles.centered}>
            <Text style={styles.title}>
              {audioType !== null && getTypeLabel(audioType)}
            </Text>
            <TouchableOpacity style={styles.button} onPress={handlePickAudio}>
              <Text style={styles.buttonText}>📁 Seleziona File Audio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
              <Text style={styles.secondaryButtonText}>Cambia Tipo</Text>
            </TouchableOpacity>
          </View>
        );

      case AppState.TRANSCRIBING:
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text style={styles.loadingText}>Trascrizione in corso...</Text>
            <Text style={styles.fileName}>{fileName}</Text>
          </View>
        );

      case AppState.ANALYSIS_COMPLETE:
        return (
          <ScrollView style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Trascrizione</Text>
              <Text style={styles.fileName}>{fileName}</Text>
            </View>
            <View style={styles.transcriptionBox}>
              <Text style={styles.transcriptionText}>{transcription}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleReset}>
              <Text style={styles.buttonText}>Nuova Analisi</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case AppState.ERROR:
        return (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>❌ Errore</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.button} onPress={handleReset}>
              <Text style={styles.buttonText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0a09',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelector: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#a8a29e',
    textAlign: 'center',
    marginBottom: 30,
  },
  typeButton: {
    backgroundColor: '#292524',
    padding: 20,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  typeButtonText: {
    color: '#e7e5e4',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#44403c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#e7e5e4',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    color: '#e7e5e4',
    fontSize: 18,
    marginTop: 20,
  },
  fileName: {
    color: '#78716c',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  resultHeader: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  transcriptionBox: {
    backgroundColor: '#1c1917',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#44403c',
    marginBottom: 20,
  },
  transcriptionText: {
    color: '#e7e5e4',
    fontSize: 16,
    lineHeight: 24,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});
