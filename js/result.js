/**
 * QuizNexus - Result Module (Phase 3)
 * Features: Certificate, Share, Answer Review, Topic Performance
 */

// ============================================================
//  DATABASE
// ============================================================
const DB = {
    RESULTS: 'quiznexus_results',
    USERS: 'quiznexus_users',
    CURRENT_USER: 'quiznexus_current_user',
    getResults() {
        return JSON.parse(localStorage.getItem(this.RESULTS)) || [];
    },
    getUsers() {
        return JSON.parse(localStorage.getItem(this.USERS)) || [];
    },
    getResultById(id) {
        return this.getResults().find(r => r.id === id) || null;
    },
    getCurrentUser() {
        const data = localStorage.getItem(this.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    },
    getUserById(id) {
        return this.getUsers().find(u => u.id === id) || null;
    }
};

// ============================================================
//  STATE
// ============================================================
let resultData = null;
let currentUser = null;
let showCertificate = false;

// ============================================================
//  TOAST
// ============================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
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
//  DISPLAY RESULT
// ============================================================
function displayResult(result, user) {
    resultData = result;
    currentUser = user;
    
    // Score
    document.getElementById('scoreDisplay').textContent = result.score;
    document.getElementById('percentageDisplay').textContent = result.percentage.toFixed(1) + '%';
    document.getElementById('quizTitleDisplay').textContent = result.quizTitle || 'Quiz';
    
    // Details
    document.getElementById('correctCount').textContent = result.correct;
    document.getElementById('wrongCount').textContent = result.wrong;
    document.getElementById('skippedCount').textContent = result.skipped;
    document.getElementById('timeTaken').textContent = result.timeTaken + 's';
    
    // Lives
    const livesDisplay = document.getElementById('livesDisplay');
    if (result.livesRemaining !== undefined) {
        const hearts = '❤️'.repeat(result.livesRemaining) + '🖤'.repeat(Math.max(0, 3 - result.livesRemaining));
        livesDisplay.textContent = `❤️ Lives Remaining: ${result.livesRemaining}`;
    } else {
        livesDisplay.textContent = '❤️ Lives Remaining: 3';
    }
    
    // Grade
    const grade = getGrade(result.percentage);
    document.getElementById('gradeDisplay').textContent = grade;
    document.getElementById('gradeDisplay').className = 'stat-value ' + getGradeClass(grade);
    
    // Rank
    const allResults = DB.getResults();
    const betterScores = allResults.filter(r => r.percentage > result.percentage);
    const rank = betterScores.length + 1;
    document.getElementById('rankDisplay').textContent = '#' + rank;
    
    // Load charts
    loadResultCharts(result);
    
    // Load topic performance
    loadTopicPerformance(result);
    
    // Load answer review
    loadAnswerReview(result);
    
    // Confetti for good score
    if (result.percentage >= 70) {
        launchConfetti();
    }
    
    // Update user XP
    const xpEarned = Math.floor(result.score * 10);
    // XP update handled in storage
    
    // Store for PDF/Certificate
    window.currentResult = result;
    window.currentUser = user;
}

// ============================================================
//  GRADE SYSTEM
// ============================================================
function getGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
}

function getGradeClass(grade) {
    if (grade === 'A+' || grade === 'A') return 'gold';
    if (grade === 'B+' || grade === 'B') return 'silver';
    if (grade === 'C+' || grade === 'C') return 'bronze';
    return 'red';
}

