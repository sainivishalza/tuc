import { requireAdminPage } from "@/lib/adminAuth";
import BlogPostForm from "@/components/admin/BlogPostForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function NewBlogPostPage() {
  await requireAdminPage();

  return (
    <AdminShell current="/admin/blog">
      <BackLink href="/admin/blog">Blog Posts</BackLink>
      <PageHeader title="New blog post" />

      <Card className="max-w-3xl">
        <BlogPostForm />
      </Card>
    </AdminShell>
  );
}
