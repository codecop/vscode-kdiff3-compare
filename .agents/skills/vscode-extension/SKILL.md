---
name: vscode-extension
description: > Load this skill whenever working on the VS Code extension in this repository (manifest, code, tests, packaging, CI, releases). It encodes researched best practices and pitfalls plus this repo's own rules: fully filled manifest, spawn-not-exec, release-on-tag workflow.
---

# VS Code Extension (this repo)

## Manifest rules — package.json must be complete
- Basics: `name` (lowercase, hyphens), `displayName`, `description` (keep under 200 chars), `version` (semver), `publisher`, `license` **plus a matching LICENSE file**, `repository`, `engines.vscode` (`^1.74.0` → contributed commands auto-activate, no `activationEvents` needed), `main`, `scripts` (`test`, `package`).
- Marketplace polish: `icon` (128x128 PNG, relative path, file must exist in the package), `keywords` (max 30), `categories` (e.g. `Visualization`, `Other`), `homepage`, `bugs.url`, `galleryBanner`, `badges` (use shields.io URLs; vsce rejects non-https images and non-trusted SVGs in README).
- This repo's rule: the README and the manifest `description` carry the line `100% vibe coded ;-)`. Language is British English per [AGENTS.md](../../../AGENTS.md).
- `contributes`: commands (with `category` and a Codicon `icon` like `$(diff)`), menus with precise `when` clauses, `configuration` with defaults and descriptions.

## Menus and when clauses
- Exactly two selected items: `when: "listDoubleSelection"`.
- Three or more: `when: "listMultiSelection && !listDoubleSelection"` (same command; up to three paths open KDiff3's three-way view).
- Use the built-in group `3_compare@…` so the entry sits next to VS Code's own Compare.
- Command handlers must also work without arguments (Command Palette) — fall back to a file picker.

## Code rules
- Spawn external tools with `spawn(exe, [args], { detached: true, stdio: 'ignore' })` and `child.unref()` — never `exec` or shell strings (injection risk, spaces in paths). Note: a `.bat`/`.cmd` setting would need `shell: true`; the setting expects the exe/binary.
- Only handle the `error` event — never treat `exit` codes as errors: diff tools exit `1` when differences exist.
- Read configuration inside the handler (no cached config, no `onDidChangeConfiguration` needed).
- Push every disposable to `context.subscriptions`.
- Guard `fs.statSync` with try/catch (EACCES, broken symlinks); reject mixed file+folder selections with a clear message; warn when more than three items are selected (compare the first three).
- User-facing feedback via `showErrorMessage`/`showWarningMessage` with actionable text, not console logging.

## Packaging
- `.vscodeignore` must exclude `.vscode/**`, `.github/**`, `.agents/**`, `AGENTS.md`, `DEVELOP.md`, dotfiles, `test/**`, `node_modules/**`, eslint config, lockfile, `*.vsix` and non-icon images — but keep `README.md`, `LICENSE` and `images/icon.png`.
- Always test the real artefact: `vsce package`, then install the `.vsix` via Extensions → Install from VSIX — not only F5.
- `vsce` needs README.md, `repository`, LICENSE and the icon file present.

## Testing
- Unit tests with plain `node:test` (`npm test` = `node --test`, Node ≥ 18). Do NOT pass a directory argument — in Node 22 `--test` arguments are globs and a bare directory fails with MODULE_NOT_FOUND. Mock `vscode` and `child_process` by intercepting `Module._load` before requiring the extension.
- Follow the `unit-testing` skill: AAA structure, test names `<state>_<act>_<expected outcome>`, one assertion aspect per test.
- Manual smoke test: `F5` Extension Development Host, select two or three files or folders, context menu, verify KDiff3 opens.

## Linting
- `npm run lint` runs ESLint (flat config `eslint.config.mjs`): maximal set = `@eslint/js` `configs.all` plus `eslint-plugin-unicorn` `recommended`, Node globals, CommonJS.
- Deliberately deactivated after rule-by-rule review: `no-magic-numbers`, `unicorn/prefer-module` (we stay CommonJS), `no-undefined`, `unicorn/no-useless-undefined`, `one-var`, `sort-keys`, `func-style`, `no-underscore-dangle`, `unicorn/prefer-ternary` (conflicts with `no-ternary`).
- Wired into CI as the `Lint` step in `.github/workflows/kdiff3-compare.yaml` (after `npm ci`); the codebase is lint-clean.

## CI and releases (see also the `ci-build-action` skill)
- Test workflow `.github/workflows/<repo>.yaml`: `on: push/pull_request`, single Linux job, canonical step labels with a blank line between steps: `Check out the repo` (`actions/checkout@v7`) → `Set up Node.js` (`actions/setup-node@v6`, `node-version: 22`) → `Test` (`run: npm test`).
- Release workflow `.github/workflows/release.yaml`: `on: push: tags: ['v*']` and `permissions: contents: write`; steps: checkout → setup-node → `npm install --global @vscode/vsce` → `vsce package` → `softprops/action-gh-release@v2` with `files: <name>-*.vsix` and `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`.
- Release procedure: bump `version` in package.json, commit, then `git tag vX.Y.Z && git push origin vX.Y.Z` — the workflow attaches the `.vsix` to a new GitHub release (download on the Releases page).
- Commits follow the `commit` skill: `git commit` only, Vibe footer mandatory, push every commit immediately, never rewrite history.
