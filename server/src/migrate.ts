import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { sql } from "./db";

const MIGRATIONS_DIR = join(import.meta.dir, "..", "migrations");

export async function migrate() {
  await sql`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set(
    (await sql<{ name: string }[]>`select name from _migrations`).map((r) => r.name),
  );

  for (const file of files) {
    if (applied.has(file)) continue;
    const body = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    console.log(`[migrate] applying ${file}`);
    await sql.unsafe(body);
    await sql`insert into _migrations (name) values (${file})`;
  }
  console.log(`[migrate] up to date (${files.length} migrations)`);
}

if (import.meta.main) {
  migrate()
    .then(() => sql.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
