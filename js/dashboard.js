/**
 * QuizNexus - Dashboard Module (Complete)
 * Features: Stats, Charts, Achievements, Available Quizzes
 */

// ============================================================
//  DATABASE
// ============================================================
const DB = {
    USERS: 'quiznexus_users',
    RESULTS: 'quiznexus_results',
    QUIZZES: 'quiznexus_quizzes',
    SETTINGS: 'quiznexus_settings',
    CURRENT_USER: 'quiznexus_current_user',
    
    getUsers() {
        return JSON.parse(localStorage.getItem(this.USERS)) || [];
    },
    saveUsers(users) {
        localStorage.setItem(this.USERS, JSON.stringify(users));
    },
    getResults() {
        return JSON.parse(localStorage.getItem(this.RESULTS)) || [];
    },
    getResultsByUserId(userId) {
        return this.getResults().filter(r => r.userId === userId);
    },
    getQuizzes() {
        return JSON.parse(localStorage.getItem(this.QUIZZES)) || [];
    },
    getCurrentUser() {
        const data = localStorage.getItem(this.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    },
    setCurrentUser(user) {
        localStorage.setItem(this.CURRENT_USER, JSON.stringify(user));
    },
    clearCurrentUser() {
        localStorage.removeItem(this.CURRENT_USER);
    },
    getSettings() {
        return JSON.parse(localStorage.getItem(this.SETTINGS)) || {
            theme: 'dark',
            accentColor: '#00e676',
            animations: true,
            notifications: true,
            sound: true,
            fontSize: 'medium',
            language: 'en'
        };
    },
    saveSettings(settings) {
        localStorage.setItem(this.SETTINGS, JSON.stringify(settings));
    },
    updateUser(id, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return null;
        users[index] = { ...users[index], ...updates };
        this.saveUsers(users);
        return users[index];
    }
};

// ============================================================
//  TOAST
// ============================================================
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function redirectTo(page) {
    window.location.href = page;
}

function logout() {
    DB.clearCurrentUser();
    showToast('Logged out successfully');
    setTimeout(() => redirectTo('login.html'), 400);
}

// ============================================================
//  THEME
// ============================================================
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle i').forEach(icon => {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    });
    document.body.style.background = theme === 'light' 
        ? 'radial-gradient(ellipse at 20% 20%, #e8f5e9, #c8e6c9)' 
        : 'radial-gradient(circle at 20% 20%, #132b17, #051007)';
}

function toggleTheme() {
    const settings = DB.getSettings();
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    settings.theme = newTheme;
    DB.saveSettings(settings);
    applyTheme(newTheme);
    showToast(`Switched to ${newTheme} mode`);
}

// ============================================================
//  ACHIEVEMENTS SYSTEM
// ============================================================
const ACHIEVEMENTS = [
    { id: 'first_quiz', name: 'First Steps', icon: '🌱', desc: 'Complete your first quiz', check: (u, r) => r.length >= 1 },
    { id: 'quiz_master', name: 'Quiz Master', icon: '🧠', desc: 'Complete 10 quizzes', check: (u, r) => r.length >= 10 },
    { id: 'perfectionist', name: 'Perfectionist', icon: '⭐', desc: 'Score 100% on a quiz', check: (u, r) => r.some(res => res.percentage === 100) },
    { id: 'streak_7', name: 'Week Warrior', icon: '🔥', desc: '7 day streak', check: (u, r) => (u.streak || 0) >= 7 },
    { id: 'streak_30', name: 'Monthly Champion', icon: '🏆', desc: '30 day streak', check: (u, r) => (u.streak || 0) >= 30 },
    { id: 'xp_100', name: 'XP Collector', icon: '💎', desc: 'Earn 100 XP', check: (u, r) => (u.xp || 0) >= 100 },
    { id: 'xp_500', name: 'XP Legend', icon: '👑', desc: 'Earn 500 XP', check: (u, r) => (u.xp || 0) >= 500 }
];

function getAchievements(user) {
    const results = DB.getResultsByUserId(user.id);
    return ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: ach.check(user, results)
    }));
}

