// Dashboard JavaScript - Fetch statistics and recent records

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadRecentJobs();
});

// Fetch and display dashboard summary cards
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to load statistics');
        
        const data = await response.json();
        
        document.getElementById('stat-total-jobs').textContent = data.totalJobs || 0;
        document.getElementById('stat-total-companies').textContent = data.totalCompanies || 0;
        document.getElementById('stat-total-posts').textContent = data.totalPosts || 0;
        
        const avgSalaryFormatted = data.avgSalary > 0 
            ? '₹' + Number(data.avgSalary).toLocaleString('en-IN')
            : '₹0';
        document.getElementById('stat-avg-salary').textContent = avgSalaryFormatted;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        document.getElementById('stat-total-jobs').textContent = '-';
        document.getElementById('stat-total-companies').textContent = '-';
        document.getElementById('stat-total-posts').textContent = '-';
        document.getElementById('stat-avg-salary').textContent = '-';
    }
}

// Fetch and display latest jobs in the recent table
async function loadRecentJobs() {
    const tableBody = document.getElementById('recent-jobs-body');
    const recentState = document.getElementById('recent-state');
    
    try {
        recentState.innerHTML = '<div class="spinner"></div><p>Fetching recent job records...</p>';
        recentState.style.display = 'block';
        tableBody.innerHTML = '';
        
        const response = await fetch('/api/jobs');
        if (!response.ok) throw new Error('Failed to load recent jobs');
        
        const jobs = await response.json();
        
        if (jobs.length === 0) {
            recentState.innerHTML = '<div class="icon">📂</div><p>No job records found. Click "Add New Job" to post the first one!</p>';
            return;
        }
        
        recentState.style.display = 'none';
        
        // Show first 5 recent jobs
        const recentJobs = jobs.slice(0, 5);
        
        recentJobs.forEach(job => {
            const tr = document.createElement('tr');
            
            const salaryText = job.salary 
                ? '₹' + Number(job.salary).toLocaleString('en-IN') 
                : 'Not specified';
                
            const interviewDateText = job.interview_date 
                ? String(job.interview_date).slice(0, 10) 
                : 'Not scheduled';

            tr.innerHTML = `
                <td><span class="badge-id">#${job.job_id}</span></td>
                <td><strong>${escapeHtml(job.job_title)}</strong></td>
                <td>${escapeHtml(job.company_name)}</td>
                <td><span class="badge-location">📍 ${escapeHtml(job.job_location)}</span></td>
                <td><span class="salary-tag">${salaryText}</span></td>
                <td>${job.number_of_posts || 1}</td>
                <td>${interviewDateText}</td>
                <td>
                    <div class="table-actions">
                        <a href="edit.html?id=${job.job_id}" class="btn btn-secondary btn-sm" title="Edit Job">✏️ Edit</a>
                        <a href="delete.html?id=${job.job_id}" class="btn btn-danger btn-sm" title="Delete Job">🗑️ Delete</a>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching recent jobs:', error);
        recentState.innerHTML = '<div class="icon">⚠️</div><p>Unable to connect to the server or database. Please ensure your backend is running.</p>';
    }
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
