/**
 * QuizNexus - Quiz Engine (Phase 2)
 * Features: Full Screen, Tab Switch Detection, Lives/Attempts, Per-Question Timer
 */

// ============================================================
//  DATABASE
// ============================================================
const DB = {
    QUIZZES: 'quiznexus_quizzes',
    RESULTS: 'quiznexus_results',
    CURRENT_USER: 'quiznexus_current_user',
    getQuizzes() {
        return JSON.parse(localStorage.getItem(this.QUIZZES)) || [];
    },
    getQuizById(id) {
        return this.getQuizzes().find(q => q.id === id) || null;
    },
    getResults() {
        return JSON.parse(localStorage.getItem(this.RESULTS)) || [];
    },
    saveResults(results) {
        localStorage.setItem(this.RESULTS, JSON.stringify(results));
    },
    getCurrentUser() {
        const data = localStorage.getItem(this.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    }
};

// ============================================================
//  QUIZ STATE
// ============================================================
let currentQuiz = null;
let currentQuestions = [];
let currentIndex = 0;
let userAnswers = {};
let markedQuestions = {};
let timerInterval = null;
let questionTimerInterval = null;
let timeRemaining = 0;
let totalTime = 0;
let quizStartTime = null;
let lives = 3;
let maxLives = 3;
let isTabActive = true;
let isFullScreen = false;
let isQuizActive = true;
let tabSwitchCount = 0;
const MAX_TAB_SWITCHES = 1;

// ============================================================
//  TOAST
// ============================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        newContainer.className = 'toast-container';
        document.body.appendChild(newContainer);
        return showToast(message, type);
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

// ============================================================
//  FULL SCREEN MODE
// ============================================================
function toggleFullScreen() {
    const btn = document.querySelector('.fullscreen-btn i');
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            isFullScreen = true;
            btn.className = 'fas fa-compress';
            showToast('🖥️ Full Screen Mode Enabled');
        }).catch(() => {
            showToast('Full screen not supported', 'error');
        });
    } else {
        document.exitFullscreen().then(() => {
            isFullScreen = false;
            btn.className = 'fas fa-expand';
            showToast('🖥️ Full Screen Mode Disabled');
        });
    }
}

document.addEventListener('fullscreenchange', () => {
    const btn = document.querySelector('.fullscreen-btn i');
    if (document.fullscreenElement) {
        isFullScreen = true;
        btn.className = 'fas fa-compress';
    } else {
        isFullScreen = false;
        btn.className = 'fas fa-expand';
    }
});

// ============================================================
//  TAB SWITCH DETECTION
// ============================================================
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // User switched tab
        if (isQuizActive && lives > 0) {
            tabSwitchCount++;
            isTabActive = false;
            
            // Show warning
            document.getElementById('tabWarning').classList.add('active');
            
            // Lose a life
            loseLife('You switched tabs!');
            
            // Pause timer
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            if (questionTimerInterval) {
                clearInterval(questionTimerInterval);
                questionTimerInterval = null;
            }
        }
    } else {
        // User returned
        isTabActive = true;
        // Resume timer if alive
        if (lives > 0 && isQuizActive) {
            startTimer();
            startQuestionTimer();
        }
    }
});

// ============================================================
//  LOSE LIFE FUNCTION
// ============================================================
function loseLife(reason) {
    if (lives <= 0 || !isQuizActive) return;
    
    lives--;
    updateLivesDisplay();
    
    // Show lost life modal
    document.getElementById('remainingLives').textContent = lives;
    document.getElementById('lostLifeModal').classList.add('active');
    
    if (lives <= 0) {
        document.getElementById('gameOverMessage').style.display = 'block';
        isQuizActive = false;
        showToast('💔 Game Over! No lives left.', 'error');
        setTimeout(() => {
            submitQuiz();
        }, 2000);
    } else {
        showToast(`💔 Lost a life! ${reason} (${lives} remaining)`, 'error');
    }
}

