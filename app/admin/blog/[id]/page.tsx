import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminAuth";
import { getBlogPostById } from "@/lib/actions/blogPosts";
import BlogPostForm from "@/components/admin/BlogPostForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const post = await getBlogPostById(id);

  if (!post) notFound();

  return (
    <AdminShell current="/admin/blog">
      <BackLink href="/admin/blog">Blog Posts</BackLink>
      <PageHeader title="Edit blog post" />

      <Card className="max-w-3xl">
        <BlogPostForm postId={post.id} initial={post} />
      </Card>
    </AdminShell>
  );
}
