
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ReplyTone, ReplyLength, VoiceGender, AudioType, MeetingRecap } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getTranscriptionPrompt = (audioType: AudioType | null, isMultiFile: boolean): string => {
    const basePrompt = isMultiFile 
        ? "Questi file audio sono parti successive di una stessa comunicazione. Trascrivili in ordine cronologico come un unico testo coerente."
        : "Trascrivi questo file audio.";

    switch (audioType) {
        case AudioType.MeetingRecording:
            return `${basePrompt} Identifica e separa i diversi oratori, etichettandoli come 'Oratore A', 'Oratore B', ecc. Pulisci il testo da intercalari.`;
        case AudioType.CallRecording:
            return `${basePrompt} Trascrivi questa telefonata tra due o più persone. Identifica i diversi oratori.`;
        case AudioType.PersonalNote:
            return `${basePrompt} Trascrivi questa nota vocale. Mantieni il tono originale ma correggi errori grammaticali minimi.`;
        case AudioType.WhatsApp:
        default:
             return `${basePrompt} Questo è un messaggio vocale di WhatsApp in italiano. Se l'audio non è chiaro o in un'altra lingua, trascrivilo fedelmente e fornisci traduzione se necessario.`;
    }
}

export interface AudioInput {
    base64Data: string;
    mimeType: string;
}

/**
 * Transcribes one or more audio files.
 */
export const transcribeAudio = async (inputs: AudioInput[], audioType: AudioType | null): Promise<string> => {
  try {
    const parts = inputs.map(input => {
        let finalMimeType = input.mimeType;
        if (finalMimeType.includes('opus') || !finalMimeType) {
            finalMimeType = 'audio/ogg; codecs=opus';
        }
        return {
            inlineData: {
                mimeType: finalMimeType,
                data: input.base64Data,
            },
        };
    });

    const textPart = {
      text: getTranscriptionPrompt(audioType, inputs.length > 1),
    };

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...parts, textPart] },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Impossibile trascrivere l'audio.");
  }
};

export const generateWhatsAppFollowUp = async (transcription: string): Promise<string[]> => {
    try {
        const prompt = `Analizza questa trascrizione WhatsApp e genera 2 brevi domande per me per capire meglio come rispondere.\nTrascrizione: "${transcription}"\nFormatta come JSON con chiave 'questions'.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['questions']
                }
            }
        });
        const result = JSON.parse(response.text.trim());
        return result.questions || [];
    } catch (error) { return []; }
};

export const generateReply = async (transcription: string, tone: ReplyTone, length: ReplyLength, recipientName: string): Promise<string> => {
  try {
    const toneText = tone === ReplyTone.Agree ? 'concorde' : tone === ReplyTone.Disagree ? 'discorde' : 'neutrale';
    const lengthText = length === ReplyLength.Short ? 'breve' : length === ReplyLength.Long ? 'dettagliata' : 'media';
    const prompt = `Trascrizione messaggio ricevuto: "${transcription}"\nGenera una risposta WhatsApp in italiano.\nMittente: ${recipientName || 'sconosciuto'}\nTono: ${toneText}\nLunghezza: ${lengthText}`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text;
  } catch (error) { throw new Error("Errore generazione risposta."); }
};

export const generateSpeech = async (text: string, voice: VoiceGender): Promise<string> => {
    try {
        const voiceName = voice === VoiceGender.Male ? 'Puck' : 'Kore';
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName }}},
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data.");
        return base64Audio;
    } catch (error) { throw new Error("Errore sintesi vocale."); }
}

export const generateSummary = async (transcription: string): Promise<string> => {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Riassumi concisamente: "${transcription}"` });
    return response.text;
};

export const generateKeyPoints = async (transcription: string): Promise<string[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Estrai i punti chiave (JSON chiave 'keyPoints'): "${transcription}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } } }
            }
        }
    });
    return JSON.parse(response.text.trim()).keyPoints || [];
};

export const generateCleanTranscript = async (transcription: string): Promise<string> => {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Formatta come copione pulito: "${transcription}"` });
    return response.text;
};

export const generateMeetingRecap = async (transcription: string): Promise<MeetingRecap> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analizza riunione ed estrai riassunto, decisioni, azioni (JSON): "${transcription}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    actionItems: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['summary', 'decisions', 'actionItems']
            }
        }
    });
    return JSON.parse(response.text.trim()) as MeetingRecap;
};
