import Dexie, { type Table } from 'dexie';
import type { Attempt, Settings, Session, Snapshot, Stat } from '../types';
import { cases, levels } from '../types';
import { defaults, updateStat } from './engine';
export class LearningDB extends Dexie {
  stats!: Table<Stat, string>;
  attempts!: Table<Attempt, string>;
  meta!: Table<{ key: string; value: unknown }, string>;
  constructor(name = 'DeutschMeister') {
    super(name);
    this.version(1).stores({
      stats: 'id,due,mastery',
      attempts: 'id,at,level,sessionId',
      meta: 'key',
    });
  }
}
export const db = new LearningDB();
export async function readSnapshot(database = db): Promise<Snapshot> {
  const [stats, attempts, settings, session] = await Promise.all([
    database.stats.toArray(),
    database.attempts.toArray(),
    database.meta.get('settings'),
    database.meta.get('session'),
  ]);
  return {
    version: 1,
    stats,
    attempts,
    settings: { ...defaults, ...(settings?.value as Partial<Settings>) },
    session: (session?.value as Session) || null,
  };
}
export async function saveSettings(settings: Settings) {
  await db.meta.put({ key: 'settings', value: settings });
}
export async function saveSession(session: Session | null) {
  await db.meta.put({ key: 'session', value: session });
}
export async function persistAnswer(attempt: Attempt, session: Session, database = db) {
  await database.transaction('rw', database.stats, database.attempts, database.meta, async () => {
    if (await database.attempts.get(attempt.id)) return;
    for (const id of new Set(attempt.skills)) {
      const prev = await database.stats.get(id);
      await database.stats.put(updateStat(prev, id, attempt.correct, attempt.at));
    }
    await database.attempts.put(attempt);
    await database.meta.put({ key: 'session', value: session });
  });
}
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown) => typeof v === 'string';
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const strings = (v: unknown) => Array.isArray(v) && v.every(str);
const topics = [
  'article',
  'gender',
  'plural',
  'declension',
  'case',
  'phrase',
  'personal',
  'possessive',
  'standalone',
];
function validAttempt(a: unknown): boolean {
  return (
    obj(a) &&
    [
      'id',
      'questionId',
      'answer',
      'expected',
      'prompt',
      'explanation',
      'classification',
      'sessionId',
    ].every((k) => str(a[k])) &&
    topics.includes(a.topic as string) &&
    levels.includes(a.level as never) &&
    strings(a.skills) &&
    typeof a.correct === 'boolean' &&
    num(a.at)
  );
}
function validQuestion(q: unknown): boolean {
  return (
    obj(q) &&
    ['id', 'prompt', 'context', 'answer', 'explanation'].every((k) => str(q[k])) &&
    topics.includes(q.topic as string) &&
    levels.includes(q.level as never) &&
    strings(q.skills) &&
    strings(q.options) &&
    ['typed', 'choice'].includes(q.format as string) &&
    (q.case === undefined || cases.includes(q.case as never)) &&
    (q.strictCase === undefined || typeof q.strictCase === 'boolean')
  );
}
export function parseBackup(text: string): Snapshot {
  if (text.length > 20_000_000) throw new Error('Backup exceeds the 20 MB import limit.');
  const b: unknown = JSON.parse(text);
  if (
    !obj(b) ||
    b.version !== 1 ||
    !obj(b.settings) ||
    !Array.isArray(b.stats) ||
    !Array.isArray(b.attempts)
  )
    throw new Error('This is not a version 1 DeutschMeister backup.');
  const s = b.settings;
  if (
    !levels.includes(s.level as never) ||
    !['light', 'dark', 'system'].includes(s.theme as string) ||
    !num(s.goal) ||
    (s.goal as number) < 1 ||
    (s.goal as number) > 500 ||
    ![5, 10, 15, 20, 30].includes(s.length as number) ||
    ['cumulative', 'onboarded', 'typed'].some((k) => typeof s[k] !== 'boolean') ||
    !Array.isArray(s.weights) ||
    s.weights.length !== 3 ||
    !s.weights.every(num) ||
    s.weights.reduce((a: number, n: number) => a + n, 0) !== 100 ||
    s.weights[2] < 10
  )
    throw new Error('Invalid study settings in backup.');
  if (
    !b.attempts.every(validAttempt) ||
    new Set(b.attempts.map((a) => (a as Attempt).id)).size !== b.attempts.length
  )
    throw new Error('Invalid or duplicate learning history.');
  if (
    !b.stats.every(
      (v) =>
        obj(v) &&
        str(v.id) &&
        [
          'attempts',
          'correct',
          'incorrect',
          'streak',
          'last',
          'due',
          'mastery',
          'ease',
          'interval',
        ].every((k) => num(v[k])) &&
        v.attempts === (v.correct as number) + (v.incorrect as number) &&
        (v.mastery as number) <= 100 &&
        (v.ease as number) >= 1.3 &&
        Array.isArray(v.recent) &&
        v.recent.length <= 10 &&
        v.recent.every((x) => typeof x === 'boolean'),
    ) ||
    new Set(b.stats.map((s) => (s as Stat).id)).size !== b.stats.length
  )
    throw new Error('Invalid progress records.');
  if (b.session !== null) {
    const x = b.session;
    if (
      !obj(x) ||
      !str(x.id) ||
      !['quick', 'focused', 'daily', 'weak', 'exam'].includes(x.mode as string) ||
      !Array.isArray(x.questions) ||
      !x.questions.length ||
      x.questions.length > 30 ||
      !x.questions.every(validQuestion) ||
      !Array.isArray(x.answers) ||
      !x.answers.every(validAttempt) ||
      !Number.isInteger(x.index) ||
      (x.index as number) < 0 ||
      (x.index as number) >= x.questions.length ||
      typeof x.complete !== 'boolean' ||
      typeof x.feedback !== 'boolean' ||
      !num(x.started) ||
      x.answers.length > x.questions.length
    )
      throw new Error('Invalid saved session.');
  }
  return b as unknown as Snapshot;
}
export async function importBackup(text: string, database = db) {
  const b = parseBackup(text);
  await database.transaction('rw', database.stats, database.attempts, database.meta, async () => {
    await database.stats.clear();
    await database.attempts.clear();
    await database.meta.clear();
    await database.stats.bulkPut(b.stats);
    await database.attempts.bulkPut(b.attempts);
    await database.meta.bulkPut([
      { key: 'settings', value: b.settings },
      { key: 'session', value: b.session },
    ]);
  });
  return b;
}
export async function resetProgress() {
  await db.transaction('rw', db.stats, db.attempts, db.meta, async () => {
    await db.stats.clear();
    await db.attempts.clear();
    await db.meta.delete('session');
  });
}
