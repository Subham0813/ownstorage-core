let tempCounter = 0;

export function makeTempId(prefix = "local") {
  tempCounter += 1;
  return `local:${prefix}:${Date.now()}:${tempCounter}`;
}

export function isTempId(id) {
  return typeof id === "string" && id.startsWith("local:");
}

export function applyOverrides(list, overrides, removedIds) {
  return list
    .map((item) => {
      const updater = overrides[item.id];
      return updater ? { ...updater(item) } : item;
    })
    .filter((item) => !removedIds.has(item.id));
}

export function upsertItem(list, item) {
  const idx = list.findIndex((i) => i.id === item.id);
  if (idx === -1) return [...list, item];
  const next = [...list];
  next[idx] = { ...next[idx], ...item };
  return next;
}

export function removeById(list, id) {
  return list.filter((i) => i.id !== id);
}

export function sortItems(items, sortBy = "name", sortOrder = "asc") {
  return [...items].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "name") cmp = a.name.localeCompare(b.name);
    else if (sortBy === "date")
      cmp = new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt);
    else if (sortBy === "size") cmp = (a.size || 0) - (b.size || 0);
    return sortOrder === "desc" ? -cmp : cmp;
  });
}

export function mergeOptimistic({ dirs, files, overrides, removedIds, added }) {
  const removed = removedIds || new Set();
  const additions = added || [];
  const patchedDirs = applyOverrides(dirs, overrides || {}, removed).filter(
    (d) => !removed.has(d.id),
  );
  const patchedFiles = applyOverrides(files, overrides || {}, removed).filter(
    (f) => !removed.has(f.id),
  );
  const mergedDirs = patchedDirs.concat(
    additions.filter((a) => a.type === "directory"),
  );
  const mergedFiles = patchedFiles.concat(
    additions.filter((a) => a.type === "file"),
  );
  return { dirs: mergedDirs, files: mergedFiles, items: mergedDirs.concat(mergedFiles) };
}
