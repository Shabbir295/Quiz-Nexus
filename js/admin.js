/**
 * QuizNexus - Admin Module (Complete Working)
 */

// ============================================================
//  DATABASE
// ============================================================
const DB = {
    QUIZZES: 'quiznexus_quizzes',
    USERS: 'quiznexus_users',
    RESULTS: 'quiznexus_results',
    SETTINGS: 'quiznexus_settings',
    ADMIN_SESSION: 'quiznexus_admin_session',
    QUESTION_BANK: 'quiznexus_question_bank',
    
    getQuizzes() {
        return JSON.parse(localStorage.getItem(this.QUIZZES)) || [];
    },
    saveQuizzes(quizzes) {
        localStorage.setItem(this.QUIZZES, JSON.stringify(quizzes));
    },
    getQuizById(id) {
        return this.getQuizzes().find(q => q.id === id) || null;
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
            questions: quizData.questions || [],
            published: quizData.published !== undefined ? quizData.published : true,
            createdBy: 'admin',
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
        let quizzes = this.getQuizzes();
        quizzes = quizzes.filter(q => q.id !== id);
        this.saveQuizzes(quizzes);
        return quizzes;
    },
    getUsers() {
        return JSON.parse(localStorage.getItem(this.USERS)) || [];
    },
    getResults() {
        return JSON.parse(localStorage.getItem(this.RESULTS)) || [];
    },
    getSettings() {
        return JSON.parse(localStorage.getItem(this.SETTINGS)) || { theme: 'dark' };
    },
    saveSettings(settings) {
        localStorage.setItem(this.SETTINGS, JSON.stringify(settings));
    },
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
    }
};

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

