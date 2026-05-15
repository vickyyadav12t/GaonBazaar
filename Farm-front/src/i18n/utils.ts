/** Shallow-deep merge for locale objects (plain objects + arrays replaced by value). */
export function deepMerge<T extends Record<string, unknown>>(base: T, patch: Partial<T>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const pv = patch[key];
    if (pv === undefined) continue;
    const bv = base[key];
    if (
      pv !== null &&
      typeof pv === 'object' &&
      !Array.isArray(pv) &&
      bv !== null &&
      typeof bv === 'object' &&
      !Array.isArray(bv)
    ) {
      out[key as string] = deepMerge(bv as Record<string, unknown>, pv as Record<string, unknown>);
    } else {
      out[key as string] = pv as unknown;
    }
  }
  return out as T;
}
