import type {SitemapDocument, SitemapNode, SitemapProject} from './sitemap.ts';

type NodeChange = {
    id: string;
    before?: SitemapNode;
    after?: SitemapNode;
};

export type DocumentChange = {
    beforeUpdatedAt: string;
    afterUpdatedAt: string;
    beforeProject?: SitemapProject;
    afterProject?: SitemapProject;
    nodeChanges: NodeChange[];
    beforeOrder?: string[];
    afterOrder?: string[];
};

const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

export function createDocumentChange(before: SitemapDocument, after: SitemapDocument): DocumentChange {
    const beforeNodes = new Map(before.nodes.map((node) => [node.id, node]));
    const afterNodes = new Map(after.nodes.map((node) => [node.id, node]));
    const ids = new Set([...beforeNodes.keys(), ...afterNodes.keys()]);
    const nodeChanges = [...ids].flatMap((id) => {
        const previous = beforeNodes.get(id);
        const next = afterNodes.get(id);
        return same(previous, next) ? [] : [{id, before: previous, after: next}];
    });
    const beforeOrder = before.nodes.map(({id}) => id);
    const afterOrder = after.nodes.map(({id}) => id);
    const orderChanged = !same(beforeOrder, afterOrder);
    const projectChanged = !same(before.project, after.project);

    return {
        beforeUpdatedAt: before.updatedAt,
        afterUpdatedAt: after.updatedAt,
        beforeProject: projectChanged ? before.project : undefined,
        afterProject: projectChanged ? after.project : undefined,
        nodeChanges,
        beforeOrder: orderChanged ? beforeOrder : undefined,
        afterOrder: orderChanged ? afterOrder : undefined,
    };
}

export function applyDocumentChange(
    current: SitemapDocument,
    change: DocumentChange,
    direction: 'undo' | 'redo',
): SitemapDocument {
    const nodes = new Map(current.nodes.map((node) => [node.id, node]));
    for (const item of change.nodeChanges) {
        const target = direction === 'undo' ? item.before : item.after;
        if (target) nodes.set(item.id, target);
        else nodes.delete(item.id);
    }
    const order = direction === 'undo' ? change.beforeOrder : change.afterOrder;
    const orderedNodes = order
        ? order.map((id) => nodes.get(id)).filter((node): node is SitemapNode => Boolean(node))
        : [...nodes.values()];

    return {
        ...current,
        project: (direction === 'undo' ? change.beforeProject : change.afterProject) ?? current.project,
        nodes: orderedNodes,
        updatedAt: direction === 'undo' ? change.beforeUpdatedAt : change.afterUpdatedAt,
    };
}