function logout() {
    localStorage.removeItem('quiznexus_admin_session');
    localStorage.removeItem('quiznexus_current_user');
    showToast('Logged out');
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

// ============================================================
//  LOAD QUIZZES
// ============================================================
let allQuizzes = [];

function loadQuizzes() {
    allQuizzes = DB.getQuizzes();
    renderQuizzes(allQuizzes);
    populateCategoryFilter(allQuizzes);
}

function renderQuizzes(quizzes) {
    const grid = document.getElementById('quizGrid');
    if (!grid) return;
    
    if (quizzes.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);">No quizzes created yet</p>';
        return;
    }
    
    grid.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card glass">
            <div class="card-top">
                <div class="title">${quiz.title}</div>
                <span class="badge ${quiz.published ? 'published' : 'hidden'}">
                    ${quiz.published ? '✅ Published' : '🔒 Hidden'}
                </span>
            </div>
            <div class="description">${quiz.description || 'No description'}</div>
            <div class="meta">
                <span><i class="fas fa-question-circle"></i> ${quiz.questions?.length || 0} questions</span>
                <span><i class="fas fa-clock"></i> ${quiz.duration} min</span>
                <span><i class="fas fa-signal"></i> ${quiz.difficulty || 'Medium'}</span>
                <span><i class="fas fa-tag"></i> ${quiz.category || 'General'}</span>
            </div>
            <div class="card-actions">
                <button class="btn-icon edit" onclick="editQuiz('${quiz.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn-icon copy" onclick="duplicateQuiz('${quiz.id}')"><i class="fas fa-copy"></i> Copy</button>
                <button class="btn-icon hide" onclick="togglePublish('${quiz.id}')"><i class="fas ${quiz.published ? 'fa-eye-slash' : 'fa-eye'}"></i> ${quiz.published ? 'Hide' : 'Publish'}</button>
                <button class="btn-icon questions" onclick="manageQuestions('${quiz.id}')"><i class="fas fa-list"></i> Questions</button>
                <button class="btn-icon delete" onclick="deleteQuiz('${quiz.id}')"><i class="fas fa-trash"></i> Delete</button>
            </div>
        </div>
    `).join('');
}

function filterQuizzes() {
    const search = document.getElementById('searchQuizzes')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    
    let filtered = allQuizzes;
    
    if (search) {
        filtered = filtered.filter(q => 
            q.title.toLowerCase().includes(search) || 
            (q.description || '').toLowerCase().includes(search)
        );
    }
    
    if (category) {
        filtered = filtered.filter(q => (q.category || 'General') === category);
    }
    
    if (status) {
        filtered = filtered.filter(q => 
            status === 'published' ? q.published : !q.published
        );
    }
    
    renderQuizzes(filtered);
}

function populateCategoryFilter(quizzes) {
    const select = document.getElementById('categoryFilter');
    if (!select) return;
    
    const categories = new Set(quizzes.map(q => q.category || 'General'));
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    select.value = currentValue;
}

// ============================================================
//  QUIZ BUILDER
// ============================================================
let editingQuizId = null;
let tempQuestions = [];

function openQuizBuilder(quiz = null) {
    editingQuizId = quiz?.id || null;
    tempQuestions = quiz?.questions ? JSON.parse(JSON.stringify(quiz.questions)) : [];
    
    document.getElementById('builderTitle').textContent = quiz ? '✏️ Edit Quiz' : '📝 Create New Quiz';
    document.getElementById('quizTitle').value = quiz?.title || '';
    document.getElementById('quizDescription').value = quiz?.description || '';
    document.getElementById('quizDuration').value = quiz?.duration || 10;
    document.getElementById('quizCategory').value = quiz?.category || 'General';
    document.getElementById('quizDifficulty').value = quiz?.difficulty || 'Medium';
    
    renderAddedQuestions();
    document.getElementById('questionsContainer').innerHTML = '';
    addQuestionField();
    
    document.getElementById('quizBuilderModal').classList.add('active');
}

function closeQuizBuilder() {
    document.getElementById('quizBuilderModal').classList.remove('active');
    editingQuizId = null;
    tempQuestions = [];
}

function addQuestionField() {
    const container = document.getElementById('questionsContainer');
    const qIndex = container.children.length;
    const div = document.createElement('div');
    div.className = 'question-builder';
    div.innerHTML = `
        <div class="q-header">
            <h4>❓ Question ${qIndex + 1}</h4>
            <button class="action-btn glass" onclick="this.closest('.question-builder').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="input-group">
            <input type="text" class="q-text" placeholder="Enter question text..." value="">
        </div>
        <div class="options-grid">
            <div class="opt-input"><label>A.</label><input type="text" class="opt-input-a" placeholder="Option A" value=""></div>
            <div class="opt-input"><label>B.</label><input type="text" class="opt-input-b" placeholder="Option B" value=""></div>
            <div class="opt-input"><label>C.</label><input type="text" class="opt-input-c" placeholder="Option C" value=""></div>
            <div class="opt-input"><label>D.</label><input type="text" class="opt-input-d" placeholder="Option D" value=""></div>
        </div>
        <div class="correct-option">
            <label>✅ Correct Answer:</label>
            <select class="q-correct">
                <option value="0">A</option>
                <option value="1">B</option>
                <option value="2">C</option>
                <option value="3">D</option>
            </select>
            <button class="action-btn success-outline" onclick="addQuestionToList(this)"><i class="fas fa-plus"></i> Add</button>
        </div>
    `;
    container.appendChild(div);
}

function addQuestionToList(btn) {
    const builder = btn.closest('.question-builder');
    const text = builder.querySelector('.q-text').value.trim();
    const optA = builder.querySelector('.opt-input-a').value.trim();
    const optB = builder.querySelector('.opt-input-b').value.trim();
    const optC = builder.querySelector('.opt-input-c').value.trim();
    const optD = builder.querySelector('.opt-input-d').value.trim();
    const correct = parseInt(builder.querySelector('.q-correct').value);
    
    if (!text) { showToast('Please enter question text', 'error'); return; }
    if (!optA || !optB || !optC || !optD) { showToast('Please fill all options', 'error'); return; }
    
    tempQuestions.push({
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        text: text,
        options: [optA, optB, optC, optD],
        correct: correct,
        explanation: ''
    });
    
    builder.querySelector('.q-text').value = '';
    builder.querySelector('.opt-input-a').value = '';
    builder.querySelector('.opt-input-b').value = '';
    builder.querySelector('.opt-input-c').value = '';
    builder.querySelector('.opt-input-d').value = '';
    builder.querySelector('.q-correct').value = '0';
    
    renderAddedQuestions();
    showToast('✅ Question added!');
}

function renderAddedQuestions() {
    const container = document.getElementById('addedQuestionsList');
    if (!container) return;
    
    if (tempQuestions.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);padding:12px;text-align:center;">No questions added yet.</p>';
        return;
    }
    
    container.innerHTML = tempQuestions.map((q, idx) => `
        <div class="question-list-item">
            <div class="q-info">
                <strong>Q${idx + 1}: ${q.text}</strong>
                <small>Options: ${q.options.join(' · ')} | ✅ Correct: ${q.options[q.correct]}</small>
            </div>
            <div class="q-actions">
                <button class="action-btn danger-outline" onclick="removeQuestion(${idx})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function removeQuestion(index) {
    tempQuestions.splice(index, 1);
    renderAddedQuestions();
    showToast('Question removed');
}

