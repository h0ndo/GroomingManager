# UX/UI- und Accessibility-Spezifikation: Arbeitsgraph-MVP

Status: UX/UI-Spezifikation für `GM-GRAPH-001` bis `GM-GRAPH-008`, Schwerpunkt `GM-GRAPH-004` Focused Work, `GM-GRAPH-005` Custom Flex und `GM-GRAPH-007` Tastatur/lineare Alternative.

## Zielbild

Der Arbeitsgraph ist der primäre Arbeitsraum nach dem Login. Er ersetzt klassische Menüsuche nicht nur visuell, sondern macht sichtbar:

- welche Domänen eine Rolle bearbeiten darf,
- welche konkreten Instanzen gerade im Arbeitskontext liegen,
- welche Aktionen fachlich an welcher Domäne oder Instanz hängen,
- welche Bereiche bewusst ein- oder ausgeblendet sind.

Die UI muss barriereärmer sein als eine verschachtelte Business-Navigation: weniger versteckte Pfade, klarere Kontextzuordnung, stabile Fokusführung, vollständige Tastaturbedienbarkeit und eine lineare Alternative für Screenreader und Nutzer:innen, die den Graphen nicht räumlich bedienen möchten.

## Grundannahmen für den MVP

- Rollen im MVP: `admin`, `groomer`, `kunde`.
- Custom-Flex-Positionen bleiben zunächst im Frontend-State und werden über `Layout zurücksetzen` verworfen.
- Instanzknoten dürfen im MVP aus Stub-/Demo-Daten entstehen, müssen aber im UI als simuliert oder beispielhaft erkennbar sein.
- Bestehende klassische Routen dürfen als Fallback sichtbar bleiben, der Graph ist aber die primäre Arbeitsnavigation.
- Diese Annahmen müssen durch Requirements/Teamleitung bestätigt werden, blockieren die UX-Spezifikation aber nicht.

## Gemeinsame Informationsarchitektur

### Knotentypen

| Typ | Nutzerziel | Verhalten | Accessibility-Auswirkung |
| --- | --- | --- | --- |
| `root` / Start | Zur zentralen Orientierung zurückfinden. | Aktiviert Übersicht. In Custom Flex optional globales Auf-/Zuklappen. | Eindeutiger Startpunkt für Tastatur- und lineare Darstellung. |
| `domain` | Arbeitsbereich wie Kund:innen, Hunde, Termine öffnen. | Aktiviert Kontextpanel; expandiert/zentriert je nach Modus. | Domänen ersetzen versteckte Hauptnavigation durch sichtbare, benannte Ziele. |
| `page` / Liste | Listen- oder Seitenkontext erreichen. | Öffnet Kontextpanel oder vorhandene Route. | Beschreibt eindeutig, dass dies ein Listen-/Seitenbereich ist. |
| `instance` | An konkretem Objekt arbeiten. | Hält Objekt als Arbeitsknoten sichtbar; zeigt Beziehungen/Aktionen. | Reduziert Gedächtnislast, weil der konkrete Kontext sichtbar bleibt. |
| `action` | Kontextaktion ausführen. | Öffnet Formular/Panel oder startet Aktion; destruktive Aktionen brauchen Bestätigung. | Aktionen sind nicht versteckt, sondern semantisch am passenden Objekt verankert. |

### Kanten

Kanten sind semantische Beziehungen, nicht Dekoration. Jede Kante braucht intern eine fachliche Bedeutung: `gehört zu`, `öffnet`, `Aktion für`, `Instanz von`, `Termin für`. Visuell reicht im MVP eine Linie mit Typfarbe/-stil; die lineare Alternative und Screenreader-Texte müssen die Beziehung sprachlich nennen.

## Interaktionsmodus: Focused Work

### Nutzerziel

Nutzer:innen wollen einen aktiven Arbeitskontext stabil im Zentrum behalten, z. B. einen Kunden, Hund oder Termin, ohne die Orientierung im Gesamtgraphen komplett zu verlieren.

### Verhalten

1. Auswahl eines Knotens setzt ihn als aktiven Knoten.
2. Im Modus Focused Work wird `centeredNodeId` auf den aktiven bzw. explizit fokussierten Knoten gesetzt.
3. Die Zentrierung erfolgt über Viewport-/Layout-Transformation, nicht durch Mutation der fachlichen Graphdaten.
4. Vorheriger Kontext bleibt sichtbar, wird aber räumlich nach links oder in den Hintergrund verschoben.
5. Auswahl eines Top-Level-Knotens öffnet nur dessen relevante Kinder; andere Top-Level-Bereiche bleiben reduziert.
6. Wechsel auf einen anderen Knoten kündigt die Fokusänderung kurz an: Panel-Titel, aktive Markierung und optional Live-Region aktualisieren sich gemeinsam.
7. Escape führt aus Detail-/Aktionskontexten zum letzten stabilen Graphkontext zurück; wenn kein Detailkontext offen ist, wird nur Pan/Viewport zurückgesetzt.

