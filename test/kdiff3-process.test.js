'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadExtension } = require('./mocks');

test('custom exe path configured_invoke handler_spawns that exe when it exists', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kdiff3-exe-'));
  const exePath = path.join(directory, 'kdiff3');
  fs.writeFileSync(exePath, '');
  const { calls } = loadExtension({ kdiff3Path: exePath });

  calls.handler({}, [{ fsPath: '/a' }, { fsPath: '/b' }]);

  assert.equal(calls.spawn.length, 1);
  assert.equal(calls.spawn[0].exe, exePath);
  assert.equal(calls.errors.length, 0);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('blank path configured_invoke handler_falls back to kdiff3 on PATH', () => {
  const { calls } = loadExtension({ kdiff3Path: ' '.repeat(3) });

  calls.handler({}, [{ fsPath: '/a' }, { fsPath: '/b' }]);

  assert.equal(calls.spawn[0].exe, 'kdiff3');
});

test('configured exe path does not exist_invoke handler_shows not-found error with settings hint and spawns nothing', () => {
  const { calls } = loadExtension({ kdiff3Path: '/nonexistent/kdiff3' });

  calls.handler({}, [{ fsPath: '/a' }, { fsPath: '/b' }]);

  assert.equal(calls.spawn.length, 0);
  assert.equal(calls.errors.length, 1);
  assert.match(calls.errors[0], /not found/u);
  assert.match(calls.errors[0], /kdiff3Compare\.kdiff3Path/u);
});

test('spawn emits error_invoke handler_shows message naming exe and setting', () => {
  const { calls } = loadExtension();

  calls.handler({}, [{ fsPath: '/a' }, { fsPath: '/b' }]);
  calls.spawn[0].child.emitError(new Error('ENOENT'));

  assert.equal(calls.errors.length, 1);
  assert.match(calls.errors[0], /Could not start KDiff3 \(kdiff3\)/u);
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
