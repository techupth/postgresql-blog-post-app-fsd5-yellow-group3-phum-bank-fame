import { Router } from "express";
import { pool } from "../utils/db.js";

const postRouter = Router();
const PAGE_SIZE = 10; // Adjust the value based on your pagination requirements

postRouter.get("/", async (req, res) => {
  const status = req.query.status;
  const keywords = req.query.keywords;
  const offset = req.query.offset || 0; // Assuming offset is provided in the query parameters

  let query = "";
  let values = [];

  if (status && keywords) {
    query = `SELECT * FROM posts
    WHERE status = $1
    AND title ILIKE $2
    LIMIT $3
    OFFSET $4`;
    values = [status, keywords, PAGE_SIZE, offset];
  } else if (keywords) {
    query = `SELECT * FROM posts
    WHERE title ILIKE $1
    LIMIT $2
    OFFSET $3`;
    values = [keywords, PAGE_SIZE, offset];
  } else if (status) {
    query = `SELECT * FROM posts
    WHERE status = $1
    LIMIT $2
    OFFSET $3`;
    values = [status, PAGE_SIZE, offset];
  } else {
    query = `SELECT * FROM posts
    LIMIT $1
    OFFSET $2`;
    values = [PAGE_SIZE, offset];
  }

  try {
    const results = await pool.query(query, values);

    return res.json({
      data: results.rows,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

postRouter.get("/:id", async (req, res) => {
  const postId = req.params.id;

  const result = await pool.query("SELECT * FROM posts WHERE post_id = $1", [
    Number(postId),
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
      newPost.user_id, //
      //นี่คือ user_id ที่ถูกจำลองขึ้นมา เนื่องจากเรายังไม่มีระบบ Authentication ในส่วน Back End

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
  try {
    const postId = req.params.id;
    const hasPublished = req.body.status === "published";

    const updatedPost = {
      updated_at: new Date(),
      published_at: hasPublished ? new Date() : null,
      ...req.body,
    };

    const existingPost = await pool.query(
      "SELECT * FROM posts WHERE post_id = $1",
      [postId]
    );

    if (existingPost.rows.length === 0) {
      return res.status(404).json({
        error: `Post with ID ${postId} not found.`,
      });
    }

    const updatedFields = Object.keys(updatedPost).filter(
      (key) => key !== "updated_at" && key !== "published_at"
    );

    const updateValues = updatedFields.map((field) => updatedPost[field]);

    await pool.query(
      `UPDATE posts
       SET ${updatedFields
         .map((field, index) => `${field} = $${index + 1}`)
         .join(", ")}
       WHERE post_id = $${updatedFields.length + 1}`,
      [...updateValues, postId]
    );

    return res.json({
      message: `Post ${postId} has been updated.`,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

postRouter.delete("/:id", async (req, res) => {
  try {
    const postId = req.params.id;

    const existingPost = await pool.query(
      "SELECT * FROM posts WHERE post_id = $1",
      [postId]
    );

    if (existingPost.rows.length === 0) {
      return res.status(404).json({
        error: `Post with ID ${postId} not found.`,
      });
    }

    await pool.query("DELETE FROM posts WHERE post_id = $1", [postId]);

    return res.json({
      message: `Post ${postId} has been deleted.`,
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

export default postRouter;
