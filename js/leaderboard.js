/**
 * QuizNexus - Leaderboard Module
 * Shows ranked users with medals
 */

let leaderboardData = [];
let currentSort = 'score';

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        redirectTo('login.html');
        return;
    }

    loadLeaderboard();

    // Search
    const searchInput = document.getElementById('searchLeaderboard');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterLeaderboard(this.value);
        });
    }
});

function loadLeaderboard() {
    const users = DB.getUsers();
    const results = DB.getResults();

    leaderboardData = users.map(user => {
        const userResults = results.filter(r => r.userId === user.id);
        const totalScore = userResults.reduce((sum, r) => sum + r.score, 0);
        const avgPercentage = userResults.length > 0 ? 
            (userResults.reduce((sum, r) => sum + r.percentage, 0) / userResults.length) : 0;
        const quizzesTaken = userResults.length;
        const highestScore = userResults.length > 0 ? 
            Math.max(...userResults.map(r => r.score)) : 0;

        return {
            ...user,
            totalScore: totalScore,
            avgPercentage: avgPercentage,
            quizzesTaken: quizzesTaken,
            highestScore: highestScore
        };
    });

    sortLeaderboard(currentSort);
}

function sortLeaderboard(sortBy) {
    currentSort = sortBy;
    
    // Update buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(sortBy));
    });

    if (sortBy === 'score') {
        leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
    } else if (sortBy === 'quizzes') {
        leaderboardData.sort((a, b) => b.quizzesTaken - a.quizzesTaken);
    }

    renderLeaderboard(leaderboardData);
}

function filterLeaderboard(query) {
    const filtered = leaderboardData.filter(user => 
        user.fullName.toLowerCase().includes(query.toLowerCase()) ||
        user.rollNumber.toLowerCase().includes(query.toLowerCase())
    );
    renderLeaderboard(filtered);
}

function renderLeaderboard(users) {
    const container = document.getElementById('leaderboardList');
    if (!container) return;

    if (users.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No users found</p>';
        return;
    }

    container.innerHTML = users.map((user, index) => {
        let rankClass = '';
        let medalIcon = '';
        
        if (index === 0) {
            rankClass = 'gold';
            medalIcon = '🥇';
        } else if (index === 1) {
            rankClass = 'silver';
            medalIcon = '🥈';
        } else if (index === 2) {
            rankClass = 'bronze';
            medalIcon = '🥉';
        }

        return `
            <div class="leaderboard-item glass" style="margin-bottom: 8px; padding: 16px 20px; transition: transform 0.2s;">
                <div class="rank ${rankClass}">
                    ${medalIcon || `#${index + 1}`}
                </div>
                <div class="user-info">
                    <div class="name">${user.fullName}</div>
                    <div class="detail">
                        ${user.rollNumber} · ${user.quizzesTaken} quizzes taken
                    </div>
                </div>
                <div class="score">
                    ${user.totalScore} pts
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">
                        ${user.avgPercentage.toFixed(1)}% avg
                    </div>
                </div>
            </div>
        `;
    }).join('');
}