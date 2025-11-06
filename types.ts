export enum AppState {
  IDLE,
  TRANSCRIBING,
  TRANSCRIBED,
  GENERATING_REPLY,
  ERROR,
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