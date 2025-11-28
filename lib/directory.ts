import { promises as fs } from 'fs';
import path from 'path';

export type DirectoryEntry = {
    name: string;
    relativePath: string;
    type: 'file' | 'directory';
    size: number;
    modified: string;
};

export type DirectorySnapshot = {
    basePath: string;
    requestedPath: string;
    absolutePath: string;
    parentPath: string | null;
    breadcrumbs: Array<{ label: string; path: string }>;
    entries: DirectoryEntry[];
};

const BASE_DIRECTORY = '/dp-apps';

function resolvePath(requestedPath = '') {
    const normalizedRequest = requestedPath.replace(/^\/+/, '');
    const targetPath = path.resolve(BASE_DIRECTORY, normalizedRequest);

    if (!targetPath.startsWith(BASE_DIRECTORY)) {
        throw new Error('Requested path is outside the allowed directory.');
    }

    return targetPath;
}

function buildBreadcrumbs(requestedPath: string) {
    const segments = requestedPath.split('/').filter(Boolean);
    const crumbs: Array<{ label: string; path: string }> = [
        { label: path.basename(BASE_DIRECTORY) || BASE_DIRECTORY, path: '' },
    ];

    return segments.reduce<{ pathAcc: string; breadcrumbs: typeof crumbs }>(
        (acc, segment) => {
            const nextPath = acc.pathAcc
                ? `${acc.pathAcc}/${segment}`
                : segment;
            acc.breadcrumbs.push({ label: segment, path: nextPath });
            return { pathAcc: nextPath, breadcrumbs: acc.breadcrumbs };
        },
        { pathAcc: '', breadcrumbs: crumbs }
    ).breadcrumbs;
}

export async function readDirectory(
    requestedPath = ''
): Promise<DirectorySnapshot> {
    const absolutePath = resolvePath(requestedPath);

    const dirents = await fs.readdir(absolutePath, { withFileTypes: true });

    const entries = await Promise.all(
        dirents.map(async (dirent) => {
            const entryPath = path.join(absolutePath, dirent.name);
            const stats = await fs.stat(entryPath);

            return {
                name: dirent.name,
                relativePath: path.relative(BASE_DIRECTORY, entryPath),
                type: dirent.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime.toISOString(),
            } satisfies DirectoryEntry;
        })
    );

    entries.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    const breadcrumbs = buildBreadcrumbs(requestedPath);
    const parentPath =
        breadcrumbs.length > 1
            ? breadcrumbs[breadcrumbs.length - 2].path
            : null;

    return {
        basePath: BASE_DIRECTORY,
        requestedPath,
        absolutePath,
        parentPath,
        breadcrumbs,
        entries,
    };
}
