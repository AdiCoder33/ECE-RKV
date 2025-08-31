const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get resume by student ID
router.get('/:studentId', authenticateToken, async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    const resumeQuery = `
      SELECT * FROM Resumes 
      WHERE student_id = ?
    `;
    
    const result = await executeQuery(resumeQuery, [studentId]);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    const resume = result.recordset[0];
    res.json({
      personalInfo: JSON.parse(resume.personal_info),
      education: JSON.parse(resume.education),
      experience: JSON.parse(resume.experience),
      projects: JSON.parse(resume.projects),
      skills: JSON.parse(resume.skills)
    });
    
  } catch (error) {
    console.error('Resume fetch error:', error);
    next(error);
  }
});

// Create or update resume
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { personalInfo, education, experience, projects, skills } = req.body;
    const studentId = req.user.id;
    
    // Check if resume exists
    const existingResumeQuery = `
      SELECT id FROM Resumes WHERE student_id = ?
    `;
    const existingResult = await executeQuery(existingResumeQuery, [studentId]);
    
    if (existingResult.recordset.length > 0) {
      // Update existing resume
      const updateQuery = `
        UPDATE Resumes 
        SET personal_info = ?, education = ?, experience = ?, projects = ?, skills = ?, updated_at = NOW()
        WHERE student_id = ?
      `;
      
      await executeQuery(updateQuery, [
        JSON.stringify(personalInfo),
        JSON.stringify(education),
        JSON.stringify(experience),
        JSON.stringify(projects),
        JSON.stringify(skills),
        studentId
      ]);
      
      res.json({ message: 'Resume updated successfully' });
    } else {
      // Create new resume
      const insertQuery = `
        INSERT INTO Resumes (student_id, personal_info, education, experience, projects, skills, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await executeQuery(insertQuery, [
        studentId,
        JSON.stringify(personalInfo),
        JSON.stringify(education),
        JSON.stringify(experience),
        JSON.stringify(projects),
        JSON.stringify(skills)
      ]);
      
      res.status(201).json({ message: 'Resume created successfully' });
    }
    
  } catch (error) {
    console.error('Resume save error:', error);
    next(error);
  }
});

// Delete resume
router.delete('/:studentId', authenticateToken, async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    const deleteQuery = `
      DELETE FROM Resumes WHERE student_id = ?
    `;
    
    await executeQuery(deleteQuery, [studentId]);
    res.json({ message: 'Resume deleted successfully' });
    
  } catch (error) {
    console.error('Resume delete error:', error);
    next(error);
  }
});

module.exports = router;
