'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function createCalls() {
  return {
    spawn: [],
    errors: [],
    warnings: [],
    dialogs: 0,
    dialogOptions: undefined,
    handler: undefined
  };
}

function createVscodeMock(calls, kdiff3Path, dialogResult) {
  return {
    commands: {
      registerCommand: (id, handler) => {
        calls.handler = handler;
        return {
          dispose() {
            // No-op.
          }
        };
      }
    },
    workspace: {
      getConfiguration: (section) => ({
        get: (key) => {
          if (section === 'kdiff3Compare' && key === 'kdiff3Path') {
            return kdiff3Path;
          }
          return undefined;
        }
      })
    },
    window: {
      showOpenDialog: (options) => {
        calls.dialogs += 1;
        calls.dialogOptions = options;
        return Promise.resolve(dialogResult);
      },
      showWarningMessage: (message) => {
        calls.warnings.push(message);
      },
      showErrorMessage: (message) => {
        calls.errors.push(message);
      }
    }
  };
}

function createChildProcessMock(calls) {
  return {
    spawn: (exe, spawnArguments, options) => {
      const listeners = {};
      const child = {
        on: (event, callback) => {
          listeners[event] = callback;
        },
        unref: () => {
          // No-op.
        },
        emitError: (error) => {
          if (listeners.error) {
            listeners.error(error);
          }
        },
        emitExit: (code) => {
          if (listeners.exit) {
            listeners.exit(code);
          }
        }
      };
      calls.spawn.push({ exe, args: spawnArguments, options, child });
      return child;
    }
  };
}

function loadWithMocks(vscodeMock, childProcessMock) {
  const originalLoad = Module._load;
  // eslint-disable-next-line func-names
  Module._load = function (request, ...rest) {
    if (request === 'vscode') {
      return vscodeMock;
    }
    if (request === 'child_process' || request === 'node:child_process') {
      return childProcessMock;
    }
    // eslint-disable-next-line unicorn/no-this-outside-of-class
    return originalLoad.call(this, request, ...rest);
  };
  const extensionPath = require.resolve('../extension.js');
  delete require.cache[extensionPath];
  const extension = require('../extension.js');
  Module._load = originalLoad;
  return extension;
}

function loadExtension({ kdiff3Path = 'kdiff3', dialogResult = undefined } = {}) {
  const calls = createCalls();
  const extension = loadWithMocks(
    createVscodeMock(calls, kdiff3Path, dialogResult),
    createChildProcessMock(calls)
  );
  extension.activate({ subscriptions: [] });
  return { calls };
}

const tick = () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

let testUnlessWindows = test;
if (process.platform === 'win32') {
  testUnlessWindows = test.skip;
}

test('two selected resources_invoke handler_spawns kdiff3 with both paths detached', () => {
  const { calls } = loadExtension();

  calls.handler({}, [{ fsPath: '/a.txt' }, { fsPath: '/b.txt' }]);

  assert.equal(calls.spawn.length, 1);
  assert.equal(calls.spawn[0].exe, 'kdiff3');
  assert.deepEqual(calls.spawn[0].args, ['/a.txt', '/b.txt']);
  assert.equal(calls.spawn[0].options.detached, true);
});

test('three selected resources_invoke handler_spawns kdiff3 with three paths for three-way compare', () => {
  const { calls } = loadExtension();

  calls.handler({}, [{ fsPath: '/a' }, { fsPath: '/b' }, { fsPath: '/c' }]);

  assert.equal(calls.spawn.length, 1);
  assert.deepEqual(calls.spawn[0].args, ['/a', '/b', '/c']);
});

test('four selected resources_invoke handler_spawns with the first three paths only', () => {
  const { calls } = loadExtension();

  calls.handler({}, [
    { fsPath: '/a' },
    { fsPath: '/b' },
    { fsPath: '/c' },
    { fsPath: '/d' }
  ]);

  assert.equal(calls.spawn.length, 1);
  assert.deepEqual(calls.spawn[0].args, ['/a', '/b', '/c']);
  assert.equal(calls.warnings.length, 1);
});

