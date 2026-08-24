/**
 * Store & Persistence Module for DayPulse Daily Checklist
 */

const STORAGE_KEYS = {
    ROUTINE_ITEMS: 'daypulse_routine_items_v3',
    DAILY_LOGS: 'daypulse_daily_logs_v3',
    SETTINGS: 'daypulse_settings_v3',
};

const DEFAULT_SETTINGS = {
    timeFormat: '12h', // '12h' or '24h'
    soundEnabled: true,
    theme: 'dark', // 'dark', 'light', 'system'
    celebrations: true,
};

const DEFAULT_ROUTINES = [
    {
        id: 'routine-1',
        title: 'Morning Hydration & Light Stretching',
        time: '06:30',
        duration: '15m',
        days: 'all',
        icon: 'droplets',
        notes: 'Drink 500ml water and 10 mins gentle spine stretches',
        order: 1,
        createdAtDate: '2020-01-01',
        deletedAtDate: null,
        enabled: true
    },
    {
        id: 'routine-2',
        title: 'Physical Workout / Exercise Session',
        time: '07:00',
        duration: '45m',
        days: 'all',
        icon: 'activity',
        notes: 'Gym, cardio, or home bodyweight circuit',
        order: 2,
        createdAtDate: '2020-01-01',
        deletedAtDate: null,
        enabled: true
    },
    {
        id: 'routine-3',
        title: 'Healthy Breakfast & Daily Planning',
        time: '08:00',
        duration: '30m',
        days: 'all',
        icon: 'coffee',
        notes: 'Review top 3 priorities for the day',
        order: 3,
        createdAtDate: '2020-01-01',
        deletedAtDate: null,
        enabled: true
    },
    {
        id: 'routine-4',
        title: 'Deep Work Focus Block #1',
        time: '09:00',
        duration: '2h',
        days: 'weekdays',
        icon: 'target',
        notes: 'No distractions, deep work on primary project',
        order: 4,
        createdAtDate: '2020-01-01',
        deletedAtDate: null,
        enabled: true
    },
    {
        id: 'routine-5',
        title: 'Nutritious Lunch & Outdoor Walk',
        time: '12:30',
        duration: '45m',
        days: 'all',
        icon: 'sun',
        notes: 'Step away from all screens and get fresh air',
        order: 5,
        createdAtDate: '2020-01-01',
        deletedAtDate: null,
        enabled: true
    },
    {
        id: 'routine-6',
        title: 'Focused Work & Communication Sprint',
        time: '14:00',
        duration: '2h 30m',
        days: 'weekdays',
        icon: 'briefcase',
        notes: 'Tasks, meetings, inbox clearance',
        order: 6,
        createdAtDate: '2020-01-01',
        deletedAtDate: null,
        enabled: true
    },
    {
        id: 'routine-7',
        title: 'Evening Decompression & Family / Hobby Time',
        time: '18:00',
        duration: '1h',
        days: 'all',
        icon: 'smile',
        notes: 'Relaxation, hobbies, cooking or spending time with family',
        order: 7,
        createdAtDate: '2020-01-01',
        deletedAtDate: null,
        enabled: true
    },
    {
        id: 'routine-8',
        title: 'Daily Reflection & Prepare for Tomorrow',
        time: '21:30',
        duration: '15m',
        days: 'all',
        icon: 'book-open',
        notes: 'Note down wins of the day and prepare clothing/desk for morning',
        order: 8,
        createdAtDate: '2020-01-01',
        deletedAtDate: null,
        enabled: true
    },
    {
        id: 'routine-9',
        title: 'Wind Down & Bedtime Reading',
        time: '22:00',
        duration: '30m',
        days: 'all',
        icon: 'moon',
        notes: 'Turn off screens, read book and sleep by 10:30 PM',
        order: 9,
        createdAtDate: '2020-01-01',
        deletedAtDate: null,
        enabled: true
    }
];

class Store {
    constructor() {
        this.routineItems = this._load(STORAGE_KEYS.ROUTINE_ITEMS, null);
        if (!this.routineItems) {
            this.routineItems = JSON.parse(JSON.stringify(DEFAULT_ROUTINES));
            this._save(STORAGE_KEYS.ROUTINE_ITEMS, this.routineItems);
        }

        this.dailyLogs = this._load(STORAGE_KEYS.DAILY_LOGS, {});
        this.settings = { ...DEFAULT_SETTINGS, ...this._load(STORAGE_KEYS.SETTINGS, {}) };
    }

