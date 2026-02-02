export enum YapStyle {
  DEFAULT = 'Default',
  ZOOMER = 'Zoomer / Brainrot',
  CORPORATE = 'Corporate Speak',
  ACADEMIC = 'Academic / Intellectual',
  PIRATE = 'Pirate',
  SHAKESPEAREAN = 'Shakespearean',
  LINKEDIN = 'LinkedIn Lunatic',
  TECH_BRO = 'SF Tech Bro',
  ANGRY_BOOMER = 'Angry Boomer',
  PHILOSOPHER = 'Existential Philosopher'
}

export enum YapLength {
  SHORT = 'Short (Quick Yap)',
  MEDIUM = 'Medium (Solid Rant)',
  LONG = 'Long (Full Manifesto)',
  EXTREME = 'Extreme (Filibuster)'
}

export interface YapRequest {
  topic: string;
  style: YapStyle;
  length: YapLength;
}

export interface HistoryItem {
  id: string;
  topic: string;
  content: string;
  style: YapStyle;
  timestamp: number;
}