### Zustände

| Zustand | Darstellung | UI-Text/Label | Accessibility-Anforderung |
| --- | --- | --- | --- |
| Normal | Kreis mit Typfarbe, Icon und Kurzlabel. | Sichtbarer Name, z. B. `Kunden`. | Button muss Namen, Typ und Zweck im Accessible Name/Description haben. |
| Hover | Leichte Hervorhebung, kein Informationsverlust. | Kein neuer Pflichttext nur auf Hover. | Hover darf nicht einzige Informationsquelle sein. |
| Active | Deutlicher Ring/Glow plus Panel-Kopplung. | `Aktiver Arbeitsknoten: Kunden`. | `aria-current` oder vergleichbare Semantik für aktiven Knoten prüfen. |
| Focus | Starker, kontrastreicher Fokusrahmen, unabhängig von Active. | Keine Änderung des Labels. | `:focus-visible` muss ohne Hover sichtbar sein; Mindestkontrast 3:1 zum Umfeld. |
| Disabled | Gedimmt, nicht interaktiv, Grund im Panel/Tooltip. | `Nicht verfügbar: fehlende Berechtigung`. | Nicht als aktives Ziel fokussieren; wenn sichtbar, Erklärung in linearer Liste. |
| Empty | Reduzierter Knoten/Panel mit nächster sinnvoller Aktion. | `Noch keine Hunde hinterlegt. Hund hinzufügen.` | Empty State muss handlungsleitend und nicht nur leer sein. |
| Loading | Knoten/Panel zeigt Ladezustand ohne Layoutsprung. | `Kunden werden geladen…`. | `aria-busy=true` am betroffenen Bereich; keine Fokusfalle. |
| Error | Betroffener Knoten/Panel mit Fehlerfarbe und Wiederholen-Aktion. | `Kunden konnten nicht geladen werden. Erneut versuchen.` | Fehler muss im Panel und optional Live-Region angekündigt werden. |

### Accessibility-Auswirkung

Focused Work reduziert kognitive Last, weil nur der aktuelle Arbeitsbereich expandiert und visuell stabil bleibt. Damit der Modus keine neue Barriere erzeugt, müssen Zentrierung und Animationen reduziert werden, wenn Nutzer:innen reduzierte Bewegung bevorzugen (`prefers-reduced-motion`). Die aktive Beziehung zwischen Graphknoten und Kontextpanel muss programmatisch nachvollziehbar sein.

## Interaktionsmodus: Custom Flex

### Nutzerziel

Nutzer:innen wollen Top-Level-Arbeitsbereiche räumlich so arrangieren, dass sie zu ihrer Arbeitsweise passen, ohne fachliche Parent-Child-Beziehungen zu zerstören.

### Verhalten

1. Nur Top-Level-Knoten sind im MVP frei verschiebbar.
2. Drag startet erst nach kleinem Bewegungsschwellwert, damit ein Klick nicht versehentlich als Drag zählt.
3. Während Drag erhält der Knoten einen Drag-Zustand; Kindknoten folgen live parent-relativ.
4. Kindknoten werden aus aktueller Parent-Position plus Auto-Layout-Differenz berechnet. Veraltete manuelle Child-Positionen dürfen nicht gewinnen.
5. `Alles einpassen` ist nur in Custom Flex sichtbar und passt Zoom/Pan auf alle sichtbaren Knoten an.
6. `Layout zurücksetzen` löscht manuelle Positionen, Zoom und Pan und stellt die Standardanordnung wieder her.
7. Start-Knoten kann im Custom-Flex-Modus alle aktuell expandierbaren Bereiche auf- oder zuklappen.
8. Dragging darf keine Aktion auslösen; ein bewegter Knoten unterdrückt den nächsten Click.

### Fit-to-View, Mindestlesbarkeit und Viewport

#### Nutzerziel

Nutzer:innen wollen nach `Alles aufklappen` schnell wieder Orientierung bekommen, ohne dass der vollständig sichtbare Graph so stark verkleinert wird, dass Labels, Icons oder Fokusrahmen nicht mehr produktiv lesbar sind.

#### Verhalten

