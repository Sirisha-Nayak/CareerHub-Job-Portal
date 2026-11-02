// Delete Record JavaScript - Selection, Confirmation Modal, and Safe Deletion

let pendingDeleteJobId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadDeleteJobRecords();

    // Check if ID is passed in URL query (e.g., delete.html?id=3)
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');

    if (idFromUrl) {
        // Open confirmation modal for this specific job once loaded
        fetchAndTriggerDelete(idFromUrl);
    }

    // Modal action buttons
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('confirm-delete-btn').addEventListener('click', executeDelete);
});

// Load all jobs into the deletion table
async function loadDeleteJobRecords() {
    const tableBody = document.getElementById('delete-table-body');
    const stateContainer = document.getElementById('delete-state');

    try {
        stateContainer.innerHTML = '<div class="spinner"></div><p>Fetching records from database...</p>';
        stateContainer.style.display = 'block';
        tableBody.innerHTML = '';

        const response = await fetch('/api/jobs');
        if (!response.ok) throw new Error('Failed to retrieve jobs');

        const jobs = await response.json();

        if (jobs.length === 0) {
            stateContainer.innerHTML = '<div class="icon">📂</div><p>No job listings found in MySQL database.</p>';
            stateContainer.style.display = 'block';
            return;
        }

        stateContainer.style.display = 'none';

        jobs.forEach(job => {
            const tr = document.createElement('tr');

            const salaryText = job.salary 
                ? '₹' + Number(job.salary).toLocaleString('en-IN') 
                : 'Not specified';

            tr.innerHTML = `
                <td><span class="badge-id">#${job.job_id}</span></td>
                <td><strong>${escapeHtml(job.job_title)}</strong></td>
                <td>${escapeHtml(job.company_name)}</td>
                <td><span class="badge-location">📍 ${escapeHtml(job.job_location)}</span></td>
                <td><span class="salary-tag">${salaryText}</span></td>
                <td>${job.number_of_posts || 1} Openings</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="promptDelete(${job.job_id}, '${escapeQuote(job.job_title)}', '${escapeQuote(job.company_name)}')">
                        🗑️ Delete Record
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error fetching jobs for deletion:', error);
        stateContainer.innerHTML = '<div class="icon">⚠️</div><p>Unable to connect to MySQL database.</p>';
        stateContainer.style.display = 'block';
    }
}

// Open modal for a specific job ID directly (used if coming with ?id=...)
async function fetchAndTriggerDelete(jobId) {
    try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) return;

        const job = await response.json();
        promptDelete(job.job_id, job.job_title, job.company_name, job.job_location, job.salary);
    } catch (err) {
        console.error(err);
    }
}

// Show confirmation modal with full details
function promptDelete(jobId, jobTitle, companyName, location = '', salary = '') {
    pendingDeleteJobId = jobId;

    document.getElementById('modal-job-id-text').textContent = '#' + jobId;
    document.getElementById('modal-job-title').textContent = jobTitle;
    document.getElementById('modal-job-company').textContent = companyName;

    const modal = document.getElementById('delete-modal');
    modal.classList.add('active');
}

// Close confirmation modal
function closeModal() {
    const modal = document.getElementById('delete-modal');
    modal.classList.remove('active');
    pendingDeleteJobId = null;
}

// Execute DELETE via API
async function executeDelete() {
    if (!pendingDeleteJobId) return;

    const confirmBtn = document.getElementById('confirm-delete-btn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner" style="width: 14px; height: 14px; border-width: 2px; margin: 0;"></span> Deleting...';

    try {
        const response = await fetch(`/api/jobs/${pendingDeleteJobId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete record');
        }

        showToast(`Job #${pendingDeleteJobId} was successfully removed.`, 'success');
        closeModal();

        // Remove query param from URL if present
        if (window.location.search) {
            window.history.pushState({}, '', window.location.pathname);
        }

        // Refresh list
        loadDeleteJobRecords();

    } catch (error) {
        console.error('Error executing delete:', error);
        showToast(error.message || 'Error deleting record', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '🗑️ Yes, Delete Record';
    }
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

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeQuote(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'");
}
