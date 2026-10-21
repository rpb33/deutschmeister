import { describe, expect, it } from 'vitest';
import { nouns } from '../src/data/nouns';
import { articles, nounForm, nounPhrase, people, possessive } from '../src/data/grammar';
import {
  defaults,
  levelFilter,
  questionBank,
  validate,
  updateStat,
  classification,
  schedule,
  reinforce,
  streak,
  localDay,
} from '../src/lib/engine';
import { cases, levels } from '../src/types';
import type { Attempt } from '../src/types';
const noun = (word: string) => nouns.find((n) => n.word === word)!;
const bank = questionBank(defaults, true);
const q = (id: string) => bank.find((q) => q.id === id)!;
describe('vocabulary integrity', () => {
  it.each(levels)('%s has at least 50 complete, unique entries', (level) => {
    const list = nouns.filter((n) => n.level === level);
    expect(list.length).toBeGreaterThanOrEqual(50);
    for (const n of list) {
      expect(n.id).toBe(n.word);
      for (const key of [
        'word',
        'english',
        'plural',
        'genitive',
        'dativePlural',
        'category',
        'example',
        'translation',
        'notes',
      ] as const)
        expect(n[key].length).toBeGreaterThan(0);
      expect(n.article).toBe(articles.definite.NOM[n.gender]);
      expect(n.indefinite).toBe(n.gender === 'p' ? null : articles.indefinite.NOM[n.gender]);
    }
    expect(new Set(nouns.map((n) => n.id)).size).toBe(nouns.length);
  });
  it('retains umlauts, identical forms, foreign and plural-only forms', () => {
    expect(noun('Buch').plural).toBe('Bücher');
    expect(noun('Lehrer').plural).toBe('Lehrer');
    expect(noun('Kriterium').plural).toBe('Kriterien');
    expect(noun('Eltern').gender).toBe('p');
    expect(noun('Daten').indefinite).toBeNull();
  });
  it('filters exact and cumulative levels without changing history', () => {
    expect(levelFilter(nouns, { level: 'B1', cumulative: false })).toHaveLength(50);
    expect(levelFilter(nouns, { level: 'B1', cumulative: true })).toHaveLength(150);
  });
});
describe('German paradigms', () => {
  it('declines definite, indefinite and negative articles', () => {
    expect(articles.definite.AKK.m).toBe('den');
    expect(articles.definite.GEN.n).toBe('des');
    expect(articles.indefinite.DAT.f).toBe('einer');
    expect(articles.negative.DAT.p).toBe('keinen');
    for (const c of cases) expect(articles.indefinite[c].p).toBe('—');
  });
  it.each([
    ['Student', 'AKK', 'den Studenten'],
    ['Herr', 'DAT', 'dem Herrn'],
    ['Herr', 'GEN', 'des Herrn'],
    ['Name', 'AKK', 'den Namen'],
    ['Name', 'GEN', 'des Namens'],
    ['Herz', 'DAT', 'dem Herzen'],
    ['Herz', 'GEN', 'des Herzens'],
    ['Mädchen', 'NOM', 'das Mädchen'],
  ])('declines irregular %s %s', (word, c, expected) =>
    expect(nounPhrase(noun(word), c as (typeof cases)[number])).toBe(expected),
  );
  it('handles dative plurals and absent singulars', () => {
    expect(nounPhrase(noun('Kind'), 'DAT', 'definite', true)).toBe('den Kindern');
    expect(nounForm(noun('Auto'), 'DAT', true)).toBe('Autos');
    expect(nounForm(noun('Frau'), 'DAT', true)).toBe('Frauen');
    expect(nounPhrase(noun('Eltern'), 'DAT')).toBe('den Eltern');
    expect(nounPhrase(noun('Buch'), 'NOM', 'indefinite', true)).toBe('Bücher');
  });
  it('distinguishes she, they and formal you', () => {
    expect(people.find((p) => p.id === 'sie-sg')!.forms[2]).toBe('ihr');
    expect(people.find((p) => p.id === 'sie-pl')!.forms[2]).toBe('ihnen');
    expect(people.find((p) => p.id === 'Sie')!.forms[2]).toBe('Ihnen');
    expect(people.find((p) => p.id === 'wir')!.forms[3]).toBe('unser');
  });
  it('handles attributive, standalone and euer forms', () => {
    expect(possessive('mein', 'NOM', 'm')).toBe('mein');
    expect(possessive('mein', 'NOM', 'm', true)).toBe('meiner');
    expect(possessive('mein', 'AKK', 'n', true)).toBe('meines');
    expect(possessive('euer', 'DAT', 'm')).toBe('eurem');
    expect(possessive('euer', 'NOM', 'n')).toBe('euer');
    expect(possessive('Ihr', 'GEN', 'p')).toBe('Ihrer');
  });
});
describe('question generation and answers', () => {
  it.each(levels)('generates valid unique %s questions with one matching answer', (level) => {
    const qs = questionBank({ ...defaults, level }, true);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    for (const q of qs) {
      expect(q.options.filter((x) => x === q.answer)).toHaveLength(1);
      expect(q.options.length).toBeGreaterThan(1);
      expect(q.explanation.length).toBeGreaterThan(10);
      expect(q.answer).not.toContain('undefined');
      expect(validate(q.answer, q)).toBe(true);
    }
  });
  it('respects level restrictions and allows an override', () => {
    expect(questionBank(defaults).some((q) => q.case === 'GEN')).toBe(false);
    expect(bank.some((q) => q.case === 'GEN')).toBe(true);
    expect(questionBank(defaults).some((q) => q.topic === 'standalone')).toBe(false);
  });
  it('does not invent singular articles or plurals for mass nouns', () => {
    const qs = questionBank({ ...defaults, level: 'B2' });
    expect(qs.some((q) => q.id === 'article:Eltern')).toBe(false);
    expect(qs.some((q) => q.id === 'plural:Wachstum')).toBe(false);
    expect(qs.some((q) => q.id === 'phrase:Eltern:DAT:indefinite')).toBe(false);
  });
  it('accepts explicitly allowed genitives without accepting wrong case endings', () => {
    expect(validate('des Buchs', q('phrase:Buch:GEN:definite'))).toBe(true);
    expect(validate('des Buchen', q('phrase:Buch:GEN:definite'))).toBe(false);
    expect(q('phrase:Kind:DAT:definite:plural').answer).toBe('den Kindern');
    expect(q('poss-sentence-1').answer).toBe('meinem');
    expect(q('standalone-sentence-1').answer).toBe('meiner');
  });
  it('keeps sentence IDs stable when levels change', () => {
    const easy = questionBank(defaults);
    const hard = questionBank({ ...defaults, level: 'B2' });
    for (const e of easy.filter(
      (q) =>
        q.id.startsWith('case:') || q.id.startsWith('sentence:') || q.id.startsWith('replace:'),
    ))
      expect(hard.find((q) => q.id === e.id)?.prompt).toBe(e.prompt);
  });
  it('normalizes whitespace and harmless case, but preserves umlauts and formal Sie', () => {
    expect(validate('  DER ', q('article:Hund'))).toBe(true);
    expect(validate('BÜCHER', q('plural:Buch'))).toBe(true);
    expect(validate('Bucher', q('plural:Buch'))).toBe(false);
    expect(validate('ihnen', q('personal:Sie:DAT'))).toBe(false);
    expect(validate('Ihnen', q('personal:Sie:DAT'))).toBe(true);
    expect(validate('meins', q('standalone:ich:n:NOM'))).toBe(true);
  });
  it('classifies gender, plural, spelling and pronoun errors', () => {
    expect(classification(q('article:Hund'), 'die')).toBe('Incorrect noun gender');
    expect(classification(q('plural:Buch'), 'Buchs')).toBe('Incorrect plural');
    expect(classification(q('plural:Buch'), 'Bucher')).toBe('Spelling / umlaut');
    expect(classification(q('personal:er:DAT'), 'ihn')).toContain('pronoun');
  });
});
describe('adaptive learning', () => {
  it('does not declare mastery after one success', () => {
    expect(updateStat(undefined, 'x', true, 100).mastery).toBeLessThan(20);
  });
  it('grows intervals after success and schedules failures sooner', () => {
    const one = updateStat(undefined, 'x', true, 100);
    const two = updateStat(one, 'x', true, 200);
    const three = updateStat(two, 'x', true, 300);
    expect(one.interval).toBe(1);
    expect(two.interval).toBe(3);
    expect(three.interval).toBeGreaterThan(3);
    const failed = updateStat(three, 'x', false, 400);
    expect(failed.due).toBe(600400);
    expect(failed.streak).toBe(0);
    expect(failed.incorrect).toBe(1);
    expect(failed.ease).toBeLessThan(three.ease);
  });
  it('caps recent history and requires sustained success', () => {
    let s = updateStat(undefined, 'x', true, 1);
    for (let i = 0; i < 15; i++) s = updateStat(s, 'x', true, i + 2);
    expect(s.recent).toHaveLength(10);
    expect(s.mastery).toBe(100);
    expect(s.interval).toBeLessThanOrEqual(180);
  });
  it('selects due items while reserving new material', () => {
    const due = bank
      .slice(0, 40)
      .map((x) => ({ ...updateStat(undefined, `item:${x.id}`, true, 0), due: 0 }));
    const chosen = schedule(bank, due, 10, 'daily', [50, 30, 20], () => 0.5, 100);
    expect(chosen).toHaveLength(10);
    expect(new Set(chosen.map((q) => q.id)).size).toBe(10);
    expect(chosen.filter((q) => due.some((s) => s.id === `item:${q.id}`)).length).toBe(8);
  });
  it('prioritizes weak skills without starving new material', () => {
    const stat = updateStat(undefined, 'topic:plural', false, 0);
    const chosen = schedule(bank, [stat], 10, 'weak', [50, 30, 20], () => 0.5, 100);
    expect(chosen.filter((q) => q.topic === 'plural').length).toBeGreaterThanOrEqual(8);
  });
  it('reinforces after intervening questions with a different example', () => {
    const failed = q('article:Hund');
    const list = [failed, ...bank.filter((q) => q.topic === 'personal').slice(0, 9)];
    const next = reinforce(list, 0, failed, bank);
    expect(next[1]).toBe(list[1]);
    expect(next[2]).toBe(list[2]);
    expect(next[3].topic).toBe(failed.topic);
    expect(next[3].id).not.toBe(failed.id);
  });
  it('gracefully limits a session to available unique questions', () => {
    expect(schedule([q('article:Hund')], [], 30, 'exam')).toHaveLength(1);
  });
  it('counts local calendar streaks without losing yesterday’s streak', () => {
    const now = new Date(2026, 2, 10, 12).getTime();
    const one = new Date(2026, 2, 9, 12).getTime();
    const two = new Date(2026, 2, 8, 12).getTime();
    expect(streak([{ at: one }, { at: two }] as Attempt[], now)).toBe(2);
    expect(localDay(now)).toBe('2026-03-10');
  });
  it('typed preference carries to generated questions', () => {
    const qs = questionBank({ ...defaults, typed: true });
    expect(
      qs
        .filter((q) => q.topic !== 'case' && !q.id.startsWith('usage-'))
        .every((q) => q.format === 'typed'),
    ).toBe(true);
  });
});
