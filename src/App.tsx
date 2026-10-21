import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Flame,
  GraduationCap,
  Home,
  Leaf,
  Moon,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  Sparkles,
  Target,
  TrendingUp,
  Volume2,
  X,
  Zap,
  Download,
  Upload,
  Sun,
  Trophy,
  WifiOff,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cases, levels } from './types';
import type {
  ArticleType,
  Case,
  Gender,
  Mode,
  Noun,
  Session,
  Settings,
  Snapshot,
  Topic,
} from './types';
import { nouns } from './data/nouns';
import {
  articles,
  caseNames,
  caseRules,
  genderNames,
  lessons,
  nounPhrase,
  people,
  possessive,
  topicNames,
} from './data/grammar';
import {
  defaults,
  levelFilter,
  localDay,
  questionBank,
  recordAnswer,
  reinforce,
  schedule,
  streak,
} from './lib/engine';
import {
  importBackup,
  parseBackup,
  persistAnswer,
  readSnapshot,
  resetProgress,
  saveSession,
  saveSettings,
} from './lib/storage';

type Tab = 'Dashboard' | 'Learn' | 'Practice' | 'Review' | 'Settings';
const nav: { label: Tab; icon: LucideIcon }[] = [
  { label: 'Dashboard', icon: Home },
  { label: 'Learn', icon: BookOpen },
  { label: 'Practice', icon: Zap },
  { label: 'Review', icon: RotateCcw },
  { label: 'Settings', icon: SettingsIcon },
];
const modeNames: Record<Mode, string> = {
  quick: 'Quick practice',
  focused: 'Focused practice',
  daily: 'Daily review',
  weak: 'Weakness trainer',
  exam: 'Exam mode',
};
const levelLabels = ['Beginner', 'Elementary', 'Intermediate', 'Upper-intermediate'];
const empty: Snapshot = { version: 1, settings: defaults, stats: [], attempts: [], session: null };
const percent = (correct: number, total: number) =>
  total ? Math.round((correct / total) * 100) : 0;
