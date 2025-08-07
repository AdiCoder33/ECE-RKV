const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all alumni profiles
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.name, u.email, u.phone, u.created_at,
             ap.company, ap.position, ap.graduation_year, ap.field_of_study,
             ap.location, ap.bio, ap.linkedin, ap.github, ap.website,
             ap.achievements, ap.skills, ap.work_experience, ap.education
      FROM Users u
      LEFT JOIN AlumniProfiles ap ON u.id = ap.user_id
      WHERE u.role = 'alumni'
      ORDER BY u.name
    `;
    
    const result = await executeQuery(query);
    
    const alumni = result.recordset.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      position: row.position,
      graduationYear: row.graduation_year,
      fieldOfStudy: row.field_of_study,
      location: row.location,
      bio: row.bio,
      linkedin: row.linkedin,
      github: row.github,
      website: row.website,
      achievements: row.achievements ? JSON.parse(row.achievements) : [],
      skills: row.skills ? JSON.parse(row.skills) : [],
      workExperience: row.work_experience ? JSON.parse(row.work_experience) : [],
      education: row.education ? JSON.parse(row.education) : []
    }));
    
    res.json(alumni);
    
  } catch (error) {
    console.error('Error fetching alumni:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get alumni profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT u.id, u.name, u.email, u.phone, u.created_at,
             ap.company, ap.position, ap.graduation_year, ap.field_of_study,
             ap.location, ap.bio, ap.linkedin, ap.github, ap.website,
             ap.achievements, ap.skills, ap.work_experience, ap.education
      FROM Users u
      LEFT JOIN AlumniProfiles ap ON u.id = ap.user_id
      WHERE u.id = ? AND u.role = 'alumni'
    `;
    
    const result = await executeQuery(query, [id]);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Alumni not found' });
    }
    
    const row = result.recordset[0];
    const alumni = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      position: row.position,
      graduationYear: row.graduation_year,
      fieldOfStudy: row.field_of_study,
      location: row.location,
      bio: row.bio,
      linkedin: row.linkedin,
      github: row.github,
      website: row.website,
      achievements: row.achievements ? JSON.parse(row.achievements) : [],
      skills: row.skills ? JSON.parse(row.skills) : [],
      workExperience: row.work_experience ? JSON.parse(row.work_experience) : [],
      education: row.education ? JSON.parse(row.education) : []
    };
    
    res.json(alumni);
    
  } catch (error) {
    console.error('Error fetching alumni profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update alumni profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      company, position, graduationYear, fieldOfStudy, location,
      bio, linkedin, github, website, achievements, skills,
      workExperience, education
    } = req.body;
    
    // Check if profile exists
    const existingProfileQuery = `
      SELECT id FROM AlumniProfiles WHERE user_id = ?
    `;
    const existingResult = await executeQuery(existingProfileQuery, [userId]);
    
    if (existingResult.recordset.length > 0) {
      // Update existing profile
      const updateQuery = `
        UPDATE AlumniProfiles 
        SET company = ?, position = ?, graduation_year = ?, field_of_study = ?,
            location = ?, bio = ?, linkedin = ?, github = ?, website = ?,
            achievements = ?, skills = ?, work_experience = ?, education = ?,
            updated_at = GETDATE()
        WHERE user_id = ?
      `;
      
      await executeQuery(updateQuery, [
        company, position, graduationYear, fieldOfStudy, location,
        bio, linkedin, github, website,
        JSON.stringify(achievements), JSON.stringify(skills),
        JSON.stringify(workExperience), JSON.stringify(education),
        userId
      ]);
      
      res.json({ message: 'Profile updated successfully' });
    } else {
      // Create new profile
      const insertQuery = `
        INSERT INTO AlumniProfiles 
        (user_id, company, position, graduation_year, field_of_study, location,
         bio, linkedin, github, website, achievements, skills, work_experience,
         education, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
      `;
      
      await executeQuery(insertQuery, [
        userId, company, position, graduationYear, fieldOfStudy, location,
        bio, linkedin, github, website,
        JSON.stringify(achievements), JSON.stringify(skills),
        JSON.stringify(workExperience), JSON.stringify(education)
      ]);
      
      res.status(201).json({ message: 'Profile created successfully' });
    }
    
  } catch (error) {
    console.error('Error updating alumni profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete alumni profile
router.delete('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const deleteQuery = `
      DELETE FROM AlumniProfiles WHERE user_id = ?
    `;
    
    await executeQuery(deleteQuery, [userId]);
    res.json({ message: 'Profile deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting alumni profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