function addFromBank() {
    const bank = DB.getQuestionBank();
    if (bank.length === 0) {
        showToast('Question bank is empty!', 'error');
        return;
    }
    bank.forEach(q => {
        tempQuestions.push({
            id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            text: q.text,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation || ''
        });
    });
    renderAddedQuestions();
    showToast(`✅ Added ${bank.length} questions from bank`);
}

function saveQuizBuilder() {
    const title = document.getElementById('quizTitle').value.trim();
    const description = document.getElementById('quizDescription').value.trim();
    const duration = document.getElementById('quizDuration').value;
    const category = document.getElementById('quizCategory').value;
    const difficulty = document.getElementById('quizDifficulty').value;
    
    if (!title) { showToast('Please enter quiz title', 'error'); return; }
    if (!duration || duration < 1) { showToast('Please enter valid duration', 'error'); return; }
    if (tempQuestions.length === 0) { showToast('Please add at least one question', 'error'); return; }
    
    const quizData = {
        title,
        description,
        duration: parseInt(duration),
        category,
        difficulty,
        questions: tempQuestions,
        published: true
    };
    
    if (editingQuizId) {
        DB.updateQuiz(editingQuizId, quizData);
        showToast('✅ Quiz updated successfully!');
    } else {
        DB.createQuiz(quizData);
        showToast('✅ Quiz published successfully!');
    }
    
    closeQuizBuilder();
    loadQuizzes();
}

// ============================================================
//  QUIZ ACTIONS
// ============================================================
function editQuiz(quizId) {
    const quiz = DB.getQuizById(quizId);
    if (!quiz) { showToast('Quiz not found!', 'error'); return; }
    openQuizBuilder(quiz);
}

function duplicateQuiz(quizId) {
    const quiz = DB.getQuizById(quizId);
    if (!quiz) { showToast('Quiz not found!', 'error'); return; }
    
    const newQuiz = DB.createQuiz({
        title: quiz.title + ' (Copy)',
        description: quiz.description || '',
        duration: quiz.duration || 10,
        category: quiz.category || 'General',
        difficulty: quiz.difficulty || 'Medium',
        questions: JSON.parse(JSON.stringify(quiz.questions || [])),
        published: false
    });
    
    if (newQuiz) {
        showToast('✅ Quiz duplicated successfully!');
        loadQuizzes();
    }
}

function togglePublish(quizId) {
    const quiz = DB.getQuizById(quizId);
    if (!quiz) { showToast('Quiz not found!', 'error'); return; }
    
    const newStatus = !quiz.published;
    DB.updateQuiz(quizId, { published: newStatus });
    showToast(`✅ Quiz ${newStatus ? 'published' : 'hidden'} successfully!`);
    loadQuizzes();
}

function deleteQuiz(quizId) {
    if (!confirm('⚠️ Are you sure you want to delete this quiz permanently?')) return;
    
    const quiz = DB.getQuizById(quizId);
    if (!quiz) { showToast('Quiz not found!', 'error'); return; }
    
    DB.deleteQuiz(quizId);
    showToast('🗑️ Quiz deleted successfully!');
    loadQuizzes();
}

function manageQuestions(quizId) {
    const quiz = DB.getQuizById(quizId);
    if (!quiz) { showToast('Quiz not found!', 'error'); return; }
    showToast(`📋 "${quiz.title}" has ${quiz.questions?.length || 0} questions.`, 'info');
}

// ============================================================
//  QUESTION BANK
// ============================================================
let bankVisible = false;

function toggleQuestionBank() {
    const panel = document.getElementById('questionBankPanel');
    bankVisible = !bankVisible;
    panel.style.display = bankVisible ? 'block' : 'none';
    if (bankVisible) loadQuestionBank();
}

