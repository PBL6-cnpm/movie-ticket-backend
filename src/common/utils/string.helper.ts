import parse from 'parse-duration';

export function parseTtlToSeconds(ttl: string | number): number {
  if (ttl === undefined || ttl === null) {
    throw new Error('TTL is required but got undefined/null');
  }

  if (typeof ttl === 'string') {
    const ttlMs = parse(ttl);
    if (ttlMs === null || isNaN(ttlMs)) {
      throw new Error(`Invalid TTL format: ${ttl}`);
    }
    return Math.floor(ttlMs / 1000);
  }

  if (typeof ttl === 'number') {
    if (isNaN(ttl)) {
      throw new Error(`Invalid TTL number: ${ttl}`);
    }
    return Math.floor(ttl / 1000);
  }

  throw new Error(`Unsupported TTL type: ${typeof ttl}`);
}