1. `Alles einpassen` berechnet zunächst die Bounding Box aller sichtbaren Knoten inklusive Knotenradius, Labelbereich, Fokus-/Active-Ring und Kantenendpunkte.
2. Der Zielzoom darf nicht unter den Mindestlesezoom fallen. Für den MVP gilt: `minReadableZoom = 0.75` für Graphknoten mit sichtbarem Label. Ein reiner Übersichtszoom unter 0.75 ist nur zulässig, wenn Labels ab diesem Zustand nicht als primäre Bedieninformation gelten und eine klare Alternative angeboten wird.
3. Wenn alle sichtbaren Knoten bei `minReadableZoom` nicht gleichzeitig in den Graphviewport passen, wird nicht weiter verkleinert. Stattdessen setzt `Alles einpassen` Zoom auf `minReadableZoom`, zentriert die Graph-Bounding-Box bestmöglich und lässt Pan/Scroll für die restliche Fläche zu.
4. In diesem Fall zeigt die UI einen nicht-blockierenden Hinweis: `Graph ist bei lesbarer Größe größer als der sichtbare Bereich. Ziehe oder scrolle, um weitere Knoten zu sehen.`
5. Die Toolbar-Aktion bleibt erfolgreich, wenn keine Knoten abgeschnitten sind, die innerhalb des pannbaren Bereichs liegen. Erfolg bedeutet nicht zwingend: alle Knoten gleichzeitig ohne Bewegung sichtbar.
6. Bei `prefers-reduced-motion: reduce` erfolgen Zoom/Pan-Änderungen ohne animiertes Hinein-/Herausfliegen.
7. `Alles einpassen` verändert keine Expansion, keine aktiven Knoten, keine manuellen Top-Level-Positionen und keine Graphdaten.

#### Viewport-Regeln

- Der Graphviewport braucht innen mindestens `32px` Padding auf allen Seiten; bei sichtbaren Hilfetexten/Overlays unten mindestens `48px` Safe Area, damit Knoten und Fokusrahmen nicht unter Texten liegen.
- Der Graphbereich soll im Dashboard mindestens `min(70vh, verfügbare Dashboardhöhe)` nutzen; als harte Untergrenze gelten `560px` Höhe auf Desktop-Viewports. Bei kleineren Viewports muss ein vertikaler Scrollbereich oder eine reduzierte Graphhöhe plus direkt sichtbare lineare Alternative greifen.
- Toolbar, Hilfetext und Statushinweise dürfen nicht über interaktiven Knoten liegen. Wenn Overlay technisch nötig ist, muss die Fit-Bounding-Box dessen belegte Fläche als nicht nutzbaren Innenbereich abziehen.
- Pan-Grenzen müssen alle sichtbaren Knoten plus Padding erreichbar machen. Kein sichtbarer Knoten darf dauerhaft außerhalb des pannbaren Bereichs liegen.
- Wenn der Graph größer als der Viewport ist, müssen visuelle Pan-/Scroll-Signale sichtbar sein: dezente Randverläufe, Mini-Hinweis `Zum Verschieben ziehen` oder eine kurze Statuszeile nach Fit-to-View. Signale dürfen wichtige Labels nicht verdecken.

#### Zustände

| Zustand | Darstellung | UI-Text/Label | Accessibility-Anforderung |
| --- | --- | --- | --- |
| Fit erfolgreich, alles passt | Graph ist mit lesbarem Zoom komplett sichtbar. | Live-Region: `Alle sichtbaren Knoten eingepasst.` | Fokus bleibt auf `Alles einpassen`; kein automatischer Fokuswechsel. |
| Fit erfolgreich, pannbar | Zoom bleibt bei Mindestlesezoom; Rand-/Pan-Signale zeigen weitere Fläche an. | Status: `Graph ist bei lesbarer Größe größer als der sichtbare Bereich.` | Hinweis wird per `aria-live="polite"` angekündigt und ist nicht nur farblich codiert. |
| Fit nicht möglich | Graphdaten fehlen oder Bounding Box kann nicht berechnet werden. | `Graph konnte nicht eingepasst werden. Erneut versuchen.` | Fehler im Kontext des Graphen, Schaltfläche bleibt per Tastatur erreichbar. |
| Sehr kleiner Viewport | Graph zeigt lesbaren Ausschnitt; lineare Alternative ist direkt erreichbar. | `Kleiner Bildschirm: Nutze die Liste für die vollständige Struktur.` | Liste darf nicht hinter rein visuellem Scroll-/Pan-Verhalten versteckt sein. |

#### Nicht-Ziele und Trade-offs

