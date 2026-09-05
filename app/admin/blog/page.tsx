import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllBlogPosts, deleteBlogPost } from "@/lib/actions/blogPosts";
import type { BlogPost } from "@/lib/supabase/types";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusStyles: Record<BlogPost["status"], string> = {
  draft: "bg-gray-100 text-gray-500",
  published: "bg-emerald-100 text-emerald-700",
};

export default async function BlogAdminPage() {
  await requireAdminPage();
  const posts = await getAllBlogPosts();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Admin
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Blog Posts</h1>
            <p className="mt-1 text-sm text-gray-500">
              {posts.length} post{posts.length === 1 ? "" : "s"} across all locales.
            </p>
          </div>
          <Link
            href="/admin/blog/new"
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            <Plus size={15} />
            New post
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {posts.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No blog posts yet.
            </div>
          )}

          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[post.status]}`}>
                    {post.status}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {post.locale}
                  </span>
                </div>
                <p className="mt-1.5 truncate font-display text-sm font-semibold text-gray-900">{post.title}</p>
                <p className="truncate text-xs text-gray-400">/{post.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await deleteBlogPost(post.id, post.locale, post.slug);
                  }}
                >
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
