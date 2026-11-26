'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadExtension } = require('./mocks');

test('invoked without selection_shows hint and spawns nothing', () => {
  const { calls } = loadExtension();

  calls.handler(undefined, undefined);

  assert.equal(calls.spawn.length, 0);
  assert.equal(calls.infos.length, 1);
  assert.match(calls.infos[0], /Select two or three files or folders in the Explorer/u);
});