- Nicht-Ziel: Der vollständig aufgeklappte Graph muss nicht immer gleichzeitig auf einem Desktop-Screen vollständig lesbar sichtbar sein. Lesbarkeit hat Vorrang vor Totalübersicht.
- Nicht-Ziel: Kein automatisches Einklappen von fachlich sichtbaren Knoten als Nebenwirkung von `Alles einpassen`; das würde Nutzer:innen Kontext entziehen.
- Trade-off: Bei großen Graphen ist `Alles einpassen` eine Orientierungs- und Pan-Startposition, nicht die Hauptarbeitsansicht. Für produktives Arbeiten sollen Focused Work, Collapse und die lineare Alternative genutzt werden.
- Trade-off: Kompaktere radiale Abstände dürfen Action-Knoten näher an Parents bringen, aber nicht unter die Mindestzielgröße von `44 x 44 CSS-Pixel` und nicht zu überlappenden Fokusrahmen führen.

### Zustände

| Zustand | Darstellung | UI-Text/Label | Accessibility-Anforderung |
| --- | --- | --- | --- |
| Normal | Knoten wirkt greifbar, aber nicht wie frei editierbarer Node-Editor. | `Kunden, Domäne, verschiebbar`. | Accessible Description nennt Verschiebbarkeit nur für verschiebbare Top-Level-Knoten. |
| Hover | Cursor/Highlight signalisiert Drag-Möglichkeit. | Kein ausschließlich visueller Hinweis. | Für Tastatur gibt es separate Aktionen `Nach oben/unten/links/rechts verschieben` oder lineare Steuerung. |
| Active | Knoten bleibt fachlich aktiv, unabhängig von manueller Position. | `Aktiver Arbeitsknoten`. | Active darf nicht mit Drag-Fokus verwechselt werden. |
| Focus | Fokusrahmen bleibt während Tastaturbedienung sichtbar. | Aktionshilfen im Hilfetext. | Fokus darf beim Drag/Reset nicht verloren gehen. |
| Dragging | Knoten hebt sich an; betroffene Kinder bewegen sich mit. | Live-Region sparsam: `Kunden verschoben`. | Keine dauernde Screenreader-Flut während Pointer-Drag; Abschluss reicht. |
| Disabled | Nicht verschiebbare Kinder zeigen kein Drag-Signal. | `Wird durch Elternknoten angeordnet`. | Kinder bleiben aktivierbar, aber nicht als frei verschiebbar angekündigt. |
| Empty | Keine expandierten Kinder; Knoten zeigt Expander-Hinweis. | `Weitere Inhalte ausgeblendet`. | Eingeklappte Inhalte müssen über Knotenaktion oder lineare Liste wieder erreichbar sein. |
| Loading | Manuelles Layout bleibt stabil, Kindbereich lädt nach. | `Aktionen werden geladen…`. | `aria-busy` am Teilbaum. |
| Error | Fehler am betroffenen Teilbaum, Parent bleibt verschiebbar. | `Teilbereich konnte nicht geladen werden`. | Wiederholen-Aktion ist per Tastatur erreichbar. |

### Accessibility-Auswirkung

Custom Flex verbessert Orientierung für Nutzer:innen, die von räumlicher Anordnung profitieren. Gleichzeitig muss eine nicht-räumliche Bedienung gleichwertig bleiben: alle Ziele und Aktionen sind auch in der linearen Alternative erreichbar; Dragging ist Zusatzkomfort, nicht Voraussetzung.

## Tastaturmodell

### Tab-Reihenfolge

1. Skip-/Orientierungslink zum Arbeitsgraphen.
2. Modusumschalter `Focused Work` / `Custom Flex`.
3. Graph-Toolbar: Zoom, Alles einpassen, Layout zurücksetzen, Alles auf-/zuklappen.
4. Graph als fokussierbarer Bereich mit kurzem Hilfetext.
5. Sichtbare Knoten in stabiler logischer Reihenfolge: Start, Top-Level im Rollenmodell, expandierte Kinder parentweise, Instanzen, Aktionen.
6. Kontextpanel zum aktiven Knoten.
7. Fallback-Routen/sonstige Dashboard-Bereiche.

### Tastenbelegung

| Taste | Verhalten |
| --- | --- |
| Tab / Shift+Tab | Wechselt zwischen globalen Controls, sichtbaren Knoten und Panel-Controls. |
| Enter / Space | Aktiviert fokussierten Knoten oder dessen Hauptaktion. |
| Pfeiltasten | Optional innerhalb des Graphbereichs: nächster Knoten entlang sichtbarer Beziehungen oder räumlich nächster Knoten. Wenn technisch unsicher, erst roving tabindex in logischer Reihenfolge umsetzen. |
| Home | Fokus auf Start-Knoten. |
| End | Fokus auf letzten sichtbaren Knoten in linearer Reihenfolge. |
| Escape | Schließt Detail-/Aktionskontext oder setzt Pan zurück; Fokus bleibt nachvollziehbar im Graph/Panel. |
| + / - | Zoom im Graphbereich, zusätzlich zu Toolbar-Buttons. |
| Strg/Cmd + Mausrad | Zoom mit Pointer; darf normales Scrollen ohne Modifier nicht blockieren. |

