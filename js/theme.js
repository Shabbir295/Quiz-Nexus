/**
 * QuizNexus - Theme Management
 * Handles dark/light mode and accent colors
 */

document.addEventListener('DOMContentLoaded', function() {
    // Apply saved theme
    const settings = DB.getSettings();
    applyTheme(settings.theme || 'dark');
    applyAccentColor(settings.accentColor || '#00e676');
});

function toggleTheme() {
    const settings = DB.getSettings();
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    settings.theme = newTheme;
    DB.saveSettings(settings);
    applyTheme(newTheme);
    showToast(`Switched to ${newTheme} mode`);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update toggle icons
    document.querySelectorAll('.theme-toggle i').forEach(icon => {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    });

    // Update theme option buttons
    document.querySelectorAll('.theme-option').forEach(btn => {
        const btnTheme = btn.textContent.includes('Dark') ? 'dark' : 'light';
        btn.classList.toggle('active', btnTheme === theme);
    });
}

function applyAccentColor(color) {
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-hover', color);
    
    // Update accent color input if present
    const input = document.getElementById('accentColor');
    if (input) {
        input.value = color;
    }
}

// Initialize with saved settings
document.addEventListener('DOMContentLoaded', function() {
    const settings = DB.getSettings();
    applyTheme(settings.theme || 'dark');
    applyAccentColor(settings.accentColor || '#00e676');
});