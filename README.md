# DeutschMeister

An offline-first, mobile-first German study app for English speakers. Built with React, TypeScript, Vite, Tailwind CSS, Dexie/IndexedDB, and a precaching PWA service worker. No accounts, backend, paid API, tracking, or external fonts.

## Run locally

Use **Node.js 22.12 or newer** (Node 22 LTS is used in CI).

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, including `/deutschmeister/`. To test the installable/offline production version:

```sh
npm run build
npm run preview
```

Open `http://localhost:4173/deutschmeister/`. Service workers require HTTPS or localhost. Development mode intentionally does not install the production service worker.

## Features

- Five main sections: Dashboard, Learn, Practice, Review, Settings; bottom navigation on phones.
- Onboarding, A1–B2 selection, exact-level or cumulative vocabulary, daily goals, 5/10/15/20/30-question sessions, light/dark/device themes.
- 200 authored nouns (50 per level), with translations, examples, genders, plurals, explicit genitives and irregularities. These are editorial learning bands, not an official CEFR certification list.
- Vocabulary flashcards with independently hidden articles/plurals, optional browser pronunciation, search, and singular/plural declension tables.
- All four cases; definite, indefinite and negative articles; nine personal-pronoun identities; possessive determiners and standalone possessives, including euer and formal Ihr.
- Interactive reference tables and progressive lessons, always available regardless of level. Rare genitive pronouns are marked as formal/literary.
- Quick practice (always 10 questions), focused practice, daily review, weakness trainer, exam mode and reference/study mode.
- Multiple choice, typed answers, authored sentence completion/replacement/transformation exercises, case identification and noun-phrase declension. Focus on cases, topics or specific pronoun identities; override grammar level restrictions.
- Adaptive scheduling, skill-level mistake classifications, varied reinforcement, mastery scores, review due dates, local-calendar streaks, 7/30-day charts and per-level statistics.
- Durable progress and unfinished sessions; atomic answer saves; JSON backup/restore with schema checks; confirmed reset.

## Repository map

```text
src/
  App.tsx                 App shell, dashboard, learning, quizzes and settings
  styles.css              Mobile/desktop layouts, theme, accessible focus styles
  types.ts                Shared content, session and persistence models
  data/
    nouns.ts              200 nouns, examples and explicit inflection exceptions
    grammar.ts            Article/pronoun paradigms, declension functions, lessons
    exercises.ts          Authored contextual exercises
  lib/
    engine.ts             Questions, validation, adaptation and statistics
    storage.ts            Dexie schema, atomic transactions, validated import/export
public/                   Original 192/512px mask-safe PWA icons
scripts/generate-icons.py Reproducible icon generator (Python standard library)
tests/                    Unit/content/persistence tests, fake IndexedDB
e2e/                     Playwright phone/desktop production-browser tests
.github/workflows/deploy.yml  Gated GitHub Pages build and deployment
```

## Learning algorithm

The algorithm is a documented **simplified SM-2-inspired schedule**, not a full SM-2 implementation or a validated assessment of language proficiency.

Each answer updates its question, noun, topic, CEFR level, and relevant gender/case/article/pronoun skills in one IndexedDB transaction. Each record includes attempts, correct/incorrect counts, the last ten results, consecutive successes, timestamps, interval, ease and mastery. Accuracy is calculated from the stored counts.

- First successful review: 1 day; second consecutive success: 3 days; later intervals multiply by ease, capped at 180 days.
- Ease starts at 2.5, rises by 0.05 on success, falls by 0.2 on failure, and never falls below 1.3.
- Failure resets the success streak and schedules a review in 10 minutes.
- Mastery = `100 × min(attempts / 8, 1) × (0.6 × lifetime accuracy + 0.4 × last-ten accuracy)`. A vocabulary word counts as mastered at 85% mastery with at least three consecutive successes. One correct answer is never mastery.
- Default selection reserves 20% new questions, allocates 50% to weak/recently failed skills and 30% to due questions. Settings offer alternate balances. Missing buckets fall back to other review material, new material and the least recently practiced items.
- Daily review prioritizes due questions. Weakness trainer emphasizes weak concepts. Both reserve new material where available. New material is balanced by topic to prevent large pronoun paradigms from dominating.
- A mistake can replace a question **three positions later** with a different example of the same topic and case, preserving a specific gender/case or plural pattern where present. If the session is nearly over or no suitable variation exists, the saved review schedule carries the reinforcement into later sessions.
- Two mistakes in one topic during a session reveal a study link. Exam mode defers feedback and does not insert remedial questions.
- Selection is unique within each session. Narrow filters with fewer available questions produce a shorter session rather than duplicating items.

Typed validation normalizes Unicode and whitespace, allows nonsemantic case changes, preserves umlauts and formal/informal pronoun distinctions, and accepts the common shortened standalone neuter form (meins). Explicitly listed alternative genitives and dative Herz are accepted. The finite bank does not aim to recognize every regional, stylistic or rare variant.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests use the **production preview at `/deutschmeister/`**, with Pixel 7 and desktop Chromium profiles. They cover onboarding, settings, right/wrong feedback, interrupted-session restoration, completion/statistics, tables, vocabulary reveal, typed input, backup/restore, reset cancellation/confirmation, exam feedback and offline reload/practice.

