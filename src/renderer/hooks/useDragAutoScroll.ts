import {useEffect, type RefObject} from 'react';
import {dragScrollVelocity} from '../lib/dragScroll.ts';

export function useDragAutoScroll(ref: RefObject<HTMLElement | null>, active: boolean): void {
    useEffect(() => {
        const canvas = ref.current;
        if (!active || !canvas) return;
        let velocity = {x: 0, y: 0};
        let frame = 0;
        let previousTime = 0;
        const stop = () => {
            velocity = {x: 0, y: 0};
            cancelAnimationFrame(frame);
            frame = 0;
            previousTime = 0;
        };
        const tick = (time: number) => {
            const seconds = previousTime ? Math.min(time - previousTime, 32) / 1000 : 0;
            previousTime = time;
            canvas.scrollLeft += velocity.x * seconds;
            canvas.scrollTop += velocity.y * seconds;
            frame = requestAnimationFrame(tick);
        };
        const onDragOver = (event: globalThis.DragEvent) => {
            velocity = dragScrollVelocity(event.clientX, event.clientY, canvas.getBoundingClientRect());
            if (!velocity.x && !velocity.y) stop();
            else if (!frame) frame = requestAnimationFrame(tick);
        };
        const onDragLeave = (event: globalThis.DragEvent) => {
            if (!event.relatedTarget) stop();
        };
        // Track movement even over cards that reject a drop. Do not make invalid
        // targets droppable merely to enable scrolling.
        window.addEventListener('dragover', onDragOver, true);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('drop', stop, true);
        window.addEventListener('dragend', stop, true);
        window.addEventListener('blur', stop);
        return () => {
            stop();
            window.removeEventListener('dragover', onDragOver, true);
            window.removeEventListener('dragleave', onDragLeave);
            window.removeEventListener('drop', stop, true);
            window.removeEventListener('dragend', stop, true);
            window.removeEventListener('blur', stop);
        };
    }, [active, ref]);
}
