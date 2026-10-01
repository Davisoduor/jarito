export type Page = 'app' | 'canvas' | 'brightspace' | 'support';

export function currentPage(pathname = window.location.pathname): Page {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/canvas') return 'canvas';
  if (path === '/brightspace') return 'brightspace';
  if (path === '/support') return 'support';
  return 'app';
}

