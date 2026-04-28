export function getBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

export function toBasePath(path: string): string {
  const base = getBasePath();
  return path === "/" ? `${base}/` : `${base}${path}`;
}

export function stripBasePath(pathname: string): string {
  const base = getBasePath();
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (!base) {
    return normalized;
  }
  return normalized.startsWith(base)
    ? normalized.slice(base.length) || "/"
    : normalized;
}

export function isActivePath(currentPath: string, href: string): boolean {
  return href === "/" ? currentPath === "/" : currentPath.startsWith(href);
}
