type Bounds = {left: number; top: number; right: number; bottom: number};

/** CSS pixels per second; acceleration near edges keeps distant targets reachable. */
export function dragScrollVelocity(x: number, y: number, bounds: Bounds): {x: number; y: number} {
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return {x: 0, y: 0};
    const speed = (pointer: number, start: number, end: number) => {
        const edge = Math.min(72, (end - start) / 3);
        if (edge <= 0) return 0;
        if (pointer < start + edge) return -750 * (1 - (pointer - start) / edge);
        if (pointer > end - edge) return 750 * (1 - (end - pointer) / edge);
        return 0;
    };
    return {x: speed(x, bounds.left, bounds.right), y: speed(y, bounds.top, bounds.bottom)};
}
