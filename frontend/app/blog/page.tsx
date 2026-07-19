'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';
import useSWR from 'swr';
import { blogAPI } from '@/services/api';

const categories = [
  { name: 'All', value: '' },
  { name: 'Health', value: 'health' },
  { name: 'Recipes', value: 'recipes' },
  { name: 'Nutrition', value: 'nutrition' },
  { name: 'Lifestyle', value: 'lifestyle' },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = require('react').useState('');
  const { data, isLoading } = useSWR(['/api/blog', selectedCategory], () =>
    blogAPI.getAll({ category: selectedCategory })
  );

  const posts = data?.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-grow py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Mokshya Blog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Health tips, recipes, and nutrition insights from our team
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-12 flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-6 py-2 rounded-full transition ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-white'
                    : 'bg-muted text-foreground hover:bg-secondary'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Blog Posts */}
          {isLoading ? (
            <div className="text-center py-12">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No posts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: any) => (
                <Link key={post._id} href={`/blog/${post.slug}`}>
                  <div className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-lg transition group cursor-pointer">
                    <div className="bg-gradient-to-br from-secondary to-accent h-48 flex items-center justify-center text-white font-semibold group-hover:opacity-90 transition">
                      {post.featuredImage ? (
                        <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        'Featured Image'
                      )}
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-3 py-1 bg-muted rounded-full capitalize">{post.category}</span>
                        <span>{post.views || 0} views</span>
                      </div>

                      <h2 className="text-xl font-bold text-primary line-clamp-2 group-hover:text-accent transition">
                        {post.title}
                      </h2>

                      <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>{post.author?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
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

