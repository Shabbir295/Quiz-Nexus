/**
 * QuizNexus - Main Application (Complete)
 */

// ============================================================
//  DATABASE
// ============================================================
const DB = {
    USERS: 'quiznexus_users',
    QUIZZES: 'quiznexus_quizzes',
    RESULTS: 'quiznexus_results',
    SETTINGS: 'quiznexus_settings',
    CURRENT_USER: 'quiznexus_current_user',
    ADMIN_SESSION: 'quiznexus_admin_session',
    SERVERS: 'quiznexus_servers',
    
    // ----- USERS -----
    getUsers() {
        try { return JSON.parse(localStorage.getItem(this.USERS)) || []; } 
        catch { return []; }
    },
    saveUsers(users) {
        localStorage.setItem(this.USERS, JSON.stringify(users));
    },
    getUserById(id) {
        return this.getUsers().find(u => u.id === id) || null;
    },
    getUserByRollNumber(rollNumber) {
        return this.getUsers().find(u => u.rollNumber === rollNumber) || null;
    },
    getUserByEmail(email) {
        return this.getUsers().find(u => u.email === email) || null;
    },
    createUser(userData) {
        const users = this.getUsers();
        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            fullName: userData.fullName,
            rollNumber: userData.rollNumber,
            password: userData.password,
            email: userData.email || '',
            phone: userData.phone || '',
            avatar: userData.avatar || '',
            serverId: userData.serverId || null,
            xp: 0,
            streak: 0,
            longestStreak: 0,
            totalScore: 0,
            quizzesTaken: [],
            achievements: [],
            createdAt: new Date().toISOString(),
            isActive: true,
            isBanned: false
        };
        users.push(newUser);
        this.saveUsers(users);
        return newUser;
    },
    updateUser(id, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return null;
        users[index] = { ...users[index], ...updates };
        this.saveUsers(users);
        return users[index];
    },
    deleteUser(id) {
        const users = this.getUsers();
        const filtered = users.filter(u => u.id !== id);
        this.saveUsers(filtered);
        return filtered;
    },
    getCurrentUser() {
        try {
            const data = localStorage.getItem(this.CURRENT_USER);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },
    setCurrentUser(user) {
        localStorage.setItem(this.CURRENT_USER, JSON.stringify(user));
    },
    clearCurrentUser() {
        localStorage.removeItem(this.CURRENT_USER);
    },
    isAdminLoggedIn() {
        return localStorage.getItem(this.ADMIN_SESSION) === 'true';
    },
    setAdminSession(value) {
        localStorage.setItem(this.ADMIN_SESSION, JSON.stringify(value));
    },
    
    // ----- SERVERS -----
    getServers() {
        try { return JSON.parse(localStorage.getItem(this.SERVERS)) || []; } 
        catch { return []; }
    },
    getServerById(id) {
        return this.getServers().find(s => s.id === id) || null;
    },
    
    // ----- QUIZZES -----
    getQuizzes() {
        try { return JSON.parse(localStorage.getItem(this.QUIZZES)) || []; } 
        catch { return []; }
    },
    getQuizById(id) {
        return this.getQuizzes().find(q => q.id === id) || null;
    },
    getQuizzesByServerId(serverId) {
        return this.getQuizzes().filter(q => q.serverId === serverId);
    },
    createQuiz(quizData) {
        const quizzes = this.getQuizzes();
        const newQuiz = {
            id: 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            title: quizData.title,
            description: quizData.description || '',
            category: quizData.category || 'General',
            difficulty: quizData.difficulty || 'Medium',
            duration: parseInt(quizData.duration) || 10,
            serverId: quizData.serverId || null,
            questions: quizData.questions || [],
            published: quizData.published !== undefined ? quizData.published : true,
            createdBy: quizData.createdBy || 'admin',
            createdAt: new Date().toISOString(),
            totalAttempts: 0,
            averageScore: 0
        };
        quizzes.push(newQuiz);
        this.saveQuizzes(quizzes);
        return newQuiz;
    },
    updateQuiz(id, updates) {
        const quizzes = this.getQuizzes();
        const index = quizzes.findIndex(q => q.id === id);
        if (index === -1) return null;
        quizzes[index] = { ...quizzes[index], ...updates };
        this.saveQuizzes(quizzes);
        return quizzes[index];
    },
    deleteQuiz(id) {
        const quizzes = this.getQuizzes();
        const filtered = quizzes.filter(q => q.id !== id);
        this.saveQuizzes(filtered);
        return filtered;
    },
    
    // ----- RESULTS -----
    getResults() {
        try { return JSON.parse(localStorage.getItem(this.RESULTS)) || []; } 
        catch { return []; }
    },
    saveResults(results) {
        localStorage.setItem(this.RESULTS, JSON.stringify(results));
    },
    getResultById(id) {
        return this.getResults().find(r => r.id === id) || null;
    },
    getResultsByUserId(userId) {
        return this.getResults().filter(r => r.userId === userId);
    },
    createResult(resultData) {
        const results = this.getResults();
        const newResult = {
            id: 'result_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: resultData.userId,
            quizId: resultData.quizId,
            serverId: resultData.serverId || null,
            quizTitle: resultData.quizTitle || '',
            score: resultData.score || 0,
            total: resultData.total || 0,
            percentage: resultData.percentage || 0,
            correct: resultData.correct || 0,
            wrong: resultData.wrong || 0,
            skipped: resultData.skipped || 0,
            timeTaken: resultData.timeTaken || 0,
            answers: resultData.answers || [],
            completedAt: new Date().toISOString()
        };
        results.push(newResult);
        this.saveResults(results);
        return newResult;
    },
    
    // ----- SETTINGS -----
    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(this.SETTINGS)) || {
                theme: 'dark',
                accentColor: '#00e676',
                animations: true,
                notifications: true,
                sound: true,
                fontSize: 'medium',
                language: 'en'
            };
        } catch {
            return {
                theme: 'dark',
                accentColor: '#00e676',
                animations: true,
                notifications: true,
                sound: true,
                fontSize: 'medium',
                language: 'en'
            };
        }
    },
    saveSettings(settings) {
        localStorage.setItem(this.SETTINGS, JSON.stringify(settings));
    },
    
    // ----- CLEAR -----
    clearAll() {
        localStorage.clear();
    }
};

