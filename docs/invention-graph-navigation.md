# Invention Disclosure: Barrierearme graphbasierte Arbeitsnavigation

## Kurzfassung

Diese Idee beschreibt eine alternative Navigations- und Bedienstruktur für Webanwendungen, die sich von klassischen Webseitenhierarchien, Menüs, Tabs und versteckten Aktionspfaden löst. Stattdessen werden Domänen, Seitenkontexte, konkrete Objektinstanzen und ausführbare Aktionen als interaktiver Arbeitsgraph dargestellt.

Ziel ist eine Bedienoberfläche, die Zusammenhänge sichtbar macht, kognitive Last reduziert und Barrieren für eingeschränkte wie nicht eingeschränkte Menschen senkt.

## Problem

Heutige Webanwendungen sind oft seiten- und menüorientiert:

- Funktionen liegen in verschachtelten Navigationsstrukturen.
- Nutzer:innen müssen wissen, wo sich ein Prozess befindet.
- Aktionen sind oft kontextfern oder erst nach mehreren Klicks sichtbar.
- Domänenwissen bleibt implizit: Beziehungen zwischen Objekten, Rollen und Aktionen werden nicht direkt angezeigt.
- Menschen mit kognitiven, motorischen oder visuellen Einschränkungen verlieren leichter Orientierung.
- Auch uneingeschränkte Nutzer:innen müssen unnötige Navigationsarbeit leisten.

## Ziel

Die Anwendung soll als verständlicher, sichtbarer und direkt bedienbarer Arbeitsraum funktionieren:

- Domänen werden als Knoten dargestellt.
- Beziehungen werden als Kanten sichtbar.
- Konkrete Arbeitsobjekte, z. B. ein Kunde, hängen als Instanzknoten im Graphen.
- Kontextbezogene Aktionen hängen direkt an der jeweiligen Domäne oder Instanz.
- Die Oberfläche zeigt nicht nur, was möglich ist, sondern auch, wie Dinge zusammenhängen.

## Kernidee

Ein computerimplementiertes Navigations- und Interaktionsverfahren transformiert die Struktur einer Business-Webanwendung in einen dynamischen Arbeitsgraphen.

Der Graph enthält unter anderem:

- Start-/Root-Knoten
- Top-Level-Domänen
- Seiten-/Listenkontexte
- konkrete Objektinstanzen
- kontextspezifische Aktionen
- Beziehungen zwischen diesen Elementen

Die Bedienung erfolgt durch Auswahl, Fokus, Expand/Collapse, Dragging, automatische Layout-Neuberechnung und View-Anpassung.

## Interaktionsprinzipien

### Start-/Root-Knoten

Der Startknoten dient als Einstiegspunkt und kann im flexiblen Modus das gesamte Diagramm auf- oder zuklappen.

### Focused Work

Im Focused-Work-Modus wird der aktive Arbeitsknoten in den Mittelpunkt gerückt. Nicht aktive Bereiche werden räumlich nach links bzw. in den Hintergrund verschoben. Ziel ist eine reduzierte, aufgabenorientierte Ansicht mit weniger Ablenkung.

### Custom Flex

Im Custom-Flex-Modus können Nutzer:innen Knoten frei verschieben und sich ihren Arbeitsraum selbst räumlich organisieren. Kindknoten bleiben dabei radial und semantisch sichtbar ihrem Parent zugeordnet.

### Expand/Collapse

Domänen- und Instanzknoten können ihre jeweiligen Kinder ein- und ausklappen. Dadurch kann die Komplexität dynamisch reduziert oder erweitert werden.

### Fit-to-View

Ein Einpassen-Mechanismus berechnet die sichtbaren Grenzen des Graphen und passt Zoom sowie Positionierung automatisch an, damit der gesamte relevante Arbeitsbereich sichtbar wird.

### Parent-relative Kindpositionierung

Wenn ein Parent-Knoten verschoben wird, werden seine Kindknoten aus der aktuellen Parent-Position neu berechnet. Dadurch bleibt die visuelle und semantische Zugehörigkeit erhalten.

## Accessibility-Aspekte

