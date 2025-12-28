const VOICE_CLONE_KEY = 'voiceCloneSample';

/**
 * Converts a Blob to a base64 encoded string.
 * @param blob The blob to convert.
 * @returns A promise that resolves with the base64 string.
 */
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Saves the recorded voice blob to localStorage as a base64 string.
 * @param voiceBlob The recorded audio blob.
 */
export const saveClonedVoice = async (voiceBlob: Blob) => {
    try {
        const base64String = await blobToBase64(voiceBlob);
        localStorage.setItem(VOICE_CLONE_KEY, base64String);
    } catch (error) {
        console.error("Failed to save voice to localStorage", error);
        throw new Error("Could not save voice sample.");
    }
};

/**
 * Retrieves the cloned voice data from localStorage.
 * @returns The base64 string of the voice data, or null if not found.
 */
export const getClonedVoice = (): string | null => {
    return localStorage.getItem(VOICE_CLONE_KEY);
};

/**
 * Checks if a cloned voice sample exists in localStorage.
 * @returns True if the voice sample exists, false otherwise.
 */
export const hasClonedVoice = (): boolean => {
    return localStorage.getItem(VOICE_CLONE_KEY) !== null;
};
