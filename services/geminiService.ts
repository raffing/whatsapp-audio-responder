import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ReplyTone, ReplyLength, VoiceGender, AudioType, MeetingRecap } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getTranscriptionPrompt = (audioType: AudioType | null): string => {
    switch (audioType) {
        case AudioType.MeetingRecording:
            return "Trascrivi questa registrazione di una riunione. Identifica e separa i diversi oratori se possibile, etichettandoli come 'Oratore A', 'Oratore B', ecc. Pulisci il testo da riempitivi come 'uhm' e 'ehm'.";
        case AudioType.CallRecording:
            return "Trascrivi questa telefonata tra due o più persone. Identifica e separa i diversi oratori se possibile, etichettandoli come 'Persona A', 'Persona B', ecc.";
        case AudioType.PersonalNote:
            return "Trascrivi questa nota vocale personale. Correggi eventuali errori grammaticali minori per migliorare la leggibilità, mantenendo il tono originale.";
        case AudioType.WhatsApp:
        default:
             return "Trascrivi questo file audio in italiano. Se l'audio contiene rumore o non è chiaro, indicalo. Se l'audio è in un'altra lingua, trascrivilo in quella lingua e poi fornisci una traduzione in italiano.";
    }
}


/**
 * Transcribes an audio file using the Gemini Pro model.
 * @param base64Audio The base64 encoded audio data.
 * @param mimeType The MIME type of the audio file.
 * @param audioType The type of audio being processed to tailor the prompt.
 * @returns The transcribed text.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string, audioType: AudioType | null): Promise<string> => {
  try {
    // Basic normalization for m4a if browser doesn't detect it perfectly, 
    // though Gemini is robust.
    let finalMimeType = mimeType;
    if (!finalMimeType || finalMimeType === '') {
        finalMimeType = 'audio/mp4'; // Fallback for m4a/mp4 containers
    }

    const audioPart = {
      inlineData: {
        mimeType: finalMimeType,
        data: base64Audio,
      },
    };

    const textPart = {
      text: getTranscriptionPrompt(audioType),
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
 * Generates follow-up questions for a WhatsApp message.
 * @param transcription The text of the message received.
 * @returns An array of suggested questions.
 */
