export type Role = "owner" | "editor" | "viewer";

export type Permission =
  | "workflow:create"
  | "workflow:update"
  | "workflow:delete"
  | "agent:create"
  | "agent:update"
  | "agent:delete"
  | "mcp:invoke"
  | "pipeline:run";

const rolePermissions: Record<Role, Permission[]> = {
  owner: [
    "workflow:create",
    "workflow:update",
    "workflow:delete",
    "agent:create",
    "agent:update",
    "agent:delete",
    "mcp:invoke",
    "pipeline:run",
  ],
  editor: [
    "workflow:create",
    "workflow:update",
    "agent:create",
    "agent:update",
    "mcp:invoke",
    "pipeline:run",
  ],
  viewer: ["mcp:invoke"],
};

export function hasPermission(role: Role, perm: Permission) {
  return rolePermissions[role]?.includes(perm) ?? false;
}

export function getUserRoleForProject(
  userId: string,
  projectOwnerId: string,
): Role {
  // default owner for own projects; extend to team model as needed
  return userId === projectOwnerId ? "owner" : "viewer";
}

// Enhanced permission checking with team support
import { ProjectPermission, teamStore } from "./team";

export async function hasProjectPermission(
  userId: string,
  projectId: string,
  permission: ProjectPermission,
): Promise<boolean> {
  const userPermissions = await teamStore.getUserProjectPermissions(
    userId,
    projectId,
  );
  return userPermissions.includes(permission);
}

export async function getUserProjectPermissions(
  userId: string,
  projectId: string,
): Promise<ProjectPermission[]> {
  return teamStore.getUserProjectPermissions(userId, projectId);
}
