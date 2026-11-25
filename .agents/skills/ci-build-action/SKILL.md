---
name: ci-build-action
description: > Create a GitHub Actions workflow (.github/workflows/<task-folder>.yaml) that builds and tests one task folder on every push and pull request. Language agnostic; C/C++ is the worked example and gets an extra Windows job, other languages (Java, Python, ...) get a single Linux job. Use when adding CI to a numbered experiment folder.
---

# CI Build Action

Create `.github/workflows/<task-folder>.yaml` - the workflow file name equals the task folder name (e.g. `02_pac_man.yaml` for `02_pac_man/`). Build files are exempt from the `naming` skill, so the YAML keeps conventional names.

Style reference: `codecop/Finder-Refactoring-Kata` `.github/workflows/C.yml`.

## Skeleton

```yaml
name: Test <task-folder>

on:
  push:
    paths:
      - '<task-folder>/**'
      - '.github/workflows/<task-folder>.yaml'
  pull_request:
    paths:
      - '<task-folder>/**'
      - '.github/workflows/<task-folder>.yaml'

jobs:
  linux:
    runs-on: ubuntu-latest
    steps:
    - name: Check out the repo
      uses: actions/checkout@v7
    # ... language-specific steps, each with `working-directory: <task-folder>`
```

* `push` without a `branches:` filter = all branches; `paths:` limits the run to changes in the task folder and in the workflow file itself.

## Step structure, formatting and naming

* One action per step: a flat list under `steps:`, **blank line between steps**, 2-space indentation (as in `C.yml`).
* Every step starts with `- name:` (short capitalised label), then either `uses:` (an action) or `run:` (shell). Multi-line commands use `run: |`, single commands plain `run: make test`.
* The step labels are always the same - use the canonical set from the other workflows in `codecop/Finder-Refactoring-Kata` (`.github/workflows/*.yml`): `Check out the repo` (`actions/checkout@v7`, always first) -> `Set up <language/toolchain>` (`actions/setup-java@v6`, `actions/setup-python@v7`, `actions/setup-dotnet@v6.1.0`, `msys2/setup-msys2` for MinGW, ...) and/or `Set up dependencies` (apt-get/package installs) -> `Build` -> `Test`. Variants seen there: `Build and test` (Java), Python has only `Test`. Optional extras keep their own labels and come last: `Smoke`, `Coverage`, `Upload ...` (artifact upload last).
* Put `working-directory: <task-folder>` on every `run` step of the job (not in `defaults:`), so each step reads standalone top-down.
* Set `shell:` only where needed (e.g. `shell: msys2 {0}` on the Windows msys2 steps); Linux jobs use the default shell.
* Job names stay short (`linux`, `windows`, or the build system like `build`, `cmake` in `C.yml`); the workflow `name:` is `Test <task-folder>`.

## Jobs per language

* **Linux job (every language):** `ubuntu-latest`, install dependencies with `apt-get`, build, run tests. Add smoke/coverage steps and an `actions/upload-artifact` for reports when the task has them.
* **Windows job (only for compiled languages that must also build on Windows, e.g. C/C++ with MinGW):** `windows-latest`. For MinGW C use `msys2/setup-msys2@v2` with `msystem: mingw64` and `install: make mingw-w64-x86_64-toolchain mingw-w64-x86_64-cmocka`, then steps with `shell: msys2 {0}` running the Windows makefile, e.g. `make -f Makefile.win CMOCKA_ROOT=/mingw64 all` / `test` / `smoke`.
* **Other languages (Java, Python, JavaScript, ...): no Windows job** - a single Linux job is enough.

## Worked example: C (02_pac_man in this repo)

* linux job: `sudo apt-get install -y libcmocka-dev lcov`, then `make`, `make test`, `make smoke`, `make coverage`, upload `02_pac_man/docs/coverage-report` as artifact.
* windows job: msys2 mingw64 with cmocka, then `make -f Makefile.win CMOCKA_ROOT=/mingw64 all` / `test` / `smoke`.

### C/Windows-only gotchas (rare - only for C/C++ with a Windows job)

* msys2 `install:` must include the `make` package, otherwise the Windows job fails with `make: command not found` (exit 127).
* In makefiles use `CC = gcc` (not `CC ?= gcc`): GNU make's builtin `CC=cc` would win otherwise; command-line `make CC=...` still overrides.
* Make Windows makefile recipes shell-portable (`-mkdir $(BUILD) 2>nul`, `echo ... | exe > NUL`), so they work in both `cmd.exe` and the msys2 shell.
* On Windows enable `ENABLE_VIRTUAL_TERMINAL_PROCESSING` on the **output** console handle as well, otherwise ANSI clear-screen prints escape garbage; keep a `system("cls")` fallback and restore the old mode on exit.

## Gotchas (language agnostic)

* Validate the file (`python3 -c "import yaml; yaml.safe_load(open(...))"`) and watch the run: `gh run list --repo <owner>/<repo> --branch <branch>` and `gh run view <id> --log-failed`.
