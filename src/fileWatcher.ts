import chokidar from "chokidar";

export function watchRouteFiles(
  directory: string,
  callback: (changedFiles: string[]) => void
): void {
  const watcher = chokidar.watch(directory, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
  });
  watcher.on("change", (path) => callback([path]));
}
