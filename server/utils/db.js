import * as pg from "pg";
const { Pool } = pg.default;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "posts",
  password: "013334923",
  port: 5432,
});

export { pool };
