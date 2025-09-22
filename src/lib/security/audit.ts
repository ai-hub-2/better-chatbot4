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

// Real database audit store using PostgreSQL
import { pgDb as db } from "lib/db/pg/db.pg";

class DatabaseAuditStore implements AuditRepository {
  async log(event: Omit<AuditEvent, "id" | "timestamp">): Promise<void> {
    try {
      await db.query(
        `
        INSERT INTO audit_events (
          id, timestamp, user_id, action, resource, resource_id, 
          metadata, ip, user_agent, success, error
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
        [
          crypto.randomUUID(),
          new Date(),
          event.userId,
          event.action,
          event.resource,
          event.resourceId || null,
          event.metadata ? JSON.stringify(event.metadata) : null,
          event.ip || null,
          event.userAgent || null,
          event.success,
          event.error || null,
        ],
      );
    } catch (error) {
      console.error("Failed to log audit event:", error);
      // Fallback to console logging for critical events
      console.log("AUDIT:", JSON.stringify(event));
    }
  }

  async query(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    since?: Date;
    limit?: number;
  }): Promise<AuditEvent[]> {
    try {
      let query = `
        SELECT id, timestamp, user_id, action, resource, resource_id, 
               metadata, ip, user_agent, success, error
        FROM audit_events
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 0;

      if (filters.userId) {
        paramCount++;
        query += ` AND user_id = $${paramCount}`;
        params.push(filters.userId);
      }
      if (filters.action) {
        paramCount++;
        query += ` AND action = $${paramCount}`;
        params.push(filters.action);
      }
      if (filters.resource) {
        paramCount++;
        query += ` AND resource = $${paramCount}`;
        params.push(filters.resource);
      }
      if (filters.since) {
        paramCount++;
        query += ` AND timestamp >= $${paramCount}`;
        params.push(filters.since);
      }

      query += ` ORDER BY timestamp DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      const result = await db.query(query, params);

      return result.rows.map((row) => ({
        id: row.id,
        timestamp: new Date(row.timestamp),
        userId: row.user_id,
        action: row.action,
        resource: row.resource,
        resourceId: row.resource_id,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        ip: row.ip,
        userAgent: row.user_agent,
        success: row.success,
        error: row.error,
      }));
    } catch (error) {
      console.error("Failed to query audit events:", error);
      return [];
    }
  }
}

export const auditStore = new DatabaseAuditStore();

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