function IconBox({ icon: Icon, tone = 'green' }: { icon: LucideIcon; tone?: string }) {
  return (
    <span className={`icon-box ${tone}`}>
      <Icon size={22} />
    </span>
  );
}
function Progress({ value, label = 'Learning progress' }: { value: number; label?: string }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.min(100, value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
function LevelSelect({ settings, update }: { settings: Settings; update: (s: Settings) => void }) {
  return (
    <div className="level-select">
      {levels.map((l, i) => (
        <button
          key={l}
          className={settings.level === l ? 'selected' : ''}
          onClick={() => update({ ...settings, level: l })}
        >
          <strong>{l}</strong>
          <span>{levelLabels[i]}</span>
        </button>
      ))}
    </div>
  );
}
function App() {
  const [data, setData] = useState<Snapshot>(empty);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('Dashboard');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [showQuiz, setShowQuiz] = useState(false);
  const [focusTopics, setFocusTopics] = useState<Topic[]>(['article']);
  const [focusCases, setFocusCases] = useState<Case[]>([...cases]);
  const [override, setOverride] = useState(false);
  const [length, setLength] = useState(10);
  const [person, setPerson] = useState('all');
  const [studyTopic, setStudyTopic] = useState<Topic | null>(null);
  const lock = useRef(false);
  const settingsQueue = useRef(Promise.resolve());
  const settingsVersion = useRef(0);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const refresh = async () => {
    const snapshot = await readSnapshot();
    setData(snapshot);
    setLength(snapshot.settings.length);
    return snapshot;
  };
  useEffect(() => {
    refresh()
      .then(() => setLoaded(true))
      .catch(() => {
        setError('Local storage could not be opened. Allow browser storage, then reload.');
        setLoaded(true);
      });
    const on = () => setOnline(navigator.onLine);
    addEventListener('online', on);
    addEventListener('offline', on);
    return () => {
      removeEventListener('online', on);
      removeEventListener('offline', on);
    };
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle(
        'dark',
        data.settings.theme === 'dark' || (data.settings.theme === 'system' && media.matches),
      );
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [data.settings.theme]);
  async function action(fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await settingsQueue.current;
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Your previous progress is safe.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const update = (settings: Settings) => {
    setData((d) => ({ ...d, settings }));
    setLength(settings.length);
    setSettingsSaving(true);
    const version = ++settingsVersion.current;
    settingsQueue.current = settingsQueue.current
      .then(() => saveSettings(settings))
      .catch(async () => {
        setError('Preferences could not be saved. Check available browser storage and try again.');
        if (version === settingsVersion.current) {
          const saved = await readSnapshot();
          setData((d) => ({ ...d, settings: saved.settings }));
        }
      })
      .finally(() => {
        if (version === settingsVersion.current) setSettingsSaving(false);
      });
  };
  const stats = data.stats;
  const attempts = data.attempts;
  const settings = data.settings;
  const session = data.session;
  const due = stats.filter((s) => s.id.startsWith('item:') && s.due <= Date.now());
  const weak = stats
    .filter((s) => s.id.startsWith('topic:') && s.attempts >= 2 && s.mastery < 65)
    .sort((a, b) => a.mastery - b.mastery);
  function start(mode: Mode, topics?: Topic[], cs?: Case[]) {
    void action(async () => {
      if (
        session &&
        !session.complete &&
        !window.confirm('Replace your unfinished session? Answers already submitted will be kept.')
      )
        return;
      let bank = questionBank(settings, topics ? true : mode === 'focused' ? override : false);
      if (mode === 'focused' || topics) {
        bank = bank.filter(
          (q) =>
            (topics || focusTopics).includes(q.topic) &&
            (!q.case || (cs || focusCases).includes(q.case)) &&
            (person === 'all' ||
              !['personal', 'possessive', 'standalone'].includes(q.topic) ||
              q.skills.includes(`person:${person}`) ||
              q.skills.includes(`possessor:${person}`)),
        );
      }
      const questions = schedule(
        bank,
        stats,
        mode === 'quick' ? 10 : length,
        mode,
        settings.weights,
      );
      if (!questions.length)
        throw new Error(
          'No questions match these filters. Choose another topic or enable all grammar levels.',
        );
      const next: Session = {
        id: crypto.randomUUID(),
        mode,
        questions,
        index: 0,
        answers: [],
        started: Date.now(),
        complete: false,
        feedback: false,
      };
      await saveSession(next);
      setData((d) => ({ ...d, session: next }));
      setShowQuiz(true);
    });
  }
  function answer(input: string) {
    if (!session || session.feedback || session.complete) return;
    void action(async () => {
      const q = session.questions[session.index];
      const attempt = recordAnswer(q, input, session.id);
      const next = {
        ...session,
        answers: [...session.answers, attempt],
        feedback: true,
        questions:
          !attempt.correct && session.mode !== 'exam'
            ? reinforce(session.questions, session.index, q, questionBank(settings, true))
            : session.questions,
      };
      await persistAnswer(attempt, next);
      await refresh();
    });
  }
  function nextQuestion() {
    if (!session) return;
    void action(async () => {
      const complete = session.index === session.questions.length - 1;
      const next = {
        ...session,
        complete,
        index: complete ? session.index : session.index + 1,
        feedback: false,
      };
      await saveSession(next);
      setData((d) => ({ ...d, session: next }));
    });
  }
  if (!loaded)
    return (
      <div className="loading">
        <Leaf size={36} />
        <h1>DeutschMeister</h1>
        <p>Getting your study space ready…</p>
      </div>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setShowQuiz(false);
            setTab('Dashboard');
          }}
        >
          <span className="brand-mark">
            d<span>m</span>
            <i />
          </span>
          <div>
            Deutsch<span>Meister</span>
            <small>A LITTLE GERMAN, EVERY DAY</small>
          </div>
        </a>
        <div className="sidebar-label">YOUR LEARNING SPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={tab === label && !showQuiz ? 'active' : ''}
              onClick={() => {
                setTab(label);
                setShowQuiz(false);
              }}
            >
              <Icon size={21} />
              <span>{label}</span>
              {label === 'Review' && due.length > 0 && <b>{due.length}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="plant">
            <Leaf size={32} />
          </div>
          <h3>Small steps. Real progress.</h3>
          <p>Build a habit that opens up a whole new language.</p>
          <span className="offline-label">
            <span /> Built for offline learning
          </span>
        </div>
        <div className="profile">
          <span>DU</span>
          <div>
            Dein Lernweg<small>Your personal learning journey</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">
              d<span>m</span>
              <i />
            </span>
            <strong>DeutschMeister</strong>
          </div>
          <div className="breadcrumb">
            Your learning space <ChevronRight size={14} />
            <strong>{showQuiz ? 'Practice session' : tab}</strong>
          </div>
          <div className="header-actions">
            {(tab === 'Settings' || !data.settings.onboarded) && (
              <span className="save-status" role="status">
                {settingsSaving ? 'Saving preferences…' : 'Saved on this device'}
              </span>
            )}
            {!online && (
              <span className="offline-chip">
                <WifiOff size={15} /> Offline
              </span>
            )}
            <span className="streak-chip">
              <Flame size={17} />
              {streak(attempts)}
              <span> day streak</span>
            </span>
            <button
              className="level-chip"
              onClick={() => {
                setTab('Settings');
                setShowQuiz(false);
              }}
            >
              {settings.level}
              <ChevronRight size={13} />
            </button>
            <button
              className="icon-button theme-toggle"
              aria-label="Toggle dark mode"
              onClick={() =>
                update({
                  ...settings,
                  theme: document.documentElement.classList.contains('dark') ? 'light' : 'dark',
                })
              }
            >
              {settings.theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>
        <main id="main">
          {error && (
            <div className="notice error" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError('')}>
                <X size={16} />
              </button>
            </div>
          )}
          {message && (
            <div className="notice" role="status">
              {message}
              <button aria-label="Dismiss message" onClick={() => setMessage('')}>
                <X size={16} />
              </button>
            </div>
          )}
          {!settings.onboarded ? (
            <section className="onboarding card">
              <span className="eyebrow">
                <Leaf size={16} /> YOUR GERMAN JOURNEY STARTS HERE
              </span>
              <h1>Hallo, future German speaker.</h1>
              <p>
                A little practice today. A little more confidence tomorrow.
                <br />
                Let’s make this learning space yours.
              </p>
              <h3>Where would you like to start?</h3>
              <LevelSelect settings={settings} update={update} />
              <div className="form-grid">
                <label>
                  Daily question goal
                  <select
                    value={settings.goal}
                    onChange={(e) => update({ ...settings, goal: +e.target.value })}
                  >
                    {[5, 10, 20, 30, 50].map((n) => (
                      <option key={n} value={n}>
                        {n} questions a day
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Preferred session length
                  <select
                    aria-label="Preferred session length"
                    value={settings.length}
                    onChange={(e) => update({ ...settings, length: +e.target.value })}
                  >
                    {[5, 10, 15, 20, 30].map((n) => (
                      <option key={n} value={n}>
                        {n} questions
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                className="primary"
                disabled={busy}
                onClick={() => update({ ...settings, onboarded: true })}
              >
                Start my journey <ArrowRight size={18} />
              </button>
              <p className="fine-print">No account. No ads. Your progress stays on this device.</p>
            </section>
          ) : showQuiz && session ? (
            <Quiz
              key={session.id}
              session={session}
              busy={busy}
              answer={answer}
              next={nextQuestion}
              exit={() => {
                setShowQuiz(false);
                setTab('Dashboard');
              }}
              study={() => {
                setStudyTopic(session.questions[session.index].topic);
                setShowQuiz(false);
                setTab('Learn');
              }}
            />
          ) : tab === 'Dashboard' ? (
            <Dashboard
              data={data}
              dueCount={due.length}
              weak={weak[0]?.id}
              start={start}
              navigate={setTab}
              resume={() => setShowQuiz(true)}
            />
          ) : tab === 'Learn' ? (
            <Learn
              initialTopic={studyTopic}
              settings={settings}
              practice={(topics, cs) => start('focused', topics, cs)}
            />
          ) : tab === 'Practice' ? (
            <>
              <PageTitle
                eyebrow="MAKE IT STICK"
                title="A little practice. A lot of progress."
                subtitle="Find your rhythm, focus on a skill, or see how far you’ve come."
              />
              <div className="practice-grid">
                {(
                  [
                    {
                      mode: 'quick',
                      icon: Zap,
                      tone: 'green',
                      description: 'Ten thoughtful questions, picked just for you.',
                      tag: 'YOUR DAILY MOMENT',
                    },
                    {
                      mode: 'focused',
                      icon: Target,
                      tone: 'purple',
                      description: 'Choose the topics and cases you want to work on.',
                      tag: 'BUILD YOUR SESSION',
                    },
                    {
                      mode: 'daily',
                      icon: RotateCcw,
                      tone: 'orange',
                      description: `Revisit what you’ve learned. ${due.length} questions are due.`,
                      tag: 'KEEP IT FRESH',
                    },
                    {
                      mode: 'weak',
                      icon: TrendingUp,
                      tone: 'blue',
                      description: 'Turn tricky spots into strengths with adaptive practice.',
                      tag: 'GROW YOUR CONFIDENCE',
                    },
                    {
                      mode: 'exam',
                      icon: GraduationCap,
                      tone: 'pink',
                      description: 'An uninterrupted assessment. Get your feedback at the end.',
                      tag: 'CHECK YOUR PROGRESS',
                    },
                  ] as const
                ).map((m) => (
                  <article className="card mode-card" key={m.mode}>
                    <IconBox icon={m.icon} tone={m.tone} />
                    <span className="eyebrow">{m.tag}</span>
                    <h2>{modeNames[m.mode]}</h2>
                    <p>{m.description}</p>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        m.mode === 'focused'
                          ? document
                              .getElementById('focus-builder')
                              ?.scrollIntoView({ behavior: 'smooth' })
                          : start(m.mode)
                      }
                    >
                      Let’s practice <ArrowRight size={17} />
                    </button>
                  </article>
                ))}
                <article className="card mode-card">
                  <IconBox icon={BookOpen} />
                  <span className="eyebrow">TAKE YOUR TIME</span>
                  <h2>Reference & study</h2>
                  <p>Clear explanations, vocabulary cards and interactive tables.</p>
                  <button className="text-button" onClick={() => setTab('Learn')}>
                    Explore lessons <ArrowRight size={17} />
                  </button>
                </article>
              </div>
              <section className="card focus-builder" id="focus-builder">
                <h2>Make it your practice</h2>
                <p className="muted">
                  These filters apply to focused practice. Session length also applies to review and
                  exam modes.
                </p>
                <div className="chip-group">
                  {Object.entries(topicNames).map(([t, label]) => (
                    <button
                      key={t}
                      className={focusTopics.includes(t as Topic) ? 'chip selected' : 'chip'}
                      aria-pressed={focusTopics.includes(t as Topic)}
                      onClick={() =>
                        setFocusTopics((a) =>
                          a.includes(t as Topic) ? a.filter((x) => x !== t) : [...a, t as Topic],
                        )
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="chip-group">
                  {cases.map((c) => (
                    <button
                      key={c}
                      className={focusCases.includes(c) ? 'chip selected' : 'chip'}
                      aria-pressed={focusCases.includes(c)}
                      onClick={() =>
                        setFocusCases((a) => (a.includes(c) ? a.filter((x) => x !== c) : [...a, c]))
                      }
                    >
                      {caseNames[c]}
                    </button>
                  ))}
                </div>
                <div className="form-grid">
                  <label>
                    Session length
                    <select
                      aria-label="Session length"
                      value={length}
                      onChange={(e) => setLength(+e.target.value)}
                    >
                      {[5, 10, 15, 20, 30].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Personal / possessive pronoun
                    <select value={person} onChange={(e) => setPerson(e.target.value)}>
                      <option value="all">All people</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={override}
                    onChange={(e) => setOverride(e.target.checked)}
                  />{' '}
                  Include grammar above my selected level
                </label>
                <button
                  className="primary"
                  disabled={busy || !focusTopics.length || !focusCases.length}
                  onClick={() => start('focused')}
                >
                  Start focused practice <ArrowRight size={18} />
                </button>
              </section>
            </>
          ) : tab === 'Review' ? (
            <>
              <PageTitle
                eyebrow="REMEMBER MORE, FOR LONGER"
                title="A fresh look at what you know."
                subtitle="A little revisiting keeps your German growing."
              />
              <div className="review-summary card">
                <IconBox icon={RotateCcw} tone="orange" />
                <div>
                  <h2>{due.length} questions ready to revisit</h2>
                  <p>
                    {due.length
                      ? 'Your next review is ready.'
                      : 'You’re up to date. Practice now to build your review schedule.'}
                  </p>
                </div>
                <button className="primary" onClick={() => start('daily')}>
                  Start review <ArrowRight size={17} />
                </button>
              </div>
              <div className="two-col">
                <section className="card">
                  <h2>Your growth areas</h2>
                  <p className="muted">Skills with at least two attempts and mastery below 65%.</p>
                  {weak.length ? (
                    weak.map((s) => (
                      <button
                        className="list-row full"
                        key={s.id}
                        onClick={() => start('focused', [s.id.slice(6) as Topic])}
                      >
                        <div>
                          <strong>{topicNames[s.id.slice(6) as Topic]}</strong>
                          <small>
                            {s.incorrect} mistakes · {percent(s.correct, s.attempts)}% accuracy
                          </small>
                        </div>
                        <span>
                          {s.mastery}%<ChevronRight size={15} />
                        </span>
                      </button>
                    ))
                  ) : (
                    <Empty
                      icon={Leaf}
                      text="Your learning pattern will appear here as you practice."
                    />
                  )}
                  <button className="secondary" onClick={() => start('weak')}>
                    Open weakness trainer
                  </button>
                </section>
                <section className="card">
                  <h2>Recent mistakes</h2>
                  <p className="muted">Every mistake is a useful next step.</p>
                  {attempts
                    .filter((a) => !a.correct)
                    .sort((a, b) => b.at - a.at)
                    .slice(0, 8)
                    .map((a) => (
                      <details className="mistake" key={a.id}>
                        <summary>
                          {a.prompt}
                          <small>{a.classification}</small>
                        </summary>
                        <p>
                          Your answer: <s>{a.answer}</s>
                          <br />
                          Correct: <strong>{a.expected}</strong>
                        </p>
                        <p>{a.explanation}</p>
                      </details>
                    ))}
                  {!attempts.some((a) => !a.correct) && (
                    <Empty icon={CheckCircle2} text="No mistakes to revisit yet. Keep exploring." />
                  )}
                </section>
              </div>
            </>
          ) : (
            <SettingsPage
              settings={settings}
              update={update}
              busy={busy}
              notify={setMessage}
              run={action}
              refresh={refresh}
            />
          )}
          <footer>
            <span>DeutschMeister</span>
            <span>
              Made for your own pace. <Leaf size={13} />
            </span>
          </footer>
        </main>
      </div>
      {settings.onboarded && (
        <nav className="bottom-nav" aria-label="Mobile navigation">
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={tab === label && !showQuiz ? 'active' : ''}
              onClick={() => {
                setTab(label);
                setShowQuiz(false);
              }}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
function PageTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="page-title">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="empty">
      <Icon size={29} />
      <p>{text}</p>
    </div>
  );
}
function Dashboard({
  data,
  dueCount,
  weak,
  start,
  navigate,
  resume,
}: {
  data: Snapshot;
  dueCount: number;
  weak?: string;
  start: (m: Mode, t?: Topic[], c?: Case[]) => void;
  navigate: (t: Tab) => void;
  resume: () => void;
}) {
  const [days, setDays] = useState(7);
  const { attempts, stats, settings, session } = data;
  const correct = attempts.filter((a) => a.correct).length;
  const today = attempts.filter((a) => localDay(a.at) === localDay(Date.now())).length;
  const learned = stats.filter((s) => s.id.startsWith('noun:')).length;
  const mastered = stats.filter(
    (s) => s.id.startsWith('noun:') && s.mastery >= 85 && s.streak >= 3,
  ).length;
  const skill = (id: string) => stats.find((s) => s.id === id);
  const topic = weak?.slice(6) as Topic | undefined;
  const weakest = weak ? skill(weak) : undefined;
  const series = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const day = localDay(+date);
    return {
      day,
      label: date.toLocaleDateString('en', { weekday: 'short' }),
      count: attempts.filter((a) => localDay(a.at) === day).length,
    };
  });
  const max = Math.max(settings.goal, ...series.map((d) => d.count));
  return (
    <>
      <div className="greeting">
        <div>
          <span className="eyebrow">EIN BISSCHEN BESSER, JEDEN TAG</span>
          <h1>
            Hallo, ready to grow? <span className="wave">☀</span>
          </h1>
          <p>Your next small step towards confident German starts here.</p>
        </div>
        <span className="date-label">
          {new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-tag">
            <Sparkles size={14} /> YOUR DAILY DOSE OF DEUTSCH
          </span>
          <h2>
            A little German.
            <br />A world of possibility.
          </h2>
          <p>
            Build your confidence, one word at a time.
            <br />
            Your next 10 questions are ready when you are.
          </p>
          <button className="hero-button" onClick={() => start('quick')}>
            Let’s practice <ArrowRight size={18} />
          </button>
          <span className="hero-note">
            <span /> 10 questions · about 3 minutes · made for you
          </span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="spark spark-one">✦</span>
          <span className="spark spark-two">✧</span>
          <div className="word-tile tile-der">
            der<span>masculine</span>
          </div>
          <div className="word-tile tile-das">
            das<span>neuter</span>
          </div>
          <div className="word-tile tile-die">
            die<span>feminine</span>
          </div>
          <span className="art-leaf">
            <Leaf size={34} />
          </span>
          <span className="art-caption">WORT FÜR WORT.</span>
        </div>
      </section>
      {session && !session.complete && (
        <button className="resume-banner" onClick={resume}>
          <Play size={19} />
          <span>
            <strong>Pick up where you left off</strong> {session.answers.length} of{' '}
            {session.questions.length} questions answered
          </span>
          <ArrowRight size={18} />
        </button>
      )}
      <div className="stat-grid">
        <StatCard
          icon={Target}
          tone="green"
          value={`${today} / ${settings.goal}`}
          label="Daily goal"
          detail={
            today >= settings.goal
              ? 'Goal reached. Schön gemacht!'
              : `${Math.max(0, settings.goal - today)} more to make today count`
          }
          progress={(today / settings.goal) * 100}
        />
        <StatCard
          icon={Flame}
          tone="orange"
          value={`${streak(attempts)}`}
          label="Day streak"
          detail={streak(attempts) ? 'Keep your momentum going' : 'A new habit starts with today'}
        />
        <StatCard
          icon={CheckCircle2}
          tone="blue"
          value={attempts.length ? `${percent(correct, attempts.length)}%` : '—'}
          label="Overall accuracy"
          detail={`${attempts.length} questions answered`}
        />
        <StatCard
          icon={BookOpen}
          tone="purple"
          value={String(learned)}
          label="Words explored"
          detail={`${mastered} mastered · ${nouns.length} to discover`}
        />
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-main">
          <section className="card recommended">
            <div className="section-heading">
              <h2>Your next best step</h2>
              <span className="badge">
                <Sparkles size={12} /> PERSONALIZED
              </span>
            </div>
            <div className="recommend-body">
              <IconBox icon={topic ? TrendingUp : RotateCcw} tone="orange" />
              <div>
                <h3>
                  {topic
                    ? `A little more ${topicNames[topic].toLowerCase()}`
                    : dueCount
                      ? 'Keep those words with you'
                      : 'Let’s build your foundation'}
                </h3>
                <p>
                  {weakest
                    ? `Your ${topicNames[topic!].toLowerCase()} accuracy is ${percent(weakest.correct, weakest.attempts)}%. A focused session can help.`
                    : dueCount
                      ? `${dueCount} questions are ready for review. Revisit them while they’re fresh.`
                      : 'Start with articles and everyday nouns. Your recommendations will grow with you.'}
                </p>
                <button
                  className="text-button"
                  onClick={() =>
                    start(
                      topic ? 'focused' : dueCount ? 'daily' : 'quick',
                      topic ? [topic] : undefined,
                    )
                  }
                >
                  {topic
                    ? 'Practice this skill'
                    : dueCount
                      ? 'Start daily review'
                      : 'Start learning'}{' '}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>
          <section className="card">
            <div className="section-heading">
              <h2>Your learning rhythm</h2>
              <div className="segmented">
                {[7, 30].map((n) => (
                  <button
                    key={n}
                    className={days === n ? 'selected' : ''}
                    onClick={() => setDays(n)}
                  >
                    {n} days
                  </button>
                ))}
              </div>
            </div>
            <p className="muted chart-caption">Every little bit adds up.</p>
            <div
              className="chart"
              role="img"
              aria-label={`Questions answered in the last ${days} days: ${series.map((d) => `${d.day}: ${d.count}`).join(', ')}`}
            >
              <div className="chart-grid">
                <span>{max}</span>
                <span>{Math.round(max / 2)}</span>
                <span>0</span>
              </div>
              <div className="chart-bars">
                {series.map((d, i) => (
                  <div className="bar-column" key={d.day}>
                    <div
                      className={`bar ${i === days - 1 ? 'current' : ''}`}
                      style={{ height: `${Math.max(d.count ? 4 : 1, (d.count / max) * 100)}%` }}
                      title={`${d.day}: ${d.count} questions`}
                    />
                    {(days === 7 || i % 5 === 0) && (
                      <span>{days === 7 ? d.label : d.day.slice(-2)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-legend">
              <span />
              <small>Questions practiced</small>
              <strong>{series.reduce((s, d) => s + d.count, 0)} this period</strong>
            </div>
          </section>
          <section className="card">
            <div className="section-heading">
              <h2>Explore your German</h2>
              <button className="text-button" onClick={() => navigate('Learn')}>
                View all <ArrowRight size={15} />
              </button>
            </div>
            <div className="explore-grid">
              {[
                {
                  title: 'Words worth knowing',
                  sub: 'Nouns, articles & plurals',
                  icon: BookOpen,
                  tone: 'blue',
                },
                {
                  title: 'Make sense of cases',
                  sub: 'NOM · AKK · DAT · GEN',
                  icon: GraduationCap,
                  tone: 'purple',
                },
              ].map((c) => (
                <button className="explore-tile" key={c.title} onClick={() => navigate('Learn')}>
                  <IconBox icon={c.icon} tone={c.tone} />
                  <strong>{c.title}</strong>
                  <small>{c.sub}</small>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className="dashboard-side">
          <section className="card case-progress">
            <div className="section-heading">
              <h2>Getting the hang of cases</h2>
              <span title="Accuracy by case">
                <CircleHelp size={16} />
              </span>
            </div>
            <p className="muted">One ending at a time.</p>
            {cases.map((c) => {
              const s = skill(`case:${c}`);
              return (
                <div className="case-row" key={c}>
                  <div>
                    <span className={`case-dot ${c.toLowerCase()}`} />
                    <strong>{caseNames[c]}</strong>
                    <span>{s ? `${percent(s.correct, s.attempts)}%` : 'Not yet'}</span>
                  </div>
                  <Progress
                    label={`${caseNames[c]} accuracy`}
                    value={s ? percent(s.correct, s.attempts) : 0}
                  />
                </div>
              );
            })}
            <button className="text-button" onClick={() => navigate('Practice')}>
              Practice your cases <ArrowRight size={16} />
            </button>
          </section>
          <section className="word-day">
            <span className="eyebrow">
              <Leaf size={14} /> A WORD FOR TODAY
            </span>
            {(() => {
              const available = levelFilter(nouns, settings);
              const n = available[Math.floor(Date.now() / 86400000) % available.length];
              return (
                <>
                  <span className={`gender-label ${n.gender}`}>{genderNames[n.gender]}</span>
                  <h2>
                    <span>{n.article}</span> {n.word}
                  </h2>
                  <p>{n.english}</p>
                  <div className="word-divider" />
                  <strong>{n.example}</strong>
                  <small>{n.translation}</small>
                  <button className="text-button" onClick={() => navigate('Learn')}>
                    Discover more words <ArrowRight size={16} />
                  </button>
                </>
              );
            })()}
          </section>
          <section className="gentle-note">
            <span>✦</span>
            <p>
              You don’t have to be perfect.
              <br />
              You just have to keep going.
            </p>
          </section>
        </div>
      </div>
      <section className="card">
        <div className="section-heading">
          <h2>The bigger picture</h2>
          <BarChart3 size={20} />
        </div>
        <div className="metrics-grid">
          {(
            [
              'gender:m',
              'gender:f',
              'gender:n',
              'topic:plural',
              'topic:personal',
              'topic:possessive',
              'topic:standalone',
            ] as string[]
          ).map((id) => {
            const s = skill(id);
            return (
              <div key={id}>
                <small>
                  {id.startsWith('topic:')
                    ? topicNames[id.slice(6) as Topic]
                    : `${genderNames[id.slice(7) as Gender]} nouns`}
                </small>
                <strong>{s ? `${percent(s.correct, s.attempts)}%` : '—'}</strong>
                <span>
                  {s ? `${s.attempts} attempts · ${s.mastery}% mastery` : 'Ready to explore'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="level-summary">
          {levels.map((l) => {
            const a = attempts.filter((x) => x.level === l);
            return (
              <div key={l}>
                <b>{l}</b>
                <span>
                  {a.length} answers · {percent(a.filter((x) => x.correct).length, a.length)}%
                  accuracy
                </span>
              </div>
            );
          })}
        </div>
        {stats.some((s) => s.id.startsWith('topic:')) && (
          <p className="muted">
            Strongest topic:{' '}
            {
              topicNames[
                stats
                  .filter((s) => s.id.startsWith('topic:'))
                  .sort((a, b) => b.mastery - a.mastery)[0]
                  .id.slice(6) as Topic
              ]
            }
            . Mastery needs repeated success over time.
          </p>
        )}
      </section>
    </>
  );
}
function StatCard({
  icon,
  tone,
  value,
  label,
  detail,
  progress,
}: {
  icon: LucideIcon;
  tone: string;
  value: string;
  label: string;
  detail: string;
  progress?: number;
}) {
  return (
    <div className="card stat-card">
      <div className="stat-top">
        <IconBox icon={icon} tone={tone} />
        <span>{label}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      {progress !== undefined && <Progress label={label} value={progress} />}
      <small>{detail}</small>
    </div>
  );
}
function Learn({
  settings,
  practice,
  initialTopic,
}: {
  settings: Settings;
  practice: (topics: Topic[], cs?: Case[]) => void;
  initialTopic: Topic | null;
}) {
  const [section, setSection] = useState('Lessons');
  const [search, setSearch] = useState('');
  const [index, setIndex] = useState(0);
  const [hideArticle, setHideArticle] = useState(false);
  const [hidePlural, setHidePlural] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [type, setType] = useState<ArticleType>('definite');
  const [cell, setCell] = useState<{ c: Case; g: Gender }>({ c: 'NOM', g: 'm' });
  const [owner, setOwner] = useState('ich');
  const [standalone, setStandalone] = useState(false);
  const words = levelFilter(nouns, settings).filter((n) =>
    `${n.word} ${n.english}`.toLowerCase().includes(search.toLowerCase()),
  );
  const n = words[index % Math.max(1, words.length)];
  const p = people.find((p) => p.id === owner)!;
  function move(delta: number) {
    setIndex((i) => (i + delta + words.length) % words.length);
    setRevealed(false);
  }
  function speak(word: string) {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'de-DE';
      speechSynthesis.speak(u);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="UNDERSTAND IT. REMEMBER IT."
        title="Make yourself at home in German."
        subtitle="Explore the words and patterns that make the language click."
      />
      <div className="study-tabs" role="tablist" aria-label="Study section">
        {['Lessons', 'Vocabulary', 'Articles', 'Personal pronouns', 'Possessives'].map((s) => (
          <button
            role="tab"
            aria-selected={section === s}
            key={s}
            className={section === s ? 'selected' : ''}
            onClick={() => setSection(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {section === 'Lessons' ? (
        <div className="lesson-grid">
          {lessons.map((l, i) => (
            <details className="card lesson" key={l.id} open={initialTopic === l.topic}>
              <summary>
                <span className="lesson-number">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <span className="eyebrow">
                    {l.level} ·{' '}
                    {levels.indexOf(l.level) > levels.indexOf(settings.level)
                      ? 'EXPLORE AHEAD'
                      : 'YOUR LEARNING PATH'}
                  </span>
                  <h2>{l.title}</h2>
                </div>
                <ChevronRight size={19} />
              </summary>
              <div className="lesson-content">
                <strong>{l.rule}</strong>
                <p>{l.explanation}</p>
                <blockquote>
                  {l.example}
                  <small>{l.translation}</small>
                </blockquote>
                <p className="lesson-tip">
                  <strong>Watch out:</strong> {l.mistake}
                </p>
                <button
                  className="primary"
                  onClick={() => practice([l.topic], l.c ? [l.c] : undefined)}
                >
                  Practice this topic <ArrowRight size={17} />
                </button>
              </div>
            </details>
          ))}
        </div>
      ) : section === 'Vocabulary' ? (
        <>
          <div className="vocab-toolbar">
            <label className="search-label">
              Find a word
              <input
                type="search"
                placeholder="Search German or English…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIndex(0);
                  setRevealed(false);
                }}
              />
            </label>
            <div>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={hideArticle}
                  onChange={(e) => {
                    setHideArticle(e.target.checked);
                    setRevealed(false);
                  }}
                />{' '}
                Hide articles
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={hidePlural}
                  onChange={(e) => {
                    setHidePlural(e.target.checked);
                    setRevealed(false);
                  }}
                />{' '}
                Hide plurals
              </label>
            </div>
          </div>
          {n ? (
            <>
              <section className="card vocab-card">
                <div className="section-heading">
                  <span className="eyebrow">
                    {n.level} · {n.category}
                  </span>
                  <span className="muted">
                    {(index % words.length) + 1} / {words.length}
                  </span>
                </div>
                <span className={`gender-label ${hideArticle && !revealed ? '' : n.gender}`}>
                  {hideArticle && !revealed ? 'What’s the gender?' : genderNames[n.gender]}
                </span>
                <h1>
                  {hideArticle && !revealed ? '___' : n.article} {n.word}
                </h1>
                <p className="word-meaning">{n.english}</p>
                <p className="plural-label">
                  Plural:{' '}
                  <strong>
                    {hidePlural && !revealed
                      ? '•••'
                      : n.plural === '—'
                        ? 'Not normally used'
                        : `die ${n.plural}`}
                  </strong>
                </p>
                <blockquote>
                  {hideArticle && !revealed ? 'Reveal the article to see the example.' : n.example}
                  <small>{hideArticle && !revealed ? '' : n.translation}</small>
                </blockquote>
                {(!hideArticle || revealed) && <p className="muted">{n.notes}</p>}
                <div className="vocab-controls">
                  <button
                    className="icon-button"
                    aria-label="Previous word"
                    onClick={() => move(-1)}
                  >
                    <ArrowLeft size={21} />
                  </button>
                  {(hideArticle || hidePlural) && !revealed ? (
                    <button className="primary" onClick={() => setRevealed(true)}>
                      Reveal answer
                    </button>
                  ) : (
                    <button className="secondary" onClick={() => speak(`${n.article} ${n.word}`)}>
                      <Volume2 size={18} /> Listen
                    </button>
                  )}
                  <button className="icon-button" aria-label="Next word" onClick={() => move(1)}>
                    <ArrowRight size={21} />
                  </button>
                </div>
              </section>
              {(!hideArticle || revealed) && (
                <section className="card">
                  <h2>{n.word}: all four cases</h2>
                  <NounTable noun={n} />
                </section>
              )}
            </>
          ) : (
            <Empty icon={BookOpen} text="No words found at this level. Try another search." />
          )}
        </>
      ) : section === 'Articles' ? (
        <section className="card reference-card">
          <div className="section-heading">
            <h2>Small words. Big meaning.</h2>
            <select
              aria-label="Article type"
              value={type}
              onChange={(e) => setType(e.target.value as ArticleType)}
            >
              <option value="definite">Definite · der</option>
              <option value="indefinite">Indefinite · ein</option>
              <option value="negative">Negative · kein</option>
            </select>
          </div>
          <p className="muted">Tap a form to explore it. All cases are always available here.</p>
          <GrammarTable
            render={(c, g) => articles[type][c][g]}
            onCell={(c, g) => setCell({ c, g })}
            selected={cell}
          />
          <div className="table-explanation">
            <span className="badge">
              {caseNames[cell.c]} · {genderNames[cell.g]}
            </span>
            <h3>{articles[type][cell.c][cell.g]}</h3>
            <p>
              {type === 'indefinite' && cell.g === 'p'
                ? 'German has no plural indefinite article. Use a bare plural noun: Bücher.'
                : `${caseRules[cell.c]} Use ${articles[type][cell.c][cell.g]} for this ${type} form.`}
            </p>
            <strong>
              {type === 'indefinite' && cell.g === 'p'
                ? 'Bücher'
                : nounPhrase(
                    nouns.find(
                      (n) => n.word === { m: 'Hund', f: 'Frau', n: 'Kind', p: 'Eltern' }[cell.g],
                    )!,
                    cell.c,
                    type,
                  )}
            </strong>
          </div>
          <button className="primary" onClick={() => practice(['declension'], [cell.c])}>
            Practice {caseNames[cell.c].toLowerCase()} <ArrowRight size={17} />
          </button>
        </section>
      ) : section === 'Personal pronouns' ? (
        <section className="card reference-card">
          <h2>Same person. A different role.</h2>
          <p>
            Pronouns change with their role in the sentence. Formal <strong>Sie</strong> is always
            capitalized.
          </p>
          <div className="table-scroll">
            <table>
              <caption>Personal pronouns by case</caption>
              <thead>
                <tr>
                  <th>Person</th>
                  {cases.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id}>
                    <th>{p.label}</th>
                    {p.forms.map((f, i) => (
                      <td key={i}>{f}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-explanation">
            <h3>A note on the genitive</h3>
            <p>
              Genitive personal pronouns are uncommon in everyday German. You may encounter them in
              literary or formal expressions: <strong>Wir gedenken ihrer.</strong> (We remember
              her/them.) They are not interchangeable with possessive determiners.
            </p>
            <p>
              <strong>Ich sehe den Mann. → Ich sehe ihn.</strong>
              <br />I see the man. → I see him. The accusative stays the same.
            </p>
          </div>
          <button className="primary" onClick={() => practice(['personal'])}>
            Practice pronouns <ArrowRight size={17} />
          </button>
        </section>
      ) : (
        <section className="card reference-card">
          <h2>Whose is it?</h2>
          <p>The owner chooses the stem. The noun’s gender, number and case choose the ending.</p>
          <div className="form-grid">
            <label>
              Possessor
              <select
                aria-label="Possessor"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} → {p.stem}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Usage
              <select
                value={standalone ? 'standalone' : 'determiner'}
                onChange={(e) => setStandalone(e.target.value === 'standalone')}
              >
                <option value="determiner">Determiner · with a noun</option>
                <option value="standalone">Standalone · replaces a noun</option>
              </select>
            </label>
          </div>
          <GrammarTable
            render={(c, g) => possessive(p.stem, c, g, standalone)}
            onCell={(c, g) => setCell({ c, g })}
            selected={cell}
          />
          <div className="table-explanation">
            <h3>{possessive(p.stem, cell.c, cell.g, standalone)}</h3>
            <p>
              {standalone
                ? 'A standalone possessive replaces the noun: mein Hund → meiner; mein Buch → meines (also meins). Genitive standalone forms are rare and formal.'
                : 'A determiner accompanies a noun: mein Hund, meine Tasche, meinem Kind.'}
            </p>
            {p.stem === 'euer' && (
              <p>Euer loses its second e before these endings: eure, euren, eurem, eurer, eures.</p>
            )}
            <p>
              Example: <strong>Ich helfe meinem Bruder.</strong> — I help my brother. Helfen takes
              dative.
            </p>
          </div>
          <button
            className="primary"
            onClick={() => practice([standalone ? 'standalone' : 'possessive'], [cell.c])}
          >
            Practice possessives <ArrowRight size={17} />
          </button>
        </section>
      )}
    </>
  );
}
function GrammarTable({
  render,
  onCell,
  selected,
}: {
  render: (c: Case, g: Gender) => string;
  onCell: (c: Case, g: Gender) => void;
  selected: { c: Case; g: Gender };
}) {
  return (
    <div className="table-scroll">
      <table>
        <caption>Declensions: select a form for details</caption>
        <thead>
          <tr>
            <th>Case</th>
            {(['m', 'f', 'n', 'p'] as Gender[]).map((g) => (
              <th key={g}>{genderNames[g]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c}>
              <th>{c}</th>
              {(['m', 'f', 'n', 'p'] as Gender[]).map((g) => (
                <td key={g}>
                  <button
                    className={selected.c === c && selected.g === g ? 'selected' : ''}
                    onClick={() => onCell(c, g)}
                    aria-label={`${caseNames[c]}, ${genderNames[g]}: ${render(c, g)}`}
                  >
                    {render(c, g)}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function NounTable({ noun }: { noun: Noun }) {
  return (
    <div className="table-scroll">
      <table>
        <caption>Definite noun phrases</caption>
        <thead>
          <tr>
            <th>Case</th>
            <th>Singular</th>
            <th>Plural</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c}>
              <th>{c}</th>
              <td>{noun.gender === 'p' ? '—' : nounPhrase(noun, c)}</td>
              <td>{noun.plural === '—' ? '—' : nounPhrase(noun, c, 'definite', true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Quiz({
  session,
  busy,
  answer,
  next,
  exit,
  study,
}: {
  session: Session;
  busy: boolean;
  answer: (s: string) => void;
  next: () => void;
  exit: () => void;
  study: () => void;
}) {
  const [typed, setTyped] = useState('');
  const q = session.questions[session.index];
  const result = session.answers[session.index];
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTyped('');
    input.current?.focus();
  }, [session.index]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && session.feedback && !busy) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [session.feedback, busy, next]);
  if (session.complete) {
    const correct = session.answers.filter((a) => a.correct).length;
    return (
      <section className="card results">
        <span className="completion-icon">
          <Trophy size={40} />
        </span>
        <span className="eyebrow">ONE MORE STEP FORWARD</span>
        <h1>Schön gemacht!</h1>
        <p>You showed up for your German. That’s what counts.</p>
        <div className="result-score">
          {percent(correct, session.answers.length)}
          <span>%</span>
        </div>
        <p>
          {correct} of {session.answers.length} correct · {modeNames[session.mode]}
        </p>
        <div className="result-topics">
          {[...new Set(session.answers.map((a) => a.topic))].map((t) => {
            const a = session.answers.filter((a) => a.topic === t);
            return (
              <div key={t}>
                <strong>{topicNames[t]}</strong>
                <span>
                  {a.filter((a) => a.correct).length} / {a.length}
                </span>
              </div>
            );
          })}
        </div>
        <div className="result-history">
          {session.answers.map((a) => (
            <details className="mistake" key={a.id}>
              <summary>
                {a.correct ? <Check size={16} /> : <X size={16} />} {a.prompt}
              </summary>
              <p>
                Your answer: {a.answer}
                <br />
                Correct answer: <strong>{a.expected}</strong>
              </p>
              <p>{a.explanation}</p>
            </details>
          ))}
        </div>
        <button className="primary" onClick={exit}>
          Back to my dashboard <ArrowRight size={18} />
        </button>
      </section>
    );
  }
  const exam = session.mode === 'exam';
  const repeated = session.answers.filter((a) => !a.correct && a.topic === q.topic).length >= 2;
  return (
    <section className="quiz-wrap">
      <div className="quiz-header">
        <button className="text-button" onClick={exit}>
          <ArrowLeft size={18} /> Save & leave
        </button>
        <span>{modeNames[session.mode]}</span>
        <span>
          {session.index + 1} / {session.questions.length}
        </span>
      </div>
      <Progress
        label="Session completion"
        value={(session.answers.length / session.questions.length) * 100}
      />
      <div className="card quiz-card">
        <span className="eyebrow">
          {q.level} · {topicNames[q.topic]}
        </span>
        <p className="quiz-context">{q.context}</p>
        <h1>{q.prompt}</h1>
        {q.format === 'typed' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim() && !session.feedback) answer(typed);
            }}
          >
            <label className="sr-only" htmlFor="quiz-answer">
              Your answer
            </label>
            <input
              ref={input}
              id="quiz-answer"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={typed}
              disabled={busy || session.feedback}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type your answer…"
            />
            <div className="special-characters">
              {['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={session.feedback}
                  onClick={() => {
                    setTyped((s) => s + c);
                    input.current?.focus();
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              className="primary full"
              disabled={busy || session.feedback || !typed.trim()}
              type="submit"
            >
              Check answer <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <div className="answer-options">
            {q.options.map((option, i) => (
              <button
                key={option}
                disabled={busy || session.feedback}
                className={
                  session.feedback && !exam
                    ? option === q.answer
                      ? 'correct'
                      : option === result?.answer
                        ? 'incorrect'
                        : ''
                    : ''
                }
                onClick={() => answer(option)}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {option}
                {session.feedback && !exam && option === q.answer && <Check size={20} />}
              </button>
            ))}
          </div>
        )}
        {session.feedback && (
          <div
            className={`feedback ${exam ? 'neutral' : result?.correct ? 'success' : 'retry'}`}
            role="status"
          >
            <h3>
              {exam
                ? 'Answer saved'
                : result?.correct
                  ? 'Richtig! Nicely done.'
                  : 'A useful learning moment.'}
            </h3>
            {!exam && (
              <>
                <p>
                  Correct answer: <strong>{q.answer}</strong>
                </p>
                <p>{q.explanation}</p>
                {!result?.correct && (
                  <small>{result?.classification} · We’ll revisit this skill.</small>
                )}
                {repeated && (
                  <button className="text-button" onClick={study}>
                    Review the lesson <BookOpen size={16} />
                  </button>
                )}
              </>
            )}
            <button className="primary full" disabled={busy} onClick={next}>
              {session.index === session.questions.length - 1 ? 'See my results' : 'Next question'}{' '}
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
      <p className="quiz-footnote">
        {exam
          ? 'Take your time. Feedback comes at the end.'
          : 'Progress, not perfection. Every answer helps us personalize your practice.'}
      </p>
    </section>
  );
}
function SettingsPage({
  settings,
  update,
  busy,
  notify,
  run,
  refresh,
}: {
  settings: Settings;
  update: (s: Settings) => void;
  busy: boolean;
  notify: (s: string) => void;
  run: (fn: () => Promise<void>) => Promise<void>;
  refresh: () => Promise<Snapshot>;
}) {
  const file = useRef<HTMLInputElement>(null);
  function exportData() {
    void run(async () => {
      const data = await readSnapshot();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `deutschmeister-${localDay(Date.now())}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Your progress backup has been downloaded.');
    });
  }
  return (
    <>
      <PageTitle
        eyebrow="YOUR LEARNING, YOUR WAY"
        title="A space that works for you."
        subtitle="Set your pace and make yourself comfortable."
      />
      <section className="card settings-section">
        <h2>Your German level</h2>
        <p>Change your level whenever you like. Your learning history stays with you.</p>
        <LevelSelect settings={settings} update={update} />
        <label className="check-label">
          <input
            type="checkbox"
            checked={settings.cumulative}
            onChange={(e) => update({ ...settings, cumulative: e.target.checked })}
          />{' '}
          Include vocabulary from earlier levels
        </label>
      </section>
      <section className="card settings-section">
        <h2>Find your rhythm</h2>
        <div className="form-grid">
          <label>
            Daily question goal
            <select
              value={settings.goal}
              onChange={(e) => update({ ...settings, goal: +e.target.value })}
            >
              {[5, 10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
          </label>
          <label>
            Session length
            <select
              aria-label="Preferred session length"
              value={settings.length}
              onChange={(e) => update({ ...settings, length: +e.target.value })}
            >
              {[5, 10, 15, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
          </label>
          <label>
            Appearance
            <select
              value={settings.theme}
              onChange={(e) => update({ ...settings, theme: e.target.value as Settings['theme'] })}
            >
              <option value="system">Follow device</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            Adaptive balance
            <select
              value={settings.weights.join(',')}
              onChange={(e) =>
                update({
                  ...settings,
                  weights: e.target.value.split(',').map(Number) as Settings['weights'],
                })
              }
            >
              <option value="50,30,20">Balanced · 50% weak / 30% due / 20% new</option>
              <option value="60,20,20">Reinforce · 60% weak / 20% due / 20% new</option>
              <option value="30,30,40">Explore · 30% weak / 30% due / 40% new</option>
            </select>
          </label>
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            checked={settings.typed}
            onChange={(e) => update({ ...settings, typed: e.target.checked })}
          />{' '}
          Prefer typed answers over multiple choice
        </label>
        <p className="fine-print">
          Changes apply to new sessions. Quick practice always has 10 questions.
        </p>
      </section>
      <section className="card settings-section">
        <h2>Your progress belongs to you</h2>
        <p>
          Learning history is stored in this browser on this device. It does not automatically sync.
          Export a backup before clearing browser data or moving to another device.
        </p>
        <div className="button-row">
          <button className="secondary" disabled={busy} onClick={exportData}>
            <Download size={17} /> Export progress
          </button>
          <button className="secondary" disabled={busy} onClick={() => file.current?.click()}>
            <Upload size={17} /> Import backup
          </button>
        </div>
        <input
          className="sr-only"
          aria-label="Import progress file"
          ref={file}
          type="file"
          accept=".json,application/json"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected)
              void run(async () => {
                if (selected.size > 20_000_000)
                  throw new Error('Backup exceeds the 20 MB import limit.');
                const text = await selected.text();
                parseBackup(text);
                if (!confirm('Replace this device’s progress and settings with this backup?'))
                  return;
                await importBackup(text);
                await refresh();
                notify('Your learning history has been restored.');
                if (file.current) file.current.value = '';
              });
          }}
        />
        <hr />
        <button
          className="danger-button"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              if (
                !confirm(
                  'Permanently delete all learning progress on this device? Export a backup first if you want to keep it.',
                )
              )
                return;
              await resetProgress();
              await refresh();
              notify('Progress reset. Your study preferences have been kept.');
            })
          }
        >
          Reset all learning progress
        </button>
      </section>
      <section className="card settings-section">
        <h2>Take DeutschMeister with you</h2>
        <p>
          On Android, open this app in Chrome and choose <strong>Install app</strong> or{' '}
          <strong>Add to Home screen</strong> from the menu. After the first complete load, your
          lessons and practice work offline.
        </p>
        <p className="muted">
          Pronunciation uses your browser’s German voices. Availability offline depends on the
          voices installed on your device. App updates take effect after all open app windows are
          closed and reopened.
        </p>
        <button
          className="secondary"
          onClick={() =>
            void run(async () => {
              if (!navigator.storage?.persist) {
                notify(
                  'Your browser does not offer persistent storage requests. Keep regular backups.',
                );
                return;
              }
              const kept = await navigator.storage.persist();
              notify(
                kept
                  ? 'Persistent storage is enabled.'
                  : 'Your browser manages storage automatically. Export regular backups.',
              );
            })
          }
        >
          Keep learning data on this device
        </button>
      </section>
    </>
  );
}
export default App;
