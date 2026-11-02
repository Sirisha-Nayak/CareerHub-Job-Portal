require('dotenv').config();
const express = require('express');
const db = require('./config/db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Clean page routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/view', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

app.get('/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add.html'));
});

app.get('/edit', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'edit.html'));
});

app.get('/delete', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'delete.html'));
});

// API: Get summary statistics for Dashboard cards
app.get('/api/stats', (req, res) => {
    const statsQuery = `
        SELECT 
            COUNT(*) AS totalJobs,
            COUNT(DISTINCT company_name) AS totalCompanies,
            COUNT(DISTINCT job_location) AS totalLocations,
            COALESCE(SUM(number_of_posts), 0) AS totalPosts,
            COALESCE(ROUND(AVG(salary), 0), 0) AS avgSalary
        FROM jobs
    `;

    db.query(statsQuery, (err, results) => {
        if (err) {
            console.error('Error fetching stats:', err);
            return res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
        }
        res.json(results[0]);
    });
});

// READ: Get all jobs
app.get('/api/jobs', (req, res) => {
    db.query(
        'SELECT * FROM jobs ORDER BY job_id DESC',
        (err, results) => {
            if (err) {
                console.error('Error fetching jobs:', err);
                return res.status(500).json({
                    message: 'Failed to fetch jobs'
                });
            }
            res.json(results);
        }
    );
});

// SEARCH AND FILTER JOBS
app.get('/api/search-jobs', (req, res) => {
    const { keyword, location, minSalary, maxSalary } = req.query;

    let sql = 'SELECT * FROM jobs WHERE 1=1';
    const values = [];

    if (keyword) {
        sql += ` AND (
            job_title LIKE ?
            OR company_name LIKE ?
            OR required_skills LIKE ?
        )`;
        const searchValue = `%${keyword}%`;
        values.push(searchValue, searchValue, searchValue);
    }

    if (location) {
        sql += ' AND job_location LIKE ?';
        values.push(`%${location}%`);
    }

    if (minSalary !== undefined && minSalary !== '') {
        sql += ' AND salary >= ?';
        values.push(Number(minSalary));
    }

    if (maxSalary !== undefined && maxSalary !== '') {
        sql += ' AND salary <= ?';
        values.push(Number(maxSalary));
    }

    sql += ' ORDER BY job_id DESC';

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error searching jobs:', err);
            return res.status(500).json({
                message: 'Failed to search jobs'
            });
        }
        res.json(results);
    });
});

// READ: Get one job by ID
app.get('/api/jobs/:id', (req, res) => {
    db.query(
        'SELECT * FROM jobs WHERE job_id = ?',
        [req.params.id],
        (err, results) => {
            if (err) {
                console.error('Error fetching job:', err);
                return res.status(500).json({
                    message: 'Failed to fetch job'
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: 'Job record not found'
                });
            }

            res.json(results[0]);
        }
    );
});

// CREATE: Add a new job
app.post('/api/jobs', (req, res) => {
    const {
        job_title,
        company_name,
        job_location,
        salary,
        required_skills,
        interview_date,
        number_of_posts
    } = req.body;

    if (!job_title || !company_name || !job_location) {
        return res.status(400).json({
            message: 'Job title, company name, and location are required'
        });
    }

    const sql = `INSERT INTO jobs
        (job_title, company_name, job_location, salary,
         required_skills, interview_date, number_of_posts)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        job_title.trim(),
        company_name.trim(),
        job_location.trim(),
        salary ? parseFloat(salary) : null,
        required_skills ? required_skills.trim() : null,
        interview_date ? interview_date : null,
        number_of_posts ? parseInt(number_of_posts, 10) : 1
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting job:', err);
            return res.status(500).json({
                message: 'Failed to add job'
            });
        }

        res.status(201).json({
            message: 'Job added successfully!',
            job_id: result.insertId
        });
    });
});

// UPDATE: Edit an existing job
app.put('/api/jobs/:id', (req, res) => {
    const {
        job_title,
        company_name,
        job_location,
        salary,
        required_skills,
        interview_date,
        number_of_posts
    } = req.body;

    if (!job_title || !company_name || !job_location) {
        return res.status(400).json({
            message: 'Job title, company name, and location are required'
        });
    }

    const sql = `UPDATE jobs SET
        job_title = ?,
        company_name = ?,
        job_location = ?,
        salary = ?,
        required_skills = ?,
        interview_date = ?,
        number_of_posts = ?
        WHERE job_id = ?`;

    const values = [
        job_title.trim(),
        company_name.trim(),
        job_location.trim(),
        salary ? parseFloat(salary) : null,
        required_skills ? required_skills.trim() : null,
        interview_date ? interview_date : null,
        number_of_posts ? parseInt(number_of_posts, 10) : 1,
        req.params.id
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating job:', err);
            return res.status(500).json({
                message: 'Failed to update job'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Job not found or no changes made'
            });
        }

        res.json({
            message: 'Job updated successfully!'
        });
    });
});

// DELETE: Remove a job
app.delete('/api/jobs/:id', (req, res) => {
    db.query(
        'DELETE FROM jobs WHERE job_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) {
                console.error('Error deleting job:', err);
                return res.status(500).json({
                    message: 'Failed to delete job'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: 'Job not found'
                });
            }

            res.json({
                message: 'Job deleted successfully!'
            });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`CareerHub server running at http://localhost:${PORT}`);
});
