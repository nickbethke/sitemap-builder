import {type SitemapLayout, type SitemapNode} from '@/lib/sitemap.ts';
import {cn} from '@/lib/utils.ts';
import {type PointerEvent as ReactPointerEvent} from 'react';

export type MiniMapViewport = {
    scrollLeft: number;
    scrollTop: number;
    clientWidth: number;
    clientHeight: number;
};

const MINI_MAP_MAX_SIZE = 180;

export function MiniMap({
    layout,
    nodes,
    selectedId,
    zoom,
    viewport,
    onNavigate,
}: {
    layout: SitemapLayout;
    nodes: SitemapNode[];
    selectedId: string;
    zoom: number;
    viewport: MiniMapViewport;
    onNavigate: (x: number, y: number) => void;
}) {
    const scale = Math.min(MINI_MAP_MAX_SIZE / layout.width, MINI_MAP_MAX_SIZE / layout.height);
    const mapWidth = layout.width * scale;
    const mapHeight = layout.height * scale;

    const navigateTo = (clientX: number, clientY: number, bounds: DOMRect) => {
        onNavigate((clientX - bounds.left) / scale, (clientY - bounds.top) / scale);
    };

    const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        const handle = event.currentTarget;
        const bounds = handle.getBoundingClientRect();
        handle.setPointerCapture(event.pointerId);
        navigateTo(event.clientX, event.clientY, bounds);

        handle.onpointermove = (moveEvent) => navigateTo(moveEvent.clientX, moveEvent.clientY, bounds);
        handle.onpointerup = () => {
            handle.onpointermove = null;
            handle.onpointerup = null;
        };
    };

    const viewLeft = Math.max(0, (viewport.scrollLeft / zoom) * scale);
    const viewTop = Math.max(0, (viewport.scrollTop / zoom) * scale);
    const viewWidth = Math.min(mapWidth - viewLeft, (viewport.clientWidth / zoom) * scale);
    const viewHeight = Math.min(mapHeight - viewTop, (viewport.clientHeight / zoom) * scale);

    return (
        <div
            className="absolute bottom-3 right-3 z-10 cursor-crosshair overflow-hidden rounded-md border border-border bg-[hsl(var(--panel)/.85)] p-px shadow-sm backdrop-blur-md"
            style={{width: mapWidth + 2, height: mapHeight + 2}}
            onPointerDown={startDrag}
            onClick={(event) => event.stopPropagation()}
        >
            <div className="relative" style={{width: mapWidth, height: mapHeight}}>
                {nodes.map((node) => {
                    const position = layout.positions[node.id];
                    if (!position) return null;

                    return (
                        <div
                            key={node.id}
                            className={cn(
                                'absolute rounded-[1px]',
                                node.id === selectedId ? 'bg-primary' : 'bg-foreground/25',
                            )}
                            style={{
                                left: position.x * scale,
                                top: position.y * scale,
                                width: Math.max(2, layout.cardSizes[node.id].width * scale),
                                height: Math.max(2, layout.cardSizes[node.id].height * scale),
                            }}
                        />
                    );
                })}

                <div
                    className="pointer-events-none absolute border border-primary bg-primary/10"
                    style={{
                        left: viewLeft,
                        top: viewTop,
                        width: Math.max(0, viewWidth),
                        height: Math.max(0, viewHeight),
                    }}
                />
            </div>
        </div>
    );
}