function closeLostLifeModal() {
    document.getElementById('lostLifeModal').classList.remove('active');
    if (lives <= 0) {
        submitQuiz();
    }
}

function updateLivesDisplay() {
    const display = document.getElementById('livesDisplay');
    if (!display) return;
    
    let hearts = '';
    for (let i = 0; i < maxLives; i++) {
        hearts += i < lives ? '❤️' : '🖤';
    }
    display.textContent = hearts;
}

// ============================================================
//  LOAD QUIZ
// ============================================================
function loadQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');
    
    if (!quizId) {
        showToast('No quiz selected!', 'error');
        setTimeout(() => redirectTo('dashboard.html'), 1000);
        return;
    }

    currentQuiz = DB.getQuizById(quizId);
    if (!currentQuiz) {
        showToast('Quiz not found!', 'error');
        setTimeout(() => redirectTo('dashboard.html'), 1000);
        return;
    }

    // Shuffle questions
    currentQuestions = shuffleArray([...currentQuiz.questions]);
    
    // Shuffle options for each question
    currentQuestions = currentQuestions.map(q => {
        const shuffledOptions = shuffleArray([...q.options]);
        const correctIndex = shuffledOptions.indexOf(q.options[q.correct]);
        return {
            ...q,
            options: shuffledOptions,
            correct: correctIndex
        };
    });

    if (currentQuestions.length === 0) {
        showToast('This quiz has no questions!', 'error');
        setTimeout(() => redirectTo('dashboard.html'), 1000);
        return;
    }

    // Reset state
    currentIndex = 0;
    userAnswers = {};
    markedQuestions = {};
    lives = maxLives;
    isQuizActive = true;
    tabSwitchCount = 0;
    quizStartTime = Date.now();

    totalTime = currentQuiz.duration * 60;
    timeRemaining = totalTime;

    // Update UI
    document.getElementById('quizTitle').textContent = currentQuiz.title;
    document.getElementById('totalQuestions').textContent = currentQuestions.length;
    updateLivesDisplay();

    // Request full screen
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    }

    // Start timers
    startTimer();
    loadQuestion(0);
    updatePalette();
}

// ============================================================
//  TIMERS
// ============================================================
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isTabActive) return;
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            clearInterval(questionTimerInterval);
            showToast('⏰ Time is up! Auto-submitting...', 'error');
            setTimeout(() => submitQuiz(), 1000);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timerDisplay');
    if (timerElement) {
        const mins = Math.floor(timeRemaining / 60);
        const secs = timeRemaining % 60;
        timerElement.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        const warning = timeRemaining < 60;
        timerElement.parentElement.classList.toggle('warning', warning);
    }
}

function startQuestionTimer() {
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    let qTime = 30; // 30 seconds per question
    
    const qTimerDisplay = document.getElementById('questionTimerDisplay');
    const qTimerFill = document.getElementById('qTimerFill');
    
    qTimerDisplay.textContent = qTime + 's';
    qTimerFill.style.width = '100%';
    qTimerFill.classList.remove('warning');
    
    questionTimerInterval = setInterval(() => {
        if (!isTabActive) return;
        qTime--;
        qTimerDisplay.textContent = qTime + 's';
        const percent = (qTime / 30) * 100;
        qTimerFill.style.width = percent + '%';
        
        if (qTime < 10) {
            qTimerFill.classList.add('warning');
        }
        
        if (qTime <= 0) {
            clearInterval(questionTimerInterval);
            // Auto next question
            showToast('⏰ Time for this question is up!', 'warning');
            if (currentIndex < currentQuestions.length - 1) {
                nextQuestion();
            } else {
                submitQuiz();
            }
        }
    }, 1000);
}

