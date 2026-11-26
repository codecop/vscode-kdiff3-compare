'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadExtension, testUnlessWindows, tick } = require('./helpers');

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
