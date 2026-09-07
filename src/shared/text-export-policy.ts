/** A project may be an incomplete draft; exported sitemap URLs must not be. */
export function validateExportBaseUrl(value: string): URL {
    try {
        if (value !== value.trim() || /[\s\\?#]/.test(value) || !/^https?:\/\//i.test(value)) throw new Error();
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
        return url;
    } catch {
        throw new Error('Export benötigt eine gültige HTTP(S)-Basis-URL ohne Zugangsdaten, Query oder Fragment.');
    }
}

export function validateExportPath(value: string): void {
    if (!value.startsWith('/') || value.startsWith('//') || /[\s\\#\u0000-\u001f\u007f]/.test(value) || /%(?![0-9a-f]{2})/i.test(value)) {
        throw new Error(`Ungültiger Exportpfad: ${value.slice(0, 200)}`);
    }
}

export function sitemapExportUrl(base: URL, path: string): string {
    validateExportPath(path);
    // Preserve the configured base path, matching the editor's project-relative slugs.
    const url = new URL(`${base.href.replace(/\/$/, '')}${path === '/' ? '' : path}`);
    if (url.origin !== base.origin || url.href.length >= 2048) throw new Error('Export-URL ist ungültig oder zu lang.');
    return url.href;
}

export function escapeMarkdownText(value: string): string {
    return value
        .replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ')
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .replace(/[\\`*_[\]{}()#+.!|~\-]/g, '\\$&');
}

export function markdownPath(value: string): string {
    validateExportPath(value);
    const url = new URL(value, 'https://export.invalid');
    return `${url.pathname}${url.search}`.replace(/[()'"<>`]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}
