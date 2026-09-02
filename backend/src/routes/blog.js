const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============================================
// GET /api/blog/categories
// Get all categories with their subcategories
// ============================================
router.get('/categories', (req, res) => {
  try {
    // Get all main categories (parent_id is NULL)
    const mainCategories = db.prepare(`
      SELECT id, name, slug, description, icon, created_at
      FROM categories 
      WHERE parent_id IS NULL
      ORDER BY name
    `).all();

    // Get all subcategories
    const subCategories = db.prepare(`
      SELECT id, name, slug, description, parent_id, icon, created_at
      FROM categories 
      WHERE parent_id IS NOT NULL
      ORDER BY name
    `).all();

    // Group subcategories by parent_id
    const categoriesWithChildren = mainCategories.map(main => {
      const children = subCategories.filter(sub => sub.parent_id === main.id);
      return {
        ...main,
        children: children
      };
    });

    res.json({
      success: true,
      data: categoriesWithChildren,
      count: categoriesWithChildren.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// ============================================
// GET /api/blog/categories/:slug
// Get a single category by slug
// ============================================
router.get('/categories/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = db.prepare(`
      SELECT id, name, slug, description, parent_id, icon, created_at
      FROM categories 
      WHERE slug = ?
    `).get(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Get children if it's a parent category
    if (!category.parent_id) {
      const children = db.prepare(`
        SELECT id, name, slug, description, icon
        FROM categories 
        WHERE parent_id = ?
        ORDER BY name
      `).all(category.id);
      
      category.children = children;
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
});

module.exports = router;
