/**
 * QuizNexus - Profile Module
 * User profile management
 */

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        redirectTo('login.html');
        return;
    }

    loadProfile(currentUser);

    // Avatar upload
    const avatarInput = document.getElementById('profileAvatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            handleProfileAvatarUpload(e);
        });
    }

    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProfile();
        });
    }
});

function loadProfile(user) {
    // Set avatar
    const avatarImg = document.getElementById('profileAvatar');
    if (avatarImg) {
        avatarImg.src = user.avatar || 'assets/avatars/default-avatar.png';
    }

    // Set form values
    document.getElementById('profileName').value = user.fullName || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileRollNumber').value = user.rollNumber || '';

    // Load stats
    const results = DB.getResultsByUserId(user.id);
    const totalQuizzes = results.length;
    const avgScore = totalQuizzes > 0 ? 
        (results.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes) : 0;

    document.getElementById('profileXP').textContent = user.xp || 0;
    document.getElementById('profileQuizzes').textContent = totalQuizzes;
    document.getElementById('profileAvgScore').textContent = avgScore.toFixed(1) + '%';

    // Load quiz history
    loadQuizHistory(results);
}

function loadQuizHistory(results) {
    const container = document.getElementById('quizHistory');
    if (!container) return;

    if (results.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No quizzes taken yet</p>';
        return;
    }

    container.innerHTML = results
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 10)
        .map(r => `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-glass);">
                <div>
                    <strong>${r.quizTitle || 'Quiz'}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        ${new Date(r.completedAt).toLocaleDateString()}
                    </div>
                </div>
                <div style="text-align: right;">
                    <span style="color: var(--accent); font-weight: 600;">${r.percentage.toFixed(1)}%</span>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        ${r.score}/${r.total}
                    </div>
                </div>
            </div>
        `).join('');
}

function handleProfileAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showToast('Image size must be less than 2MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const avatarImg = document.getElementById('profileAvatar');
        if (avatarImg) {
            avatarImg.src = e.target.result;
        }
        showToast('Avatar updated successfully!');
    };
    reader.readAsDataURL(file);
}

function deleteAvatar() {
    if (confirm('Are you sure you want to delete your avatar?')) {
        const avatarImg = document.getElementById('profileAvatar');
        if (avatarImg) {
            avatarImg.src = 'assets/avatars/default-avatar.png';
        }
        showToast('Avatar deleted');
    }
}

function updateProfile() {
    const currentUser = DB.getCurrentUser();
    if (!currentUser) return;

    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const avatar = document.getElementById('profileAvatar').src;

    if (!name || name.length < 2) {
        showToast('Please enter a valid name', 'error');
        return;
    }

    if (!email || !email.includes('@')) {
        showToast('Please enter a valid email', 'error');
        return;
    }

    // Update user
    const updatedUser = DB.updateUser(currentUser.id, {
        fullName: name,
        email: email,
        phone: phone,
        avatar: avatar
    });

    if (updatedUser) {
        DB.setCurrentUser(updatedUser);
        showToast('Profile updated successfully! 🎉');
    } else {
        showToast('Error updating profile', 'error');
    }
}