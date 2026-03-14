function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function detectNamesToProtect(
  code: string,
  globals: string[],
  autoGlobals: boolean,
): string[] {
  const names = [...globals];

  if (autoGlobals) {
    const exportPattern = /^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+(\w+)/gm;
    for (const match of code.matchAll(exportPattern)) {
      if (!names.includes(match[1])) {
        names.push(match[1]);
      }
    }
  }

  if (names.length === 0) return [];

  // Only protect names that are declared in this module
  return names.filter((name) => {
    const escaped = escapeRegExp(name);
    const declPattern = new RegExp(`(?:function|const|let|var|class)\\s+${escaped}\\b`);
    return declPattern.test(code);
  });
}
