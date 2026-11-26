'use strict';

const nodeTest = require('node:test');
const Module = require('node:module');

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

let testUnlessWindows = nodeTest;
if (process.platform === 'win32') {
  testUnlessWindows = nodeTest.skip;
}

module.exports = { loadExtension, testUnlessWindows, tick };
