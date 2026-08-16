/**
 * QuizNexus - Settings Module
 * User preferences and theme management
 */

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        redirectTo('login.html');
        return;
    }

    loadSettings();

    // Theme toggle buttons
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.textContent.includes('Dark') ? 'dark' : 'light';
            setTheme(theme);
        });
    });

    // Settings toggles
    ['animationsToggle', 'notificationsToggle', 'soundToggle'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function() {
                saveSetting(id.replace('Toggle', ''), this.checked);
            });
        }
    });

    // Font size
    const fontSize = document.getElementById('fontSize');
    if (fontSize) {
        fontSize.addEventListener('change', function() {
            setFontSize(this.value);
        });
    }

    // Language
    const language = document.getElementById('language');
    if (language) {
        language.addEventListener('change', function() {
            setLanguage(this.value);
        });
    }
});

function loadSettings() {
    const settings = DB.getSettings();
    
    // Theme
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(btn => {
        const theme = btn.textContent.includes('Dark') ? 'dark' : 'light';
        btn.classList.toggle('active', settings.theme === theme);
    });

    // Toggles
    document.getElementById('animationsToggle').checked = settings.animations !== false;
    document.getElementById('notificationsToggle').checked = settings.notifications !== false;
    document.getElementById('soundToggle').checked = settings.sound !== false;

    // Font size
    document.getElementById('fontSize').value = settings.fontSize || 'medium';

    // Language
    document.getElementById('language').value = settings.language || 'en';

    // Accent color
    document.getElementById('accentColor').value = settings.accentColor || '#00e676';
}

function setTheme(theme) {
    const settings = DB.getSettings();
    settings.theme = theme;
    DB.saveSettings(settings);
    
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update active state
    document.querySelectorAll('.theme-option').forEach(btn => {
        const btnTheme = btn.textContent.includes('Dark') ? 'dark' : 'light';
        btn.classList.toggle('active', btnTheme === theme);
    });

    // Update theme toggle icons
    document.querySelectorAll('.theme-toggle i').forEach(icon => {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    });

    showToast(`Theme switched to ${theme} mode`);
}

function setAccentColor(color) {
    const settings = DB.getSettings();
    settings.accentColor = color;
    DB.saveSettings(settings);
    
    document.documentElement.style.setProperty('--accent', color);
    showToast('Accent color updated');
}

function setFontSize(size) {
    const settings = DB.getSettings();
    settings.fontSize = size;
    DB.saveSettings(settings);

    const sizes = {
        small: '14px',
        medium: '16px',
        large: '18px'
    };
    document.documentElement.style.fontSize = sizes[size] || '16px';
    showToast(`Font size set to ${size}`);
}

function setLanguage(lang) {
    const settings = DB.getSettings();
    settings.language = lang;
    DB.saveSettings(settings);
    showToast(`Language set to ${lang.toUpperCase()}`);
}

function saveSetting(key, value) {
    const settings = DB.getSettings();
    settings[key] = value;
    DB.saveSettings(settings);
}

function resetSettings() {
    if (confirm('Reset all settings to default?')) {
        const defaultSettings = {
            theme: 'dark',
            accentColor: '#00e676',
            animations: true,
            notifications: true,
            sound: true,
            fontSize: 'medium',
            language: 'en'
        };
        DB.saveSettings(defaultSettings);
        loadSettings();
        applyAllSettings(defaultSettings);
        showToast('Settings reset to default');
    }
}

function applyAllSettings(settings) {
    // Theme
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.style.setProperty('--accent', settings.accentColor);
    document.documentElement.style.fontSize = {
        small: '14px',
        medium: '16px',
        large: '18px'
    }[settings.fontSize] || '16px';
}

function clearAllData() {
    if (confirm('⚠️ This will delete ALL data including users, quizzes, and results. Are you sure?')) {
        if (confirm('Final confirmation: This action cannot be undone!')) {
            DB.clearAll();
            showToast('All data cleared');
            setTimeout(() => redirectTo('login.html'), 500);
        }
    }
}