// ============================================================
//  QUESTION LOADING
// ============================================================
function loadQuestion(index) {
    const question = currentQuestions[index];
    if (!question) return;
    
    currentIndex = index;
    
    // Update question number
    document.getElementById('questionNumber').textContent = `Question ${index + 1} of ${currentQuestions.length}`;
    document.getElementById('questionText').textContent = question.text;
    
    // Update progress
    const progress = ((index + 1) / currentQuestions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = `Question ${index + 1} of ${currentQuestions.length}`;
    
    // Reset question timer
    if (questionTimerInterval) {
        clearInterval(questionTimerInterval);
        startQuestionTimer();
    }
    
    // Load options with keyboard shortcuts
    const container = document.getElementById('optionsContainer');
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    container.innerHTML = question.options.map((option, optIndex) => `
        <div class="option-item ${userAnswers[index] === optIndex ? 'selected' : ''}" 
             onclick="selectOption(${index}, ${optIndex})"
             data-key="${optIndex + 1}">
            <input type="radio" name="question_${index}" value="${optIndex}" 
                   ${userAnswers[index] === optIndex ? 'checked' : ''}>
            <label>${letters[optIndex]}. ${option}</label>
            <span class="opt-key">${optIndex + 1}</span>
        </div>
    `).join('');
    
    updatePalette();
    
    // Scroll to top
    document.querySelector('.question-area').scrollTop = 0;
}

function selectOption(questionIndex, optionIndex) {
    userAnswers[questionIndex] = optionIndex;
    
    const container = document.getElementById('optionsContainer');
    const options = container.querySelectorAll('.option-item');
    options.forEach((el, idx) => {
        el.classList.toggle('selected', idx === optionIndex);
        const radio = el.querySelector('input[type="radio"]');
        if (radio) radio.checked = idx === optionIndex;
    });
    
    updatePalette();
    saveProgress();
}

function nextQuestion() {
    if (currentIndex < currentQuestions.length - 1) {
        loadQuestion(currentIndex + 1);
    } else {
        showToast('You are on the last question!');
    }
}

function previousQuestion() {
    if (currentIndex > 0) {
        loadQuestion(currentIndex - 1);
    }
}

function markForReview() {
    markedQuestions[currentIndex] = !markedQuestions[currentIndex];
    updatePalette();
    showToast(markedQuestions[currentIndex] ? '📌 Marked for review' : '📌 Review mark removed');
    saveProgress();
}

function clearAnswer() {
    delete userAnswers[currentIndex];
    const container = document.getElementById('optionsContainer');
    const options = container.querySelectorAll('.option-item');
    options.forEach(el => {
        el.classList.remove('selected');
        const radio = el.querySelector('input[type="radio"]');
        if (radio) radio.checked = false;
    });
    updatePalette();
    showToast('Answer cleared');
    saveProgress();
}

function updatePalette() {
    const grid = document.getElementById('paletteGrid');
    if (!grid) return;
    
    grid.innerHTML = currentQuestions.map((_, idx) => {
        let status = '';
        if (userAnswers[idx] !== undefined) status = 'answered';
        if (markedQuestions[idx]) status = status ? 'answered marked' : 'marked';
        return `
            <button class="palette-btn ${status} ${idx === currentIndex ? 'current' : ''}"
                    onclick="loadQuestion(${idx})">
                ${idx + 1}
            </button>
        `;
    }).join('');
}

// ============================================================
//  SAVE/RESUME PROGRESS
// ============================================================
function saveProgress() {
    const progress = {
        quizId: currentQuiz.id,
        answers: userAnswers,
        marked: markedQuestions,
        index: currentIndex,
        time: timeRemaining,
        lives: lives,
        timestamp: Date.now()
    };
    localStorage.setItem('quiznexus_quiz_progress', JSON.stringify(progress));
}

function loadProgress() {
    const saved = localStorage.getItem('quiznexus_quiz_progress');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.quizId === currentQuiz.id) {
                userAnswers = data.answers || {};
                markedQuestions = data.marked || {};
                currentIndex = data.index || 0;
                timeRemaining = data.time || timeRemaining;
                lives = data.lives || lives;
                updateLivesDisplay();
                loadQuestion(currentIndex);
                updatePalette();
                showToast('🔄 Progress restored from previous session');
                return true;
            }
        } catch(e) {
            console.log('Could not restore progress');
        }
    }
    return false;
}

