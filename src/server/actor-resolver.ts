import type { AuthenticatedActor } from "../domain/types.js";

const DEFAULT_CLERK: AuthenticatedActor = {
  id: "ACT-LOCAL-CLERK",
  name: "Nguyen Van A (Clerk)",
  role: "CLERK",
  tenantId: "TENANT-LOCAL-001",
};

const DEFAULT_MANAGER: AuthenticatedActor = {
  id: "ACT-LOCAL-MGR",
  name: "Tran Thi B (Manager)",
  role: "MANAGER",
  tenantId: "TENANT-LOCAL-001",
};

export function resolveLocalActor(req: Request): AuthenticatedActor {
  const roleHeader = req.headers.get("x-actor-role")?.toUpperCase();
  const url = new URL(req.url);
  const roleParam = url.searchParams.get("role")?.toUpperCase();
  const selectedRole = roleHeader ?? roleParam;

  if (selectedRole === "MANAGER" || selectedRole === "ADMIN") {
    return DEFAULT_MANAGER;
  }
  return DEFAULT_CLERK;
}
