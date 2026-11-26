'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadExtension, tick } = require('./mocks');

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
