import { GoogleGenAI, Modality } from "@google/genai";
import { ReplyTone, ReplyLength, VoiceGender } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Transcribes an audio file using the Gemini Pro model.
 * @param base64Audio The base64 encoded audio data.
 * @param mimeType The MIME type of the audio file.
 * @returns The transcribed text.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Audio,
      },
    };

    const textPart = {
      text: "Trascrivi questo file audio in italiano. Se l'audio contiene rumore o non è chiaro, indicalo. Se l'audio è in un'altra lingua, trascrivilo in quella lingua e poi fornisci una traduzione in italiano.",
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [audioPart, textPart] },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

/**
 * Generates a possible reply based on a given transcription.
 * @param transcription The text of the message received.
 * @param tone The desired tone of the reply.
 * @param length The desired length of the reply.
 * @param recipientName The name of the person who sent the audio.
 * @returns A suggested reply.
 */
export const generateReply = async (transcription: string, tone: ReplyTone, length: ReplyLength, recipientName: string): Promise<string> => {
  try {
    let toneInstruction = '';
    switch (tone) {
      case ReplyTone.Agree:
        toneInstruction = 'Mostra accordo con il messaggio.';
        break;
      case ReplyTone.Disagree:
        toneInstruction = 'Esprimi un cortese disaccordo.';
        break;
      case ReplyTone.Neutral:
      default:
        toneInstruction = 'Sii neutrale e informativo.';
        break;
    }

    let lengthInstruction = '';
    switch (length) {
        case ReplyLength.Short:
            lengthInstruction = 'Sii molto breve, una o due frasi al massimo.';
            break;
        case ReplyLength.Long:
            lengthInstruction = 'Sii più dettagliato e completo.';
            break;
        case ReplyLength.Medium:
        default:
            lengthInstruction = 'Sii di media lunghezza, chiaro e conciso.';
            break;
    }

    const recipientContext = recipientName 
        ? `Il messaggio è stato inviato da "${recipientName}".` 
        : "";

    const prompt = `Sei un assistente che aiuta a rispondere ai messaggi vocali di WhatsApp.
Il tuo compito è generare una risposta dal mio punto di vista.
${recipientContext}
La trascrizione del messaggio che ho ricevuto è: "${transcription}"
Per favore, genera una risposta colloquiale e naturale in italiano.
La risposta deve seguire queste direttive:
- Tono: ${toneInstruction}
- Lunghezza: ${lengthInstruction}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating reply:", error);
    throw new Error("Failed to generate reply.");
  }
};

/**
 * Generates speech from text using a pre-built voice.
 * @param text The text to convert to speech.
 * @param voice The desired voice gender.
 * @returns A base64 encoded string of the raw audio data.
 */
export const generateSpeech = async (text: string, voice: VoiceGender): Promise<string> => {
    try {
        const voiceName = voice === VoiceGender.Male ? 'Puck' : 'Kore';

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech.");
    }
}