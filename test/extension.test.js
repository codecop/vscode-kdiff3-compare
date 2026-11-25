const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const fs = require('fs');
const os = require('os');
const path = require('path');

function loadExtension({ kdiff3Path = 'kdiff3', dialogResult = undefined } = {}) {
  const calls = {
    spawn: [],
    errors: [],
    warnings: [],
    dialogs: 0,
    dialogOptions: undefined,
    handler: undefined
  };
  const vscodeMock = {
    commands: {
      registerCommand: (id, handler) => {
        calls.handler = handler;
        return { dispose() {} };
      }
    },
    workspace: {
      getConfiguration: (section) => ({
        get: (key) =>
          section === 'kdiff3Compare' && key === 'kdiff3Path' ? kdiff3Path : undefined
      })
    },
    window: {
      showOpenDialog: async (options) => {
        calls.dialogs += 1;
        calls.dialogOptions = options;
        return dialogResult;
      },
      showWarningMessage: (message) => {
        calls.warnings.push(message);
      },
      showErrorMessage: (message) => {
        calls.errors.push(message);
      }
    }
  };
  const childProcessMock = {
    spawn: (exe, args, options) => {
      const listeners = {};
      const child = {
        on: (event, callback) => {
          listeners[event] = callback;
        },
        unref: () => {},
        emitError: (err) => {
          if (listeners.error) {
            listeners.error(err);
          }
        }
      };
      calls.spawn.push({ exe, args, options, child });
      return child;
    }
  };
  const originalLoad = Module._load;
  Module._load = function (request, ...rest) {
    if (request === 'vscode') {
      return vscodeMock;
    }
    if (request === 'child_process') {
      return childProcessMock;
    }
    return originalLoad.call(this, request, ...rest);
  };
  const extensionPath = require.resolve('../extension.js');
  delete require.cache[extensionPath];
  const extension = require('../extension.js');
  Module._load = originalLoad;
  extension.activate({ subscriptions: [] });
  return { calls };
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

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
});

test('custom path configured_invoke handler_spawns the configured exe', () => {
  const { calls } = loadExtension({ kdiff3Path: 'C:\\Tools\\KDiff3\\kdiff3.exe' });

  calls.handler({}, [{ fsPath: '/a' }, { fsPath: '/b' }]);

  assert.equal(calls.spawn[0].exe, 'C:\\Tools\\KDiff3\\kdiff3.exe');
});

test('blank path configured_invoke handler_falls back to kdiff3 on PATH', () => {
  const { calls } = loadExtension({ kdiff3Path: '   ' });

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
  assert.match(calls.errors[0], /\/opt\/kdiff3\/bin\/kdiff3/);
  assert.match(calls.errors[0], /kdiff3Compare\.kdiff3Path/);
});

test('mixed file and folder selected_invoke handler_shows error and spawns nothing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdiff3-test-'));
  const file = path.join(dir, 'a.txt');
  fs.writeFileSync(file, 'x');
  const { calls } = loadExtension();

  calls.handler({}, [{ fsPath: file }, { fsPath: dir }]);

  assert.equal(calls.spawn.length, 0);
  assert.equal(calls.errors.length, 1);
  assert.match(calls.errors[0], /file with a folder/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('two folders selected_invoke handler_spawns with both folder paths', () => {
  const dirA = fs.mkdtempSync(path.join(os.tmpdir(), 'kdiff3-a-'));
  const dirB = fs.mkdtempSync(path.join(os.tmpdir(), 'kdiff3-b-'));
  const { calls } = loadExtension();

  calls.handler({}, [{ fsPath: dirA }, { fsPath: dirB }]);

  assert.equal(calls.spawn.length, 1);
  assert.deepEqual(calls.spawn[0].args, [dirA, dirB]);
  assert.equal(calls.errors.length, 0);
  fs.rmSync(dirA, { recursive: true, force: true });
  fs.rmSync(dirB, { recursive: true, force: true });
});
