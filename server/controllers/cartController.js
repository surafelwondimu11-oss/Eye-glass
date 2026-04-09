const { getConnection } = require('../config/mysql');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const connection = getConnection();
    const query = `
      SELECT c.*, e.name, e.selling_price, e.image_url, e.brand
      FROM cart c
      JOIN eyeglasses e ON c.eyeglass_id = e.id
      WHERE c.user_id = ?
    `;
    
    connection.query(query, [req.user.id], (err, results) => {
      if (err) {
        console.error('Error fetching cart:', err);
        return res.status(500).json({ message: 'Error fetching cart' });
      }
      res.json(results);
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const connection = getConnection();
    const { eyeglass_id, quantity } = req.body;
    const user_id = req.user.id;

    // Check if item already in cart
    const checkQuery = 'SELECT * FROM cart WHERE user_id = ? AND eyeglass_id = ?';
    connection.query(checkQuery, [user_id, eyeglass_id], (err, results) => {
      if (err) {
        console.error('Error checking cart:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length > 0) {
        // Update quantity
        const updateQuery = 'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND eyeglass_id = ?';
        connection.query(updateQuery, [quantity || 1, user_id, eyeglass_id], (err) => {
          if (err) {
            console.error('Error updating cart:', err);
            return res.status(500).json({ message: 'Error updating cart' });
          }
          res.json({ message: 'Cart updated successfully' });
        });
      } else {
        // Insert new item
        const insertQuery = 'INSERT INTO cart (user_id, eyeglass_id, quantity) VALUES (?, ?, ?)';
        connection.query(insertQuery, [user_id, eyeglass_id, quantity || 1], (err) => {
          if (err) {
            console.error('Error adding to cart:', err);
            return res.status(500).json({ message: 'Error adding to cart' });
          }
          res.status(201).json({ message: 'Added to cart successfully' });
        });
      }
    });
  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const connection = getConnection();
    const { quantity } = req.body;
    const cart_id = req.params.id;
    const user_id = req.user.id;

    const query = 'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?';
    connection.query(query, [quantity, cart_id, user_id], (err, result) => {
      if (err) {
        console.error('Error updating cart item:', err);
        return res.status(500).json({ message: 'Error updating cart item' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Cart item not found' });
      }

      res.json({ message: 'Cart item updated successfully' });
    });
  } catch (error) {
    console.error('Error in updateCartItem:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const connection = getConnection();
    const cart_id = req.params.id;
    const user_id = req.user.id;

    const query = 'DELETE FROM cart WHERE id = ? AND user_id = ?';
    connection.query(query, [cart_id, user_id], (err, result) => {
      if (err) {
        console.error('Error removing from cart:', err);
        return res.status(500).json({ message: 'Error removing from cart' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Cart item not found' });
      }

      res.json({ message: 'Item removed from cart successfully' });
    });
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clear user's cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const connection = getConnection();
    const query = 'DELETE FROM cart WHERE user_id = ?';
    connection.query(query, [req.user.id], (err) => {
      if (err) {
        console.error('Error clearing cart:', err);
        return res.status(500).json({ message: 'Error clearing cart' });
      }
      res.json({ message: 'Cart cleared successfully' });
    });
  } catch (error) {
    console.error('Error in clearCart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