### Fokusführung

- Nach Aktivierung eines Knotens bleibt der Fokus grundsätzlich auf dem Knoten, damit Nutzer:innen weiter im Graph navigieren können.
- Wenn eine Aktion ein Formular im Kontextpanel öffnet, darf der Fokus auf die erste sinnvolle Formulareingabe wechseln, muss aber per Escape oder Zurück-Aktion zum auslösenden Knoten zurückkehren.
- Nach `Layout zurücksetzen`, `Alles einpassen`, Expand oder Collapse bleibt der Fokus auf dem auslösenden Control oder Knoten.
- Ausgeblendete Knoten dürfen nicht im Tab-Order verbleiben.

## Screenreader- und ARIA-Konzept

### Graph-Region

- Graph-Container: `role="region"` mit `aria-label="Arbeitsgraph: Navigation, Beziehungen und Aktionen"`.
- Hilfetext per `aria-describedby`, z. B. `Enter aktiviert, Escape geht zurück, Tab erreicht die lineare Liste.`
- Bei asynchronem Laden: `aria-busy="true"` am betroffenen Graph- oder Panelbereich.

### Knotenlabel

Jeder Knoten braucht einen verständlichen Accessible Name und eine zusätzliche Beschreibung:

Format:

`<Name>, <Typ>. <Status>. <Beziehungen>. <Hauptaktion>.`

Beispiele:

- `Kunden, Domäne. Aktiv. 3 Inhalte sichtbar. Enter öffnet Kundenkontext.`
- `Katja Gross, Kundeninstanz. Verbunden mit Kunden, Profil, Terminliste und Löschen. Enter zeigt Details.`
- `Löschen, Aktion für Katja Gross. Destruktive Aktion, Bestätigung erforderlich.`

### Kanten für Screenreader

Visuelle Kanten bleiben `aria-hidden`, weil einzelne SVG-Linien sonst Rauschen erzeugen. Beziehungen werden stattdessen in Knotenbeschreibung, Kontextpanel und linearer Liste textlich wiedergegeben.

### Live-Region

Das Kontextpanel kann `aria-live="polite"` nutzen. Keine Live-Ankündigung bei jedem Pixel Drag. Sinnvolle Ankündigungen:

- `Kunden fokussiert.`
- `Kunden aufgeklappt, 3 Inhalte sichtbar.`
- `Layout zurückgesetzt.`
- `Alle sichtbaren Knoten eingepasst.`
- `Kunde Katja Gross angeheftet.`

## Lineare Alternative

### Nutzerziel

Nutzer:innen, die Screenreader nutzen, räumliche Graphen schwer verstehen oder bewusst eine reduzierte Ansicht möchten, können dieselben sichtbaren Inhalte als Liste/Baum bedienen.

### Verhalten

1. Eine Schaltfläche `Als Liste anzeigen` oder ein dauerhaft sichtbarer Abschnitt `Lineare Ansicht` steht direkt beim Graphen bereit.
2. Die lineare Ansicht bildet exakt den aktuell sichtbaren Graphzustand ab, nicht einen separaten Navigationsbaum.
3. Die Darstellung ist hierarchisch: Start als Wurzel, darunter Gruppen pro rollenabhängiger Top-Level-Domäne, darunter expandierte Kinder in Parent-Child-Reihenfolge.
4. Jeder Eintrag zeigt Typ, Name, Kurzbeschreibung, Status, Hierarchietiefe und verfügbare Aktionen.
5. Expand/Collapse und Aktivierung sind auch in der Liste möglich.
6. Aktiver Knoten, Tastaturfokus, Expand/Collapse und Kontextpanel bleiben zwischen Graph und Liste synchron.
7. Wenn der Graph visuell nicht bedienbar ist, bleibt die Liste vollständig nutzbar.
8. Bei sehr langen Listen bleiben Domain-Gruppen überspringbar: Jede Domain-Gruppe hat eine Überschrift und optional eine Aktion `Gruppe überspringen` bzw. die nächste Überschrift ist per Screenreader-Navigation erreichbar.

### Hierarchieregeln

