/**
 * Routine Templates & Time Helpers Module
 */

const PRESET_TEMPLATES = {
    balanced: {
        id: 'balanced',
        name: 'Balanced Life & Work',
        description: 'Comprehensive balance of morning habits, deep work blocks, outdoor time, and restorative sleep.',
        items: [
            { title: 'Morning Hydration & Light Stretching', time: '06:30', duration: '15m', days: 'all', icon: 'droplets' },
            { title: 'Physical Workout / Exercise', time: '07:00', duration: '45m', days: 'all', icon: 'activity' },
            { title: 'Healthy Breakfast & Daily Planning', time: '08:00', duration: '30m', days: 'all', icon: 'coffee' },
            { title: 'Deep Work Focus Block #1', time: '09:00', duration: '2h', days: 'weekdays', icon: 'target' },
            { title: 'Nutritious Lunch & Outdoor Walk', time: '12:30', duration: '45m', days: 'all', icon: 'sun' },
            { title: 'Deep Work & Project Sprint #2', time: '14:00', duration: '2h 30m', days: 'weekdays', icon: 'briefcase' },
            { title: 'Evening Decompression & Family Time', time: '18:00', duration: '1h', days: 'all', icon: 'smile' },
            { title: 'Daily Review & Next Day Prep', time: '21:30', duration: '15m', days: 'all', icon: 'book-open' },
            { title: 'Wind Down & Bedtime Reading', time: '22:00', duration: '30m', days: 'all', icon: 'moon' }
        ]
    },
    student: {
        id: 'student',
        name: 'Student / Academic Focus',
        description: 'Optimized for study sessions, lecture reviews, problem solving, and healthy test preparation.',
        items: [
            { title: 'Morning Walk & Breakfast', time: '07:00', duration: '40m', days: 'all', icon: 'coffee' },
            { title: 'Review Yesterday’s Study Notes', time: '08:00', duration: '30m', days: 'all', icon: 'book-open' },
            { title: 'Study Sprint 1: Problem Solving / Hard Subject', time: '09:00', duration: '2h', days: 'all', icon: 'target' },
            { title: 'Lunch & Relax', time: '12:30', duration: '1h', days: 'all', icon: 'sun' },
            { title: 'Study Sprint 2: Assignments & Practice Questions', time: '14:00', duration: '2h', days: 'all', icon: 'briefcase' },
            { title: 'Physical Activity / Sport', time: '17:30', duration: '1h', days: 'all', icon: 'activity' },
            { title: 'Flashcards & Active Recall Practice', time: '20:30', duration: '45m', days: 'all', icon: 'check-circle' },
            { title: 'Pack Bag for Tomorrow & Sleep by 10:30 PM', time: '22:00', duration: '30m', days: 'all', icon: 'moon' }
        ]
    },
    minimalist: {
        id: 'minimalist',
        name: 'Minimalist Essential Habits',
        description: '5 high-impact daily non-negotiables for focus and consistency without overwhelming tasks.',
        items: [
            { title: 'Morning Sunlight & Glass of Water', time: '07:00', duration: '15m', days: 'all', icon: 'sun' },
            { title: 'Top 1 Most Important Task of the Day', time: '09:00', duration: '2h', days: 'weekdays', icon: 'target' },
            { title: '30 Minutes Daily Movement / Walk', time: '13:00', duration: '30m', days: 'all', icon: 'activity' },
            { title: '15 Minutes Reading Non-Fiction', time: '19:00', duration: '15m', days: 'all', icon: 'book-open' },
            { title: 'No Screens 30 Mins Before Sleep', time: '22:30', duration: '30m', days: 'all', icon: 'moon' }
        ]
    }
};

class RoutineEngine {
    static formatTime(timeStr, format = '12h') {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;

        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];

        if (isNaN(hours)) return timeStr;

        if (format === '24h') {
            return `${String(hours).padStart(2, '0')}:${minutes}`;
        }

        // 12-hour format with AM/PM
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;

        return `${hours}:${minutes} ${period}`;
    }

    static getRecurrenceLabel(days) {
        if (!days || days === 'all') return 'Every Day';
        if (days === 'weekdays') return 'Weekdays (Mon-Fri)';
        if (days === 'weekends') return 'Weekends (Sat-Sun)';
        if (Array.isArray(days)) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days.map(d => dayNames[d]).join(', ');
        }
        return 'Every Day';
    }

    static getGreeting(hour) {
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        if (hour < 21) return 'Good evening';
        return 'Good night';
    }

    static getMotivationalQuote() {
        const quotes = [
            "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
            "Small daily disciplines compound into massive life victories.",
            "Win the morning, win the day.",
            "Focus on the process, and the results will take care of themselves.",
            "Consistency beats intensity every single time.",
            "Your future is found in your daily routine.",
            "Action is the foundational key to all success."
        ];
        const index = Math.floor(Math.random() * quotes.length);
        return quotes[index];
    }
}

window.RoutineEngine = RoutineEngine;
window.PRESET_TEMPLATES = PRESET_TEMPLATES;
