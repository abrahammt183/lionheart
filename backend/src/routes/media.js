const express = require('express');
const router = express.Router();
const Media = require('../models/Media');
const Post = require('../models/Post');
const { authenticate, requireAdmin } = require('../services/auth');

// ============================================
// GET /api/media/post/:postId
// Get all media for a post
// ============================================
router.get('/post/:postId', (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    
    // Check if post exists
    const post = Post.getById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const media = Media.getByPost(postId);

    res.json({
      success: true,
      data: media,
      count: media.length
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch media'
    });
  }
});

// ============================================
// GET /api/media/post/:postId/cover
// Get cover image for a post
// ============================================
router.get('/post/:postId/cover', (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    
    const post = Post.getById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const cover = Media.getCover(postId);

    res.json({
      success: true,
      data: cover || null
    });
  } catch (error) {
    console.error('Error fetching cover:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cover image'
    });
  }
});

// ============================================
// POST /api/media
// Add media to a post (admin/editor)
// ============================================
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    const { post_id, type, url, caption, is_cover, sort_order } = req.body;

    if (!post_id || !url) {
      return res.status(400).json({
        success: false,
        error: 'Post ID and URL are required'
      });
    }

    // Check if post exists
    const post = Post.getById(post_id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Validate type
    const validTypes = ['image', 'video', 'audio', 'file'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid media type. Must be: image, video, audio, file'
      });
    }

    const media = Media.create({
      post_id,
      type: type || 'image',
      url,
      caption: caption || null,
      is_cover: is_cover || false,
      sort_order: sort_order || 0
    });

    res.status(201).json({
      success: true,
      data: media
    });
  } catch (error) {
    console.error('Error creating media:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create media'
    });
  }
});

// ============================================
// PUT /api/media/:id
// Update media (admin/editor)
// ============================================
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const media = Media.getById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Media not found'
      });
    }

    const updated = Media.update(id, req.body);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating media:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update media'
    });
  }
});

// ============================================
// DELETE /api/media/:id
// Delete media (admin)
// ============================================
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const media = Media.getById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Media not found'
      });
    }

    Media.delete(id);

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete media'
    });
  }
});

// ============================================
// DELETE /api/media/post/:postId
// Delete all media for a post (admin)
// ============================================
router.delete('/post/:postId', authenticate, requireAdmin, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    
    const post = Post.getById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    Media.deleteByPost(postId);

    res.json({
      success: true,
      message: 'All media for post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post media:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post media'
    });
  }
});

module.exports = router;
