// Edit Record JavaScript - Fetch existing data by ID, pre-fill form, and PUT update

document.addEventListener('DOMContentLoaded', () => {
    // Populate the job selector dropdown
    loadAllJobsForSelector();

    // Check if ID is provided in query params (e.g. edit.html?id=2)
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');

    if (idFromUrl) {
        document.getElementById('select-job-id').value = idFromUrl;
        fetchJobDetails(idFromUrl);
    }

    // Handle job selection change
    document.getElementById('select-job-id').addEventListener('change', (e) => {
        const selectedId = e.target.value;
        if (selectedId) {
            // Update browser URL query without refreshing
            const newUrl = `${window.location.pathname}?id=${selectedId}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            fetchJobDetails(selectedId);
        } else {
            resetEditForm();
        }
    });

    // Handle manual ID lookup button
    document.getElementById('load-job-btn').addEventListener('click', () => {
        const manualId = document.getElementById('manual-job-id').value.trim();
        if (!manualId) {
            showToast('Please enter a Job ID', 'error');
            return;
        }
        fetchJobDetails(manualId);
    });

    // Handle form submit (UPDATE)
    const editForm = document.getElementById('edit-job-form');
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const jobId = document.getElementById('job_id').value;
        if (!jobId) {
            showToast('No job selected for editing', 'error');
            return;
        }

        const job_title = document.getElementById('job_title').value.trim();
        const company_name = document.getElementById('company_name').value.trim();
        const job_location = document.getElementById('job_location').value.trim();
        const salary = document.getElementById('salary').value;
        const required_skills = document.getElementById('required_skills').value.trim();
        const interview_date = document.getElementById('interview_date').value;
        const number_of_posts = document.getElementById('number_of_posts').value;

        if (!job_title || !company_name || !job_location) {
            showToast('Job Title, Company Name, and Location cannot be empty', 'error');
            return;
        }

        const payload = {
            job_title,
            company_name,
            job_location,
            salary: salary ? parseFloat(salary) : null,
            required_skills: required_skills || null,
            interview_date: interview_date || null,
            number_of_posts: number_of_posts ? parseInt(number_of_posts, 10) : 1
        };

        const updateBtn = document.getElementById('update-btn');
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin: 0;"></span> Updating...';

        try {
            const response = await fetch(`/api/jobs/${jobId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update job');
            }

            showToast(`Record #${jobId} successfully updated!`, 'success');
            
            // Refresh selector list to show updated title
            loadAllJobsForSelector(jobId);

        } catch (error) {
            console.error('Error updating job:', error);
            showToast(error.message || 'Error updating record', 'error');
        } finally {
            updateBtn.disabled = false;
            updateBtn.innerHTML = '💾 Update Job Record';
        }
    });
});

// Load all jobs into the selector dropdown
async function loadAllJobsForSelector(selectedId = null) {
    const selector = document.getElementById('select-job-id');
    try {
        const response = await fetch('/api/jobs');
        if (!response.ok) return;

        const jobs = await response.json();
        selector.innerHTML = '<option value="">-- Choose a Job from Database --</option>';

        jobs.forEach(job => {
            const opt = document.createElement('option');
            opt.value = job.job_id;
            opt.textContent = `#${job.job_id} - ${job.job_title} at ${job.company_name} (${job.job_location})`;
            selector.appendChild(opt);
        });

        if (selectedId) {
            selector.value = selectedId;
        }
    } catch (err) {
        console.error('Error populating job selector:', err);
    }
}

// Fetch single job by ID and pre-populate fields
async function fetchJobDetails(jobId) {
    const editForm = document.getElementById('edit-job-form');
    const statusMsg = document.getElementById('edit-status-msg');

    try {
        statusMsg.style.display = 'block';
        statusMsg.innerHTML = '<div class="spinner"></div><p>Fetching job details for ID #' + jobId + '...</p>';

        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Job #${jobId} was not found in database.`);
            }
            throw new Error('Failed to fetch job data.');
        }

        const job = await response.json();

        // Populate fields
        document.getElementById('job_id').value = job.job_id;
        document.getElementById('display_job_id').textContent = '#' + job.job_id;
        document.getElementById('job_title').value = job.job_title || '';
        document.getElementById('company_name').value = job.company_name || '';
        document.getElementById('job_location').value = job.job_location || '';
        document.getElementById('salary').value = job.salary ? Number(job.salary) : '';
        document.getElementById('required_skills').value = job.required_skills || '';
        document.getElementById('number_of_posts').value = job.number_of_posts || 1;

        if (job.interview_date) {
            // Format YYYY-MM-DD
            const formattedDate = String(job.interview_date).slice(0, 10);
            document.getElementById('interview_date').value = formattedDate;
        } else {
            document.getElementById('interview_date').value = '';
        }

        // Also sync selector dropdown
        const selector = document.getElementById('select-job-id');
        if (selector) selector.value = job.job_id;

        statusMsg.style.display = 'none';
        editForm.style.display = 'block';
        showToast(`Loaded details for Job #${job.job_id}: ${job.job_title}`, 'info');

    } catch (error) {
        console.error('Error fetching job details:', error);
        statusMsg.style.display = 'block';
        statusMsg.innerHTML = `<div class="icon">⚠️</div><p><strong>${error.message}</strong></p>`;
        editForm.style.display = 'none';
        showToast(error.message, 'error');
    }
}

function resetEditForm() {
    document.getElementById('edit-job-form').reset();
    document.getElementById('edit-job-form').style.display = 'none';
    document.getElementById('edit-status-msg').style.display = 'block';
    document.getElementById('edit-status-msg').innerHTML = '<div class="icon">👆</div><p>Please select a job above to load its values for editing.</p>';
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
