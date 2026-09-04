const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../services/auth');

// ============================================
// GET /api/blog/posts - Get published posts
// ============================================
router.get('/posts', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const posts = Post.getPublished(limit, offset);
    const total = Post.countPublished();

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
});

// ============================================
// GET /api/blog/posts/:slug - Get single post
// ============================================
router.get('/posts/:slug', (req, res) => {
  try {
    const post = Post.getBySlug(req.params.slug);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Only increment views if post is published
    if (post.status === 'published') {
      Post.incrementViews(post.id);
      post.views = (post.views || 0) + 1;
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    });
  }
});

// ============================================
// GET /api/blog/posts/category/:slug - Posts by category
// ============================================
router.get('/posts/category/:slug', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const posts = Post.getByCategory(req.params.slug, limit, offset);

    res.json({
      success: true,
      data: posts,
      pagination: { page, limit }
    });
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
});

// ============================================
// GET /api/blog/search - Search posts
// ============================================
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const results = Post.search(q);
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// ============================================
// POST /api/blog/posts - Create new post (Admin/Editor)
// ============================================
router.post('/posts', authenticate, requireAdmin, (req, res) => {
  try {
    const { title, slug, content, excerpt, category_id, status, featured_image } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title, slug, and content are required'
      });
    }

    const post = Post.create({
      title,
      slug,
      content,
      excerpt: excerpt || null,
      category_id: category_id || null,
      author_id: req.user.id,
      status: status || 'draft',
      featured_image: featured_image || null
    });

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({
        success: false,
        error: 'A post with this slug already exists'
      });
    }
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
});

// ============================================
// PUT /api/blog/posts/:id - Update post (Admin/Editor)
// ============================================
router.put('/posts/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const post = Post.getById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const updated = Post.update(id, req.body);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({
        success: false,
        error: 'A post with this slug already exists'
      });
    }
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post'
    });
  }
});

// ============================================
// DELETE /api/blog/posts/:id - Delete post (Admin)
// ============================================
router.delete('/posts/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const post = Post.getById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    Post.delete(id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
});

// ============================================
// GET /api/blog/categories - Get categories (already defined)
// GET /api/blog/categories/:slug - Get category (already defined)
// ============================================

module.exports = router;
