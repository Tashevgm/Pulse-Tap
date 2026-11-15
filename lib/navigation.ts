export function safeInternalPath(value: string | null | undefined, fallback = "/dashboard") {
  const candidate = value?.trim() ?? "";
  return candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : fallback;
}
