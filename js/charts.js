/**
 * QuizNexus - Chart Configuration
 * Centralized chart settings and utilities
 */

// Chart.js default configuration
if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#a0c9a8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    // Custom plugin for chart backgrounds
    Chart.register({
        id: 'customBackground',
        beforeDraw: function(chart) {
            const ctx = chart.ctx;
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    });
}

// Chart utility functions
const ChartUtils = {
    // Generate gradient
    createGradient(ctx, chartArea, colorStart, colorEnd) {
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
    },

    // Get theme colors
    getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            text: isDark ? '#a0c9a8' : '#2d5a3a',
            grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)'
        };
    },

    // Common chart options
    commonOptions: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255,255,255,0.05)'
                },
                ticks: {
                    color: '#a0c9a8'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#a0c9a8'
                }
            }
        }
    }
};

// Make ChartUtils globally available
window.ChartUtils = ChartUtils;