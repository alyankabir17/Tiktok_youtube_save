import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, blogPostsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/blog", async (_req, res) => {
  const posts = await db
    .select({
      slug: blogPostsTable.slug,
      title: blogPostsTable.title,
      excerpt: blogPostsTable.excerpt,
      coverImage: blogPostsTable.coverImage,
      tags: blogPostsTable.tags,
      publishedAt: blogPostsTable.publishedAt,
    })
    .from(blogPostsTable)
    .orderBy(desc(blogPostsTable.publishedAt));
  return res.json(
    posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverImage: p.coverImage,
      tags: p.tags,
      publishedAt: p.publishedAt.toISOString(),
    })),
  );
});

router.get("/blog/:slug", async (req, res) => {
  const slug = req.params["slug"];
  if (!slug) return res.status(400).json({ error: "BAD_REQUEST", message: "Missing slug." });
  const found = await db.select().from(blogPostsTable).where(eq(blogPostsTable.slug, slug)).limit(1);
  const post = found[0];
  if (!post) return res.status(404).json({ error: "NOT_FOUND", message: "Post not found." });
  return res.json({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    tags: post.tags,
    contentMarkdown: post.contentMarkdown,
    publishedAt: post.publishedAt.toISOString(),
  });
});

export default router;