// ============================================================
//  SUBMIT QUIZ
// ============================================================
function submitQuiz() {
    if (!isQuizActive && lives <= 0) {
        confirmSubmit();
        return;
    }
    
    const answered = Object.keys(userAnswers).length;
    const total = currentQuestions.length;
    
    if (answered < total) {
        document.getElementById('answeredCount').textContent = answered;
        document.getElementById('totalQuestionsModal').textContent = total;
        document.getElementById('markedCount').textContent = Object.keys(markedQuestions).length;
        document.getElementById('modalLives').textContent = lives;
        document.getElementById('submitModal').classList.add('active');
    } else {
        confirmSubmit();
    }
}

function closeModal() {
    document.getElementById('submitModal').classList.remove('active');
}

function confirmSubmit() {
    closeModal();
    isQuizActive = false;
    clearInterval(timerInterval);
    clearInterval(questionTimerInterval);
    
    // Exit full screen
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
    
    // Calculate results
    let correct = 0, wrong = 0, skipped = 0;
    let answerDetails = [];
    
    currentQuestions.forEach((question, idx) => {
        const userAnswer = userAnswers[idx];
        const isCorrect = userAnswer !== undefined && userAnswer === question.correct;
        
        if (userAnswer === undefined) skipped++;
        else if (isCorrect) correct++;
        else wrong++;
        
        answerDetails.push({
            questionIndex: idx,
            userAnswer: userAnswer,
            correctAnswer: question.correct,
            isCorrect: isCorrect,
            questionText: question.text,
            options: question.options
        });
    });
    
    const total = currentQuestions.length;
    const score = correct;
    const percentage = (correct / total) * 100;
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    
    const currentUser = DB.getCurrentUser();
    const results = DB.getResults();
    const newResult = {
        id: 'result_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        userId: currentUser.id,
        quizId: currentQuiz.id,
        quizTitle: currentQuiz.title,
        score: score,
        total: total,
        percentage: percentage,
        correct: correct,
        wrong: wrong,
        skipped: skipped,
        timeTaken: timeTaken,
        livesRemaining: lives,
        maxLives: maxLives,
        answers: answerDetails,
        completedAt: new Date().toISOString()
    };
    results.push(newResult);
    DB.saveResults(results);
    
    sessionStorage.setItem('quiznexus_last_result', JSON.stringify(newResult));
    localStorage.removeItem('quiznexus_quiz_progress');
    
    showToast(`✅ Quiz submitted! Score: ${score}/${total}`);
    setTimeout(() => redirectTo('result.html'), 500);
}

// ============================================================
//  KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', function(e) {
    // Number keys 1-9 for options
    if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key) - 1;
        const options = document.querySelectorAll('.option-item');
        if (options[num]) {
            options[num].click();
        }
        return;
    }
    
    // Arrow keys
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextQuestion();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        previousQuestion();
    } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        markForReview();
    } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        clearAnswer();
    } else if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        submitQuiz();
    } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullScreen();
    }
});

// ============================================================
//  UTILITY
// ============================================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function closeTabWarning() {
    document.getElementById('tabWarning').classList.remove('active');
    isTabActive = true;
    if (lives > 0 && isQuizActive) {
        startTimer();
        startQuestionTimer();
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
//  PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        redirectTo('login.html');
        return;
    }
    
    initParticles();
    loadQuiz();
    
    // Load saved progress after quiz is loaded
    setTimeout(() => {
        loadProgress();
    }, 500);
});

// ============================================================
//  GLOBAL EXPORTS
// ============================================================
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.markForReview = markForReview;
window.clearAnswer = clearAnswer;
window.selectOption = selectOption;
window.loadQuestion = loadQuestion;
window.submitQuiz = submitQuiz;
window.closeModal = closeModal;
window.confirmSubmit = confirmSubmit;
window.toggleFullScreen = toggleFullScreen;
window.closeTabWarning = closeTabWarning;
window.closeLostLifeModal = closeLostLifeModal;