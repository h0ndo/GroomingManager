# GroomingManager Framework

Wiederverwendbare Angular-Library für graphbasierte Navigation.

## Enthalten

- `WorkspaceGraph`: standalone Angular-Komponente für den Navigations-/Arbeitsgraphen
- Knoten-/Kantentypen (`WorkspaceGraphNode`, `WorkspaceGraphEdge`, `WorkspaceGraphNodeKind`, ...)
- Radialer Layout-Kern (`computeRadialGraphLayout` und zugehörige Typen)

Die Library enthält bewusst keine GroomingManager-Fachlogik, keine Backend-Anbindung und keine Dashboard-Seiten. Projektabhängige Graph-Modelle bleiben in der jeweiligen App und verwenden nur die exportierten Framework-Typen/-Komponenten.