Local verification: 42 unit tests and 12 production browser tests passed, including WCAG A/AA automated dashboard checks in light and dark themes. Lint, TypeScript and production build passed. Automated checks do not replace testing on the target Android phone.

The icon generator can be rerun with `python3 scripts/generate-icons.py`.

## Publish through GitHub Pages

The repository remote supplied for this project is `https://github.com/rpb33/deutschmeister.git`.

1. If setting up elsewhere, create a GitHub repository named `deutschmeister` and configure its Git remote. Choose visibility and GitHub plan settings that permit Pages.
2. Push the source and lockfile to `main`:

   ```sh
   git add .
   git commit -m "Build offline DeutschMeister learning app"
   git push -u origin main
   ```

3. In GitHub, open **Settings → Pages → Build and deployment → Source → GitHub Actions**. If GitHub requires permission to run workflows, enable them under Actions settings.
4. Open **Actions → Test and deploy DeutschMeister**. A push to `main` or a manual dispatch runs dependency installation, lint, TypeScript, unit tests, the production build, browser tests and the Pages artifact upload. The deployment job runs only after these pass. Pull requests get checks without publication.
5. Open the URL shown by the `github-pages` environment after deployment. For the supplied repository it should be `https://rpb33.github.io/deutschmeister/`.
6. Visit that URL online, then verify a reload in airplane mode after the service worker has installed. Do not infer a successful deployment merely from the presence of this workflow.

`vite.config.ts` defaults to `/deutschmeister/`. CI derives the production path from the repository name. If using an account-root repository (`USERNAME.github.io`) or a custom domain, set `BASE_PATH=/` in the build step. For a different subpath locally, run `BASE_PATH=/your-repository/ npm run build`.

Navigation is kept inside the application rather than HTML5 history routes, so GitHub Pages never needs to resolve `/learn` or `/practice`. Assets, manifest, scope and service-worker registration all use the configured base. Reloads use the real project index; the offline navigation fallback serves its precached copy.

## Install on Android

1. Open the live GitHub Pages URL in Chrome on Android while online.
2. Let the app finish loading, then choose **Install app** or **Add to Home screen** from Chrome’s menu.
3. Launch DeutschMeister from the Android home screen in standalone mode.
4. Lessons, vocabulary, practice and progress storage work offline. Pronunciation depends on the installed German speech voices; the browser may need connectivity for some voices.

For an update, commit and push changes to `main`. CI rebuilds and deploys them. The service worker installs updates without interrupting an active study session; close **all** app windows/tabs and reopen to activate the new version. IndexedDB is outside the application cache and is retained across app updates. Future schema changes must use incremental Dexie migrations.

## Data and privacy

All history stays in the browser’s IndexedDB. No data is sent to a server. There is no automatic cross-device sync. Settings offers JSON export/import and a browser persistent-storage request. Browser storage eviction, private browsing, clearing site data or uninstall behavior can remove local history, so keep backups. Imports validate the entire file before replacing data in one transaction; version 1 backups are limited to 20 MB.

## Content approach and boundaries

Content is authored in structured datasets, not generated by an external language model at runtime. Paradigms handle weak masculine nouns, mixed Name/Gedanke, Herr, Herz, dative plural -n, plural-only and mass nouns, and the absence of indefinite plural articles. Tests check data completeness and representative linguistic exceptions, but automated tests are not an independent linguistic certification. An external German-teacher review is recommended before presenting the app as an accredited curriculum.

Grammar reference material consulted for paradigm cross-checks:

- [Lingolia: noun declension](https://deutsch.lingolia.com/de/grammatik/nomen/deklination)
- [Lingolia: weak nouns](https://deutsch.lingolia.com/de/grammatik/nomen/n-deklination)
- [Lingolia: possessives](https://deutsch.lingolia.com/de/grammatik/pronomen/possessivpronomen)
- [LEO grammar: possessive pronouns and determiners](https://dict.leo.org/grammatik/deutsch/Wort/Pronomen/FRegeln-P/Posses/index.html)
- [Vite: static deployment](https://vite.dev/guide/static-deploy.html)
- [Vite PWA guide](https://vite-pwa-org.netlify.app/guide/)

CEFR labels organize this initial noun/declension curriculum. This is not a complete A1–B2 language course: listening comprehension, open conversation, adjective endings, verb conjugation and official exam certification are outside the initial scope. Physical Android installation and device-specific speech support must be checked on the target phone; automated mobile tests emulate Chrome’s viewport and input environment.

## Extending the app

Add noun rows and explicit irregular forms in `nouns.ts`, authored questions in `exercises.ts`, and lessons in `grammar.ts`. Keep IDs stable so learning history remains attached to the same concept. Never derive an irregular plural from a blanket rule. Add a content/engine test for each new exception.

Useful follow-ups include independent language review, larger curated vocabulary sets, richer listening practice, optional user-controlled sync, and Capacitor packaging. The app is already a static client with separate content, learning and persistence modules; native packaging can reuse those modules and the production web build.
