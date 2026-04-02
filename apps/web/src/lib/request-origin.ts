/** İstekten mutlak site kökü (QR ve yönlendirmeler için). */
export function getRequestOrigin(request: Request): string {
  const u = new URL(request.url);
  const forwarded = request.headers.get('x-forwarded-host');
  const proto = request.headers.get('x-forwarded-proto') ?? (u.protocol === 'https:' ? 'https' : 'http');
  if (forwarded) {
    return `${proto}://${forwarded}`;
  }
  return `${u.protocol}//${u.host}`;
}
