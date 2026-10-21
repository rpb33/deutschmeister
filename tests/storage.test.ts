import { afterEach, describe, expect, it } from 'vitest';
import {
  LearningDB,
  importBackup,
  parseBackup,
  persistAnswer,
  readSnapshot,
} from '../src/lib/storage';
import { defaults, questionBank, recordAnswer } from '../src/lib/engine';
import type { Session, Snapshot } from '../src/types';
const dbs: LearningDB[] = [];
function create() {
  const db = new LearningDB('test-' + crypto.randomUUID());
  dbs.push(db);
  return db;
}
afterEach(async () => {
  for (const d of dbs.splice(0)) await d.delete();
});
function fixture() {
  const q = questionBank(defaults)[0];
  const a = recordAnswer(q, q.answer, 'session');
  const session: Session = {
    id: 'session',
    mode: 'quick',
    questions: [q],
    index: 0,
    answers: [a],
    started: Date.now(),
    complete: false,
    feedback: true,
  };
  return { q, a, session };
}
describe('durable local progress', () => {
  it('persists multiple affected skills and an interrupted session atomically', async () => {
    const db = create();
    const { a, session } = fixture();
    await persistAnswer(a, session, db);
    const saved = await readSnapshot(db);
    expect(saved.attempts).toHaveLength(1);
    expect(saved.stats).toHaveLength(a.skills.length);
    expect(saved.session?.feedback).toBe(true);
    expect(saved.stats.every((s) => s.attempts === 1)).toBe(true);
    db.close();
    await db.open();
    expect((await readSnapshot(db)).attempts[0].answer).toBe(a.answer);
  });
  it('does not double-count an answer retried after a write', async () => {
    const db = create();
    const { a, session } = fixture();
    await persistAnswer(a, session, db);
    await persistAnswer(a, session, db);
    expect((await readSnapshot(db)).stats.every((s) => s.attempts === 1)).toBe(true);
  });
  it('exports and restores all data including settings and active session', async () => {
    const db = create();
    const { a, session } = fixture();
    await persistAnswer(a, session, db);
    await db.meta.put({
      key: 'settings',
      value: { ...defaults, level: 'B2', theme: 'dark', onboarded: true },
    });
    const backup = await readSnapshot(db);
    const other = create();
    await importBackup(JSON.stringify(backup), other);
    expect(await readSnapshot(other)).toEqual(backup);
  });
  it('rejects corrupt data without destroying existing progress', async () => {
    const db = create();
    const { a, session } = fixture();
    await persistAnswer(a, session, db);
    const b = await readSnapshot(db);
    const invalid = { ...b, stats: [{ ...b.stats[0], mastery: 500 }] };
    await expect(importBackup(JSON.stringify(invalid), db)).rejects.toThrow('Invalid progress');
    expect((await readSnapshot(db)).attempts).toHaveLength(1);
  });
  it('rejects invalid settings, unknown versions, questions, and duplicate IDs', () => {
    const b: Snapshot = { version: 1, settings: defaults, stats: [], attempts: [], session: null };
    expect(() => parseBackup(JSON.stringify({ ...b, version: 9 }))).toThrow();
    expect(() =>
      parseBackup(JSON.stringify({ ...b, settings: { ...defaults, weights: [90, 10, 0] } })),
    ).toThrow();
    const { a, session } = fixture();
    expect(() =>
      parseBackup(JSON.stringify({ ...b, session: { ...session, questions: [{}] } })),
    ).toThrow();
    expect(() => parseBackup(JSON.stringify({ ...b, attempts: [a, a] }))).toThrow();
  });
});
