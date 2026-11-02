// View Records JavaScript - Search, Filter, and Table Rendering

let allJobsCache = [];

document.addEventListener('DOMContentLoaded', () => {
    loadAllJobs();

    // Attach search and reset handlers
    const searchForm = document.getElementById('search-filter-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            filterJobs();
        });
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchForm.reset();
            loadAllJobs();
        });
    }
});

// Load all jobs from backend API
async function loadAllJobs() {
    const tableBody = document.getElementById('jobs-table-body');
    const stateContainer = document.getElementById('view-state');
    const counterBadge = document.getElementById('record-count-badge');

    try {
        stateContainer.innerHTML = '<div class="spinner"></div><p>Loading database records...</p>';
        stateContainer.style.display = 'block';
        tableBody.innerHTML = '';

        const response = await fetch('/api/jobs');
        if (!response.ok) throw new Error('Failed to retrieve jobs');

        allJobsCache = await response.json();
        renderTable(allJobsCache);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        stateContainer.innerHTML = `
            <div class="icon">⚠️</div>
            <p><strong>Failed to load records from MySQL.</strong></p>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Make sure your server is running on port 3001 and MySQL is connected.</p>
        `;
        counterBadge.textContent = '0 records';
    }
}

// Filter jobs by keyword, location, or salary using /api/search-jobs
async function filterJobs() {
    const keyword = document.getElementById('filter-keyword').value.trim();
    const location = document.getElementById('filter-location').value.trim();
    const minSalary = document.getElementById('filter-min-salary').value;
    const maxSalary = document.getElementById('filter-max-salary').value;

    const stateContainer = document.getElementById('view-state');
    const tableBody = document.getElementById('jobs-table-body');

    if (minSalary !== '' && maxSalary !== '' && Number(minSalary) > Number(maxSalary)) {
        showToast('Minimum salary cannot exceed maximum salary', 'error');
        return;
    }

    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (location) params.append('location', location);
    if (minSalary !== '') params.append('minSalary', minSalary);
    if (maxSalary !== '') params.append('maxSalary', maxSalary);

    try {
        stateContainer.innerHTML = '<div class="spinner"></div><p>Searching records...</p>';
        stateContainer.style.display = 'block';
        tableBody.innerHTML = '';

        const response = await fetch('/api/search-jobs?' + params.toString());
        if (!response.ok) throw new Error('Search failed');

        const results = await response.json();
        renderTable(results);
    } catch (error) {
        console.error('Error searching jobs:', error);
        stateContainer.innerHTML = '<div class="icon">⚠️</div><p>Search failed. Please try again.</p>';
    }
}

// Render records into the HTML table
function renderTable(jobs) {
    const tableBody = document.getElementById('jobs-table-body');
    const stateContainer = document.getElementById('view-state');
    const counterBadge = document.getElementById('record-count-badge');

    counterBadge.textContent = `${jobs.length} record${jobs.length === 1 ? '' : 's'}`;

    if (jobs.length === 0) {
        tableBody.innerHTML = '';
        stateContainer.innerHTML = `
            <div class="icon">🔍</div>
            <p><strong>No job records matched your query.</strong></p>
            <p style="font-size: 13px; margin-top: 4px;">Try clearing filters or add a new job posting.</p>
        `;
        stateContainer.style.display = 'block';
        return;
    }

    stateContainer.style.display = 'none';
    tableBody.innerHTML = '';

    jobs.forEach(job => {
        const tr = document.createElement('tr');

        const salaryFormatted = job.salary 
            ? '₹' + Number(job.salary).toLocaleString('en-IN')
            : '<span style="color: #94a3b8;">Not specified</span>';

        const interviewFormatted = job.interview_date 
            ? String(job.interview_date).slice(0, 10)
            : '<span style="color: #94a3b8;">Not scheduled</span>';

        // Split skills into badges if comma separated
        let skillsHtml = '';
        if (job.required_skills) {
            const skillsArr = job.required_skills.split(',');
            skillsHtml = skillsArr.map(s => `<span class="badge-skill">${escapeHtml(s.trim())}</span>`).join(' ');
        } else {
            skillsHtml = '<span style="color: #94a3b8; font-size: 12px;">None specified</span>';
        }

        tr.innerHTML = `
            <td><span class="badge-id">#${job.job_id}</span></td>
            <td><strong>${escapeHtml(job.job_title)}</strong></td>
            <td>${escapeHtml(job.company_name)}</td>
            <td><span class="badge-location">📍 ${escapeHtml(job.job_location)}</span></td>
            <td><span class="salary-tag">${salaryFormatted}</span></td>
            <td>${skillsHtml}</td>
            <td><span style="font-weight: 600;">${job.number_of_posts || 1}</span></td>
            <td>${interviewFormatted}</td>
            <td>
                <div class="table-actions">
                    <a href="edit.html?id=${job.job_id}" class="btn btn-secondary btn-sm" title="Edit this record">✏️ Edit</a>
                    <a href="delete.html?id=${job.job_id}" class="btn btn-danger btn-sm" title="Delete this record">🗑️ Delete</a>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Toast notification helper
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Helper to escape HTML characters
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