testUnlessWindows('unstatable path like a broken symlink_invoke handler_treated as not mixed and still spawns', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kdiff3-link-'));
  const link = path.join(directory, 'broken');
  fs.symlinkSync(path.join(directory, 'does-not-exist'), link);
  const { calls } = loadExtension();

  calls.handler({}, [{ fsPath: link }, { fsPath: '/b.txt' }]);

  assert.equal(calls.spawn.length, 1);
  assert.deepEqual(calls.spawn[0].args, [link, '/b.txt']);
  assert.equal(calls.errors.length, 0);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('custom path configured_invoke handler_spawns the configured exe', () => {
  const exePath = String.raw`C:\Tools\KDiff3\kdiff3.exe`;
  const { calls } = loadExtension({ kdiff3Path: exePath });

  calls.handler({}, [{ fsPath: '/a' }, { fsPath: '/b' }]);

  assert.equal(calls.spawn[0].exe, exePath);
});

test('blank path configured_invoke handler_falls back to kdiff3 on PATH', () => {
  const { calls } = loadExtension({ kdiff3Path: ' '.repeat(3) });

  calls.handler({}, [{ fsPath: '/a' }, { fsPath: '/b' }]);

  assert.equal(calls.spawn[0].exe, 'kdiff3');
});

test('single resource without multi selection_invoke handler_opens dialog instead of spawning', () => {
  const { calls } = loadExtension();

  calls.handler({ fsPath: '/a.txt' }, undefined);

  assert.equal(calls.dialogs, 1);
  assert.equal(calls.spawn.length, 0);
});

test('fallback dialog_options_allow selecting files and folders', async () => {
  const { calls } = loadExtension({ dialogResult: undefined });

  calls.handler({ fsPath: '/a.txt' }, undefined);
  await tick();

  assert.equal(calls.dialogOptions.canSelectFiles, true);
  assert.equal(calls.dialogOptions.canSelectFolders, true);
  assert.equal(calls.dialogOptions.canSelectMany, true);
});

test('dialog with two uris_invoke handler_spawns with the chosen paths', async () => {
  const { calls } = loadExtension({
    dialogResult: [{ fsPath: '/x' }, { fsPath: '/y' }]
  });

  calls.handler({ fsPath: '/a.txt' }, undefined);
  await tick();

  assert.equal(calls.spawn.length, 1);
  assert.deepEqual(calls.spawn[0].args, ['/x', '/y']);
});

test('dialog with three uris_invoke handler_shows warning and spawns nothing', async () => {
  const { calls } = loadExtension({
    dialogResult: [{ fsPath: '/x' }, { fsPath: '/y' }, { fsPath: '/z' }]
  });

  calls.handler({ fsPath: '/a.txt' }, undefined);
  await tick();

  assert.equal(calls.warnings.length, 1);
  assert.equal(calls.spawn.length, 0);
});

test('dialog cancelled_invoke handler_spawns nothing and stays quiet', async () => {
  const { calls } = loadExtension({ dialogResult: undefined });

  calls.handler({ fsPath: '/a.txt' }, undefined);
  await tick();

  assert.equal(calls.spawn.length, 0);
  assert.equal(calls.warnings.length, 0);
});

test('spawn emits error_invoke handler_shows message naming exe and setting', () => {
  const { calls } = loadExtension({ kdiff3Path: '/opt/kdiff3/bin/kdiff3' });

  calls.handler({}, [{ fsPath: '/a' }, { fsPath: '/b' }]);
  calls.spawn[0].child.emitError(new Error('ENOENT'));

  assert.equal(calls.errors.length, 1);
  assert.match(calls.errors[0], /\/opt\/kdiff3\/bin\/kdiff3/u);
  assert.match(calls.errors[0], /kdiff3Compare\.kdiff3Path/u);
});

test('non-zero exit code_invoke handler_shows plain error without the settings hint', () => {
  const { calls } = loadExtension();

  calls.handler({}, [{ fsPath: '/a' }, { fsPath: '/b' }]);
  calls.spawn[0].child.emitExit(2);

  assert.equal(calls.errors.length, 1);
  assert.match(calls.errors[0], /exited with code 2/u);
  assert.doesNotMatch(calls.errors[0], /kdiff3Compare\.kdiff3Path/u);
});

test('zero exit code_invoke handler_shows no error', () => {
  const { calls } = loadExtension();

  calls.handler({}, [{ fsPath: '/a' }, { fsPath: '/b' }]);
  calls.spawn[0].child.emitExit(0);

  assert.equal(calls.errors.length, 0);
});

test('mixed file and folder selected_invoke handler_shows error and spawns nothing', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kdiff3-test-'));
  const file = path.join(directory, 'a.txt');
  fs.writeFileSync(file, 'x');
  const { calls } = loadExtension();

  calls.handler({}, [{ fsPath: file }, { fsPath: directory }]);

  assert.equal(calls.spawn.length, 0);
  assert.equal(calls.errors.length, 1);
  assert.match(calls.errors[0], /file with a folder/u);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('two folders selected_invoke handler_spawns with both folder paths', () => {
  const directoryA = fs.mkdtempSync(path.join(os.tmpdir(), 'kdiff3-a-'));
  const directoryB = fs.mkdtempSync(path.join(os.tmpdir(), 'kdiff3-b-'));
  const { calls } = loadExtension();

  calls.handler({}, [{ fsPath: directoryA }, { fsPath: directoryB }]);

  assert.equal(calls.spawn.length, 1);
  assert.deepEqual(calls.spawn[0].args, [directoryA, directoryB]);
  assert.equal(calls.errors.length, 0);
  fs.rmSync(directoryA, { recursive: true, force: true });
  fs.rmSync(directoryB, { recursive: true, force: true });
});
