# KDiff3 Compare

100% vibe coded ;-)

[![CI](https://img.shields.io/github/actions/workflow/status/codecop/vscode-kdiff3-compare/kdiff3-compare.yaml?branch=main)](https://github.com/codecop/vscode-kdiff3-compare/actions/workflows/kdiff3-compare.yaml)

Minimal VS Code extension: select two or three files or folders in the
Explorer, right-click, **Compare Selected with KDiff3** — KDiff3 opens with
them (two paths: side-by-side diff; three paths: three-way view; folders:
directory comparison). Mixed file/folder selections are rejected with an
error message.

## Development / Testing
1. Open this folder in VS Code
2. Press `F5` (the Extension Development Host starts, see `.vscode/launch.json`)
3. In the host window: Explorer, select two or three files or folders, right-click, run the command

Without a selection (e.g. from the Command Palette) the command opens a file
dialog and expects exactly two files or folders.

## Unit tests
The command logic is tested with plain Node (`node:test`), mocking the
`vscode` API and `child_process` — no VS Code download needed:

```sh
npm test
```

## Settings
`kdiff3Compare.kdiff3Path` — full path to the KDiff3 executable:

- Windows: `C:\Program Files\KDiff3\kdiff3.exe`
- Linux/macOS: `/usr/bin/kdiff3` (or the default `kdiff3` to use PATH)

## Packaging and releasing
Locally:

```sh
npm install -g @vscode/vsce
vsce package   # creates kdiff3-compare-<version>.vsix
```

Automatic GitHub release: bump `version` in `package.json`, commit, then push a
matching tag. The `release` workflow (`.github/workflows/release.yaml`) packages
the `.vsix` and attaches it to a new GitHub release (download on the Releases page):

```sh
git tag v0.1.0
git push origin v0.1.0
```

CI runs `npm test` on every push and pull request
(`.github/workflows/kdiff3-compare.yaml`).