    _load(key, fallback) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            console.error(`Error loading key ${key}:`, e);
            return fallback;
        }
    }

    _save(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {
            console.error(`Error saving key ${key}:`, e);
        }
    }

    // --- Routine Master Items ---
    getRoutineItems(includeDeleted = false) {
        let items = [...this.routineItems];
        if (!includeDeleted) {
            items = items.filter(i => !i.deletedAtDate);
        }
        return items.sort((a, b) => {
            if (a.time && b.time) return a.time.localeCompare(b.time);
            return (a.order || 0) - (b.order || 0);
        });
    }

    saveRoutineItems(items) {
        this.routineItems = items;
        this._save(STORAGE_KEYS.ROUTINE_ITEMS, this.routineItems);
    }

    addRoutineItem(item, currentDateStr = null) {
        const todayStr = currentDateStr || this.formatDateISO(new Date());

        const newItem = {
            id: 'routine-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            title: item.title.trim(),
            time: item.time || '',
            duration: item.duration || '',
            days: item.days || 'all',
            icon: item.icon || 'check-circle',
            notes: item.notes || '',
            order: this.routineItems.length + 1,
            createdAtDate: todayStr,
            deletedAtDate: null,
            enabled: item.enabled !== false
        };
        this.routineItems.push(newItem);
        this.saveRoutineItems(this.routineItems);
        return newItem;
    }

    addMultipleRoutineItems(itemsArray, currentDateStr = null) {
        const todayStr = currentDateStr || this.formatDateISO(new Date());
        const addedItems = [];

        itemsArray.forEach((item, index) => {
            if (!item.title || !item.title.trim()) return;
            const newItem = {
                id: 'routine-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5) + '-' + index,
                title: item.title.trim(),
                time: item.time || '',
                duration: item.duration || '',
                days: item.days || 'all',
                icon: item.icon || 'check-circle',
                notes: item.notes || '',
                order: this.routineItems.length + 1,
                createdAtDate: todayStr,
                deletedAtDate: null,
                enabled: true
            };
            this.routineItems.push(newItem);
            addedItems.push(newItem);
        });

        this.saveRoutineItems(this.routineItems);
        return addedItems;
    }

    updateRoutineItem(id, updates) {
        const index = this.routineItems.findIndex(i => i.id === id);
        if (index !== -1) {
            this.routineItems[index] = { ...this.routineItems[index], ...updates };
            this.saveRoutineItems(this.routineItems);
            return this.routineItems[index];
        }
        return null;
    }

    deleteRoutineItem(id, effectiveDateStr = null) {
        const index = this.routineItems.findIndex(i => i.id === id);
        if (index !== -1) {
            const item = this.routineItems[index];
            const todayStr = effectiveDateStr || this.formatDateISO(new Date());

            if (item.createdAtDate && item.createdAtDate >= todayStr) {
                this.routineItems.splice(index, 1);
            } else {
                item.deletedAtDate = todayStr;
            }
            this.saveRoutineItems(this.routineItems);
        }
    }

    deleteAllRoutineItems(effectiveDateStr = null) {
        const todayStr = effectiveDateStr || this.formatDateISO(new Date());
        
        // Soft-delete items so earlier historical days retain their accurate logs
        this.routineItems.forEach(item => {
            if (!item.deletedAtDate) {
                item.deletedAtDate = todayStr;
            }
        });

        // Filter out items that were only created today
        this.routineItems = this.routineItems.filter(item => item.createdAtDate && item.createdAtDate < todayStr);
        this.saveRoutineItems(this.routineItems);
    }

    reorderRoutineItems(orderedIds) {
        this.routineItems.forEach(item => {
            const index = orderedIds.indexOf(item.id);
            if (index !== -1) {
                item.order = index + 1;
            }
        });
        this.saveRoutineItems(this.routineItems);
    }

    resetRoutinesToDefault() {
        this.routineItems = JSON.parse(JSON.stringify(DEFAULT_ROUTINES));
        this.saveRoutineItems(this.routineItems);
    }

    // --- Daily Logs (Per Date YYYY-MM-DD) ---
    getDailyLog(dateStr) {
        if (!this.dailyLogs[dateStr]) {
            this.dailyLogs[dateStr] = {
                date: dateStr,
                completedTaskIds: [],
                oneOffTasks: [],
                excludedRoutineIds: [],
                notes: '',
                completedAt: null
            };
        }
        if (!this.dailyLogs[dateStr].excludedRoutineIds) {
            this.dailyLogs[dateStr].excludedRoutineIds = [];
        }
        return this.dailyLogs[dateStr];
    }

    saveDailyLog(dateStr, logData) {
        this.dailyLogs[dateStr] = {
            ...this.getDailyLog(dateStr),
            ...logData
        };
        this._save(STORAGE_KEYS.DAILY_LOGS, this.dailyLogs);
    }

    toggleTaskCompletion(dateStr, taskId, isOneOff = false) {
        const log = this.getDailyLog(dateStr);
        let completed = false;

        if (isOneOff) {
            const task = (log.oneOffTasks || []).find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                completed = task.completed;
            }
        } else {
            const idx = log.completedTaskIds.indexOf(taskId);
            if (idx === -1) {
                log.completedTaskIds.push(taskId);
                completed = true;
            } else {
                log.completedTaskIds.splice(idx, 1);
                completed = false;
            }
        }

        this.saveDailyLog(dateStr, log);
        return { completed, log };
    }

    addOneOffTask(dateStr, taskData) {
        const log = this.getDailyLog(dateStr);

        const newTask = {
            id: 'oneoff-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            title: taskData.title.trim(),
            time: taskData.time || '',
            duration: taskData.duration || '',
            notes: taskData.notes || '',
            completed: false,
            createdAt: new Date().toISOString()
        };
        if (!log.oneOffTasks) log.oneOffTasks = [];
        log.oneOffTasks.push(newTask);
        this.saveDailyLog(dateStr, log);
        return newTask;
    }

    updateOneOffTask(dateStr, taskId, updates) {
        const log = this.getDailyLog(dateStr);
        if (log.oneOffTasks) {
            const index = log.oneOffTasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                log.oneOffTasks[index] = { ...log.oneOffTasks[index], ...updates };
                this.saveDailyLog(dateStr, log);
                return log.oneOffTasks[index];
            }
        }
        return null;
    }

    deleteOneOffTask(dateStr, taskId) {
        const log = this.getDailyLog(dateStr);
        if (log.oneOffTasks) {
            log.oneOffTasks = log.oneOffTasks.filter(t => t.id !== taskId);
            this.saveDailyLog(dateStr, log);
        }
    }

    deleteRoutineTaskForTodayOnly(dateStr, routineId) {
        const log = this.getDailyLog(dateStr);
        if (!log.excludedRoutineIds.includes(routineId)) {
            log.excludedRoutineIds.push(routineId);
            log.completedTaskIds = (log.completedTaskIds || []).filter(id => id !== routineId);
            this.saveDailyLog(dateStr, log);
        }
    }

    saveDailyNotes(dateStr, notes) {
        const log = this.getDailyLog(dateStr);
        log.notes = notes;
        this.saveDailyLog(dateStr, log);
    }

    // --- Settings ---
    getSettings() {
        return this.settings;
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this._save(STORAGE_KEYS.SETTINGS, this.settings);
        return this.settings;
    }

    // --- Date-Aware Applicable Routines ---
    getApplicableRoutinesForDate(dateObj) {
        const dateStr = typeof dateObj === 'string' ? dateObj : this.formatDateISO(dateObj);
        const targetDate = typeof dateObj === 'string' ? new Date(dateObj + 'T00:00:00') : dateObj;
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isWeekday = !isWeekend;

        const log = this.getDailyLog(dateStr);
        const excluded = log.excludedRoutineIds || [];

        return this.routineItems.filter(item => {
            if (item.enabled === false) return false;

            // Excluded specifically on this day
            if (excluded.includes(item.id)) return false;

            // If item was created AFTER this date, it must NOT appear on this date
            if (item.createdAtDate && item.createdAtDate > dateStr) {
                return false;
            }

            // If item was deleted ON or BEFORE this date, it must NOT appear
            if (item.deletedAtDate && item.deletedAtDate <= dateStr) {
                return false;
            }

            // Recurrence days check
            if (!item.days || item.days === 'all') return true;
            if (item.days === 'weekdays' && isWeekday) return true;
            if (item.days === 'weekends' && isWeekend) return true;
            if (Array.isArray(item.days) && item.days.includes(dayOfWeek)) return true;

            return false;
        }).sort((a, b) => {
            if (a.time && b.time) {
                return a.time.localeCompare(b.time);
            }
            return (a.order || 0) - (b.order || 0);
        });
    }

    // --- Streak & Selected Date Analytics Calculation ---
    calculateStats(selectedDateObj = null) {
        const today = new Date();
        const todayStr = this.formatDateISO(today);
        const targetDate = selectedDateObj || today;
        const targetDateStr = this.formatDateISO(targetDate);

        const isToday = targetDateStr === todayStr;
        const isPastDate = targetDateStr < todayStr;
        const isFutureDate = targetDateStr > todayStr;

        // Calculate Selected Day Stats
        const selectedLog = this.dailyLogs[targetDateStr] || { completedTaskIds: [], oneOffTasks: [] };
        const selectedRoutines = this.getApplicableRoutinesForDate(targetDate);
        const selectedOneOffs = selectedLog.oneOffTasks || [];
        const dayTotalTasks = selectedRoutines.length + selectedOneOffs.length;

        // Filter ONLY completed routine IDs that currently belong to applicable routines for this date
        const completedRoutineCount = (selectedLog.completedTaskIds || []).filter(id => 
            selectedRoutines.some(r => r.id === id)
        ).length;
        const completedOneOffCount = selectedOneOffs.filter(t => t.completed).length;
        
        const dayCompletedTasks = completedRoutineCount + completedOneOffCount;
        const rawDayRate = dayTotalTasks > 0 ? Math.round((dayCompletedTasks / dayTotalTasks) * 100) : 0;
        // Strictly clamp percentage between 0% and 100%
        const dayCompletionRate = Math.min(100, Math.max(0, rawDayRate));

        // Calculate Consecutive Streaks
        let currentStreak = 0;
        let bestStreak = 0;
        let totalCompletedAllTime = 0;

        let checkDate = new Date(today);
        let tempStreak = 0;

        for (let i = 0; i < 365; i++) {
            const dateStr = this.formatDateISO(checkDate);
            const log = this.dailyLogs[dateStr];
            
            if (log) {
                const dayRoutines = this.getApplicableRoutinesForDate(checkDate);
                const cCount = ((log.completedTaskIds || []).filter(id => dayRoutines.some(r => r.id === id)).length) + 
                               ((log.oneOffTasks || []).filter(t => t.completed).length);
                totalCompletedAllTime += cCount;

                if (cCount > 0) {
                    tempStreak++;
                    if (i === 0 || tempStreak === i + 1) {
                        currentStreak = tempStreak;
                    }
                    if (tempStreak > bestStreak) {
                        bestStreak = tempStreak;
                    }
                } else {
                    if (i > 0) break;
                }
            } else {
                if (i > 0) break;
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Get 7-Day performance summary around today
        const last7Days = [];
        for (let j = 6; j >= 0; j--) {
            const d = new Date(today);
            d.setDate(d.getDate() - j);
            const dStr = this.formatDateISO(d);
            const dLog = this.dailyLogs[dStr];
            
            const routines = this.getApplicableRoutinesForDate(d);
            const oneOffs = dLog && dLog.oneOffTasks ? dLog.oneOffTasks : [];
            const total = routines.length + oneOffs.length;

            // Only count completed routine IDs that actually exist in the day's routines!
            const cRoutine = (dLog && dLog.completedTaskIds ? dLog.completedTaskIds : []).filter(id =>
                routines.some(r => r.id === id)
            ).length;
            const cOneOff = oneOffs.filter(t => t.completed).length;
            const done = cRoutine + cOneOff;

            const rawRate = total > 0 ? Math.round((done / total) * 100) : 0;
            // Clamped between 0 and 100%
            const rate = Math.min(100, Math.max(0, rawRate));

            last7Days.push({
                dateStr: dStr,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNumber: d.getDate(),
                isToday: dStr === todayStr,
                isSelected: dStr === targetDateStr,
                completedTasks: Math.min(done, total),
                totalTasks: total,
                rate
            });
        }

        return {
            isToday,
            isPastDate,
            isFutureDate,
            dayCompletedTasks: Math.min(dayCompletedTasks, dayTotalTasks),
            dayTotalTasks,
            dayCompletionRate,
            currentStreak,
            bestStreak,
            totalCompletedAllTime,
            last7Days
        };
    }

    formatDateISO(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --- Export / Import ---
    exportAllData() {
        return JSON.stringify({
            version: '3.0',
            exportedAt: new Date().toISOString(),
            routineItems: this.routineItems,
            dailyLogs: this.dailyLogs,
            settings: this.settings
        }, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.routineItems || !Array.isArray(data.routineItems)) {
                throw new Error('Invalid backup format: missing routineItems');
            }
            this.routineItems = data.routineItems;
            this.dailyLogs = data.dailyLogs || {};
            this.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };

            this._save(STORAGE_KEYS.ROUTINE_ITEMS, this.routineItems);
            this._save(STORAGE_KEYS.DAILY_LOGS, this.dailyLogs);
            this._save(STORAGE_KEYS.SETTINGS, this.settings);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
}

window.appStore = new Store();
