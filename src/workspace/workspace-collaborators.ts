import type { DossierRepositoryLike } from "./workspace-types.js";
import { SqliteClient } from "../storage/sqlite-client.js";
import { SqliteDossierRepository } from "../storage/sqlite-dossier-repository.js";
import { ShareAccessManager } from "../sharing/share-access-manager.js";
import { OrganicEvidenceManager } from "../organic/organic-evidence-manager.js";

/** The sqlite-backed services a workspace needs, resolved from one client. */
export interface WorkspaceCollaborators {
  readonly sqliteClient: SqliteClient;
  readonly shareManager: ShareAccessManager;
  readonly organicEvidenceManager: OrganicEvidenceManager;
}

/**
 * Resolves one sqlite client for the whole workspace.
 *
 * An explicitly injected client wins; otherwise the client hanging off the
 * repository is reused, so a repository backed by a real database does not get
 * a second, unrelated in-memory one beside it.
 */
export function buildWorkspaceCollaborators(
  repo: DossierRepositoryLike,
  injected?: SqliteClient
): WorkspaceCollaborators {
  const repoClient = repo instanceof SqliteDossierRepository ? repo.client : (repo as { client?: unknown }).client;
  const sqliteClient = injected ?? (repoClient instanceof SqliteClient ? repoClient : new SqliteClient({ dbPath: ":memory:", inMemory: true }));
  return {
    sqliteClient,
    shareManager: new ShareAccessManager(sqliteClient),
    organicEvidenceManager: new OrganicEvidenceManager(sqliteClient),
  };
}
