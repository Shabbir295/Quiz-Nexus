/**
 * QuizNexus - Storage Module (Complete)
 * All LocalStorage operations with Server & Roll Number support
 */

const DB = {
    // ===== KEYS =====
    USERS: 'quiznexus_users',
    QUIZZES: 'quiznexus_quizzes',
    RESULTS: 'quiznexus_results',
    SETTINGS: 'quiznexus_settings',
    CURRENT_USER: 'quiznexus_current_user',
    ADMIN_SESSION: 'quiznexus_admin_session',
    SERVERS: 'quiznexus_servers',
    QUESTION_BANK: 'quiznexus_question_bank',
    COMMENTS: 'quiznexus_comments',
    RATINGS: 'quiznexus_ratings',
    FOLLOWS: 'quiznexus_follows',

    // ============================================================
    //  USERS
    // ============================================================
    getUsers() {
        return JSON.parse(localStorage.getItem(this.USERS)) || [];
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
    createUser(userData) {
        const users = this.getUsers();
        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            fullName: userData.fullName,
            rollNumber: userData.rollNumber,
            password: userData.password,
            email: userData.email || '',
            phone: userData.phone || '',
            avatar: userData.avatar || this.getDefaultAvatar(),
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

    // ============================================================
    //  SERVERS (With Code Support)
    // ============================================================
    getServers() {
        return JSON.parse(localStorage.getItem(this.SERVERS)) || [];
    },
    saveServers(servers) {
        localStorage.setItem(this.SERVERS, JSON.stringify(servers));
    },
    getServerById(id) {
        return this.getServers().find(s => s.id === id) || null;
    },
    getServerByCode(code) {
        return this.getServers().find(s => s.code && s.code.toLowerCase() === code.toLowerCase()) || null;
    },
    getActiveServers() {
        return this.getServers().filter(s => s.isActive !== false);
    },
    generateServerCode(serverName) {
        if (!serverName || serverName.trim() === '') return '';
        
        const name = serverName.trim();
        const words = name.split(' ');
        let prefix = '';
        
        if (words.length === 1) {
            prefix = words[0].substring(0, 3).toUpperCase();
        } else {
            for (let i = 0; i < Math.min(words.length, 3); i++) {
                if (words[i].length > 0) {
                    prefix += words[i].charAt(0).toUpperCase();
                }
            }
        }
        
        if (prefix.length < 2) prefix = 'SRV';
        
        const existing = this.getServers().filter(s => s.code && s.code.startsWith(prefix));
        const count = existing.length + 1;
        
        return `${prefix}-${String(count).padStart(3, '0')}`;
    },
    createServer(serverData) {
        const servers = this.getServers();
        const code = serverData.code || this.generateServerCode(serverData.name);
        
        if (this.getServerByCode(code)) {
            throw new Error('Server code already exists! Please use a different code.');
        }
        
        const newServer = {
            id: 'server_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: serverData.name,
            description: serverData.description || '',
            code: code.toUpperCase(),
            isActive: true,
            createdBy: 'admin',
            createdAt: new Date().toISOString()
        };
        servers.push(newServer);
        this.saveServers(servers);
        return newServer;
    },
    updateServer(id, updates) {
        const servers = this.getServers();
        const index = servers.findIndex(s => s.id === id);
        if (index === -1) return null;
        
        if (updates.code) {
            const existing = servers.find(s => s.code && s.code.toLowerCase() === updates.code.toLowerCase() && s.id !== id);
            if (existing) {
                throw new Error('Server code already exists!');
            }
        }
        
        servers[index] = { ...servers[index], ...updates };
        this.saveServers(servers);
        return servers[index];
    },
    deleteServer(id) {
        let servers = this.getServers();
        servers = servers.filter(s => s.id !== id);
        this.saveServers(servers);
        return servers;
    },

    // ============================================================
    //  QUIZZES
    // ============================================================
    getQuizzes() {
        return JSON.parse(localStorage.getItem(this.QUIZZES)) || [];
    },
    saveQuizzes(quizzes) {
        localStorage.setItem(this.QUIZZES, JSON.stringify(quizzes));
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

    // ============================================================
    //  RESULTS
    // ============================================================
    getResults() {
        return JSON.parse(localStorage.getItem(this.RESULTS)) || [];
    },
    saveResults(results) {
        localStorage.setItem(this.RESULTS, JSON.stringify(results));
    },
    getResultsByUserId(userId) {
        return this.getResults().filter(r => r.userId === userId);
    },
    getResultsByServerId(serverId) {
        return this.getResults().filter(r => r.serverId === serverId);
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

    // ============================================================
    //  QUESTION BANK
    // ============================================================
    getQuestionBank() {
        return JSON.parse(localStorage.getItem(this.QUESTION_BANK)) || [];
    },
    saveQuestionBank(questions) {
        localStorage.setItem(this.QUESTION_BANK, JSON.stringify(questions));
    },
    addToQuestionBank(question) {
        const bank = this.getQuestionBank();
        const newQ = {
            id: 'qb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            ...question,
            addedAt: new Date().toISOString()
        };
        bank.push(newQ);
        this.saveQuestionBank(bank);
        return newQ;
    },
    removeFromQuestionBank(id) {
        let bank = this.getQuestionBank();
        bank = bank.filter(q => q.id !== id);
        this.saveQuestionBank(bank);
    },

    // ============================================================
    //  COMMENTS
    // ============================================================
    getComments(quizId) {
        const all = JSON.parse(localStorage.getItem(this.COMMENTS)) || [];
        return all.filter(c => c.quizId === quizId);
    },
    addComment(quizId, userId, text) {
        const all = JSON.parse(localStorage.getItem(this.COMMENTS)) || [];
        const comment = {
            id: 'c_' + Date.now(),
            quizId: quizId,
            userId: userId,
            text: text,
            timestamp: Date.now()
        };
        all.push(comment);
        localStorage.setItem(this.COMMENTS, JSON.stringify(all));
        return comment;
    },

    // ============================================================
    //  RATINGS
    // ============================================================
    getRating(quizId) {
        const all = JSON.parse(localStorage.getItem(this.RATINGS)) || {};
        return all[quizId] || 0;
    },
    setRating(quizId, rating) {
        const all = JSON.parse(localStorage.getItem(this.RATINGS)) || {};
        all[quizId] = Math.min(5, Math.max(1, rating));
        localStorage.setItem(this.RATINGS, JSON.stringify(all));
    },

    // ============================================================
    //  FOLLOWS
    // ============================================================
    getFollows() {
        return JSON.parse(localStorage.getItem(this.FOLLOWS)) || [];
    },
    saveFollows(follows) {
        localStorage.setItem(this.FOLLOWS, JSON.stringify(follows));
    },
    toggleFollow(followerId, followingId) {
        let follows = this.getFollows();
        const existing = follows.find(f => f.followerId === followerId && f.followingId === followingId);
        if (existing) {
            follows = follows.filter(f => f !== existing);
            this.saveFollows(follows);
            return false;
        } else {
            follows.push({ followerId, followingId, timestamp: Date.now() });
            this.saveFollows(follows);
            return true;
        }
    },
    getFollowers(userId) {
        return this.getFollows().filter(f => f.followingId === userId);
    },
    getFollowing(userId) {
        return this.getFollows().filter(f => f.followerId === userId);
    },
    isFollowing(followerId, followingId) {
        return this.getFollows().some(f => f.followerId === followerId && f.followingId === followingId);
    },

    // ============================================================
    //  SETTINGS
    // ============================================================
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

    // ============================================================
    //  SESSION
    // ============================================================
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
    isAdminLoggedIn() {
        return localStorage.getItem(this.ADMIN_SESSION) === 'true';
    },
    setAdminSession(value) {
        localStorage.setItem(this.ADMIN_SESSION, JSON.stringify(value));
    },

    // ============================================================
    //  DEFAULT AVATAR
    // ============================================================
    getDefaultAvatar() {
        let avatar = localStorage.getItem('defaultAvatar');
        if (avatar) return avatar;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createRadialGradient(100, 100, 0, 100, 100, 100);
            gradient.addColorStop(0, '#00e676');
            gradient.addColorStop(1, '#008c3a');
            ctx.beginPath();
            ctx.arc(100, 100, 100, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(100, 70, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(100, 160, 45, 35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('QN', 100, 120);
            avatar = canvas.toDataURL('image/png');
            localStorage.setItem('defaultAvatar', avatar);
            return avatar;
        } catch(e) {
            return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2300e676"/><text x="50" y="65" font-size="50" text-anchor="middle" fill="white" font-family="Arial">QN</text></svg>';
        }
    },

    // ============================================================
    //  CLEAR ALL
    // ============================================================
    clearAll() {
        localStorage.removeItem(this.USERS);
        localStorage.removeItem(this.QUIZZES);
        localStorage.removeItem(this.RESULTS);
        localStorage.removeItem(this.SETTINGS);
        localStorage.removeItem(this.CURRENT_USER);
        localStorage.removeItem(this.ADMIN_SESSION);
        localStorage.removeItem(this.SERVERS);
        localStorage.removeItem(this.QUESTION_BANK);
        localStorage.removeItem(this.COMMENTS);
        localStorage.removeItem(this.RATINGS);
        localStorage.removeItem(this.FOLLOWS);
        localStorage.removeItem('defaultAvatar');
    }
};