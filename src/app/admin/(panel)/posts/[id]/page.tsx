"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PostEditor, { type EditorPost } from "@/components/admin/PostEditor";
import { fetchJson, EmptyState, Spinner } from "@/components/admin/adminui";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<EditorPost | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchJson<{ post: any }>(`/api/admin/posts/${id}`),
      fetchJson<{ categories: any[] }>("/api/admin/categories"),
    ])
      .then(([p, c]) => {
        const raw = p.post;
        setPost({
          ...raw,
          tags: typeof raw.tags === "string" ? safeParse(raw.tags) : raw.tags || [],
          featured: !!raw.featured,
        });
        setCategories(c.categories);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <EmptyState title="تعذر تحميل المقال" desc={error} />;
  if (!post || categories.length === 0) return <Spinner />;

  return <PostEditor initial={post} categories={categories} />;
}

function safeParse(s: string): string[] {
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
