import { Router } from "express";
import { pool } from "../utils/db.js";
const postRouter = Router();

// postRouter.get("/", async (req, res) => {
//   const status = req.query.status;
//   const keywords = req.query.keywords;
//   const page = req.query.page;

//   return res.json({
//     data: [],
//   });
// });
postRouter.get("/", async (req, res) => {
  const status = req.query.status || "";
  const keywords = req.query.keywords || "";
  const page = req.query.page || 1;

  const PAGE_SIZE = 5;
  const offset = (page - 1) * PAGE_SIZE;

  let query = "";
  let values = [];

  if (status && keywords) {
    query = `select * from posts
    where status=$1
    and title ilike $2
    limit $3
    offset $4`;
    values = [status, keywords, PAGE_SIZE, offset];
  } else if (keywords) {
    query = `select * from posts
    where title ilike $1
    limit $2
    offset $3`;
    values = [keywords, PAGE_SIZE, offset];
  } else if (status) {
    query = `select * from posts
    where status=$1
    limit $2
    offset $3`;
    values = [status, PAGE_SIZE, offset];
  } else {
    query = `select * from posts
    limit $1
    offset $2`;
    values = [PAGE_SIZE, offset];
  }

  const results = await pool.query(query, values);

  return res.json({
    data: results.rows,
  });
});

postRouter.get("/:id", async (req, res) => {
  const postId = req.params.id;

  const result = await pool.query("select * from posts where posts_id=$1", [
    postId,
  ]);

  return res.json({
    data: result.rows[0],
  });
});

postRouter.post("/", async (req, res) => {
  const hasPublished = req.body.status === "published";
  const newPost = {
    ...req.body,
    created_at: new Date(),
    updated_at: new Date(),
    published_at: hasPublished ? new Date() : null,
  };
  await pool.query(
    `insert into posts (user_id, title, content, status, likes, category, created_at, updated_at, published_at)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      newPost.user_id,
      newPost.title,
      newPost.content,
      newPost.status,
      newPost.likes,
      newPost.category,
      newPost.created_at,
      newPost.updated_at,
      newPost.published_at,
    ]
  );
  return res.json({
    message: "Post has been created.",
  });
});

postRouter.put("/:id", async (req, res) => {
  const hasPublished = req.body.status === "published";

  const updatedPost = {
    ...req.body,
    updated_at: new Date(),
    published_at: hasPublished ? new Date() : null,
  };
  const postId = req.params.id;
  await pool.query(
    `UPDATE posts 
  SET title=$1,content=$2,status=$3,updated_at=$4,published_at=$5 
  WHERE post_id=$6`,
    [
      updatedPost.title,
      updatedPost.content,
      updatedPost.status,
      updatedPost.updated_at,
      updatedPost.published_at,
      postId,
    ]
  );
  return res.json({
    message: `Post ${postId} has been updated.`,
  });
});

postRouter.delete("/:id", async (req, res) => {
  const postId = req.params.id;
  await pool.query(`delete from posts where post_id=$1`, [postId]);
  return res.json({
    message: `Post ${postId} has been deleted.`,
  });
});

export default postRouter;