export const generateWhatsAppFollowUp = async (transcription: string): Promise<string[]> => {
    try {
        const prompt = `Analizza la seguente trascrizione di un messaggio audio WhatsApp e genera 2-3 domande di approfondimento pertinenti. L'obiettivo è aiutarmi a raccogliere maggiori dettagli per poter formulare una risposta completa e accurata. Le domande devono essere formulate in prima persona (dal mio punto di vista), come se le stessi chiedendo io per avere un chiarimento. Devono essere brevi, chiare e in un tono colloquiale. Formatta l'output come un oggetto JSON con una chiave 'questions' che contiene un array di stringhe.

Trascrizione: "${transcription}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "Una domanda di approfondimento."
                            }
                        }
                    },
                    required: ['questions']
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        return result.questions || [];

    } catch (error) {
        console.error("Error generating follow-up questions:", error);
        return [];
    }
};


/**
 * Generates a possible reply for a WhatsApp message.
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
      case ReplyTone.Agree: toneInstruction = 'Mostra accordo con il messaggio.'; break;
      case ReplyTone.Disagree: toneInstruction = 'Esprimi un cortese disaccordo.'; break;
      case ReplyTone.Neutral: default: toneInstruction = 'Sii neutrale e informativo.'; break;
    }

    let lengthInstruction = '';
    switch (length) {
        case ReplyLength.Short: lengthInstruction = 'Sii molto breve, una o due frasi al massimo.'; break;
        case ReplyLength.Long: lengthInstruction = 'Sii più dettagliato e completo.'; break;
        case ReplyLength.Medium: default: lengthInstruction = 'Sii di media lunghezza, chiaro e conciso.'; break;
    }

    const recipientContext = recipientName ? `Il messaggio è stato inviato da "${recipientName}".` : "";

    const prompt = `Sei un assistente che aiuta a rispondere ai messaggi vocali di WhatsApp.
Il tuo compito è generare una risposta dal mio punto di vista.
${recipientContext}
La trascrizione del messaggio che ho ricevuto è: "${transcription}"
Per favore, genera una risposta colloquiale e naturale in italiano.
La risposta deve seguire queste direttive:
- Tono: ${toneInstruction}
- Lunghezza: ${lengthInstruction}`;
    
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
  } catch (error) {
    console.error("Error generating reply:", error);
    throw new Error("Failed to generate reply.");
  }
};

/**
 * Generates speech from text.
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
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName }}},
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data received from API.");
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech.");
    }
}

/**
 * Generates a summary for a personal note.
 * @param transcription The transcribed text of the note.
 * @returns A concise summary.
 */
export const generateSummary = async (transcription: string): Promise<string> => {
    try {
        const prompt = `Riassumi la seguente nota personale in 2-3 frasi chiave. Cattura l'essenza del messaggio in modo chiaro e conciso.

Trascrizione: "${transcription}"`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating summary:", error);
        throw new Error("Failed to generate summary.");
    }
};

/**
 * Extracts key points from a call recording.
 * @param transcription The transcribed text of the call.
 * @returns An array of key points.
 */
export const generateKeyPoints = async (transcription: string): Promise<string[]> => {
    try {
        const prompt = `Analizza la trascrizione di questa telefonata. Estrai i 3-5 punti salienti più importanti discussi. Elencali in modo chiaro e sintetico. Formatta l'output come un oggetto JSON con una chiave 'keyPoints' che contiene un array di stringhe.

Trascrizione: "${transcription}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        keyPoints: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING, description: "Un punto saliente della chiamata." }
                        }
                    },
                    required: ['keyPoints']
                }
            }
        });
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        return result.keyPoints || [];
    } catch (error) {
        console.error("Error generating key points:", error);
        throw new Error("Failed to generate key points.");
    }
};

/**
 * Clean and format a call transcript.
 * @param transcription The raw transcription.
 * @returns A cleaned, script-like formatted string.
 */
export const generateCleanTranscript = async (transcription: string): Promise<string> => {
    try {
        const prompt = `Agisci come un redattore professionista. Prendi la seguente trascrizione grezza di una telefonata e trasformala in un copione pulito e leggibile.
        
Istruzioni:
1. Correggi errori grammaticali e di punteggiatura.
2. Rimuovi intercalari inutili (es. "ehm", "uhm", ripetizioni).
3. Assicurati che gli oratori siano chiaramente distinti (es. **Persona A**: ...).
4. Mantieni il significato e il tono originale della conversazione.
5. Usa una formattazione chiara con spazi tra gli interventi.

Trascrizione grezza: "${transcription}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating clean transcript:", error);
        throw new Error("Failed to generate clean transcript.");
    }
};

/**
 * Generates a summary, decisions, and action items from a meeting recording.
 * @param transcription The transcribed text of the meeting.
 * @returns An object containing summary, decisions, and action items.
 */
export const generateMeetingRecap = async (transcription: string): Promise<MeetingRecap> => {
    try {
        const prompt = `Analizza la trascrizione di questa riunione. Estrai un riassunto generale, le decisioni chiave prese e le azioni da intraprendere (action items), indicando chi è il responsabile se menzionato.

Trascrizione: "${transcription}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: "Un riassunto conciso della riunione."
                        },
                        decisions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Un elenco delle decisioni chiave prese."
                        },
                        actionItems: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Un elenco delle azioni da intraprendere, con i responsabili se specificati."
                        }
                    },
                    required: ['summary', 'decisions', 'actionItems']
                }
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as MeetingRecap;
    } catch (error) {
        console.error("Error generating meeting recap:", error);
        throw new Error("Failed to generate meeting recap.");
    }
};