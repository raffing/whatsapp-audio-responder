export enum AppState {
  SELECTING_TYPE,
  IDLE,
  TRANSCRIBING,
  ANALYZING,
  ANALYSIS_COMPLETE,
  GENERATING_REPLY,
  ERROR,
}

export enum AudioType {
    WhatsApp,
    PersonalNote,
    CallRecording,
    MeetingRecording,
}

export enum ReplyTone {
  Agree = 'agree',
  Disagree = 'disagree',
  Neutral = 'neutral',
}

export enum ReplyLength {
  Short = 'short',
  Medium = 'medium',
  Long = 'long',
}

export enum VoiceGender {
    Male = 'male',
    Female = 'female',
}

export enum SpeechSpeed {
  Slow = 0.85,
  Normal = 1.0,
  Fast = 1.15,
}

export enum BackgroundSound {
  None = 'none',
  Cafe = 'cafe',
  Rain = 'rain',
}

export const backgroundSoundUrls: Record<BackgroundSound, string> = {
  [BackgroundSound.None]: '',
  [BackgroundSound.Cafe]: 'https://cdn.freesound.org/previews/87/87363_1132676-lq.mp3',
  [BackgroundSound.Rain]: 'https://cdn.freesound.org/previews/155/155315_2734180-lq.mp3',
};

export interface MeetingRecap {
    summary: string;
    decisions: string[];
    actionItems: string[];
}