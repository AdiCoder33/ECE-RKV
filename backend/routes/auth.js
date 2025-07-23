const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Mock users for demo
    const mockUsers = [
      { id: 1, email: 'admin@college.edu', name: 'Admin User', role: 'admin', department: 'ECE', password: 'password' },
      { id: 2, email: 'hod@college.edu', name: 'Dr. Smith', role: 'hod', department: 'ECE', password: 'password' },
      { id: 3, email: 'prof@college.edu', name: 'Prof. Johnson', role: 'professor', department: 'ECE', password: 'password' },
      { id: 4, email: 'student@college.edu', name: 'John Doe', role: 'student', department: 'ECE', year: 3, section: 'A', rollNumber: '20EC001', password: 'password' },
      { id: 5, email: 'alumni@college.edu', name: 'Jane Smith', role: 'alumni', department: 'ECE', graduationYear: 2020, password: 'password' }
    ];

    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;