function renderAchievements(user) {
    const container = document.getElementById('achievementGrid');
    if (!container) return;
    
    const achievements = getAchievements(user);
    const unlocked = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;
    
    const countEl = document.getElementById('achievementCount');
    const totalEl = document.getElementById('totalAchievements');
    if (countEl) countEl.textContent = unlocked;
    if (totalEl) totalEl.textContent = total;
    
    container.innerHTML = achievements.map(ach => `
        <div class="achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}" title="${ach.desc}">
            <span class="icon">${ach.icon}</span>
            <span class="name">${ach.name}</span>
            ${ach.unlocked ? '<span style="font-size:0.6rem;color:var(--accent);">✅</span>' : '<span style="font-size:0.6rem;color:var(--text-muted);">🔒</span>'}
        </div>
    `).join('');
}

// ============================================================
//  DASHBOARD STATS
// ============================================================
function loadDashboardStats(user) {
    const results = DB.getResultsByUserId(user.id);
    const totalResults = results.length;
    
    // Total Score
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalScoreEl = document.getElementById('totalScore');
    if (totalScoreEl) totalScoreEl.textContent = totalScore;
    
    // Average Percentage
    const avgPercentage = totalResults > 0 
        ? (results.reduce((sum, r) => sum + r.percentage, 0) / totalResults) 
        : 0;
    const avgEl = document.getElementById('avgPercentage');
    if (avgEl) avgEl.textContent = avgPercentage.toFixed(1) + '%';
    
    // Highest Score
    const highestScore = totalResults > 0 
        ? Math.max(...results.map(r => r.score)) 
        : 0;
    const highestEl = document.getElementById('highestScore');
    if (highestEl) highestEl.textContent = highestScore;
    
    // Current Streak
    const streak = user.streak || 0;
    const streakEl = document.getElementById('currentStreak');
    if (streakEl) streakEl.textContent = streak;
    const streakDisplayEl = document.getElementById('streakDisplay');
    if (streakDisplayEl) streakDisplayEl.textContent = streak;
    
    // XP
    const xpEl = document.getElementById('xpDisplay');
    if (xpEl) xpEl.textContent = user.xp || 0;
    
    // Rank
    const allUsers = DB.getUsers();
    const sortedUsers = allUsers
        .filter(u => u.id !== user.id)
        .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    const rank = sortedUsers.findIndex(u => u.totalScore <= (user.totalScore || 0)) + 1;
    const rankEl = document.getElementById('rankDisplay');
    if (rankEl) rankEl.textContent = rank > 0 ? '#' + rank : '-';
}

// ============================================================
//  PERFORMANCE CHART
// ============================================================
let performanceChartInstance = null;

function loadPerformanceChart(user) {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    
    const results = DB.getResultsByUserId(user.id);
    const sortedResults = results.sort((a, b) => 
        new Date(a.completedAt) - new Date(b.completedAt)
    );
    
    const labels = sortedResults.map(r => {
        const date = new Date(r.completedAt);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const data = sortedResults.map(r => r.percentage);
    
    if (performanceChartInstance) {
        performanceChartInstance.destroy();
    }
    
    performanceChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [{
                label: 'Score %',
                data: data.length > 0 ? data : [0],
                borderColor: '#00e676',
                backgroundColor: 'rgba(0, 230, 118, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00e676',
                pointBorderColor: '#00e676',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#a0c9a8' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#a0c9a8' }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#a0c9a8', maxTicksLimit: 10 }
                }
            }
        }
    });
}

// ============================================================
//  DAILY PROGRESS
// ============================================================
function loadDailyProgress(user) {
    const circle = document.getElementById('progressCircle');
    const percentText = document.getElementById('progressPercent');
    const todayQuizzes = document.getElementById('todayQuizzes');
    if (!circle) return;
    
    const results = DB.getResultsByUserId(user.id);
    const today = new Date().toDateString();
    const todayResults = results.filter(r => 
        new Date(r.completedAt).toDateString() === today
    );
    
    const goal = 3;
    const completed = Math.min(todayResults.length, goal);
    const percentage = (completed / goal) * 100;
    
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    if (percentText) percentText.textContent = Math.round(percentage) + '%';
    if (todayQuizzes) todayQuizzes.textContent = completed;
}

