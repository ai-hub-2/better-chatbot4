export type AuditEvent = {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
};

export type AuditRepository = {
  log: (event: Omit<AuditEvent, "id" | "timestamp">) => Promise<void>;
  query: (filters: {
    userId?: string;
    action?: string;
    resource?: string;
    since?: Date;
    limit?: number;
  }) => Promise<AuditEvent[]>;
};

// In-memory audit store (extend to database as needed)
class InMemoryAuditStore implements AuditRepository {
  private events: AuditEvent[] = [];

  async log(event: Omit<AuditEvent, "id" | "timestamp">): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    this.events.push(auditEvent);

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  async query(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    since?: Date;
    limit?: number;
  }): Promise<AuditEvent[]> {
    let filtered = this.events;

    if (filters.userId) {
      filtered = filtered.filter((e) => e.userId === filters.userId);
    }
    if (filters.action) {
      filtered = filtered.filter((e) => e.action === filters.action);
    }
    if (filters.resource) {
      filtered = filtered.filter((e) => e.resource === filters.resource);
    }
    if (filters.since) {
      filtered = filtered.filter((e) => e.timestamp >= filters.since!);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }
}

export const auditStore = new InMemoryAuditStore();

export async function auditLog(
  userId: string,
  action: string,
  resource: string,
  options: {
    resourceId?: string;
    metadata?: Record<string, any>;
    ip?: string;
    userAgent?: string;
    success?: boolean;
    error?: string;
  } = {},
): Promise<void> {
  await auditStore.log({
    userId,
    action,
    resource,
    resourceId: options.resourceId,
    metadata: options.metadata,
    ip: options.ip,
    userAgent: options.userAgent,
    success: options.success ?? true,
    error: options.error,
  });
}
