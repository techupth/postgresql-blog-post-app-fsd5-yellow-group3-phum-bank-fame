// Creating PostgreSQL Client here
import * as pg from "pg";
const { Pool } = pg.default;

const pool = new Pool({
  connectionString:
    "postgresql://postgres:postgres@localhost:5432/posts-hackhour--wednesday",
});

export { pool };
