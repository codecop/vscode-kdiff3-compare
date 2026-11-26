'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadExtension, testUnlessWindows } = require('./mocks');

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
