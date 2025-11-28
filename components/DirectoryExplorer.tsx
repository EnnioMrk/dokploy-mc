"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type DirectoryEntry = {
  name: string;
  relativePath: string;
  type: "file" | "directory";
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

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export default function DirectoryExplorer() {
  const [path, setPath] = useState("");
  const [data, setData] = useState<DirectorySnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDirectory = useCallback(async (pathToLoad: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/directory?path=${encodeURIComponent(pathToLoad)}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load directory contents.");
      }

      setData(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error while loading.";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectory(path);
  }, [path, fetchDirectory]);

  const breadcrumbs = useMemo(
    () => data?.breadcrumbs ?? [{ label: "dp-apps", path: "" }],
    [data]
  );

  return (
    <section className="flex w-full max-w-4xl flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Directory Explorer</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Browsing <span className="font-medium">{data?.absolutePath ?? data?.basePath ?? "/dp-apps"}</span>
        </p>
        <nav className="flex flex-wrap items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path || "root"} className="flex items-center gap-2">
              <button
                type="button"
                className="hover:underline"
                onClick={() => setPath(crumb.path)}
                disabled={crumb.path === path}
              >
                {crumb.label}
              </button>
              {index < breadcrumbs.length - 1 && <span className="text-zinc-400">/</span>}
            </div>
          ))}
        </nav>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-zinc-300 px-4 py-1 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
            disabled={data?.parentPath === null || loading}
            onClick={() => {
              const parent = data?.parentPath;
              if (parent != null) setPath(parent);
            }}
          >
            Up one level
          </button>
          <button
            type="button"
            className="rounded-full border border-blue-500 px-4 py-1 text-sm font-medium text-blue-600 transition hover:bg-blue-50 dark:hover:bg-zinc-800"
            disabled={loading}
            onClick={() => fetchDirectory(path)}
          >
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Modified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Loading directory contents…
                </td>
              </tr>
            ) : data?.entries?.length ? (
              data.entries.map((entry) => (
                <tr key={entry.relativePath} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                  <td className="px-4 py-3">
                    {entry.type === "directory" ? (
                      <button
                        type="button"
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                        onClick={() => setPath(entry.relativePath)}
                      >
                        {entry.name}
                      </button>
                    ) : (
                      <span className="text-zinc-700 dark:text-zinc-200">{entry.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-zinc-500 dark:text-zinc-400">{entry.type}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{formatBytes(entry.size)}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {dateFormatter.format(new Date(entry.modified))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  {data ? "This directory is empty." : "Nothing to display yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
