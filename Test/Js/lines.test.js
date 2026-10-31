'use strict';

// Plain Node test (no framework): loads the AMD module with a tiny define() shim.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let lines;
const define = (deps, factory) => { lines = factory(); };
new Function('define', fs.readFileSync(path.join(__dirname, '../../src/view/frontend/web/js/model/lines.js'), 'utf8'))(define);

const seg = (list) => [{code: 'subtotal'}, {code: 'discount', extension_attributes: {discount_lines: list}}];
let n = 0;
const test = (name, fn) => { fn(); n++; };

test('cents of floats and strings', () => {
    assert.strictEqual(lines.toCents(8.96), 896);
    assert.strictEqual(lines.toCents('8.9600'), 896);
    assert.strictEqual(lines.toCents(1.005), 100);
    assert.strictEqual(lines.toCents(0.29), 29);
    assert.strictEqual(lines.toCents(undefined), 0);
    assert.strictEqual(lines.toCents('abc'), 0);
});
test('sum in cents has no float drift', () => {
    const l = lines.fromSegments(seg([{kind: 'automatic', amount: 0.1}, {kind: 'coupon', code: 'X', amount: 0.2}]));
    assert.strictEqual(lines.sumCents(l), 30);
});
test('coupon is removable, code optional', () => {
    const l = lines.fromSegments(seg([{kind: 'automatic', label: 'A', amount: '3.15'}, {kind: 'coupon', code: 'C1', label: 'C1', amount: 8.96}]));
    assert.deepStrictEqual(l.map((x) => [x.kind, x.code, x.removable, x.cents]),
        [['automatic', '', false, 315], ['coupon', 'C1', true, 896]]);
});
test('no lines for missing or malformed data', () => {
    assert.deepStrictEqual(lines.fromSegments(null), []);
    assert.deepStrictEqual(lines.fromSegments([{code: 'discount'}]), []);
    assert.deepStrictEqual(lines.fromSegments([{code: 'discount', extension_attributes: {discount_lines: 'x'}}]), []);
    assert.deepStrictEqual(lines.fromSegments([]), []);
});
test('zero amount line is kept', () => {
    const l = lines.fromSegments(seg([{kind: 'free_shipping', label: 'F', amount: 0}]));
    assert.strictEqual(l.length, 1);
    assert.strictEqual(l[0].cents, 0);
});

console.log('OK (' + n + ' tests)');
