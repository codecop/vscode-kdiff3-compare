# KDiff3 Compare

Minimal VS Code extension: select two files or folders in the Explorer,
right-click, **Compare Selected with KDiff3** — KDiff3 opens with both of
them (for folders, KDiff3 shows its directory comparison).

## Development / Testing
1. Open this folder in VS Code
2. Press `F5` (the Extension Development Host starts, see `.vscode/launch.json`)
3. In the host window: Explorer, select two files or folders, right-click, run the command

Without a selection (e.g. from the Command Palette) the command opens a file
dialog and expects exactly two files or folders.

## Settings
`kdiff3Compare.kdiff3Path` — full path to the KDiff3 executable:

- Windows: `C:\Program Files\KDiff3\kdiff3.exe`
- Linux/macOS: `/usr/bin/kdiff3` (or the default `kdiff3` to use PATH)

## Packaging (optional)
```sh
npm install -g @vscode/vsce
vsce package   # creates kdiff3-compare-0.1.0.vsix
```
