import type { Gender, Level, Noun } from '../types';
// Editorial CEFR grouping, not an official examination word list.
// Columns: singular | English | gender | plural | genitive | example | translation.
const raw: Record<Level, string> = {
  A1: `Mann|man|m|Männer|Mannes|Der Mann liest.|The man is reading.
Frau|woman|f|Frauen||Die Frau arbeitet.|The woman is working.
Kind|child|n|Kinder|Kindes|Das Kind spielt.|The child is playing.
Hund|dog|m|Hunde|Hundes|Der Hund schläft.|The dog is sleeping.
Katze|cat|f|Katzen||Die Katze ist klein.|The cat is small.
Haus|house|n|Häuser|Hauses|Das Haus ist alt.|The house is old.
Buch|book|n|Bücher|Buches|Ich lese ein Buch.|I am reading a book.
Tisch|table|m|Tische|Tisches|Der Tisch ist rund.|The table is round.
Stuhl|chair|m|Stühle|Stuhls|Der Stuhl ist bequem.|The chair is comfortable.
Tür|door|f|Türen||Die Tür ist offen.|The door is open.
Fenster|window|n|Fenster|Fensters|Das Fenster ist offen.|The window is open.
Auto|car|n|Autos|Autos|Das Auto ist blau.|The car is blue.
Bus|bus|m|Busse|Busses|Der Bus kommt.|The bus is coming.
Zug|train|m|Züge|Zuges|Der Zug fährt.|The train is moving.
Bahnhof|station|m|Bahnhöfe|Bahnhofs|Der Bahnhof ist groß.|The station is big.
Straße|street|f|Straßen||Die Straße ist lang.|The street is long.
Stadt|city|f|Städte||Die Stadt ist schön.|The city is beautiful.
Land|country|n|Länder|Landes|Das Land ist klein.|The country is small.
Sprache|language|f|Sprachen||Ich lerne eine Sprache.|I am learning a language.
Schule|school|f|Schulen||Die Schule beginnt.|School is starting.
Lehrer|teacher|m|Lehrer|Lehrers|Der Lehrer erklärt das Wort.|The teacher explains the word.
Lehrerin|female teacher|f|Lehrerinnen||Die Lehrerin hilft mir.|The teacher helps me.
Freund|friend|m|Freunde|Freundes|Mein Freund kommt heute.|My friend is coming today.
Freundin|female friend|f|Freundinnen||Meine Freundin wohnt hier.|My friend lives here.
Bruder|brother|m|Brüder|Bruders|Mein Bruder kocht.|My brother is cooking.
Schwester|sister|f|Schwestern||Meine Schwester singt.|My sister is singing.
Vater|father|m|Väter|Vaters|Mein Vater arbeitet.|My father is working.
Mutter|mother|f|Mütter||Meine Mutter liest.|My mother is reading.
Eltern|parents|p|Eltern||Meine Eltern kommen.|My parents are coming.
Apfel|apple|m|Äpfel|Apfels|Ich esse einen Apfel.|I am eating an apple.
Banane|banana|f|Bananen||Die Banane ist gelb.|The banana is yellow.
Brot|loaf of bread|n|Brote|Brotes|Ich kaufe ein Brot.|I am buying a loaf of bread.
Ei|egg|n|Eier|Eies|Das Ei ist frisch.|The egg is fresh.
Kartoffel|potato|f|Kartoffeln||Die Kartoffel ist heiß.|The potato is hot.
Tomate|tomato|f|Tomaten||Die Tomate ist rot.|The tomato is red.
Tasse|cup|f|Tassen||Die Tasse ist leer.|The cup is empty.
Glas|glass|n|Gläser|Glases|Das Glas ist voll.|The glass is full.
Flasche|bottle|f|Flaschen||Die Flasche ist leer.|The bottle is empty.
Tag|day|m|Tage|Tages|Heute ist ein schöner Tag.|Today is a beautiful day.
Woche|week|f|Wochen||Eine Woche hat sieben Tage.|A week has seven days.
Monat|month|m|Monate|Monats|Ein Monat ist vorbei.|A month has passed.
Jahr|year|n|Jahre|Jahres|Das Jahr beginnt.|The year is beginning.
Uhr|clock|f|Uhren||Die Uhr ist kaputt.|The clock is broken.
Name|name|m|Namen|Namens|Mein Name ist Anna.|My name is Anna.
Junge|boy|m|Jungen|Jungen|Der Junge spielt.|The boy is playing.
Mädchen|girl|n|Mädchen|Mädchens|Das Mädchen lacht.|The girl is laughing.
Zimmer|room|n|Zimmer|Zimmers|Das Zimmer ist hell.|The room is bright.
Bett|bed|n|Betten|Bettes|Das Bett ist weich.|The bed is soft.
Tasche|bag|f|Taschen||Meine Tasche ist schwer.|My bag is heavy.
Schlüssel|key|m|Schlüssel|Schlüssels|Der Schlüssel liegt hier.|The key is here.`,
  A2: `Arzt|doctor|m|Ärzte|Arztes|Der Arzt untersucht mich.|The doctor examines me.
Ärztin|female doctor|f|Ärztinnen||Die Ärztin ist freundlich.|The doctor is friendly.
Krankenhaus|hospital|n|Krankenhäuser|Krankenhauses|Das Krankenhaus ist neu.|The hospital is new.
Apotheke|pharmacy|f|Apotheken||Die Apotheke schließt bald.|The pharmacy closes soon.
Rezept|prescription|n|Rezepte|Rezepts|Ich brauche ein Rezept.|I need a prescription.
Termin|appointment|m|Termine|Termins|Ich habe morgen einen Termin.|I have an appointment tomorrow.
Reise|journey|f|Reisen||Die Reise dauert lange.|The journey takes a long time.
Koffer|suitcase|m|Koffer|Koffers|Mein Koffer ist schwer.|My suitcase is heavy.
Flughafen|airport|m|Flughäfen|Flughafens|Der Flughafen ist weit weg.|The airport is far away.
Flugzeug|airplane|n|Flugzeuge|Flugzeugs|Das Flugzeug landet.|The airplane is landing.
Fahrkarte|ticket|f|Fahrkarten||Ich kaufe eine Fahrkarte.|I am buying a ticket.
Haltestelle|stop|f|Haltestellen||Die Haltestelle ist hier.|The stop is here.
Fahrrad|bicycle|n|Fahrräder|Fahrrads|Mein Fahrrad ist kaputt.|My bicycle is broken.
Wohnung|apartment|f|Wohnungen||Die Wohnung hat drei Zimmer.|The apartment has three rooms.
Küche|kitchen|f|Küchen||Die Küche ist sauber.|The kitchen is clean.
Bad|bathroom|n|Bäder|Bades|Das Bad hat ein Fenster.|The bathroom has a window.
Balkon|balcony|m|Balkone|Balkons|Der Balkon ist klein.|The balcony is small.
Garten|garden|m|Gärten|Gartens|Wir sitzen im Garten.|We are sitting in the garden.
Nachbar|neighbor|m|Nachbarn|Nachbarn|Unser Nachbar hilft uns.|Our neighbor helps us.
Miete|rent|f|Mieten||Die Miete ist hoch.|The rent is high.
Beruf|profession|m|Berufe|Berufs|Welchen Beruf hast du?|What is your profession?
Büro|office|n|Büros|Büros|Das Büro ist im ersten Stock.|The office is on the first floor.
Kollege|colleague|m|Kollegen|Kollegen|Mein Kollege ist krank.|My colleague is ill.
Kollegin|female colleague|f|Kolleginnen||Meine Kollegin kommt später.|My colleague is coming later.
Chef|boss|m|Chefs|Chefs|Der Chef ist im Büro.|The boss is in the office.
Firma|company|f|Firmen||Die Firma sucht Mitarbeiter.|The company is looking for employees.
Rechnung|bill|f|Rechnungen||Ich bezahle die Rechnung.|I am paying the bill.
Konto|account|n|Konten|Kontos|Ich eröffne ein Konto.|I am opening an account.
Geschäft|shop|n|Geschäfte|Geschäfts|Das Geschäft öffnet um neun.|The shop opens at nine.
Markt|market|m|Märkte|Marktes|Der Markt ist am Samstag.|The market is on Saturday.
Preis|price|m|Preise|Preises|Der Preis ist zu hoch.|The price is too high.
Geschenk|gift|n|Geschenke|Geschenks|Das Geschenk ist für dich.|The gift is for you.
Geburtstag|birthday|m|Geburtstage|Geburtstags|Heute ist mein Geburtstag.|Today is my birthday.
Einladung|invitation|f|Einladungen||Danke für die Einladung.|Thank you for the invitation.
Fest|celebration|n|Feste|Festes|Das Fest beginnt um sechs.|The celebration starts at six.
Wetterbericht|weather forecast|m|Wetterberichte|Wetterberichts|Ich höre den Wetterbericht.|I am listening to the weather forecast.
Wolke|cloud|f|Wolken||Die Wolke ist dunkel.|The cloud is dark.
Berg|mountain|m|Berge|Berges|Der Berg ist hoch.|The mountain is high.
See|lake|m|Seen|Sees|Wir schwimmen im See.|We are swimming in the lake.
Strand|beach|m|Strände|Strandes|Der Strand ist schön.|The beach is beautiful.
Wald|forest|m|Wälder|Waldes|Wir gehen durch den Wald.|We are walking through the forest.
Baum|tree|m|Bäume|Baumes|Der Baum ist sehr alt.|The tree is very old.
Blume|flower|f|Blumen||Die Blume ist gelb.|The flower is yellow.
Tier|animal|n|Tiere|Tieres|Das Tier schläft.|The animal is sleeping.
Vogel|bird|m|Vögel|Vogels|Der Vogel singt.|The bird is singing.
Foto|photo|n|Fotos|Fotos|Das Foto ist schön.|The photo is beautiful.
Brief|letter|m|Briefe|Briefes|Ich schreibe einen Brief.|I am writing a letter.
Nachricht|message|f|Nachrichten||Ich lese deine Nachricht.|I am reading your message.
Zeitung|newspaper|f|Zeitungen||Er liest die Zeitung.|He is reading the newspaper.
Ferien|holidays|p|Ferien||Die Ferien beginnen morgen.|The holidays start tomorrow.`,
  B1: `Erfahrung|experience|f|Erfahrungen||Diese Erfahrung war wichtig.|This experience was important.
Entscheidung|decision|f|Entscheidungen||Die Entscheidung fällt mir schwer.|The decision is difficult for me.
Meinung|opinion|f|Meinungen||Ich respektiere deine Meinung.|I respect your opinion.
Vorschlag|suggestion|m|Vorschläge|Vorschlags|Dein Vorschlag klingt gut.|Your suggestion sounds good.
Vorteil|advantage|m|Vorteile|Vorteils|Das ist ein großer Vorteil.|That is a big advantage.
Nachteil|disadvantage|m|Nachteile|Nachteils|Der Plan hat einen Nachteil.|The plan has a disadvantage.
Grund|reason|m|Gründe|Grundes|Es gibt einen guten Grund.|There is a good reason.
Ziel|goal|n|Ziele|Ziels|Wir erreichen unser Ziel.|We are reaching our goal.
Möglichkeit|possibility|f|Möglichkeiten||Es gibt eine andere Möglichkeit.|There is another possibility.
Lösung|solution|f|Lösungen||Wir suchen eine Lösung.|We are looking for a solution.
Problem|problem|n|Probleme|Problems|Das Problem ist bekannt.|The problem is known.
Aufgabe|task|f|Aufgaben||Die Aufgabe ist schwierig.|The task is difficult.
Prüfung|exam|f|Prüfungen||Ich habe die Prüfung bestanden.|I passed the exam.
Ausbildung|training program|f|Ausbildungen||Die Ausbildung dauert drei Jahre.|The training takes three years.
Bewerbung|application|f|Bewerbungen||Ich schicke meine Bewerbung ab.|I am sending my application.
Lebenslauf|résumé|m|Lebensläufe|Lebenslaufs|Mein Lebenslauf ist aktuell.|My résumé is up to date.
Vertrag|contract|m|Verträge|Vertrags|Ich unterschreibe den Vertrag.|I am signing the contract.
Gehalt|salary|n|Gehälter|Gehalts|Das Gehalt ist fair.|The salary is fair.
Versicherung|insurance policy|f|Versicherungen||Ich brauche eine Versicherung.|I need insurance.
Unfall|accident|m|Unfälle|Unfalls|Der Unfall passierte gestern.|The accident happened yesterday.
Verkehr|traffic|m|—|Verkehrs|Der Verkehr ist heute stark.|Traffic is heavy today.
Regel|rule|f|Regeln||Diese Regel gilt für alle.|This rule applies to everyone.
Gesetz|law|n|Gesetze|Gesetzes|Das Gesetz schützt die Bürger.|The law protects citizens.
Bürger|citizen|m|Bürger|Bürgers|Der Bürger stellt eine Frage.|The citizen asks a question.
Mensch|human being|m|Menschen|Menschen|Jeder Mensch hat Rechte.|Every human being has rights.
Student|student|m|Studenten|Studenten|Der Student lernt Deutsch.|The student is learning German.
Kunde|customer|m|Kunden|Kunden|Der Kunde wartet an der Kasse.|The customer is waiting at the checkout.
Herr|gentleman|m|Herren|Herrn|Der Herr trägt einen Hut.|The gentleman is wearing a hat.
Herz|heart|n|Herzen|Herzens|Mein Herz schlägt schnell.|My heart is beating fast.
Gedanke|thought|m|Gedanken|Gedankens|Das ist ein guter Gedanke.|That is a good thought.
Gefühl|feeling|n|Gefühle|Gefühls|Ich habe ein gutes Gefühl.|I have a good feeling.
Beziehung|relationship|f|Beziehungen||Unsere Beziehung ist stabil.|Our relationship is stable.
Gesellschaft|society|f|Gesellschaften||Die Gesellschaft verändert sich.|Society is changing.
Umwelt|environment|f|—||Wir schützen die Umwelt.|We protect the environment.
Energie|energy|f|Energien||Wir sparen Energie.|We save energy.
Verbrauch|consumption|m|—|Verbrauchs|Der Verbrauch sinkt.|Consumption is falling.
Abfall|waste|m|Abfälle|Abfalls|Wir trennen den Abfall.|We sort the waste.
Verpackung|packaging|f|Verpackungen||Die Verpackung ist aus Papier.|The packaging is made of paper.
Gerät|device|n|Geräte|Geräts|Das Gerät funktioniert wieder.|The device works again.
Bildschirm|screen|m|Bildschirme|Bildschirms|Der Bildschirm ist zu dunkel.|The screen is too dark.
Passwort|password|n|Passwörter|Passworts|Mein Passwort ist sicher.|My password is secure.
Datei|file|f|Dateien||Ich speichere die Datei.|I am saving the file.
Verbindung|connection|f|Verbindungen||Die Verbindung ist langsam.|The connection is slow.
Anleitung|instructions|f|Anleitungen||Lies bitte die Anleitung.|Please read the instructions.
Werkzeug|tool|n|Werkzeuge|Werkzeugs|Ich brauche ein Werkzeug.|I need a tool.
Reparatur|repair|f|Reparaturen||Die Reparatur ist teuer.|The repair is expensive.
Veranstaltung|event|f|Veranstaltungen||Die Veranstaltung beginnt bald.|The event begins soon.
Ausstellung|exhibition|f|Ausstellungen||Die Ausstellung ist interessant.|The exhibition is interesting.
Vortrag|lecture|m|Vorträge|Vortrags|Der Vortrag dauert eine Stunde.|The lecture lasts an hour.
Publikum|audience|n|—|Publikums|Das Publikum hört zu.|The audience is listening.`,
  B2: `Voraussetzung|prerequisite|f|Voraussetzungen||Erfahrung ist eine wichtige Voraussetzung.|Experience is an important prerequisite.
Herausforderung|challenge|f|Herausforderungen||Wir nehmen die Herausforderung an.|We accept the challenge.
Entwicklung|development|f|Entwicklungen||Wir beobachten die Entwicklung genau.|We are observing the development closely.
Auswirkung|effect|f|Auswirkungen||Die Entscheidung hat große Auswirkungen.|The decision has major effects.
Maßnahme|measure|f|Maßnahmen||Diese Maßnahme verbessert die Sicherheit.|This measure improves safety.
Zusammenhang|connection|m|Zusammenhänge|Zusammenhangs|Ich erkenne einen Zusammenhang.|I recognize a connection.
Einfluss|influence|m|Einflüsse|Einflusses|Sein Einfluss ist groß.|His influence is great.
Anspruch|claim|m|Ansprüche|Anspruchs|Sie hat Anspruch auf Unterstützung.|She is entitled to support.
Widerspruch|contradiction|m|Widersprüche|Widerspruchs|Das ist ein klarer Widerspruch.|That is a clear contradiction.
Nachweis|proof|m|Nachweise|Nachweises|Bitte legen Sie einen Nachweis vor.|Please provide proof.
Verfahren|procedure|n|Verfahren|Verfahrens|Das Verfahren ist transparent.|The procedure is transparent.
Ergebnis|result|n|Ergebnisse|Ergebnisses|Das Ergebnis überrascht uns.|The result surprises us.
Verhältnis|relationship|n|Verhältnisse|Verhältnisses|Das Verhältnis hat sich verbessert.|The relationship has improved.
Bedürfnis|need|n|Bedürfnisse|Bedürfnisses|Jeder Mensch hat eigene Bedürfnisse.|Every person has their own needs.
Kenntnis|knowledge (of something)|f|Kenntnisse||Sie verfügt über gute Kenntnisse.|She has good knowledge.
Fähigkeit|ability|f|Fähigkeiten||Diese Fähigkeit lässt sich trainieren.|This ability can be trained.
Eigenschaft|characteristic|f|Eigenschaften||Geduld ist eine wichtige Eigenschaft.|Patience is an important characteristic.
Verantwortung|responsibility|f|—||Er übernimmt die Verantwortung.|He takes responsibility.
Verpflichtung|obligation|f|Verpflichtungen||Wir erfüllen unsere Verpflichtungen.|We fulfill our obligations.
Genehmigung|approval|f|Genehmigungen||Die Genehmigung liegt bereits vor.|Approval has already been granted.
Behörde|authority|f|Behörden||Die Behörde prüft den Antrag.|The authority reviews the application.
Antrag|application (formal)|m|Anträge|Antrags|Der Antrag wurde abgelehnt.|The application was rejected.
Entwurf|draft|m|Entwürfe|Entwurfs|Der Entwurf wird überarbeitet.|The draft is being revised.
Bericht|report|m|Berichte|Berichts|Der Bericht enthält neue Daten.|The report contains new data.
Beitrag|contribution|m|Beiträge|Beitrags|Ihr Beitrag ist sehr wertvoll.|Her contribution is very valuable.
Begriff|term|m|Begriffe|Begriffs|Dieser Begriff ist schwer zu erklären.|This term is difficult to explain.
Standpunkt|viewpoint|m|Standpunkte|Standpunkts|Ich verstehe deinen Standpunkt.|I understand your viewpoint.
Argument|argument|n|Argumente|Arguments|Dieses Argument überzeugt mich.|This argument convinces me.
Beweis|evidence|m|Beweise|Beweises|Es gibt keinen Beweis dafür.|There is no evidence for it.
Hypothese|hypothesis|f|Hypothesen||Die Hypothese wird überprüft.|The hypothesis is being tested.
Forschung|research|f|Forschungen||Die Forschung macht Fortschritte.|Research is making progress.
Wissenschaft|science|f|Wissenschaften||Die Wissenschaft liefert neue Erkenntnisse.|Science provides new insights.
Erkenntnis|insight|f|Erkenntnisse||Diese Erkenntnis ist entscheidend.|This insight is crucial.
Fortschritt|progress|m|Fortschritte|Fortschritts|Wir machen große Fortschritte.|We are making great progress.
Rückgang|decline|m|Rückgänge|Rückgangs|Wir verzeichnen einen Rückgang.|We are recording a decline.
Wachstum|growth|n|—|Wachstums|Das Wachstum hat sich verlangsamt.|Growth has slowed down.
Wettbewerb|competition|m|Wettbewerbe|Wettbewerbs|Der Wettbewerb wird stärker.|Competition is intensifying.
Unternehmen|enterprise|n|Unternehmen|Unternehmens|Das Unternehmen investiert in Forschung.|The enterprise invests in research.
Betrieb|business|m|Betriebe|Betriebs|Der Betrieb beschäftigt hundert Menschen.|The business employs one hundred people.
Gewerkschaft|trade union|f|Gewerkschaften||Die Gewerkschaft fordert höhere Löhne.|The trade union demands higher wages.
Vertreter|representative|m|Vertreter|Vertreters|Der Vertreter spricht für die Gruppe.|The representative speaks for the group.
Experte|expert|m|Experten|Experten|Der Experte bewertet die Lage.|The expert assesses the situation.
Zeuge|witness|m|Zeugen|Zeugen|Der Zeuge beschreibt den Vorfall.|The witness describes the incident.
Präsident|president|m|Präsidenten|Präsidenten|Der Präsident hält eine Rede.|The president delivers a speech.
Journalist|journalist|m|Journalisten|Journalisten|Der Journalist stellt kritische Fragen.|The journalist asks critical questions.
Architekt|architect|m|Architekten|Architekten|Der Architekt plant das Gebäude.|The architect designs the building.
Kriterium|criterion|n|Kriterien|Kriteriums|Dieses Kriterium ist entscheidend.|This criterion is decisive.
Phänomen|phenomenon|n|Phänomene|Phänomens|Das Phänomen ist weltweit bekannt.|The phenomenon is known worldwide.
Risiko|risk|n|Risiken|Risikos|Wir müssen das Risiko einschätzen.|We must assess the risk.
Daten|data|p|Daten||Die Daten werden verschlüsselt.|The data is encrypted.`,
};
const weak = new Set([
  'Junge',
  'Nachbar',
  'Kollege',
  'Mensch',
  'Student',
  'Kunde',
  'Herr',
  'Experte',
  'Zeuge',
  'Präsident',
  'Journalist',
  'Architekt',
]);
const mixed = new Set(['Name', 'Gedanke']);
// Explicit accepted alternatives; do not infer -s/-es for weak or mixed nouns.
const genitiveAlternatives: Record<string, string[]> = {
  Mann: ['Manns'],
  Kind: ['Kinds'],
  Hund: ['Hunds'],
  Buch: ['Buchs'],
  Tisch: ['Tischs'],
  Stuhl: ['Stuhles'],
  Zug: ['Zugs'],
  Bahnhof: ['Bahnhofes'],
  Land: ['Lands'],
  Freund: ['Freunds'],
  Brot: ['Brots'],
  Ei: ['Eis'],
  Tag: ['Tags'],
  Monat: ['Monates'],
  Jahr: ['Jahrs'],
  Bett: ['Betts'],
  Arzt: ['Arzts'],
  Rezept: ['Rezeptes'],
  Termin: ['Termines'],
  Flugzeug: ['Flugzeuges'],
  Fahrrad: ['Fahrrades'],
  Bad: ['Bads'],
  Beruf: ['Berufes'],
  Geschäft: ['Geschäftes'],
  Markt: ['Markts'],
  Geschenk: ['Geschenkes'],
  Fest: ['Fests'],
  Berg: ['Bergs'],
  Strand: ['Strands'],
  Wald: ['Walds'],
  Baum: ['Baums'],
  Tier: ['Tiers'],
  Brief: ['Briefs'],
  Vorschlag: ['Vorschlages'],
  Vorteil: ['Vorteiles'],
  Nachteil: ['Nachteiles'],
  Grund: ['Grunds'],
  Ziel: ['Zieles'],
  Vertrag: ['Vertrages'],
  Gehalt: ['Gehaltes'],
  Unfall: ['Unfalles'],
  Verkehr: ['Verkehres'],
  Gefühl: ['Gefühles'],
  Verbrauch: ['Verbrauches'],
  Abfall: ['Abfalles'],
  Gerät: ['Gerätes'],
  Passwort: ['Passwortes'],
  Werkzeug: ['Werkzeuges'],
  Vortrag: ['Vortrages'],
  Zusammenhang: ['Zusammenhanges'],
  Anspruch: ['Anspruches'],
  Widerspruch: ['Widerspruches'],
  Antrag: ['Antrages'],
  Entwurf: ['Entwurfes'],
  Bericht: ['Berichtes'],
  Beitrag: ['Beitrages'],
  Begriff: ['Begriffes'],
  Standpunkt: ['Standpunktes'],
  Fortschritt: ['Fortschrittes'],
  Rückgang: ['Rückganges'],
  Wachstum: ['Wachstumes'],
  Wettbewerb: ['Wettbewerbes'],
  Betrieb: ['Betriebes'],
};
const categories: Record<Level, string> = {
  A1: 'Everyday essentials',
  A2: 'Life & travel',
  B1: 'Work & society',
  B2: 'Ideas & perspectives',
};
export const nouns: Noun[] = Object.entries(raw).flatMap(([level, rows]) =>
  rows.split('\n').map((row) => {
    const [word, english, g, plural, gen, example, translation] = row.split('|');
    const gender = g as Gender;
    return {
      id: word,
      word,
      english,
      gender,
      plural,
      level: level as Level,
      category: categories[level as Level],
      article: gender === 'm' ? 'der' : gender === 'n' ? 'das' : 'die',
      indefinite: gender === 'p' ? null : gender === 'f' ? 'eine' : 'ein',
      genitive: gen || word,
      genitiveAlternatives: genitiveAlternatives[word],
      dativePlural: plural === '—' ? '—' : /[ns]$/.test(plural) ? plural : plural + 'n',
      weak: weak.has(word),
      example,
      translation,
      notes:
        gender === 'p'
          ? 'Plural only; no singular indefinite article.'
          : plural === '—'
            ? 'Normally used without a plural in this meaning.'
            : weak.has(word)
              ? 'Weak noun: -(e)n in all singular cases except nominative.'
              : mixed.has(word)
                ? 'Mixed declension: -n in accusative/dative, -ns in genitive.'
                : word === 'Herz'
                  ? 'Genitive: Herzens; dative: Herzen (also Herz).'
                  : word === 'Mädchen'
                    ? 'The suffix -chen makes this noun neuter, regardless of natural gender.'
                    : word === plural
                      ? 'Singular and plural have the same spelling.'
                      : 'Learn the plural with the noun; umlauts are significant.',
    };
  }),
);