- Die lineare Alternative nutzt im MVP eine Baum-/Gruppenstruktur statt gleichrangiger Kartenfolge.
- Top-Level-Domänen werden als Gruppen mit Überschrift dargestellt, z. B. `Kunden`, `Hunde`, `Termine`. Die Überschrift nennt Status und Anzahl sichtbarer Kinder: `Kunden, Domäne, aufgeklappt, 5 sichtbare Einträge`.
- Kinder werden visuell eingerückt. Empfohlene Einrückung: `depth * 1rem`, maximal `3rem`; tiefere Ebenen behalten zusätzlich eine sichtbare Parent-Zeile oder Breadcrumb, damit Text nicht zu schmal wird.
- Jede Zeile zeigt eine knappe Beziehung zum Parent, z. B. `Aktion für Kunden`, `Liste in Kunden`, `Hund von Katja Gross`.
- Actions hängen unmittelbar unter dem Knoten, für den sie gelten, nicht gesammelt am Ende der Liste.
- Eingeklappte Parents bleiben als Zeile sichtbar und nennen, wie viele aktuell ausgeblendete Kinder vorhanden sind: `3 Inhalte ausgeblendet`.
- Instanzknoten dürfen nach Domain gruppiert bleiben; mehrere Instanzen sollen nicht als unstrukturierte Kartenwand erscheinen. Wenn viele Instanzen sichtbar sind, braucht die Gruppe eine kompakte Listenvariante mit Name, Typ und Hauptaktion.
- Active-State wird auf genau einem Eintrag angezeigt. Wenn der aktive Knoten in einer eingeklappten Gruppe liegen würde, muss der Parent entweder automatisch aufgeklappt werden oder die Zeile zeigt `Aktiver Knoten liegt in dieser Gruppe` und bietet `Aktiven Eintrag anzeigen`.
- Tastaturfokus und Active-State sind getrennt: Fokus zeigt die aktuelle Bedienposition, Active zeigt den fachlichen Arbeitsknoten.

### Semantik und ARIA für die lineare Alternative

- Die einfache MVP-Variante darf als verschachtelte Liste (`ul`/`li`) mit Buttons umgesetzt werden. Wenn ein ARIA-Tree verwendet wird, muss das Team Tastaturverhalten nach Tree-Pattern vollständig testen; ein halb implementierter Tree ist schlechter als eine robuste Liste.
- Jede Domain-Gruppe braucht eine programmatische Überschrift (`h3` oder vergleichbar), damit Screenreader-Nutzer:innen Gruppen anspringen können.
- Einträge verwenden sprechende Button-Labels nach dem Knotenlabel-Format: `<Name>, <Typ>. <Status>. <Beziehung>. <Hauptaktion>.`.
- Expand/Collapse-Buttons nutzen `aria-expanded` und referenzieren den sichtbaren Kindbereich, wenn technisch stabil möglich.
- Der aktive Eintrag nutzt denselben Active-State wie der Graph, z. B. `aria-current="page"` oder `aria-current="true"`, abhängig von der finalen Semantik.
- Beim Aktivieren eines Listeneintrags aktualisieren sich Graph, Kontextpanel und Live-Region genauso wie bei Aktivierung des Graphknotens.

### Beispielstruktur

```text
Arbeitsgraph als Liste
- Start, Übersicht

Kunden, Domäne, aufgeklappt, 3 sichtbare Einträge
  - Kundenliste, Listenbereich in Kunden, nicht aktiv
  - Suchen, Aktion für Kunden
  - Hinzufügen, Aktion für Kunden

Hunde, Domäne, eingeklappt, 4 Inhalte ausgeblendet

Kalender, Domäne, aufgeklappt, aktiver Bereich
  - Tagesplanung, Listenbereich in Kalender, aktiv
  - Neuer Termin, Aktion für Kalender
```

## UI-Texte und Orientierung

| Ort | Text |
| --- | --- |
| Graph-Titel | `Arbeitsgraph` |
| Untertitel | `Navigation, Beziehungen und Aktionen` |
| Focused Work Button | `Focused Work` mit Hilfetext `Aktiven Arbeitsknoten zentrieren und Ablenkung reduzieren` |
| Custom Flex Button | `Custom Flex` mit Hilfetext `Top-Level-Arbeitsbereiche frei anordnen` |
| Alles einpassen | `Alles einpassen` |
| Layout zurücksetzen | `Layout zurücksetzen` |
| Alles aufklappen | `Alles aufklappen` |
| Alles zuklappen | `Alles zuklappen` |
| Lineare Alternative | `Als Liste anzeigen` / `Graphliste ausblenden` |
| Fit-to-View pannbar | `Graph ist bei lesbarer Größe größer als der sichtbare Bereich. Ziehe oder scrolle, um weitere Knoten zu sehen.` |
| Kleiner Viewport | `Kleiner Bildschirm: Nutze die Liste für die vollständige Struktur.` |
| Empty Graph | `Für deine Rolle sind noch keine Arbeitsbereiche verfügbar.` |
| Keine Kinder | `Weitere Inhalte sind aktuell ausgeblendet.` |
| Loading | `<Domäne> wird geladen…` |
| Error | `<Domäne> konnte nicht geladen werden. Erneut versuchen.` |

