import { cases, levels } from '../types';
import type { Attempt, Case, Gender, Level, Mode, Question, Settings, Stat } from '../types';
import { nouns } from '../data/nouns';
import { sentenceExercises } from '../data/exercises';
import {
  articles,
  caseNames,
  caseRules,
  genderNames,
  nounPhrase,
  people,
  possessive,
} from '../data/grammar';
export const defaults: Settings = {
  level: 'A1',
  cumulative: true,
  goal: 20,
  length: 10,
  theme: 'system',
  onboarded: false,
  typed: false,
  weights: [50, 30, 20],
};
export const allowedCases = (level: Level): Case[] =>
  level === 'A1' ? ['NOM', 'AKK'] : level === 'A2' ? ['NOM', 'AKK', 'DAT'] : [...cases];
export function levelFilter<T extends { level: Level }>(
  items: T[],
  settings: Pick<Settings, 'level' | 'cumulative'>,
): T[] {
  return items.filter((n) =>
    settings.cumulative
      ? levels.indexOf(n.level) <= levels.indexOf(settings.level)
      : n.level === settings.level,
  );
}
export function normalize(s: string, strict = false) {
  const v = s.normalize('NFC').trim().replace(/\s+/g, ' ');
  return strict ? v : v.toLocaleLowerCase('de');
}
export function validate(answer: string, q: Question) {
  const a = normalize(answer, !!q.strictCase),
    b = normalize(q.answer, !!q.strictCase);
  if (a === b || (q.topic === 'standalone' && b.endsWith('es') && a === b.slice(0, -2) + 's'))
    return true;
  if (q.topic === 'phrase' && q.nounId && !q.id.endsWith(':plural')) {
    const n = nouns.find((n) => n.id === q.nounId);
    const variants =
      q.case === 'GEN'
        ? n?.genitiveAlternatives
        : q.case === 'DAT' && n?.word === 'Herz'
          ? ['Herz']
          : [];
    return !!variants?.some(
      (form) =>
        a === normalize(q.answer.slice(0, q.answer.lastIndexOf(' ') + 1) + form, !!q.strictCase),
    );
  }
  return false;
}
function choices(answer: string, others: string[]): string[] {
  return [...new Set([answer, ...others])].slice(0, 4);
}
function question(
  q: Omit<Question, 'options' | 'skills'> & { options?: string[]; skills?: string[] },
): Question {
  return {
    ...q,
    options: choices(q.answer, q.options || []),
    skills: [
      `topic:${q.topic}`,
      `level:${q.level}`,
      ...(q.skills || []),
      ...(q.case ? [`case:${q.case}`] : []),
    ],
  };
}
// Noun phrases are generated from explicit paradigms; sentence exercises below are curated.
export function questionBank(settings: Settings, override = false): Question[] {
  const qs: Question[] = [];
  const cs = override ? [...cases] : allowedCases(settings.level);
  for (const n of levelFilter(nouns, settings)) {
    const base = {
      level: n.level,
      context: n.english,
      nounId: n.id,
      format: (settings.typed ? 'typed' : 'choice') as 'typed' | 'choice',
    };
    const skills = [`noun:${n.id}`, `gender:${n.gender}`];
    if (n.gender !== 'p') {
      qs.push(
        question({
          ...base,
          id: `article:${n.id}`,
          topic: 'article',
          prompt: `___ ${n.word}`,
          answer: n.article,
          options: ['der', 'die', 'das'],
          skills,
          explanation: `${n.word} is ${genderNames[n.gender].toLowerCase()}: ${n.article} ${n.word}. ${n.notes}`,
        }),
      );
      qs.push(
        question({
          ...base,
          id: `gender:${n.id}`,
          topic: 'gender',
          prompt: `What gender is “${n.word}”?`,
          answer: genderNames[n.gender],
          options: ['Masculine', 'Feminine', 'Neuter'],
          skills,
          explanation: `${n.article} ${n.word} is ${genderNames[n.gender].toLowerCase()}.`,
        }),
      );
      if (n.plural !== '—')
        qs.push(
          question({
            ...base,
            id: `plural:${n.id}`,
            topic: 'plural',
            prompt: `One ${n.word}. Many …?`,
            answer: n.plural,
            options: [n.word + 's', n.word + 'en', n.word + 'e', n.word],
            skills: [
              `noun:${n.id}`,
              `plural:${n.id}`,
              `plural-pattern:${n.word === n.plural ? 'unchanged' : n.plural.endsWith('en') ? 'en' : n.plural.slice(-1)}`,
            ],
            explanation: `${n.article} ${n.word} → die ${n.plural}. ${n.notes}`,
          }),
        );
    }
    for (const c of cs)
      for (const type of ['definite', 'indefinite', 'negative'] as const)
        for (const plural of [false, true]) {
          if (plural && (n.gender === 'p' || n.plural === '—')) continue;
          const g = plural ? 'p' : n.gender;
          if (type === 'indefinite' && g === 'p') continue;
          qs.push(
            question({
              ...base,
              id: `phrase:${n.id}:${c}:${type}${plural ? ':plural' : ''}`,
              topic: 'phrase',
              case: c,
              prompt: `${n.word} · ${caseNames[c]}`,
              context: `Use the ${type} article · ${g === 'p' ? 'plural' : 'singular'}`,
              answer: nounPhrase(n, c, type, plural),
              options: cases.filter((x) => x !== c).map((x) => nounPhrase(n, x, type, plural)),
              skills: [
                `noun:${n.id}`,
                `gender:${g}`,
                `article-type:${type}`,
                `combination:${g}:${c}`,
              ],
              explanation: `${nounPhrase(n, c, type, plural)}. ${caseRules[c]} ${n.notes}`,
            }),
          );
        }
  }
  // Contexts explicitly specify case, number and type, avoiding ambiguous blank sentences.
  for (const c of cs)
    for (const g of ['m', 'f', 'n', 'p'] as Gender[])
      for (const type of ['definite', 'indefinite', 'negative'] as const) {
        const answer = articles[type][c][g];
        if (answer === '—') continue;
        qs.push(
          question({
            id: `declension:${type}:${g}:${c}`,
            topic: 'declension',
            level: settings.level,
            case: c,
            format: settings.typed ? 'typed' : 'choice',
            prompt: `${caseNames[c]} · ${genderNames[g]}`,
            context: `Choose the ${type} article`,
            answer,
            options: Object.values(articles[type])
              .map((row) => row[g])
              .concat(Object.values(articles[type][c])),
            skills: [`article-type:${type}`, `combination:${g}:${c}`, `gender:${g}`],
            explanation: `${answer} is the ${type} ${genderNames[g].toLowerCase()} ${caseNames[c].toLowerCase()} form. ${caseRules[c]}`,
          }),
        );
      }
  const sentences: [Case, string, string, string][] = [
    ['NOM', 'Der Hund schläft.', 'Der Hund', 'The dog is the subject.'],
    ['NOM', 'Die Kinder spielen.', 'Die Kinder', 'The children are the subject.'],
    ['AKK', 'Ich sehe den Hund.', 'den Hund', 'Sehen takes an accusative object.'],
    ['AKK', 'Das Geschenk ist für die Frau.', 'die Frau', 'Für takes accusative.'],
    ['DAT', 'Ich helfe dem Mann.', 'dem Mann', 'Helfen requires dative.'],
    ['DAT', 'Wir fahren mit dem Bus.', 'dem Bus', 'Mit requires dative.'],
    [
      'GEN',
      'Das ist das Buch des Lehrers.',
      'des Lehrers',
      'The genitive identifies whose book it is.',
    ],
    [
      'GEN',
      'Die Farbe der Tasche ist schön.',
      'der Tasche',
      'The genitive links the color to the bag.',
    ],
    ['DAT', 'Das Buch liegt auf dem Tisch.', 'dem Tisch', 'A location after auf takes dative.'],
    [
      'AKK',
      'Ich lege das Buch auf den Tisch.',
      'den Tisch',
      'A destination after auf takes accusative.',
    ],
  ];
  sentences.forEach(([c, s, phrase, why], i) => {
    if (!cs.includes(c)) return;
    qs.push(
      question({
        id: `case:${i}`,
        topic: 'case',
        level: settings.level,
        case: c,
        format: 'choice',
        prompt: s,
        context: `Which case is “${phrase}”?`,
        answer: caseNames[c],
        options: Object.values(caseNames),
        explanation: why,
        skills: [],
      }),
    );
    const article = phrase.split(' ')[0];
    qs.push(
      question({
        id: `sentence:${i}`,
        topic: 'declension',
        level: settings.level,
        case: c,
        format: settings.typed ? 'typed' : 'choice',
        prompt: s.replace(phrase, `___ ${phrase.split(' ').slice(1).join(' ')}`),
        context: 'Complete with the definite article',
        answer: article,
        options: ['der', 'die', 'das', 'den', 'dem', 'des'].filter((v) => v !== article),
        explanation: why,
        skills: ['article-type:definite'],
      }),
    );
  });
  for (const p of people)
    for (const c of cs) {
      const ci = cases.indexOf(c);
      qs.push(
        question({
          id: `personal:${p.id}:${c}`,
          topic: 'personal',
          level: settings.level,
          case: c,
          format: settings.typed ? 'typed' : 'choice',
          prompt: `${p.label} → ${caseNames[c]}`,
          context: c === 'GEN' ? 'Literary / formal usage' : 'Choose the personal pronoun',
          answer: p.forms[ci],
          options: p.forms.concat(people.map((x) => x.forms[ci])),
          strictCase: ['Sie', 'sie-sg', 'sie-pl'].includes(p.id),
          skills: [`person:${p.id}`],
          explanation: `The ${caseNames[c].toLowerCase()} form of ${p.label} is ${p.forms[ci]}. ${c === 'GEN' ? 'Genitive personal pronouns are uncommon in everyday speech.' : caseRules[c]}`,
        }),
      );
      for (const g of ['m', 'f', 'n', 'p'] as Gender[])
        for (const standalone of [false, true]) {
          if (standalone && !override && levels.indexOf(settings.level) < 2) continue;
          const answer = possessive(p.stem, c, g, standalone);
          const topic = standalone ? 'standalone' : 'possessive';
          qs.push(
            question({
              id: `${topic}:${p.id}:${g}:${c}`,
              topic,
              level: settings.level,
              case: c,
              format: settings.typed ? 'typed' : 'choice',
              prompt: `${p.stem} → ${caseNames[c]} · ${genderNames[g]}`,
              context: `Possessor: ${p.label} · ${standalone ? 'standalone, without a noun' : 'determiner, before a noun'}${standalone && c === 'GEN' ? ' · rare/formal' : ''}`,
              answer,
              strictCase: ['Sie', 'sie-sg', 'sie-pl'].includes(p.id),
              options: cases
                .map((k) => possessive(p.stem, k, g, standalone))
                .concat(
                  ['m', 'f', 'n', 'p'].map((k) => possessive(p.stem, c, k as Gender, standalone)),
                ),
              skills: [`possessor:${p.id}`, `combination:${g}:${c}`],
              explanation: `${answer}: the possessor selects ${p.stem}; ${genderNames[g].toLowerCase()} and ${caseNames[c].toLowerCase()} select the ending. ${standalone ? 'This pronoun replaces the noun.' : 'This determiner accompanies a noun.'} ${p.stem === 'euer' ? 'Euer contracts to eur- before an ending.' : ''}`,
            }),
          );
        }
    }
  const replacements: [Case, string, string, string, string][] = [
    ['AKK', 'Ich sehe den Mann.', 'Replace “den Mann”', 'ihn', 'er'],
    ['AKK', 'Wir besuchen die Frau.', 'Replace “die Frau”', 'sie', 'sie-sg'],
    ['DAT', 'Ich helfe den Kindern.', 'Replace “den Kindern”', 'ihnen', 'sie-pl'],
    ['DAT', 'Das Buch gehört dem Mädchen.', 'Replace “dem Mädchen”', 'ihm', 'es'],
    ['AKK', 'Ich kenne die Kinder.', 'Replace “die Kinder”', 'sie', 'sie-pl'],
    ['DAT', 'Wir danken dem Lehrer.', 'Replace “dem Lehrer”', 'ihm', 'er'],
  ];
  replacements.forEach(([c, prompt, context, answer, person], i) => {
    if (!cs.includes(c)) return;
    qs.push(
      question({
        id: `replace:${i}`,
        topic: 'personal',
        level: settings.level,
        case: c,
        prompt,
        context,
        answer,
        format: settings.typed ? 'typed' : 'choice',
        options: ['er', 'ihn', 'ihm', 'sie', 'ihnen'],
        skills: [`person:${person}`],
        explanation: `Use ${answer} to retain the ${caseNames[c].toLowerCase()} case of the original noun phrase. ${caseRules[c]}`,
      }),
    );
  });
  for (const q of sentenceExercises) {
    if (
      (override || levels.indexOf(q.level) <= levels.indexOf(settings.level)) &&
      (!q.case || cs.includes(q.case))
    )
      qs.push(
        question({
          ...q,
          format:
            settings.typed && q.topic !== 'case' && !q.id.startsWith('usage-') ? 'typed' : 'choice',
        }),
      );
  }
  return qs;
}
export function updateStat(
  prev: Stat | undefined,
  id: string,
  correct: boolean,
  now: number,
): Stat {
  const p = prev || {
    id,
    attempts: 0,
    correct: 0,
    incorrect: 0,
    recent: [],
    streak: 0,
    last: 0,
    due: 0,
    mastery: 0,
    ease: 2.5,
    interval: 0,
  };
  const streak = correct ? p.streak + 1 : 0;
  const interval = correct
    ? streak === 1
      ? 1
      : streak === 2
        ? 3
        : Math.min(180, Math.max(1, p.interval) * p.ease)
    : 0;
  const recent = [...p.recent, correct].slice(-10);
  const accuracy = (p.correct + Number(correct)) / (p.attempts + 1);
  const mastery = Math.round(
    100 *
      Math.min(1, (p.attempts + 1) / 8) *
      (0.6 * accuracy + (0.4 * recent.filter(Boolean).length) / recent.length),
  );
  return {
    id,
    attempts: p.attempts + 1,
    correct: p.correct + Number(correct),
    incorrect: p.incorrect + Number(!correct),
    recent,
    streak,
    last: now,
    due: now + (correct ? interval * 86400000 : 600000),
    mastery,
    ease: Math.max(1.3, p.ease + (correct ? 0.05 : -0.2)),
    interval,
  };
}
export function classification(q: Question, input: string): string {
  if (
    normalize(input).replace(/[äöüß]/g, (c) => ({ ä: 'a', ö: 'o', ü: 'u', ß: 'ss' })[c]!) ===
    normalize(q.answer).replace(/[äöüß]/g, (c) => ({ ä: 'a', ö: 'o', ü: 'u', ß: 'ss' })[c]!)
  )
    return 'Spelling / umlaut';
  if (q.topic === 'article' || q.topic === 'gender') return 'Incorrect noun gender';
  if (q.topic === 'plural') return 'Incorrect plural';
  if (q.topic === 'personal') return 'Personal pronoun case confusion';
  if (q.topic === 'possessive' || q.topic === 'standalone') return 'Possessive declension error';
  return `${q.case ? caseNames[q.case] + ' ' : ''}${q.topic === 'case' ? 'case confusion' : 'article / noun ending'}`;
}
export function recordAnswer(q: Question, answer: string, sessionId: string): Attempt {
  return {
    id: crypto.randomUUID(),
    questionId: q.id,
    topic: q.topic,
    level: q.level,
    skills: [`item:${q.id}`, ...q.skills],
    answer,
    expected: q.answer,
    prompt: q.prompt,
    explanation: q.explanation,
    correct: validate(answer, q),
    classification: validate(answer, q) ? 'Correct' : classification(q, answer),
    at: Date.now(),
    sessionId,
  };
}
const shuffle = <T>(arr: T[], rng: () => number): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export function schedule(
  bank: Question[],
  stats: Stat[],
  count: number,
  mode: Mode,
  weights = defaults.weights,
  rng = Math.random,
  now = Date.now(),
): Question[] {
  const map = new Map(stats.map((s) => [s.id, s]));
  const weak = (q: Question) =>
    q.skills.some((k) => {
      const s = map.get(k);
      return s && ((s.attempts >= 2 && s.mastery < 65) || s.recent.slice(-3).includes(false));
    });
  const weakPool = shuffle(bank.filter(weak), rng).sort(
    (a, b) =>
      Math.min(...a.skills.map((k) => map.get(k)?.mastery ?? 100)) -
      Math.min(...b.skills.map((k) => map.get(k)?.mastery ?? 100)),
  );
  const duePool = shuffle(
    bank.filter((q) => {
      const s = map.get(`item:${q.id}`);
      return s && s.due <= now;
    }),
    rng,
  ).sort((a, b) => map.get(`item:${a.id}`)!.due - map.get(`item:${b.id}`)!.due);
  // Balance new material by topic so large paradigms cannot drown out noun questions.
  const topics = shuffle([...new Set(bank.map((q) => q.topic))], rng);
  const groups = topics.map((t) =>
    shuffle(
      bank.filter((q) => q.topic === t && !map.has(`item:${q.id}`)),
      rng,
    ),
  );
  const newPool: Question[] = [];
  while (groups.some((g) => g.length))
    for (const g of groups) {
      const q = g.pop();
      if (q) newPool.push(q);
    }
  const stale = shuffle(bank, rng).sort(
    (a, b) => (map.get(`item:${a.id}`)?.last || 0) - (map.get(`item:${b.id}`)?.last || 0),
  );
  const result: Question[] = [];
  const used = new Set<string>();
  const take = (pool: Question[], n: number) => {
    for (const q of pool) {
      if (n <= 0) break;
      if (!used.has(q.id)) {
        used.add(q.id);
        result.push({ ...q, options: shuffle(q.options, rng) });
        n--;
      }
    }
  };
  if (mode === 'exam') {
    take(shuffle(bank, rng), count);
    return result;
  }
  const newCount = Math.max(1, Math.round((count * weights[2]) / 100));
  take(newPool, newCount); // Reserve new material even during weakness/review sessions.
  const weakCount = mode === 'weak' ? count - newCount : Math.round((count * weights[0]) / 100);
  take(mode === 'daily' ? duePool : weakPool, weakCount);
  take(mode === 'daily' ? weakPool : duePool, count - result.length);
  take(duePool, count - result.length);
  take(weakPool, count - result.length);
  take(newPool, count - result.length);
  take(stale, count - result.length);
  return shuffle(result, rng);
}
export function reinforce(
  questions: Question[],
  index: number,
  failed: Question,
  bank: Question[],
): Question[] {
  const target = index + 3;
  if (target >= questions.length) return questions;
  const specific =
    failed.skills.find((s) => s.startsWith('combination:') || s.startsWith('plural-pattern:')) ||
    failed.skills.find((s) => s.startsWith('gender:'));
  const candidate = bank.find(
    (q) =>
      (!specific || q.skills.includes(specific)) &&
      q.id !== failed.id &&
      !questions.some((x) => x.id === q.id) &&
      q.topic === failed.topic &&
      (!failed.case || q.case === failed.case) &&
      q.skills.some((s) => failed.skills.includes(s) && !s.startsWith('level:')),
  );
  if (!candidate) return questions;
  const copy = [...questions];
  copy[target] = { ...candidate, options: shuffle(candidate.options, Math.random) };
  return copy;
}
export function skillLabel(id: string) {
  return id
    .replace(/^item:/, '')
    .replace(/^topic:/, '')
    .replace(/^case:/, '')
    .replace(/^gender:/, 'Gender: ')
    .replace(/^noun:/, 'Word: ')
    .replace(/^combination:/, 'Gender / case: ')
    .replace(/^article-type:/, 'Article: ')
    .replace(/^person:/, 'Pronoun: ')
    .replace(/^possessor:/, 'Possessor: ')
    .replace(/^plural:/, 'Plural: ')
    .replace(/^level:/, 'Level: ');
}
export function localDay(at: number) {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function streak(attempts: Attempt[], now = Date.now()) {
  const days = new Set(attempts.map((a) => localDay(a.at)));
  const d = new Date(now);
  let n = 0;
  if (!days.has(localDay(+d))) d.setDate(d.getDate() - 1);
  while (days.has(localDay(+d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
