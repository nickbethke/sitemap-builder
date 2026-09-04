import type {LookupAddress} from 'node:dns';
import type {LookupFunction} from 'node:net';
import ipaddr from 'ipaddr.js';

/** Returns true unless address is globally routable unicast. */
export function isUnsafeRemoteAddress(address: string): boolean {
    if (!ipaddr.isValid(address)) return true;
    return ipaddr.parse(address).range() !== 'unicast';
}

/** Node may request either one address or an array (`all: true`). Preserve that contract while pinning DNS results. */
export function createPinnedLookup(addresses: readonly LookupAddress[]): LookupFunction {
    if (addresses.length === 0) throw new Error('Keine DNS-Adressen zum Pinnen vorhanden.');
    const pinned = addresses[0];
    return (_hostname, options, callback) => {
        const requestedFamily = typeof options === 'number' ? options : options.family;
        const matching = addresses.filter(({family}) => !requestedFamily || family === requestedFamily);
        if (typeof options !== 'number' && options.all) {
            callback(null, (matching.length ? matching : addresses).map(({address, family}) => ({address, family})));
            return;
        }
        const selected = matching[0] ?? pinned;
        callback(null, selected.address, selected.family);
    };
}
