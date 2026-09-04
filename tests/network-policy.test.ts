import assert from 'node:assert/strict';
import test from 'node:test';
import {createPinnedLookup, isUnsafeRemoteAddress} from '../src/shared/network-policy.ts';

test('blocks local, private, special-use, and mapped addresses', () => {
    for (const address of [
        '127.0.0.1',
        '169.254.169.254',
        '10.0.0.1',
        '100.64.0.1',
        '198.18.0.1',
        '::1',
        'fc00::1',
        'fe80::1',
        '::ffff:127.0.0.1',
        'invalid',
    ]) {
        assert.equal(isUnsafeRemoteAddress(address), true, address);
    }
});

test('allows globally routable IPv4 and IPv6 unicast addresses', () => {
    assert.equal(isUnsafeRemoteAddress('8.8.8.8'), false);
    assert.equal(isUnsafeRemoteAddress('2606:4700:4700::1111'), false);
});

test('pinned lookup honors Node all-address contract', async () => {
    const lookup = createPinnedLookup([
        {address: '203.0.113.10', family: 4},
        {address: '2001:db8::10', family: 6},
    ]);
    const result = await new Promise<string | {address: string; family: number}[]>((resolve, reject) => {
        lookup('example.test', {all: true}, (error, address) => error ? reject(error) : resolve(address));
    });
    assert.deepEqual(result, [
        {address: '203.0.113.10', family: 4},
        {address: '2001:db8::10', family: 6},
    ]);
});
