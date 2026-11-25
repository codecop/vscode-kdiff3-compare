# KDiff3 Compare

Minimale VS Code Extension: Zwei Dateien im Explorer auswählen → Rechtsklick →
**Compare Selected with KDiff3** → KDiff3 öffnet sich mit beiden Dateien.

## Entwicklung / Test
1. Diesen Ordner in VS Code öffnen
2. `F5` drücken (Extension Development Host startet, siehe `.vscode/launch.json`)
3. Im Host-Fenster: Explorer → zwei Dateien selektieren → Rechtsklick → Befehl ausführen

Ohne Selektion (z. B. über die Befehlspalette) öffnet der Befehl einen
Dateiauswahldialog und erwartet genau zwei Dateien.

## Einstellung
`kdiff3Compare.kdiff3Path` — kompletter Pfad zur KDiff3-Executable:

- Windows: `C:\Program Files\KDiff3\kdiff3.exe`
- Linux/macOS: `/usr/bin/kdiff3` (oder Standard `kdiff3` für PATH)

## Packen (optional)
```sh
npm install -g @vscode/vsce
vsce package   # erzeugt kdiff3-compare-0.1.0.vsix
```