// ============================================================
//  THEME MANAGEMENT
// ============================================================
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    
    if (theme === 'light') {
        document.body.style.background = '#f0f4f1';
        document.body.style.color = '#0a1a0e';
    } else {
        document.body.style.background = '#0b1a0e';
        document.body.style.color = '#e2f0e5';
    }
    
    document.querySelectorAll('.theme-toggle i').forEach(icon => {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    });
}

function loadTheme() {
    const settings = DB.getSettings();
    applyTheme(settings.theme || 'dark');
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
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
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
    const count = Math.min(80, Math.floor((w * h) / 20000));
    for (let i = 0; i < count; i++) {
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
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0, 230, 118, ${0.05 * (1 - dist / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
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
//  AUTH CHECK
// ============================================================
function checkAuth() {
    const currentUser = DB.getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['index.html', 'login.html', 'signup.html', 'admin-login.html'];
    
    if (!currentUser && !publicPages.includes(currentPage)) {
        redirectTo('login.html');
        return false;
    }
    return true;
}

// ============================================================
//  PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 QuizNexus loading...');
    
    // Load theme
    loadTheme();
    
    // Init particles
    initParticles();
    
    // Check auth
    checkAuth();
    
    // Seed sample data if empty
    if (DB.getUsers().length === 0) {
        const users = DB.getUsers();
        users.push({
            id: 'user_1',
            fullName: 'Admin User',
            rollNumber: 'ADMIN001',
            password: 'admin123',
            email: 'admin@quiznexus.com',
            phone: '1234567890',
            avatar: '',
            xp: 0,
            streak: 0,
            longestStreak: 0,
            totalScore: 0,
            quizzesTaken: [],
            achievements: [],
            createdAt: new Date().toISOString(),
            isActive: true,
            isBanned: false
        });
        localStorage.setItem('quiznexus_users', JSON.stringify(users));
        
        const servers = [];
        servers.push({
            id: 'server_1',
            name: 'Test Server',
            description: 'Default test server',
            code: 'TS-101',
            isActive: true,
            createdBy: 'admin',
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('quiznexus_servers', JSON.stringify(servers));
        
        console.log('✅ Sample data created');
    }
    
    console.log('✅ QuizNexus loaded successfully!');
});

// ============================================================
//  GLOBAL EXPORTS
// ============================================================
window.DB = DB;
window.showToast = showToast;
window.redirectTo = redirectTo;
window.logout = logout;
window.applyTheme = applyTheme;
window.loadTheme = loadTheme;
window.toggleTheme = toggleTheme;
window.initParticles = initParticles;
window.checkAuth = checkAuth;