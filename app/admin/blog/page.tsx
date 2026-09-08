import { Plus, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllBlogPosts, deleteBlogPost } from "@/lib/actions/blogPosts";
import type { BlogPost } from "@/lib/supabase/types";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, LinkButton, Button, type BadgeTone } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusTones: Record<BlogPost["status"], BadgeTone> = {
  draft: "neutral",
  published: "success",
};

export default async function BlogAdminPage() {
  await requireAdminPage();
  const posts = await getAllBlogPosts();

  return (
    <AdminShell current="/admin/blog">
      <PageHeader
        title="Blog Posts"
        subtitle={`${posts.length} post${posts.length === 1 ? "" : "s"} across all locales.`}
        action={
          <LinkButton href="/admin/blog/new">
            <Plus size={15} />
            New post
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-3">
        {posts.length === 0 && <EmptyState>No blog posts yet.</EmptyState>}

        {posts.map((post) => (
          <Card key={post.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge tone={statusTones[post.status]}>{post.status}</Badge>
                <Badge>{post.locale}</Badge>
              </div>
              <p className="mt-1.5 truncate font-display text-sm font-semibold text-gray-900">{post.title}</p>
              <p className="truncate text-xs text-gray-400">/{post.slug}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LinkButton href={`/admin/blog/${post.id}`} variant="secondary" size="sm">
                Edit
              </LinkButton>
              <form
                action={async () => {
                  "use server";
                  await deleteBlogPost(post.id, post.locale, post.slug);
                }}
              >
                <Button type="submit" variant="danger" size="sm">
                  <Trash2 size={12} />
                  Delete
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