// ============================================================
//  WEEKLY STATS
// ============================================================
function loadWeeklyStats(user) {
    const container = document.getElementById('weekGrid');
    if (!container) return;
    
    const results = DB.getResultsByUserId(user.id);
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const currentDay = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay);
    
    let html = '';
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toDateString();
        const isToday = dateStr === today.toDateString();
        
        const dayResults = results.filter(r => 
            new Date(r.completedAt).toDateString() === dateStr
        );
        
        const count = dayResults.length;
        const avgScore = count > 0 
            ? dayResults.reduce((sum, r) => sum + r.percentage, 0) / count 
            : 0;
        
        html += `
            <div class="day-item ${isToday ? 'active' : ''}">
                <div class="day-label">${days[i]}</div>
                <div class="day-value" style="color:${count > 0 ? 'var(--accent)' : 'var(--text-muted)'}">
                    ${count > 0 ? count : '—'}
                </div>
                ${count > 0 ? `<div style="font-size:0.5rem;color:var(--text-muted);">${avgScore.toFixed(0)}%</div>` : ''}
            </div>
        `;
    }
    container.innerHTML = html;
}

// ============================================================
//  AVAILABLE QUIZZES
// ============================================================
// ============================================================
//  AVAILABLE QUIZZES - GRID VIEW
// ============================================================
function loadAvailableQuizzes() {
    const quizzes = DB.getQuizzes().filter(q => q.published === true);
    const container = document.getElementById('availableQuizzes');
    if (!container) return;
    
    if (quizzes.length === 0) {
        container.innerHTML = `
            <div class="empty-quizzes" style="grid-column:1/-1;text-align:center;padding:40px;color:#8fb89a;">
                <i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:10px;"></i>
                <p>No quizzes available right now. Check back later!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = quizzes.map(q => `
        <div class="glass" style="padding:24px;cursor:pointer;transition:all 0.3s;border:1px solid var(--border-glass);border-radius:var(--radius);"
             onmouseover="this.style.transform='translateY(-6px)';this.style.borderColor='var(--accent)';this.style.boxShadow='var(--shadow-soft), var(--neon-glow)';"
             onmouseout="this.style.transform='translateY(0)';this.style.borderColor='var(--border-glass)';this.style.boxShadow='var(--shadow-soft), var(--neon-glow)';"
             onclick="window.location.href='quiz.html?id=${q.id}'">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                <div style="font-weight:700;font-size:1.15rem;">${q.title}</div>
                <span style="font-size:0.65rem;padding:3px 12px;border-radius:30px;font-weight:600;background:rgba(0,230,118,0.15);color:#00e676;border:1px solid rgba(0,230,118,0.2);">${q.difficulty || 'Medium'}</span>
            </div>
            <div style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:14px;line-height:1.5;">${q.description || 'No description'}</div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
                <span style="display:flex;align-items:center;gap:6px;font-size:0.8rem;color:var(--text-secondary);">
                    <i class="fas fa-question-circle" style="font-size:0.85rem;opacity:0.6;"></i> ${q.questions?.length || 0} questions
                </span>
                <span style="display:flex;align-items:center;gap:6px;font-size:0.8rem;color:var(--text-secondary);">
                    <i class="fas fa-clock" style="font-size:0.85rem;opacity:0.6;"></i> ${q.duration} min
                </span>
                <span style="display:flex;align-items:center;gap:6px;font-size:0.8rem;color:var(--text-secondary);">
                    <i class="fas fa-tag" style="font-size:0.85rem;opacity:0.6;"></i> ${q.category || 'General'}
                </span>
            </div>
            <button class="btn-start" style="background:linear-gradient(145deg,#00c853,#00e676);border:none;padding:8px 20px;border-radius:60px;font-weight:600;color:#0b1a0e;cursor:pointer;transition:all 0.3s;font-family:'Inter',sans-serif;display:inline-flex;align-items:center;gap:8px;width:100%;justify-content:center;">
                <i class="fas fa-play"></i> Start Quiz
            </button>
        </div>
    `).join('');
}

// ============================================================
//  MOTIVATIONAL QUOTE
// ============================================================
const quotes = [
    { text: '"The expert in anything was once a beginner."', author: 'Unknown' },
    { text: '"Success is the sum of small efforts repeated day in and day out."', author: 'Robert Collier' },
    { text: '"Believe you can and you\'re halfway there."', author: 'Theodore Roosevelt' },
    { text: '"The only way to do great work is to love what you do."', author: 'Steve Jobs' },
    { text: '"Continuous improvement is better than delayed perfection."', author: 'Mark Twain' },
    { text: '"The secret of getting ahead is getting started."', author: 'Mark Twain' },
    { text: '"Don\'t let what you cannot do interfere with what you can do."', author: 'John Wooden' },
    { text: '"The best time to start was yesterday. The next best time is now."', author: 'Unknown' },
    { text: '"Knowledge is power. The more you learn, the more you earn."', author: 'Unknown' },
    { text: '"Practice makes progress, not perfect."', author: 'Unknown' }
];

function loadMotivationalQuote() {
    const quoteElement = document.querySelector('.quote-card .quote-text');
    const authorElement = document.querySelector('.quote-card .quote-author');
    if (quoteElement) {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const quote = quotes[randomIndex];
        quoteElement.textContent = quote.text;
        if (authorElement) authorElement.textContent = '— ' + quote.author;
    }
}

// ============================================================
//  DATE DISPLAY
// ============================================================
function updateDateDisplay() {
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }
}

// ============================================================
//  PARTICLES
// ============================================================
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;
    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            r: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
    function draw() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 230, 118, ${p.opacity})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================
//  UPDATE STREAK
// ============================================================
function updateStreak(user) {
    const results = DB.getResultsByUserId(user.id);
    if (results.length === 0) {
        DB.updateUser(user.id, { streak: 0 });
        const streakDisplay = document.getElementById('streakDisplay');
        const currentStreak = document.getElementById('currentStreak');
        if (streakDisplay) streakDisplay.textContent = '0';
        if (currentStreak) currentStreak.textContent = '0';
        return 0;
    }
    
    const sortedResults = results.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStr = today.toDateString();
    const todayResult = sortedResults.find(r => 
        new Date(r.completedAt).toDateString() === todayStr
    );
    
    if (todayResult) {
        streak = 1;
        let checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
        
        for (let i = 1; i < 30; i++) {
            const dateStr = checkDate.toDateString();
            const hasResult = sortedResults.some(r => 
                new Date(r.completedAt).toDateString() === dateStr
            );
            if (hasResult) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    }
    
    if (streak !== (user.streak || 0)) {
        DB.updateUser(user.id, { 
            streak: streak,
            longestStreak: Math.max(streak, user.longestStreak || 0)
        });
    }
    
    const streakDisplay = document.getElementById('streakDisplay');
    const currentStreak = document.getElementById('currentStreak');
    if (streakDisplay) streakDisplay.textContent = streak;
    if (currentStreak) currentStreak.textContent = streak;
    return streak;
}

// ============================================================
//  PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Force scroll to top
    window.scrollTo(0, 0);
    
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        redirectTo('login.html');
        return;
    }
    
    // Display user name
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) nameDisplay.textContent = currentUser.fullName;
    
    // Apply theme
    const settings = DB.getSettings();
    if (settings.theme) applyTheme(settings.theme);
    
    // Update date
    updateDateDisplay();
    
    // Update streak
    updateStreak(currentUser);
    
    // Load all dashboard data
    loadDashboardStats(currentUser);
    loadPerformanceChart(currentUser);
    loadDailyProgress(currentUser);
    loadWeeklyStats(currentUser);
    loadMotivationalQuote();
    loadAvailableQuizzes();
    renderAchievements(currentUser);
    
    // Init particles
    initParticles();
    
    console.log('✅ Dashboard loaded successfully');
});

// ============================================================
//  GLOBAL EXPORTS
// ============================================================
window.logout = logout;
window.toggleTheme = toggleTheme;
window.loadAvailableQuizzes = loadAvailableQuizzes;