# Development

Contributor setup for this extension. User-facing documentation lives in [README.md](README.md).

## Setup
1. Clone the repository and open it in VS Code
2. `npm ci` (installs the devDependencies: ESLint, vsce)

## Run the extension (Extension Development Host)
1. Press `F5` (launch config in `.vscode/launch.json`)
2. In the host window: Explorer, select two or three files or folders, right-click, run **Compare Selected with KDiff3** — KDiff3 opens

The command is hidden from the Command Palette (`menus.commandPalette` with `when: "false"` in `package.json`), so it appears only in the Explorer context menu. Invoked without a selection (e.g. via `executeCommand`), it only shows a hint to select two or three items in the Explorer first.

## Unit tests
```sh
npm test
```
Plain `node:test` (`node --test`, Node ≥ 18) with the `vscode` API and `child_process` mocked via a `Module._load` hook — no VS Code download needed. Note: in Node 22 `--test` arguments are globs, so the script is a bare `node --test` (a directory argument fails with MODULE_NOT_FOUND). Test names follow the `unit-testing` skill (`<state>_<act>_<expected outcome>`, AAA structure). The broken-symlink test is skipped on `win32`, where creating symlinks needs admin rights.

## Linting
```sh
npm run lint
```
ESLint 10 flat config (`eslint.config.mjs`): maximal rule set (`@eslint/js` `configs.all` plus `eslint-plugin-unicorn` `recommended`), Node globals, CommonJS. Rules deactivated after a rule-by-rule review: `no-magic-numbers`, `unicorn/prefer-module`, `no-undefined`, `unicorn/no-useless-undefined`, `one-var`, `sort-keys`, `func-style`, `no-underscore-dangle`, `unicorn/prefer-ternary` (conflicts with `no-ternary`). The codebase is lint-clean and lint runs in CI.

## Packaging
```sh
npm run package   # vsce package -> kdiff3-compare-<version>.vsix
```
`.vscodeignore` keeps the VSIX minimal — only `package.json`, `extension.js`, `README.md`, `LICENSE` and `images/icon.png` ship. Everything else (`.agents/`, `AGENTS.md`, `DEVELOP.md`, `.github/`, `test/`, eslint config, lockfile, dotfiles, `images/og-image.png`) is excluded. Verify with `npx vsce ls` before releasing.

## CI
`.github/workflows/kdiff3-compare.yaml` runs on pushes to `main` and on pull requests: `Check out the repo` → `Set up Node.js` (22) → `npm ci` → `npm test` → `npm run lint`. Tag pushes do not trigger it (`branches: ['main']` filter).

## Releasing
1. Bump `version` in `package.json`, commit on `main`, push
2. `git tag -a vX.Y.Z -m "Releases version X.Y.Z." && git push origin vX.Y.Z`
3. `.github/workflows/release.yaml` (triggers on tags `v*`, `permissions: contents: write`) builds the VSIX with `vsce package` and attaches it to a new GitHub release via `softprops/action-gh-release@v2`

Verify with `gh run list --repo codecop/vscode-kdiff3-compare` and `gh release list --repo codecop/vscode-kdiff3-compare`.

## Repository conventions
- Trunk-based development on `main` only — no feature branches, no pull requests from branches; commit rules (single-line present-tense message, Vibe footer, push immediately) are in the `commit` skill
- Skills live in `.agents/skills/`; the `vscode-extension` skill documents this repo's conventions. The generic skills (`commit`, `unit-testing`, `transcript-errors`, `ci-build-action`) are also published as workspace skills in Mistral Studio
- British English everywhere (see `AGENTS.md`)
- Social preview image: `images/og-image.png` (1280×640), excluded from the VSIX; upload via repo Settings → General → Social preview