// ============================================================
//  CHARTS
// ============================================================
function loadResultCharts(result) {
    // Doughnut chart
    const canvas = document.getElementById('resultChart');
    if (canvas) {
        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Wrong', 'Skipped'],
                datasets: [{
                    data: [result.correct, result.wrong, result.skipped],
                    backgroundColor: ['#00e676', '#ff6b6b', '#ffc107'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#a0c9a8',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
    
    // Accuracy chart
    const accuracyCanvas = document.getElementById('accuracyChart');
    if (accuracyCanvas) {
        const accuracy = (result.correct / result.total) * 100;
        const avg = 50; // Average benchmark
        
        new Chart(accuracyCanvas, {
            type: 'bar',
            data: {
                labels: ['Your Score', 'Average'],
                datasets: [{
                    label: 'Percentage',
                    data: [accuracy, avg],
                    backgroundColor: [accuracy >= 60 ? '#00e676' : '#ff6b6b', 'rgba(255,255,255,0.1)'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        max: 100,
                        grid: {
                            color: 'rgba(255,255,255,0.05)'
                        },
                        ticks: {
                            color: '#a0c9a8'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#a0c9a8'
                        }
                    }
                }
            }
        });
    }
}

// ============================================================
//  TOPIC PERFORMANCE
// ============================================================
function loadTopicPerformance(result) {
    const container = document.getElementById('topicPerformance');
    if (!container) return;
    
    // Group questions by topic (using first few words as topic)
    const topics = {};
    const answers = result.answers || [];
    
    answers.forEach((ans, idx) => {
        const questionText = ans.questionText || `Question ${idx + 1}`;
        const topic = questionText.split(' ').slice(0, 3).join(' ') || 'General';
        
        if (!topics[topic]) {
            topics[topic] = { correct: 0, total: 0 };
        }
        topics[topic].total++;
        if (ans.isCorrect) topics[topic].correct++;
    });
    
    const topicEntries = Object.entries(topics);
    if (topicEntries.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.9rem;">No topic data available</p>';
        return;
    }
    
    container.innerHTML = topicEntries.map(([topic, data]) => {
        const percent = (data.correct / data.total) * 100;
        const color = percent >= 70 ? '#00e676' : percent >= 40 ? '#ffc107' : '#ff6b6b';
        return `
            <div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:4px;">
                    <span>${topic}</span>
                    <span style="color:${color};font-weight:600;">${data.correct}/${data.total} (${percent.toFixed(0)}%)</span>
                </div>
                <div style="height:6px;background:rgba(255,255,255,0.05);border-radius:8px;overflow:hidden;">
                    <div style="height:100%;width:${percent}%;background:${color};border-radius:8px;transition:width 0.8s ease;"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
//  ANSWER REVIEW
// ============================================================
function loadAnswerReview(result) {
    const container = document.getElementById('answerReview');
    if (!container) return;
    
    const answers = result.answers || [];
    if (answers.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.9rem;text-align:center;padding:20px;">No answer data available</p>';
        return;
    }
    
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    container.innerHTML = answers.map((ans, idx) => {
        const isCorrect = ans.isCorrect;
        const status = isCorrect ? 'correct' : (ans.userAnswer === undefined ? 'skipped' : 'wrong');
        const icon = isCorrect ? '✅' : (ans.userAnswer === undefined ? '⏭️' : '❌');
        
        const userOption = ans.userAnswer !== undefined ? letters[ans.userAnswer] : '—';
        const correctOption = ans.correctAnswer !== undefined ? letters[ans.correctAnswer] : '—';
        
        return `
            <div class="answer-item">
                <span class="q-num">Q${idx + 1}</span>
                <span class="q-text">${ans.questionText || 'Question'}</span>
                <span class="q-answer">Your: ${userOption} | Correct: ${correctOption}</span>
                <span class="q-result ${status}">${icon}</span>
            </div>
        `;
    }).join('');
}

// ============================================================
//  CERTIFICATE
// ============================================================
function toggleCertificate() {
    const container = document.getElementById('certificateContainer');
    showCertificate = !showCertificate;
    container.classList.toggle('show', showCertificate);
    
    if (showCertificate) {
        const result = window.currentResult;
        const user = window.currentUser;
        
        document.getElementById('certUserName').textContent = user ? user.fullName : 'User';
        document.getElementById('certScore').textContent = result.percentage.toFixed(1) + '%';
        document.getElementById('certQuizName').textContent = result.quizTitle || 'Quiz';
        document.getElementById('certDate').textContent = 'Date: ' + new Date().toLocaleDateString();
    }
}

// ============================================================
//  SHARE RESULTS
// ============================================================
function shareResult(platform) {
    const result = window.currentResult;
    const user = window.currentUser;
    
    const text = `🎯 I scored ${result.percentage.toFixed(1)}% on "${result.quizTitle}" quiz! 🏆\n\n📊 Score: ${result.score}/${result.total}\n✅ Correct: ${result.correct}\n❌ Wrong: ${result.wrong}\n⏭️ Skipped: ${result.skipped}\n\n💪 Test your knowledge at QuizNexus!`;
    const url = window.location.href;
    const shareUrl = `https://quiznexus.com`;
    
    let shareLink = '';
    switch(platform) {
        case 'whatsapp':
            shareLink = `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + shareUrl)}`;
            break;
        case 'facebook':
            shareLink = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}&u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'linkedin':
            shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            break;
        default:
            showToast('Share feature coming soon!', 'info');
            return;
    }
    
    if (shareLink) {
        window.open(shareLink, '_blank', 'width=600,height=500');
        showToast(`Sharing on ${platform.charAt(0).toUpperCase() + platform.slice(1)}...`);
    }
}

// ============================================================
//  CONFETTI
// ============================================================
function launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const pieces = [];
    const colors = ['#00e676', '#ffd700', '#ff6b6b', '#4fc3f7', '#ff9800', '#e040fb', '#00bcd4'];
    
    for (let i = 0; i < 150; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            width: Math.random() * 8 + 4,
            height: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            velocityX: (Math.random() - 0.5) * 3,
            velocityY: Math.random() * 4 + 2,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            opacity: 1
        });
    }
    
    let animationId;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        pieces.forEach(p => {
            p.y += p.velocityY;
            p.x += p.velocityX;
            p.rotation += p.rotationSpeed;
            if (p.y < canvas.height + 50) {
                active = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
                ctx.restore();
            }
        });
        if (active) {
            animationId = requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.remove();
        }
    }
    animate();
    
    setTimeout(() => {
        if (animationId) cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.remove();
    }, 5000);
}

// ============================================================
//  PDF DOWNLOAD
// ============================================================
function downloadPDF() {
    const result = window.currentResult;
    const user = window.currentUser;
    
    if (!result) {
        showToast('No result data to export!', 'error');
        return;
    }
    
    showToast('📄 Generating PDF... Please wait.');
    
    // Create PDF content
    const content = document.createElement('div');
    content.style.cssText = 'padding:30px;background:#0b1a0e;color:#e2f0e5;font-family:Inter,sans-serif;max-width:800px;margin:0 auto;';
    content.innerHTML = `
        <div style="text-align:center;border-bottom:2px solid #00e676;padding-bottom:16px;margin-bottom:20px;">
            <h1 style="color:#00e676;font-size:1.8rem;">📊 QuizNexus - Result Report</h1>
            <p style="color:#8fb89a;">${result.quizTitle || 'Quiz'}</p>
            <p style="color:#8fb89a;">User: ${user ? user.fullName : 'Unknown'}</p>
            <p style="color:#8fb89a;">Date: ${new Date().toLocaleString()}</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0;">
            <div style="text-align:center;padding:12px;background:rgba(0,230,118,0.05);border-radius:12px;border:1px solid rgba(0,230,118,0.1);">
                <div style="font-size:1.6rem;font-weight:700;color:#00e676;">${result.score}</div>
                <div style="font-size:0.8rem;color:#8fb89a;">Score</div>
            </div>
            <div style="text-align:center;padding:12px;background:rgba(0,230,118,0.05);border-radius:12px;border:1px solid rgba(0,230,118,0.1);">
                <div style="font-size:1.6rem;font-weight:700;color:#00e676;">${result.percentage.toFixed(1)}%</div>
                <div style="font-size:0.8rem;color:#8fb89a;">Percentage</div>
            </div>
            <div style="text-align:center;padding:12px;background:rgba(0,230,118,0.05);border-radius:12px;border:1px solid rgba(0,230,118,0.1);">
                <div style="font-size:1.6rem;font-weight:700;color:#ffd700;">${getGrade(result.percentage)}</div>
                <div style="font-size:0.8rem;color:#8fb89a;">Grade</div>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0;">
            <div style="padding:10px;text-align:center;background:rgba(0,0,0,0.2);border-radius:10px;">
                <div style="font-size:1.2rem;font-weight:700;color:#00e676;">${result.correct}</div>
                <div style="font-size:0.7rem;color:#8fb89a;">Correct</div>
            </div>
            <div style="padding:10px;text-align:center;background:rgba(0,0,0,0.2);border-radius:10px;">
                <div style="font-size:1.2rem;font-weight:700;color:#ff4444;">${result.wrong}</div>
                <div style="font-size:0.7rem;color:#8fb89a;">Wrong</div>
            </div>
            <div style="padding:10px;text-align:center;background:rgba(0,0,0,0.2);border-radius:10px;">
                <div style="font-size:1.2rem;font-weight:700;color:#ffc107;">${result.skipped}</div>
                <div style="font-size:0.7rem;color:#8fb89a;">Skipped</div>
            </div>
            <div style="padding:10px;text-align:center;background:rgba(0,0,0,0.2);border-radius:10px;">
                <div style="font-size:1.2rem;font-weight:700;color:#4fc3f7;">${result.timeTaken}s</div>
                <div style="font-size:0.7rem;color:#8fb89a;">Time Taken</div>
            </div>
        </div>
        <div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid rgba(0,230,118,0.1);color:#8fb89a;font-size:0.8rem;">
            <p>Generated by QuizNexus · Learn • Practice • Compete</p>
        </div>
    `;
    
    document.body.appendChild(content);
    
    const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${result.quizTitle || 'Quiz'}_Results.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(content).save().then(() => {
        document.body.removeChild(content);
        showToast('✅ PDF downloaded successfully!');
    }).catch(() => {
        document.body.removeChild(content);
        showToast('Error generating PDF.', 'error');
    });
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
    
    // Get result from session or URL
    const savedResult = sessionStorage.getItem('quiznexus_last_result');
    if (savedResult) {
        resultData = JSON.parse(savedResult);
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('id');
        if (resultId) {
            resultData = DB.getResultById(resultId);
        }
    }
    
    if (!resultData) {
        showToast('No result found!', 'error');
        setTimeout(() => redirectTo('dashboard.html'), 1000);
        return;
    }
    
    displayResult(resultData, currentUser);
});

// ============================================================
//  GLOBAL EXPORTS
// ============================================================
window.downloadPDF = downloadPDF;
window.toggleCertificate = toggleCertificate;
window.shareResult = shareResult;