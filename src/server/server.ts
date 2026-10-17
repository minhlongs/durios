import { SqliteClient } from "../storage/sqlite-client.js";
import { FileStorageService } from "../storage/file-storage-service.js";
import { SqliteDossierRepository } from "../storage/sqlite-dossier-repository.js";
import { SqliteAuditLedger } from "../storage/sqlite-audit-ledger.js";
import { SqliteAuthService } from "../auth/sqlite-auth-service.js";
import { createOtpProviderFromEnv, type OtpProviderAdapter } from "../auth/otp-provider.js";
import { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { routeHttpRequest } from "./http-router.js";

export interface ServerOptions {
  readonly port?: number;
  readonly hostname?: string;
  readonly dbPath?: string;
  readonly dataDir?: string;
  readonly otpProvider?: OtpProviderAdapter;
}

export function createWorkspaceApp(options: ServerOptions = {}): {
  workspace: ContainerDossierWorkspace;
  sqliteClient: SqliteClient;
  authService: SqliteAuthService;
  handler: (req: Request) => Promise<Response>;
} {
  const dbPath = options.dbPath ?? process.env.DURIOS_DB_PATH ?? "./data/durios.db";
  const dataDir = options.dataDir ?? process.env.DURIOS_DATA_DIR ?? "./data/uploads";

  const sqliteClient = new SqliteClient({ dbPath });

  const fileStorage = new FileStorageService(dataDir);
  const dossierRepo = new SqliteDossierRepository(sqliteClient);
  const auditLedger = new SqliteAuditLedger(sqliteClient);
  const authService = new SqliteAuthService(
    sqliteClient,
    options.otpProvider ?? createOtpProviderFromEnv(process.env)
  );

  const workspace = new ContainerDossierWorkspace(
    dossierRepo,
    auditLedger,
    fileStorage,
    authService,
    sqliteClient
  );

  return {
    workspace,
    sqliteClient,
    authService,
    handler: (req: Request) => routeHttpRequest(workspace, req),
  };
}

export function assertLoopbackHostname(hostname: string): string {
  const clean = hostname.trim().toLowerCase();
  if (clean !== "127.0.0.1" && clean !== "localhost" && clean !== "::1") {
    throw new Error(
      `GATE-03 Security Violation: Refusing to bind DuriOS HTTP server to non-loopback host '${hostname}'. Use 127.0.0.1 behind a local HTTPS reverse proxy.`
    );
  }
  return clean;
}

export function startLocalServer(options: ServerOptions = {}) {
  const port = options.port ?? Number(process.env.DURIOS_PORT ?? process.env.PORT ?? 3000);
  const hostname = assertLoopbackHostname(options.hostname ?? process.env.DURIOS_HOST ?? "127.0.0.1");
  const { handler, sqliteClient, authService } = createWorkspaceApp(options);

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
    authService,
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
