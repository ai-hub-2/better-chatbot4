export type TeamRole = "owner" | "admin" | "editor" | "viewer";

export type ProjectPermission =
  | "project:read"
  | "project:write"
  | "project:delete"
  | "workflow:create"
  | "workflow:update"
  | "workflow:delete"
  | "workflow:execute"
  | "agent:create"
  | "agent:update"
  | "agent:delete"
  | "agent:execute"
  | "mcp:invoke"
  | "pipeline:run"
  | "deploy:trigger";

export type TeamMember = {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: Date;
  invitedBy: string;
};

export type ProjectAccess = {
  id: string;
  projectId: string;
  userId: string;
  teamId?: string;
  permissions: ProjectPermission[];
  grantedAt: Date;
  grantedBy: string;
};

export type Team = {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  settings: {
    allowMemberInvites: boolean;
    requireApprovalForJoins: boolean;
    defaultProjectPermissions: ProjectPermission[];
  };
};

const teamRolePermissions: Record<TeamRole, ProjectPermission[]> = {
  owner: [
    "project:read",
    "project:write",
    "project:delete",
    "workflow:create",
    "workflow:update",
    "workflow:delete",
    "workflow:execute",
    "agent:create",
    "agent:update",
    "agent:delete",
    "agent:execute",
    "mcp:invoke",
    "pipeline:run",
    "deploy:trigger",
  ],
  admin: [
    "project:read",
    "project:write",
    "workflow:create",
    "workflow:update",
    "workflow:delete",
    "workflow:execute",
    "agent:create",
    "agent:update",
    "agent:delete",
    "agent:execute",
    "mcp:invoke",
    "pipeline:run",
    "deploy:trigger",
  ],
  editor: [
    "project:read",
    "project:write",
    "workflow:create",
    "workflow:update",
    "workflow:execute",
    "agent:create",
    "agent:update",
    "agent:execute",
    "mcp:invoke",
    "pipeline:run",
  ],
  viewer: ["project:read", "workflow:execute", "agent:execute", "mcp:invoke"],
};

export function getTeamRolePermissions(role: TeamRole): ProjectPermission[] {
  return teamRolePermissions[role] || [];
}

export function hasProjectPermission(
  userPermissions: ProjectPermission[],
  requiredPermission: ProjectPermission,
): boolean {
  return userPermissions.includes(requiredPermission);
}

export function combinePermissions(
  teamPermissions: ProjectPermission[],
  explicitPermissions: ProjectPermission[],
): ProjectPermission[] {
  const combined = new Set([...teamPermissions, ...explicitPermissions]);
  return Array.from(combined);
}

// In-memory stores (extend to database as needed)
class InMemoryTeamStore {
  private teams: Map<string, Team> = new Map();
  private members: Map<string, TeamMember[]> = new Map();
  private projectAccess: Map<string, ProjectAccess[]> = new Map();

  async createTeam(team: Omit<Team, "id" | "createdAt">): Promise<Team> {
    const newTeam: Team = {
      ...team,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.teams.set(newTeam.id, newTeam);
    return newTeam;
  }

  async getTeam(teamId: string): Promise<Team | null> {
    return this.teams.get(teamId) || null;
  }

  async addMember(member: Omit<TeamMember, "id">): Promise<TeamMember> {
    const newMember: TeamMember = {
      ...member,
      id: crypto.randomUUID(),
    };

    const existing = this.members.get(member.teamId) || [];
    existing.push(newMember);
    this.members.set(member.teamId, existing);

    return newMember;
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return this.members.get(teamId) || [];
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const userTeams: Team[] = [];
    for (const [teamId, members] of this.members.entries()) {
      if (members.some((m) => m.userId === userId)) {
        const team = this.teams.get(teamId);
        if (team) userTeams.push(team);
      }
    }
    return userTeams;
  }

  async grantProjectAccess(
    access: Omit<ProjectAccess, "id" | "grantedAt">,
  ): Promise<ProjectAccess> {
    const newAccess: ProjectAccess = {
      ...access,
      id: crypto.randomUUID(),
      grantedAt: new Date(),
    };

    const existing = this.projectAccess.get(access.projectId) || [];
    existing.push(newAccess);
    this.projectAccess.set(access.projectId, existing);

    return newAccess;
  }

  async getProjectAccess(projectId: string): Promise<ProjectAccess[]> {
    return this.projectAccess.get(projectId) || [];
  }

  async getUserProjectPermissions(
    userId: string,
    projectId: string,
  ): Promise<ProjectPermission[]> {
    const access = this.projectAccess.get(projectId) || [];
    const userAccess = access.find((a) => a.userId === userId);

    if (userAccess) {
      return userAccess.permissions;
    }

    // Check team permissions
    const userTeams = await this.getUserTeams(userId);
    let teamPermissions: ProjectPermission[] = [];

    for (const team of userTeams) {
      const members = this.members.get(team.id) || [];
      const member = members.find((m) => m.userId === userId);
      if (member) {
        const rolePermissions = getTeamRolePermissions(member.role);
        teamPermissions = combinePermissions(teamPermissions, rolePermissions);
      }
    }

    return teamPermissions;
  }
}

export const teamStore = new InMemoryTeamStore();
