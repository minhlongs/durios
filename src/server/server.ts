import { SqliteClient } from "../storage/sqlite-client.js";
import { FileStorageService } from "../storage/file-storage-service.js";
import { SqliteDossierRepository } from "../storage/sqlite-dossier-repository.js";
import { SqliteAuditLedger } from "../storage/sqlite-audit-ledger.js";
import { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { routeHttpRequest } from "./http-router.js";

export interface ServerOptions {
  readonly port?: number;
  readonly hostname?: string;
  readonly dbPath?: string;
  readonly dataDir?: string;
}

export function createWorkspaceApp(options: ServerOptions = {}): {
  workspace: ContainerDossierWorkspace;
  sqliteClient: SqliteClient;
  handler: (req: Request) => Promise<Response>;
} {
  const dbPath = options.dbPath ?? "./data/durios.db";
  const dataDir = options.dataDir ?? "./data/uploads";

  const sqliteClient = new SqliteClient({ dbPath });

  const fileStorage = new FileStorageService(dataDir);
  const dossierRepo = new SqliteDossierRepository(sqliteClient);
  const auditLedger = new SqliteAuditLedger(sqliteClient);

  const workspace = new ContainerDossierWorkspace(
    dossierRepo,
    auditLedger,
    fileStorage
  );

  return {
    workspace,
    sqliteClient,
    handler: (req: Request) => routeHttpRequest(workspace, req),
  };
}

export function startLocalServer(options: ServerOptions = {}) {
  const port = options.port ?? Number(process.env.PORT ?? 3000);
  const hostname = options.hostname ?? "127.0.0.1";
  const { handler, sqliteClient } = createWorkspaceApp(options);

  const server = Bun.serve({
    port,
    hostname,
    fetch(req) {
      return handler(req);
    },
  });

  return {
    server,
    sqliteClient,
    url: `http://${hostname}:${server.port}`,
    stop: () => {
      server.stop();
      sqliteClient.close();
    },
  };
}

if (import.meta.main) {
  const s = startLocalServer();
  // eslint-disable-next-line no-console
  process.stdout.write(`\n🚀 DuriOS Local Core Server running at: ${s.url}\n\n`);
}