function loadQuestionBank() {
    const container = document.getElementById('questionBankList');
    if (!container) return;
    
    const bank = DB.getQuestionBank();
    if (bank.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">Question bank is empty</p>';
        return;
    }
    
    container.innerHTML = bank.map(q => `
        <div class="bank-item">
            <div class="q-text">${q.text}</div>
            <div class="q-options">${q.options.join(' · ')}</div>
            <div class="q-actions">
                <button class="action-btn success-outline" onclick="addBankQuestionToQuiz('${q.id}')"><i class="fas fa-plus"></i></button>
                <button class="action-btn danger-outline" onclick="removeFromBank('${q.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function addBankQuestionToQuiz(id) {
    const bank = DB.getQuestionBank();
    const question = bank.find(q => q.id === id);
    if (!question) return;
    
    tempQuestions.push({
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        text: question.text,
        options: question.options,
        correct: question.correct,
        explanation: question.explanation || ''
    });
    
    renderAddedQuestions();
    showToast('✅ Question added to quiz');
}

function addQuestionToBank() {
    const text = prompt('Enter question text:');
    if (!text) return;
    
    const options = [];
    for (let i = 0; i < 4; i++) {
        const opt = prompt(`Option ${String.fromCharCode(65 + i)}:`);
        if (opt === null) return;
        options.push(opt);
    }
    
    const correct = parseInt(prompt('Correct option index (0-3):'));
    if (isNaN(correct) || correct < 0 || correct > 3) {
        showToast('Invalid correct option', 'error');
        return;
    }
    
    DB.addToQuestionBank({ text, options, correct });
    loadQuestionBank();
    showToast('✅ Question added to bank');
}

function removeFromBank(id) {
    if (!confirm('Remove this question from bank?')) return;
    DB.removeFromQuestionBank(id);
    loadQuestionBank();
    showToast('Question removed from bank');
}

// ============================================================
//  IMPORT JSON - SUPPORTS YOUR FORMAT
// ============================================================
function importQuizJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) {
            showToast('No file selected', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                console.log('✅ JSON parsed:', data);
                
                let importedCount = 0;
                
                // ============================================================
                //  YOUR FORMAT: { "quiz_title": "...", "questions": [...] }
                // ============================================================
                if (data.quiz_title && data.questions && Array.isArray(data.questions)) {
                    console.log('📂 Processing your quiz format:', data.quiz_title);
                    
                    const quizData = {
                        title: data.quiz_title,
                        description: data.description || data.quiz_description || '',
                        duration: data.duration || (data.total_questions ? Math.min(data.total_questions, 30) : 10),
                        category: data.category || 'General',
                        difficulty: data.difficulty || 'Medium',
                        published: true,
                        questions: data.questions.map(q => {
                            let options = q.options || [];
                            let correct = 0;
                            
                            // If answer is text like "Interpreted", find its index
                            if (q.answer && typeof q.answer === 'string') {
                                correct = options.indexOf(q.answer);
                                if (correct === -1) correct = 0;
                            }
                            // If answer is number
                            else if (typeof q.answer === 'number') {
                                correct = q.answer;
                            }
                            // If correct_answer field exists
                            else if (q.correct_answer !== undefined) {
                                correct = q.correct_answer;
                            }
                            // If correct field exists
                            else if (q.correct !== undefined) {
                                correct = q.correct;
                            }
                            
                            return {
                                id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                                text: q.question || q.text || 'Question',
                                options: options.length > 0 ? options : ['A', 'B', 'C', 'D'],
                                correct: correct,
                                explanation: q.explanation || q.explain || ''
                            };
                        })
                    };
                    
                    DB.createQuiz(quizData);
                    importedCount++;
                    console.log(`✅ Quiz imported: "${data.quiz_title}"`);
                }
                // ============================================================
                //  YOUR FORMAT: Array of { "quiz_title": "...", "questions": [...] }
                // ============================================================
                else if (Array.isArray(data) && data.length > 0 && data[0].quiz_title) {
                    console.log('📂 Processing array of your quiz format:', data.length);
                    data.forEach(item => {
                        if (item.quiz_title && item.questions) {
                            const quizData = {
                                title: item.quiz_title,
                                description: item.description || '',
                                duration: item.duration || 10,
                                category: item.category || 'General',
                                difficulty: item.difficulty || 'Medium',
                                published: true,
                                questions: item.questions.map(q => {
                                    let options = q.options || [];
                                    let correct = 0;
                                    if (q.answer && typeof q.answer === 'string') {
                                        correct = options.indexOf(q.answer);
                                        if (correct === -1) correct = 0;
                                    } else if (typeof q.answer === 'number') {
                                        correct = q.answer;
                                    } else if (q.correct !== undefined) {
                                        correct = q.correct;
                                    }
                                    return {
                                        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                                        text: q.question || q.text || 'Question',
                                        options: options.length > 0 ? options : ['A', 'B', 'C', 'D'],
                                        correct: correct,
                                        explanation: q.explanation || ''
                                    };
                                })
                            };
                            DB.createQuiz(quizData);
                            importedCount++;
                        }
                    });
                }
                // ============================================================
                //  STANDARD FORMAT: { "title": "...", "questions": [...] }
                // ============================================================
                else if (data.title && data.questions && Array.isArray(data.questions)) {
                    console.log('📂 Processing standard quiz format:', data.title);
                    DB.createQuiz({
                        title: data.title,
                        description: data.description || '',
                        duration: data.duration || 10,
                        category: data.category || 'General',
                        difficulty: data.difficulty || 'Medium',
                        questions: data.questions.map(q => ({
                            id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                            text: q.question || q.text || 'Question',
                            options: q.options || ['A', 'B', 'C', 'D'],
                            correct: q.answer ? (q.options ? q.options.indexOf(q.answer) : 0) : (q.correct || 0),
                            explanation: q.explanation || ''
                        })),
                        published: true
                    });
                    importedCount++;
                }
                // ============================================================
                //  STANDARD ARRAY FORMAT: [{ "title": "...", "questions": [...] }]
                // ============================================================
                else if (Array.isArray(data) && data.length > 0 && data[0].title && data[0].questions) {
                    console.log('📂 Processing standard array format:', data.length);
                    data.forEach(item => {
                        if (item.title && item.questions) {
                            DB.createQuiz({
                                title: item.title,
                                description: item.description || '',
                                duration: item.duration || 10,
                                category: item.category || 'General',
                                difficulty: item.difficulty || 'Medium',
                                questions: item.questions.map(q => ({
                                    id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                                    text: q.question || q.text || 'Question',
                                    options: q.options || ['A', 'B', 'C', 'D'],
                                    correct: q.answer ? (q.options ? q.options.indexOf(q.answer) : 0) : (q.correct || 0),
                                    explanation: q.explanation || ''
                                })),
                                published: true
                            });
                            importedCount++;
                        }
                    });
                }
                // ============================================================
                //  QUESTION BANK FORMAT
                // ============================================================
                else if (data.text && data.options) {
                    DB.addToQuestionBank({
                        text: data.text,
                        options: data.options,
                        correct: data.correct || 0,
                        explanation: data.explanation || ''
                    });
                    showToast('✅ Question added to bank!');
                    loadQuizzes();
                    return;
                }
                else {
                    console.error('❌ Invalid format:', data);
                    showToast('❌ Invalid format! Please check your JSON structure.', 'error');
                    return;
                }
                
                if (importedCount > 0) {
                    showToast(`✅ ${importedCount} quiz(zes) imported successfully!`);
                    loadQuizzes();
                } else {
                    showToast('❌ No valid quizzes found in file.', 'error');
                }
                
            } catch(err) {
                console.error('❌ Import error:', err);
                showToast('❌ Error parsing JSON: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ============================================================
//  EXPORT JSON
// ============================================================
function exportQuizJSON() {
    const quizzes = DB.getQuizzes();
    const data = JSON.stringify(quizzes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quizzes_export.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 Quizzes exported');
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
    if (!localStorage.getItem('quiznexus_admin_session')) {
        redirectTo('admin-login.html');
        return;
    }
    const settings = DB.getSettings();
    if (settings.theme) applyTheme(settings.theme);
    initParticles();
    loadQuizzes();
});

// ============================================================
//  GLOBAL EXPORTS
// ============================================================
window.loadQuizzes = loadQuizzes;
window.filterQuizzes = filterQuizzes;
window.openQuizBuilder = openQuizBuilder;
window.closeQuizBuilder = closeQuizBuilder;
window.addQuestionField = addQuestionField;
window.addQuestionToList = addQuestionToList;
window.removeQuestion = removeQuestion;
window.addFromBank = addFromBank;
window.saveQuizBuilder = saveQuizBuilder;
window.editQuiz = editQuiz;
window.duplicateQuiz = duplicateQuiz;
window.togglePublish = togglePublish;
window.deleteQuiz = deleteQuiz;
window.manageQuestions = manageQuestions;
window.toggleQuestionBank = toggleQuestionBank;
window.addQuestionToBank = addQuestionToBank;
window.addBankQuestionToQuiz = addBankQuestionToQuiz;
window.removeFromBank = removeFromBank;
window.importQuizJSON = importQuizJSON;
window.exportQuizJSON = exportQuizJSON;
window.logout = logout;
window.showToast = showToast;
// ============================================================
//  SERVER MANAGEMENT FUNCTIONS - Add to admin.js
// ============================================================

function loadServers() {
    // This function is now in manage-servers.html
    // Keep it here for compatibility
}

function getServerStats() {
    const servers = DB.getServers();
    const users = DB.getUsers();
    const quizzes = DB.getQuizzes();
    
    return servers.map(server => ({
        ...server,
        userCount: users.filter(u => u.serverId === server.id).length,
        quizCount: quizzes.filter(q => q.serverId === server.id).length
    }));
}

function getServerUsers(serverId) {
    return DB.getUsers().filter(u => u.serverId === serverId);
}

function getServerQuizzes(serverId) {
    return DB.getQuizzes().filter(q => q.serverId === serverId);
}

function getServerResults(serverId) {
    return DB.getResults().filter(r => r.serverId === serverId);
}