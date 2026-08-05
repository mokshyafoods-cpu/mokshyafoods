import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Calendar, User } from 'lucide-react';
import { blogAPI } from '@/services/api';
import { buildPageMetadata } from '@/lib/seo';

const categories = [
  { name: 'All', value: '' },
  { name: 'Health', value: 'health' },
  { name: 'Recipes', value: 'recipes' },
  { name: 'Nutrition', value: 'nutrition' },
  { name: 'Lifestyle', value: 'lifestyle' },
];

const getBlogPosts = async (category: string) => {
  const params: any = {};
  if (category) params.category = category;

  const response = await blogAPI.getAll(params);
  const posts = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return posts;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: { category?: string } }): Promise<Metadata> {
  const category = (searchParams.category || '').trim();
  const title = category ? `Blog - ${category} | Mokshya Foods` : 'Mokshya Foods Blog';
  const description = category
    ? `Explore Mokshya Foods blog posts about ${category}, recipes, nutrition, and healthy living.`
    : 'Read health tips, recipes, and nutrition insights curated for a naturally healthy lifestyle.';

  return buildPageMetadata(title, description, '/blog');
}

export default async function BlogPage({ searchParams }: { searchParams?: { category?: string } }) {
  const selectedCategory = searchParams?.category?.trim().toLowerCase() || '';
  const posts = await getBlogPosts(selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-grow py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Mokshya Blog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Health tips, recipes, and nutrition insights from our team
            </p>
          </div>

          <div className="mb-12 flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.value.toLowerCase().trim();
              const href = cat.value ? `/blog?category=${encodeURIComponent(cat.value)}` : '/blog';
              return (
                <Link
                  key={cat.value}
                  href={href}
                  className={`inline-flex items-center px-6 py-2 rounded-full transition ${
                    isActive ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-secondary'
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No posts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: any) => (
                <Link key={post._id || post.slug} href={`/blog/${post.slug}`}>
                  <div className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-lg transition group cursor-pointer">
                    <div className="bg-gradient-to-br from-secondary to-accent h-48 flex items-center justify-center text-white font-semibold group-hover:opacity-90 transition">
                      {post.featuredImage ? (
                        <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        'Featured Image'
                      )}
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {post.category && (
                          <span className="px-3 py-1 bg-muted rounded-full capitalize">{post.category}</span>
                        )}
                        <span>{post.views || 0} views</span>
                      </div>

                      <h2 className="text-xl font-bold text-primary line-clamp-2 group-hover:text-accent transition">
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>{post.author?.name || 'Mokshya Foods'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

