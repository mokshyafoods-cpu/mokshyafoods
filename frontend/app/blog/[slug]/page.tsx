import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { blogAPI } from '@/services/api';
import { buildPageMetadata } from '@/lib/seo';

async function getBlogPost(slug: string) {
  const response = await blogAPI.getBySlug(slug);
  return response?.data?.data ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug;
  try {
    const post = await getBlogPost(slug);
    if (!post) {
      return buildPageMetadata('Blog post | Mokshya Foods', 'Read the latest Mokshya Foods blog post.', `/blog/${slug}`);
    }

    return buildPageMetadata(
      post.seoTitle || post.title || 'Blog post | Mokshya Foods',
      post.seoDescription || post.excerpt || 'Read the latest Mokshya Foods blog post.',
      `/blog/${slug}`
    );
  } catch {
    return buildPageMetadata('Blog post | Mokshya Foods', 'Read the latest Mokshya Foods blog post.', `/blog/${slug}`);
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-grow py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-slate-900">Post not found</h1>
            <p className="mt-4 text-slate-600">The requested blog post could not be found.</p>
            <Link href="/blog" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">
              Back to blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-grow py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-4">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-secondary">
              <ArrowLeft className="h-4 w-4" /> Back to blog
            </Link>
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-primary">{post.category || 'Blog'}</p>
              <h1 className="text-4xl font-bold text-slate-950">{post.title}</h1>
              <p className="text-sm text-muted-foreground">Published on {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {post.featuredImage ? (
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <img src={post.featuredImage} alt={post.title} className="w-full object-cover" />
            </div>
          ) : null}

          <article className="prose prose-slate max-w-none rounded-[2rem] border border-border bg-white p-10 shadow-sm">
            {post.excerpt ? <p className="text-lg text-slate-700">{post.excerpt}</p> : null}
            <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
