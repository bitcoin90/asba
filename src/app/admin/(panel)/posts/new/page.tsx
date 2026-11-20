"use client";

import { useEffect, useState } from "react";
import PostEditor from "@/components/admin/PostEditor";
import { fetchJson, Spinner } from "@/components/admin/adminui";

export default function NewPostPage() {
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);

  useEffect(() => {
    fetchJson<{ categories: any[] }>("/api/admin/categories")
      .then((j) => setCategories(j.categories))
      .catch(() => {});
  }, []);

  return categories.length === 0 ? <Spinner /> : <PostEditor initial={null} categories={categories} />;
}
