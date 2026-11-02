// Add Record JavaScript - Form validation & POST request handling

document.addEventListener('DOMContentLoaded', () => {
    const addForm = document.getElementById('add-job-form');
    const submitBtn = document.getElementById('submit-btn');

    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Extract form values
            const job_title = document.getElementById('job_title').value.trim();
            const company_name = document.getElementById('company_name').value.trim();
            const job_location = document.getElementById('job_location').value.trim();
            const salary = document.getElementById('salary').value;
            const required_skills = document.getElementById('required_skills').value.trim();
            const interview_date = document.getElementById('interview_date').value;
            const number_of_posts = document.getElementById('number_of_posts').value;

            // Client-side validation
            if (!job_title || !company_name || !job_location) {
                showToast('Please fill in all required fields (Job Title, Company, Location)', 'error');
                return;
            }

            if (salary !== '' && Number(salary) < 0) {
                showToast('Salary cannot be negative', 'error');
                return;
            }

            if (number_of_posts !== '' && Number(number_of_posts) < 1) {
                showToast('Number of posts must be at least 1', 'error');
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

            // Disable submit button during request
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin: 0;"></span> Saving...';

            try {
                const response = await fetch('/api/jobs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to create job');
                }

                showToast(`Success! Job "${job_title}" created (ID: #${data.job_id})`, 'success');
                addForm.reset();

                // Optional redirect after 1.5s
                setTimeout(() => {
                    const shouldRedirect = confirm('Job posted successfully! Would you like to view all records now?');
                    if (shouldRedirect) {
                        window.location.href = 'view.html';
                    }
                }, 600);

            } catch (error) {
                console.error('Error adding job:', error);
                showToast(error.message || 'Server error while saving job', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '💾 Save Job Record';
            }
        });
    }
});

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
    }, 4000);
}