Die Idee soll Barrieren reduzieren durch:

- weniger verschachtelte Menüs
- sichtbare Zusammenhänge statt versteckter Navigation
- reduzierte Klickpfade
- klare Objekt-Aktions-Zuordnung
- fokussierbare Arbeitsbereiche
- mögliche Tastaturnavigation entlang von Graphbeziehungen
- mögliche lineare Alternativdarstellung für Screenreader
- mögliche nutzerprofilabhängige Reduktion von Komplexität
- räumliche Orientierung statt rein abstrakter Seitenstruktur

## Technische Komponenten

Mögliche technische Bestandteile:

1. Graphmodell für Domänen, Seiten, Instanzen und Aktionen
2. Layoutalgorithmus für radiale Parent-Child-Anordnung
3. Zustandsmodell für Fokus, Expansion, Collapse und aktive Auswahl
4. Parent-relative Reflow-Berechnung bei Dragging
5. automatische Viewport-/Zoom-Anpassung
6. rollen- und kontextabhängige Knotenerzeugung
7. Accessibility-Mapping auf Tastatur-, Screenreader- und vereinfachte Darstellungsmodi

## Abgrenzung zu bekannten Konzepten

Die Idee ist nicht nur:

- eine Mindmap
- ein Sitemap-Viewer
- ein Node-Editor
- ein Workflow-Builder
- ein Diagramm zur Visualisierung
- ein klassisches Menü mit anderer Optik

Der Arbeitsgraph ist die primäre Navigations- und Bedienoberfläche der Anwendung. Er verbindet Navigation, Domänenverständnis, Objektkontext und Aktionen in einem dynamischen Interaktionsraum.

## Mögliche technische Erfindungskerne

- Verfahren zur Transformation einer Webanwendungsstruktur in einen bedienbaren Arbeitsgraphen
- dynamische Repositionierung aktiver Arbeitsknoten zur Reduktion kognitiver Last
- Parent-relative Layout-Neuberechnung bei manuell verschobenen Knoten
- kontextabhängiges Erzeugen und Entfernen von Instanz- und Aktionsknoten
- Accessibility-orientierte Steuerung eines Graph-Navigationsmodells
- automatische Sichtbereichsanpassung für einen interaktiven Arbeitsgraphen

## Beispielhafte Claim-Richtung, nicht juristisch final

Ein computerimplementiertes Verfahren zur Navigation in einer Webanwendung, umfassend:

1. Erzeugen eines Graphmodells aus Domänen, Seitenkontexten, Objektinstanzen und Aktionen der Webanwendung;
2. Darstellen des Graphmodells als interaktive Knoten und Kanten in einem Arbeitsbereich;
3. Auswahl eines aktiven Knotens durch eine Nutzerinteraktion;
4. dynamisches Repositionieren des aktiven Knotens in einen fokussierten Sichtbereich;
5. Expandieren oder Kollabieren von mit dem aktiven Knoten verbundenen Kindknoten;
6. Neuberechnen von Kindknotenpositionen relativ zu einer aktuellen Parent-Knotenposition;
7. Anpassen von Zoom und Pan des Arbeitsbereichs, um relevante Knoten sichtbar zu halten.

## Offene Prüffragen

- Welche Teile sind gegenüber bestehenden Graph-, Mindmap-, Workflow- und Accessibility-UIs tatsächlich neu?
- Welche technische Wirkung kann konkret belegt werden?
- Wie wird die Barrierefreiheit messbar verbessert?
- Welche Algorithmen oder Zustandsübergänge sind eigenständig genug für Schutzansprüche?
- Welche Teile sollten als Patent, Marke, Designschutz oder Trade Secret behandelt werden?

## Nächste Schritte

1. Prior-Art-Recherche zu graphbasierter Navigation, radialer UI, adaptive UIs und Accessibility Navigation.
2. Konkreten technischen Ablauf mit Zustandsdiagramm dokumentieren.
3. Prototyp mit Bedienpfaden und Accessibility-Zielen erweitern.
4. Mögliche Claims mit Patentanwalt prüfen.
5. Namen und visuelle Identität gegebenenfalls markenrechtlich absichern.