## Visuelle Mindestanforderungen

- Knotenform rund, aber mit zusätzlicher Typcodierung durch Farbe, Icon und Text; Farbe allein reicht nicht.
- Active und Focus müssen unterscheidbar sein: Active = fachliche Auswahl, Focus = Tastaturposition.
- Bewegungen maximal kurz; bei `prefers-reduced-motion: reduce` Positionsanimationen und Spawn-Animationen deaktivieren oder stark reduzieren.
- Knotenlabels müssen bei 200% Browserzoom lesbar bleiben; wenn nötig größere Knoten oder Umschalten auf lineare Ansicht.
- Zielgröße für interaktive Knoten/Controls mindestens 44 x 44 CSS-Pixel.
- Fehlerzustände müssen Text enthalten, nicht nur Rotfärbung.
- Graph-Zoom darf für Arbeitsansichten nicht unter `0.75` fallen, solange Knotenlabels die primäre Orientierung liefern. Niedrigere Zoomstufen sind als reine Übersicht erlaubt, brauchen dann aber sichtbaren Hinweis und direkt erreichbare lineare Alternative.
- Der Fit-to-View-Algorithmus muss Label-Boxen, Fokus-/Active-Ringe und Safe Areas berücksichtigen; Knoten gelten erst als eingepasst, wenn diese sichtbaren Bestandteile nicht abgeschnitten werden.
- Bei pannbaren Graphen müssen Rand- oder Statussignale zeigen, dass außerhalb des aktuellen Ausschnitts weitere Inhalte liegen.

## Frontend-Akzeptanzkriterien

### Für GM-GRAPH-004 Focused Work

- [ ] Aktivierung eines sichtbaren Knotens setzt Active-State, aktualisiert Kontextpanel und zentriert den Knoten im Focused-Work-Modus.
- [ ] Zentrierung wird als View/Layout-Transformation umgesetzt; Graphdaten, Knoten-IDs und Kanten bleiben unverändert.
- [ ] Vorheriger Kontext bleibt sichtbar und liegt relativ links oder visuell zurückgenommen.
- [ ] Active-State und Focus-State sind getrennt per CSS test-/prüfbar.
- [ ] Bei `prefers-reduced-motion: reduce` werden zentrierende Übergänge ohne starke Bewegung dargestellt.
- [ ] Escape aus einem geöffneten Panel/Formular führt zurück zum auslösenden Knoten; Escape im Graph setzt Pan zurück.
- [ ] Screenreader-Label des aktiven Knotens nennt Name, Typ, Status und Beziehungen.

### Für GM-GRAPH-005 Custom Flex

- [ ] Nur Top-Level-Knoten sind frei per Pointer verschiebbar; Kindknoten bleiben aktivierbar, aber nicht frei dragbar.
- [ ] Verschobene Top-Level-Positionen leben im Frontend-State.
- [ ] Kindpositionen werden bei jeder Positionsberechnung parent-relativ aus aktueller Parent-Position plus Auto-Layout-Delta berechnet.
- [ ] Stale manuelle Kindpositionen werden ignoriert, sobald sie die parent-relative Ordnung brechen würden.
- [ ] Dragging löst keine Knotenaktivierung aus.
- [ ] `Alles einpassen` ist nur in Custom Flex sichtbar und verändert Zoom/Pan innerhalb definierter Grenzen.
- [ ] `Alles einpassen` zoomt für Arbeitsansichten nicht unter `0.75`; wenn der Graph bei diesem Zoom größer als der Viewport ist, bleibt er pannbar statt weiter verkleinert zu werden.
- [ ] Fit-to-View berechnet die Bounding Box inklusive Knotenradius, sichtbarer Labels, Kantenendpunkte, Focus-/Active-Ring und Viewport-Safe-Areas.
- [ ] Graphviewport nutzt mindestens `32px` Innenabstand, unten bei Hilfetext/Overlay mindestens `48px` Safe Area; Knoten/Fokusrahmen dürfen nicht unter Toolbar oder Hilfetext liegen.
- [ ] Wenn nach Fit-to-View nicht alle Knoten gleichzeitig sichtbar sind, zeigt die UI einen verständlichen Pan-/Scroll-Hinweis und kündigt ihn per `aria-live="polite"` an.
- [ ] `Layout zurücksetzen` löscht manuelle Positionen, Zoom und Pan und behält den Fokus nachvollziehbar.
- [ ] Tastaturnutzer:innen können dieselben Knoten über Tab/Enter oder lineare Alternative erreichen.

### Für GM-GRAPH-007 Tastatur/lineare Alternative

