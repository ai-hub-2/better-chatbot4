type MemoryEntry = {
  ts: number;
  role: "planner" | "programmer" | "tester" | "publisher" | "system" | "user";
  content: string;
  tags?: string[];
};

interface GraphMemory {
  append(projectId: string, entry: MemoryEntry): Promise<void> | void;
  list(projectId: string): Promise<MemoryEntry[]> | MemoryEntry[];
  clear(projectId: string): Promise<void> | void;
  listDetailed?(
    projectId: string,
  ):
    | Promise<{ short: MemoryEntry[]; long: MemoryEntry[] }>
    | { short: MemoryEntry[]; long: MemoryEntry[] };
}

class InProcessGraphMemory implements GraphMemory {
  private store = new Map<string, MemoryEntry[]>();

  append(projectId: string, entry: MemoryEntry) {
    const arr = this.store.get(projectId) ?? [];
    arr.push(entry);
    this.store.set(projectId, arr);
  }

  list(projectId: string) {
    return this.store.get(projectId) ?? [];
  }

  clear(projectId: string) {
    this.store.delete(projectId);
  }

  listDetailed(projectId: string) {
    const all = this.list(projectId);
    const maxShort = 200;
    const start = Math.max(0, all.length - maxShort);
    return { short: all.slice(start), long: all };
  }
}

class RedisGraphMemory implements GraphMemory {
  private redis: any;
  private shortCap = 200;
  constructor(redis: any) {
    this.redis = redis;
  }
  private keyShort(projectId: string) {
    return `memory:${projectId}:short`;
  }
  private keyLong(projectId: string) {
    return `memory:${projectId}:long`;
  }
  async append(projectId: string, entry: MemoryEntry) {
    const value = JSON.stringify(entry);
    await this.redis.rpush(this.keyLong(projectId), value);
    await this.redis.rpush(this.keyShort(projectId), value);
    await this.redis.ltrim(this.keyShort(projectId), -this.shortCap, -1);
  }
  async list(projectId: string) {
    const short = await this.redis.lrange(this.keyShort(projectId), 0, -1);
    // Fallback to long if short empty
    const source = short?.length
      ? short
      : await this.redis.lrange(this.keyLong(projectId), -this.shortCap, -1);
    return (source || []).map((s: string) => JSON.parse(s) as MemoryEntry);
  }
  async clear(projectId: string) {
    await this.redis.del(this.keyShort(projectId));
    await this.redis.del(this.keyLong(projectId));
  }
  async listDetailed(projectId: string) {
    const shortRaw = await this.redis.lrange(this.keyShort(projectId), 0, -1);
    const longRaw = await this.redis.lrange(this.keyLong(projectId), 0, -1);
    return {
      short: (shortRaw || []).map((s: string) => JSON.parse(s) as MemoryEntry),
      long: (longRaw || []).map((s: string) => JSON.parse(s) as MemoryEntry),
    };
  }
}
let graphMemoryImpl: GraphMemory = new InProcessGraphMemory();

export function setGraphMemoryRedis(redis: any) {
  graphMemoryImpl = new RedisGraphMemory(redis);
}

export const graphMemory: GraphMemory = graphMemoryImpl;
export type { MemoryEntry };
