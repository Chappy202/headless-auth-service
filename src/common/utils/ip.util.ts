export function getClientIp(ip: string): string {
  // Check if it's an IPv4 mapped in IPv6
  if (ip.substr(0, 7) === '::ffff:') {
    return ip.substr(7);
  }
  return ip;
}
