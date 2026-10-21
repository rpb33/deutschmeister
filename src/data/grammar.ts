import type { ArticleType, Case, Gender, Noun, Topic, Level } from '../types';
export const genderNames: Record<Gender, string> = {
  m: 'Masculine',
  f: 'Feminine',
  n: 'Neuter',
  p: 'Plural',
};
export const caseNames: Record<Case, string> = {
  NOM: 'Nominative',
  AKK: 'Accusative',
  DAT: 'Dative',
  GEN: 'Genitive',
};
export const caseRules: Record<Case, string> = {
  NOM: 'The subject of a sentence uses the nominative.',
  AKK: 'A direct object normally uses the accusative.',
  DAT: 'Indirect objects and verbs such as helfen take the dative.',
  GEN: 'The genitive often expresses possession or a relationship between nouns.',
};
export const articles: Record<ArticleType, Record<Case, Record<Gender, string>>> = {
  definite: {
    NOM: { m: 'der', f: 'die', n: 'das', p: 'die' },
    AKK: { m: 'den', f: 'die', n: 'das', p: 'die' },
    DAT: { m: 'dem', f: 'der', n: 'dem', p: 'den' },
    GEN: { m: 'des', f: 'der', n: 'des', p: 'der' },
  },
  indefinite: {
    NOM: { m: 'ein', f: 'eine', n: 'ein', p: '—' },
    AKK: { m: 'einen', f: 'eine', n: 'ein', p: '—' },
    DAT: { m: 'einem', f: 'einer', n: 'einem', p: '—' },
    GEN: { m: 'eines', f: 'einer', n: 'eines', p: '—' },
  },
  negative: {
    NOM: { m: 'kein', f: 'keine', n: 'kein', p: 'keine' },
    AKK: { m: 'keinen', f: 'keine', n: 'kein', p: 'keine' },
    DAT: { m: 'keinem', f: 'keiner', n: 'keinem', p: 'keinen' },
    GEN: { m: 'keines', f: 'keiner', n: 'keines', p: 'keiner' },
  },
};
export function nounForm(noun: Noun, c: Case, plural = false): string {
  if (plural || noun.gender === 'p') return c === 'DAT' ? noun.dativePlural : noun.plural;
  if (c === 'GEN') return noun.genitive;
  if (c !== 'NOM' && noun.weak) return noun.word === 'Herr' ? 'Herrn' : noun.plural;
  if ((c === 'DAT' || c === 'AKK') && ['Name', 'Gedanke'].includes(noun.word))
    return noun.word + 'n';
  if (c === 'DAT' && noun.word === 'Herz') return 'Herzen';
  return noun.word;
}
export function nounPhrase(
  noun: Noun,
  c: Case,
  type: ArticleType = 'definite',
  plural = false,
): string {
  const g = plural ? 'p' : noun.gender;
  const a = articles[type][c][g];
  return (a === '—' ? '' : a + ' ') + nounForm(noun, c, plural);
}
export const people = [
  { id: 'ich', label: 'ich · I', forms: ['ich', 'mich', 'mir', 'meiner'], stem: 'mein' },
  {
    id: 'du',
    label: 'du · you (informal singular)',
    forms: ['du', 'dich', 'dir', 'deiner'],
    stem: 'dein',
  },
  { id: 'er', label: 'er · he', forms: ['er', 'ihn', 'ihm', 'seiner'], stem: 'sein' },
  { id: 'sie-sg', label: 'sie · she', forms: ['sie', 'sie', 'ihr', 'ihrer'], stem: 'ihr' },
  { id: 'es', label: 'es · it', forms: ['es', 'es', 'ihm', 'seiner'], stem: 'sein' },
  { id: 'wir', label: 'wir · we', forms: ['wir', 'uns', 'uns', 'unser'], stem: 'unser' },
  {
    id: 'ihr',
    label: 'ihr · you (informal plural)',
    forms: ['ihr', 'euch', 'euch', 'euer'],
    stem: 'euer',
  },
  { id: 'sie-pl', label: 'sie · they', forms: ['sie', 'sie', 'ihnen', 'ihrer'], stem: 'ihr' },
  { id: 'Sie', label: 'Sie · you (formal)', forms: ['Sie', 'Sie', 'Ihnen', 'Ihrer'], stem: 'Ihr' },
];
const endings: Record<Case, Record<Gender, string>> = {
  NOM: { m: '', f: 'e', n: '', p: 'e' },
  AKK: { m: 'en', f: 'e', n: '', p: 'e' },
  DAT: { m: 'em', f: 'er', n: 'em', p: 'en' },
  GEN: { m: 'es', f: 'er', n: 'es', p: 'er' },
};
export function possessive(stem: string, c: Case, g: Gender, standalone = false): string {
  let ending = endings[c][g];
  if (standalone && c === 'NOM' && g === 'm') ending = 'er';
  if (standalone && (c === 'NOM' || c === 'AKK') && g === 'n') ending = 'es';
  return (stem === 'euer' && ending ? 'eur' : stem) + ending;
}
export const topicNames: Record<Topic, string> = {
  article: 'Noun articles',
  gender: 'Noun genders',
  plural: 'Plurals',
  declension: 'Article declensions',
  case: 'Identify the case',
  phrase: 'Noun phrases',
  personal: 'Personal pronouns',
  possessive: 'Possessive determiners',
  standalone: 'Standalone possessives',
};
export interface Lesson {
  id: string;
  title: string;
  level: Level;
  topic: Topic;
  c?: Case;
  rule: string;
  explanation: string;
  example: string;
  translation: string;
  mistake: string;
}
export const lessons: Lesson[] = [
  {
    id: 'genders',
    title: 'Meet der, die & das',
    level: 'A1',
    topic: 'article',
    rule: 'Learn every noun together with its article and plural.',
    explanation:
      'German has three grammatical genders. Gender is a property of the word, not necessarily of the person or thing. Nouns ending in -chen are neuter; -ung and -heit are usually feminine.',
    example: 'Das Mädchen liest ein Buch.',
    translation: 'The girl is reading a book.',
    mistake: 'Mädchen is neuter even though it means girl.',
  },
  {
    id: 'plurals',
    title: 'One book, many books',
    level: 'A1',
    topic: 'plural',
    rule: 'The nominative plural definite article is always die.',
    explanation:
      'Plural endings include -e, -er, -(e)n, -s and no ending. An umlaut may also appear. There is no plural form of ein: use Bücher, not eine Bücher.',
    example: 'Das Buch → die Bücher. Der Lehrer → die Lehrer.',
    translation: 'The book → the books. The teacher → the teachers.',
    mistake:
      'Do not add -s to every German noun. Some words, such as Eltern, exist only in the plural.',
  },
  ...(['NOM', 'AKK', 'DAT', 'GEN'] as Case[]).map((c, i) => ({
    id: c,
    title: caseNames[c] + ' made clear',
    level: (['A1', 'A1', 'A2', 'B1'] as Level[])[i],
    topic: 'declension' as Topic,
    c,
    rule: caseRules[c],
    explanation: [
      'Ask “who or what is doing this?” Predicate nouns after sein also use nominative.',
      'Ask “whom or what does the subject see, buy or have?” The masculine definite article changes from der to den.',
      'Ask “to whom?” Dative also follows mit, nach, bei, seit, von, zu and aus. Add -n to a plural noun unless it already ends in -n or -s.',
      'The masculine and neuter definite article becomes des, and the noun usually takes -(e)s. Feminine and plural articles become der. Genitive is especially useful in written German.',
    ][i],
    example: [
      'Der Hund schläft.',
      'Ich sehe den Hund.',
      'Ich helfe dem Mann.',
      'Das ist das Fahrrad des Kindes.',
    ][i],
    translation: [
      'The dog is sleeping.',
      'I see the dog.',
      'I help the man.',
      'That is the child’s bicycle.',
    ][i],
    mistake: [
      'Do not use the accusative for the subject.',
      'Only masculine articles change between nominative and accusative.',
      'Helfen requires dative, even though English uses a direct object.',
      'Weak masculine nouns take -(e)n, not an extra -s: des Studenten.',
    ][i],
  })),
  {
    id: 'negative',
    title: 'Saying “not a” with kein',
    level: 'A1',
    topic: 'declension',
    rule: 'Kein declines like ein in the singular and has plural forms.',
    explanation:
      'Use kein to negate a noun with an indefinite article or no article. In the dative plural, use keinen and the noun’s dative plural form.',
    example: 'Ich habe keinen Hund. Ich fahre mit keinen Freunden.',
    translation: 'I do not have a dog. I am not traveling with any friends.',
    mistake: 'There is no indefinite plural article, but there is a negative plural: keine Bücher.',
  },
  {
    id: 'personal',
    title: 'From people to pronouns',
    level: 'A1',
    topic: 'personal',
    rule: 'A replacement pronoun keeps the case of the noun phrase it replaces.',
    explanation:
      'Sie can mean she, they or formal you. Context, verb agreement and capitalization distinguish them. Genitive personal pronouns are rare, mainly in literary or formal expressions such as Wir gedenken ihrer (We remember her/them).',
    example: 'Ich sehe den Mann. → Ich sehe ihn.',
    translation: 'I see the man. → I see him.',
    mistake: 'Ihn is accusative; ihm is dative. Formal Sie and Ihnen always begin with a capital.',
  },
  {
    id: 'possessive',
    title: 'Mine, yours & ours',
    level: 'A2',
    topic: 'possessive',
    rule: 'The possessor selects the stem; the possessed noun selects the ending.',
    explanation:
      'Mein, dein, sein, ihr, unser, euer and Ihr follow ein endings when they accompany a noun. Euer usually loses its second e before an ending: eure, eurem.',
    example: 'Ich helfe meinem Bruder. Ist das euer Haus?',
    translation: 'I help my brother. Is that your house?',
    mistake:
      'Use the gender and case of Bruder to select meinem, regardless of the speaker’s gender.',
  },
  {
    id: 'standalone',
    title: 'Let the possessive stand alone',
    level: 'B1',
    topic: 'standalone',
    rule: 'Without a noun, the pronoun carries the gender marking itself.',
    explanation:
      'Compare mein Hund with meiner, and mein Buch with meines (also meins). Our tables show the full forms. Genitive standalone forms are rare and mostly formal; everyday speech usually rephrases them.',
    example: 'Ist das dein Stift? – Nein, das ist meiner.',
    translation: 'Is that your pen? – No, that is mine.',
    mistake: 'Mein alone is not the masculine nominative standalone form. Use meiner.',
  },
  {
    id: 'prepositions',
    title: 'Prepositions that choose a case',
    level: 'A2',
    topic: 'case',
    rule: 'Aus, bei, mit, nach, seit, von and zu take dative; durch, für, gegen, ohne and um take accusative.',
    explanation:
      'The preposition determines the case even when the English translation suggests something different. Wegen and trotz normally take genitive in formal standard German.',
    example: 'Das Geschenk ist für den Lehrer. Ich fahre mit dem Bus.',
    translation: 'The gift is for the teacher. I travel by bus.',
    mistake: 'Mit always takes dative: mit dem Bus, not mit den Bus.',
  },
  {
    id: 'two-way',
    title: 'Where, or where to?',
    level: 'A2',
    topic: 'case',
    rule: 'An, auf, hinter, in, neben, über, unter, vor and zwischen take dative for location and accusative for a destination.',
    explanation:
      'The distinction is location versus a change of location in relation to the object, not simply movement versus no movement. Walking around inside a park can still use dative.',
    example: 'Das Buch liegt auf dem Tisch. Ich lege es auf den Tisch.',
    translation: 'The book is on the table. I put it onto the table.',
    mistake: 'Do not assume every sentence involving movement takes accusative.',
  },
  {
    id: 'verbs',
    title: 'Verbs with a favorite case',
    level: 'A2',
    topic: 'personal',
    c: 'DAT',
    rule: 'Helfen, danken, gehören, folgen and gefallen take dative objects.',
    explanation:
      'Many other verbs, including sehen, kennen and besuchen, take accusative objects. Learn the object case together with the verb.',
    example: 'Ich danke dir. Sie besucht mich.',
    translation: 'I thank you. She visits me.',
    mistake: 'English object patterns do not reliably predict German case.',
  },
  {
    id: 'irregular',
    title: 'The exceptions worth knowing',
    level: 'B1',
    topic: 'phrase',
    rule: 'Weak masculine nouns take -(e)n outside nominative singular.',
    explanation:
      'Examples include Student, Junge, Mensch and Kollege. Herr becomes Herrn in singular oblique cases, but Herren in plural. Name is mixed: den Namen, dem Namen, des Namens. Herz has des Herzens and dem Herzen.',
    example: 'Ich spreche mit dem Studenten. Das ist der Name des Herrn.',
    translation: 'I am speaking with the student. That is the gentleman’s name.',
    mistake: 'Des Studenten is correct; des Students is not.',
  },
  {
    id: 'formal',
    title: 'Precise German in formal writing',
    level: 'B2',
    topic: 'phrase',
    c: 'GEN',
    rule: 'Use genitive noun phrases to express precise relationships in formal writing.',
    explanation:
      'Longer noun phrases are common in reports and arguments. Identify the head noun and decline each dependent phrase separately. Personal genitive pronouns are much rarer than genitive articles.',
    example: 'Die Auswirkungen des Wettbewerbs sind deutlich.',
    translation: 'The effects of competition are clear.',
    mistake:
      'Do not confuse the possessive determiner meiner with the rare personal genitive meiner; their functions differ.',
  },
];
