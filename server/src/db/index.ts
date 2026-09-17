import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env.js";
import * as schema from "./schema.js";

const url = env.databaseUrl;

const client = postgres(url);
export const db = drizzle(client, { schema });
