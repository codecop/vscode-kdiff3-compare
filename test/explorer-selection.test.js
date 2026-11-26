'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadExtension } = require('./mocks');

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
