export const levels = ['A1', 'A2', 'B1', 'B2'] as const;
export type Level = (typeof levels)[number];
export const cases = ['NOM', 'AKK', 'DAT', 'GEN'] as const;
export type Case = (typeof cases)[number];
export type Gender = 'm' | 'f' | 'n' | 'p';
export type ArticleType = 'definite' | 'indefinite' | 'negative';
export type Topic =
  | 'article'
  | 'gender'
  | 'plural'
  | 'declension'
  | 'case'
  | 'phrase'
  | 'personal'
  | 'possessive'
  | 'standalone';
export interface Noun {
  id: string;
  word: string;
  english: string;
  gender: Gender;
  plural: string;
  level: Level;
  category: string;
  article: string;
  indefinite: string | null;
  genitive: string;
  genitiveAlternatives?: string[];
  dativePlural: string;
  weak: boolean;
  example: string;
  translation: string;
  notes: string;
}
export interface Question {
  id: string;
  topic: Topic;
  level: Level;
  prompt: string;
  context: string;
  answer: string;
  options: string[];
  explanation: string;
  skills: string[];
  nounId?: string;
  case?: Case;
  format: 'choice' | 'typed';
  strictCase?: boolean;
}
export interface Stat {
  id: string;
  attempts: number;
  correct: number;
  incorrect: number;
  recent: boolean[];
  streak: number;
  last: number;
  due: number;
  mastery: number;
  ease: number;
  interval: number;
}
export interface Attempt {
  id: string;
  questionId: string;
  topic: Topic;
  level: Level;
  skills: string[];
  answer: string;
  expected: string;
  prompt: string;
  explanation: string;
  correct: boolean;
  classification: string;
  at: number;
  sessionId: string;
}
export type Mode = 'quick' | 'focused' | 'daily' | 'weak' | 'exam';
export interface Settings {
  level: Level;
  cumulative: boolean;
  goal: number;
  length: number;
  theme: 'light' | 'dark' | 'system';
  onboarded: boolean;
  typed: boolean;
  weights: [number, number, number];
}
export interface Session {
  id: string;
  mode: Mode;
  questions: Question[];
  index: number;
  answers: Attempt[];
  started: number;
  complete: boolean;
  feedback: boolean;
}
export interface Snapshot {
  version: 1;
  settings: Settings;
  stats: Stat[];
  attempts: Attempt[];
  session: Session | null;
}
