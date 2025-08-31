const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all alumni profiles
router.get('/', async (req, res, next) => {
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
    
    const [rows] = await executeQuery(query);

    const alumni = rows.map(row => ({
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
    console.error('Alumni list error:', error);
    next(error);
  }
});

// Get alumni profile by ID
router.get('/:id', async (req, res, next) => {
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
    
    const [rows] = await executeQuery(query, [id]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Alumni not found' });
    }

    const row = rows[0];
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
    console.error('Alumni profile fetch error:', error);
    next(error);
  }
});

// Update alumni profile
router.put('/profile', authenticateToken, async (req, res, next) => {
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
    const [existingRows] = await executeQuery(existingProfileQuery, [userId]);

    if (existingRows.length > 0) {
      // Update existing profile
      const updateQuery = `
        UPDATE AlumniProfiles 
        SET company = ?, position = ?, graduation_year = ?, field_of_study = ?,
            location = ?, bio = ?, linkedin = ?, github = ?, website = ?,
            achievements = ?, skills = ?, work_experience = ?, education = ?,
            updated_at = NOW()
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
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
    console.error('Alumni profile update error:', error);
    next(error);
  }
});

// Delete alumni profile
router.delete('/profile', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const deleteQuery = `
      DELETE FROM AlumniProfiles WHERE user_id = ?
    `;
    
    await executeQuery(deleteQuery, [userId]);
    res.json({ message: 'Profile deleted successfully' });
    
  } catch (error) {
    console.error('Alumni profile delete error:', error);
    next(error);
  }
});

module.exports = router;
