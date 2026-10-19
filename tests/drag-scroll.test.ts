import assert from 'node:assert/strict';
import test from 'node:test';
import {dragScrollVelocity} from '../src/renderer/lib/dragScroll.ts';

const bounds = {left: 100, top: 100, right: 900, bottom: 700};

test('drag scrolling stops in center and outside canvas', () => {
    for (const [x, y] of [[500, 400], [99, 400], [901, 400], [500, 99], [500, 701]]) {
        assert.deepEqual(dragScrollVelocity(x, y, bounds), {x: 0, y: 0});
    }
});

test('drag scrolling works in all directions and accelerates near edges', () => {
    assert.equal(dragScrollVelocity(100, 400, bounds).x, -750);
    assert.equal(dragScrollVelocity(900, 400, bounds).x, 750);
    assert.equal(dragScrollVelocity(500, 100, bounds).y, -750);
    assert.equal(dragScrollVelocity(500, 700, bounds).y, 750);
    const corner = dragScrollVelocity(899, 699, bounds);
    assert.ok(corner.x > 0 && corner.y > 0);
    assert.ok(corner.x > dragScrollVelocity(850, 650, bounds).x);
});
