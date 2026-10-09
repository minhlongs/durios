import { Database } from "bun:sqlite";
import { runMigrations } from "./schema-migrations.js";

export interface SqliteClientOptions {
  readonly dbPath: string;
  readonly inMemory?: boolean;
}

export class SqliteClient {
  public readonly db: Database;

  constructor(options: SqliteClientOptions = { dbPath: "./data/durios.db" }) {
    if (options.inMemory) {
      this.db = new Database(":memory:");
    } else {
      this.db = new Database(options.dbPath, { create: true });
    }
    this.initPragmas();
    runMigrations(this.db);
  }

  private initPragmas(): void {
    this.db.run("PRAGMA journal_mode = WAL;");
    this.db.run("PRAGMA foreign_keys = ON;");
    this.db.run("PRAGMA busy_timeout = 5000;");
  }

  public close(): void {
    this.db.close();
  }

  public transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }
}