- [ ] Jeder sichtbare Knoten ist per Tastatur erreichbar oder in der linearen Alternative mit gleichwertiger Aktivierung vorhanden.
- [ ] Enter und Space aktivieren fokussierte Knoten; Escape hat ein dokumentiertes Rücksprungverhalten.
- [ ] Ausgeblendete Knoten sind nicht im Tab-Order.
- [ ] Der Graphbereich besitzt Hilfetext für Bedienung und Modus.
- [ ] Screenreader-Labels nennen mindestens Typ, Name, Active/Expanded-Status und wichtigste Beziehung/Aktion.
- [ ] Die lineare Ansicht spiegelt sichtbare Graphknoten in stabiler Reihenfolge wider.
- [ ] Graph und lineare Ansicht synchronisieren Active-State, Expand/Collapse und Panelinhalt.
- [ ] Die lineare Ansicht ist hierarchisch gegliedert: Start, Domain-Gruppen, eingerückte Kinder, Actions direkt unter ihrem Parent.
- [ ] Domain-Gruppen haben programmatische Überschriften und nennen Expanded-Status sowie Anzahl sichtbarer oder ausgeblendeter Kinder.
- [ ] Visuelle Einrückung folgt der Knotentiefe (`depth * 1rem`, maximal `3rem`) oder einer gleichwertig dokumentierten Token-Regel; tiefe Ebenen behalten Parent-Kontext/Breadcrumb.
- [ ] Active-State und Tastaturfokus sind in der Liste visuell und programmatisch unterscheidbar und mit dem Graphen synchron.
- [ ] Ein manueller Keyboard-Smoke prüft: Moduswechsel, Knotenfokus, Aktivierung, Expand/Collapse, Panelrückkehr.

## Testplan für Frontend

1. Unit-/Komponententests
   - Focused Work zentriert `centeredNodeId` und verschiebt Root/Kontext relativ links.
   - Custom Flex berechnet Kindpositionen parent-relativ trotz stale Child-Position.
   - Fit-to-View verändert Zoom/Pan nur im Custom-Flex-Modus.
   - Fit-to-View respektiert `minReadableZoom = 0.75` und aktiviert Pan-/Scroll-Hinweis, wenn der voll aufgeklappte Graph bei Mindestzoom größer als der Viewport ist.
   - Fit-to-View-Bounding-Box berücksichtigt Labelmaße und Safe Areas, sodass Fokus-/Active-Ringe nicht abgeschnitten werden.
   - Expand-all enthält dynamische Instanzknoten.
   - Lineare Liste enthält dieselben sichtbaren Knoten wie der Graph und gruppiert sie nach Parent-/Domain-Hierarchie.

2. Accessibility-Smoke
   - Tastatur-only: alle sichtbaren Knoten und Controls erreichbar, kein Fokusverlust nach Reset/Fit/Expand.
   - Screenreader-/Accessibility-Tree-Prüfung: Graphregion, Knotenlabels, Panel-Live-Region, keine störenden SVG-Kanten.
   - Lineare Alternative: Domain-Überschriften sind anspringbar, `aria-expanded` stimmt, Active-State und Fokus sind unterscheidbar.
   - Reduced Motion: Animationen werden reduziert.
   - 200% Zoom: Knoten/Controls bleiben bedienbar oder lineare Alternative ist sichtbar nutzbar.

3. Manuelle Rollensmokes
   - Admin sieht Admin/Organisation, Kund:innen, Hunde, Termine, Leistungen/Kalender, soweit im MVP modelliert.
   - Groomer sieht Termine/Tagesplanung, Kund:innen, Hunde, Grooming-Notizen, soweit berechtigt.
   - Kund:in sieht eigenes Profil, eigene Hunde, Leistungen und Termine/Anfragen.

## Offene Entscheidungen für Requirements/Teamleitung

- Bestätigen: MVP-Rollen nur `admin`, `groomer`, `kunde` oder separate Rolle `Führungskraft`?
- Bestätigen: Welche echten Backenddaten stehen zuerst für Instanzknoten zur Verfügung?
- Bestätigen: Custom-Flex-Positionen im MVP nur Frontend-State oder Persistenz vorbereiten?
- Entscheiden: Pfeiltasten-Navigation entlang Graphkanten bereits im MVP oder zunächst stabile Tab-/Listenbedienung?
- Entscheiden: Wie weit Interaktion in der linearen Alternative im ersten FE-Slice geht. UX-Vorgabe für den MVP bleibt mindestens: sichtbarer hierarchischer Baum/Gruppenliste, Active-Synchronisation, Expand/Collapse-Synchronisation und Aktivierung derselben sichtbaren Knoten.
