import {validateSitemapDocument} from '../../shared/sitemap-schema.ts';
import type {SitemapDocument, SitemapNode} from './sitemap.ts';

/** Validate before committing to state/history/autosave, not only when saving. */
export function prepareDocumentMutation(
    current: SitemapDocument,
    mutation: (current: SitemapDocument) => SitemapDocument,
): SitemapDocument {
    const next = {...mutation(current), updatedAt: new Date().toISOString()};
    validateSitemapDocument(next);
    return next;
}

export function canDuplicateNode(node: SitemapNode): boolean {
    return node.parentId !== null;
}

export function canPromoteNode(document: SitemapDocument, node: SitemapNode): boolean {
    const parent = document.nodes.find(candidate => candidate.id === node.parentId);
    return Boolean(parent && parent.parentId !== null);
}
