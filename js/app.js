/**
 * Main Application Logic for DayPulse Daily Checklist
 */

class DayPulseApp {
    constructor() {
        this.selectedDate = new Date();
        this.celebratedDates = new Set();
        this.pendingDeleteRoutineId = null;
        this.init();
    }

    init() {
        this.applyTheme(window.appStore.getSettings().theme);
        this.setupEventListeners();
        this.renderAll();

        // Check for midnight rollover every minute
        setInterval(() => {
            const now = new Date();
            if (this.isToday(this.selectedDate) && now.getDate() !== this.selectedDate.getDate()) {
                this.selectedDate = now;
                this.renderAll();
            }
        }, 60000);
    }

    // --- Date Helpers ---
    getSelectedDateStr() {
        return window.appStore.formatDateISO(this.selectedDate);
    }

    isToday(dateObj) {
        const today = new Date();
        return dateObj.getDate() === today.getDate() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getFullYear() === today.getFullYear();
    }

    isYesterday(dateObj) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return dateObj.getDate() === yesterday.getDate() &&
            dateObj.getMonth() === yesterday.getMonth() &&
            dateObj.getFullYear() === yesterday.getFullYear();
    }

    isOlderThanYesterday(dateObj) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const check = new Date(dateObj);
        check.setHours(0, 0, 0, 0);
        return check < yesterday;
    }

    isFuture(dateObj) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const check = new Date(dateObj);
        check.setHours(0, 0, 0, 0);
        return check > today;
    }

    canCheckTasks(dateObj) {
        // Only today and 1 previous day (yesterday) are allowed to be checked off
        return this.isToday(dateObj) || this.isYesterday(dateObj);
    }

    formatDisplayDate(dateObj) {
        return dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // --- Time Form Helper (12H with AM/PM) ---
    setTimeFields(timeStr) {
        const hourSelect = document.getElementById('taskHourSelect');
        const minSelect = document.getElementById('taskMinuteSelect');
        const ampmSelect = document.getElementById('taskAmPmSelect');

        if (!timeStr || !timeStr.includes(':')) {
            if (hourSelect) hourSelect.value = '';
            if (minSelect) minSelect.value = '00';
            if (ampmSelect) ampmSelect.value = 'AM';
            return;
        }

        const parts = timeStr.split(':');
        let h = parseInt(parts[0], 10);
        const m = parts[1] || '00';
        let ampm = 'AM';

        if (h >= 12) {
            ampm = 'PM';
            if (h > 12) h -= 12;
        } else if (h === 0) {
            h = 12;
            ampm = 'AM';
        }

        const formattedH = String(h).padStart(2, '0');
        if (hourSelect) hourSelect.value = formattedH;
        if (minSelect) minSelect.value = m;
        if (ampmSelect) ampmSelect.value = ampm;
    }

    getTimeFromFields() {
        const hourSelect = document.getElementById('taskHourSelect');
        const minSelect = document.getElementById('taskMinuteSelect');
        const ampmSelect = document.getElementById('taskAmPmSelect');

        if (!hourSelect || !hourSelect.value) {
            return ''; // No time specified
        }

        let h = parseInt(hourSelect.value, 10);
        const m = minSelect ? minSelect.value : '00';
        const ampm = ampmSelect ? ampmSelect.value : 'AM';

        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;

        return `${String(h).padStart(2, '0')}:${m}`;
    }

    // --- UI Rendering ---
    renderAll() {
        this.renderDateHeader();
        this.renderChecklist();
        this.renderStats();
        this.renderDailyNotes();
        this.renderRoutineManagerList();
        this.updateLucideIcons();
    }

    renderDateHeader() {
        const dateStr = this.getSelectedDateStr();
        const displayDate = this.formatDisplayDate(this.selectedDate);
        const isToday = this.isToday(this.selectedDate);
        const isYesterday = this.isYesterday(this.selectedDate);
        const isOlder = this.isOlderThanYesterday(this.selectedDate);
        const isFuture = this.isFuture(this.selectedDate);

        const titleEl = document.getElementById('currentDateTitle');
        const todayBadgeEl = document.getElementById('todayBadge');
        const yesterdayBadgeEl = document.getElementById('yesterdayBadge');
        const greetingEl = document.getElementById('greetingText');
        const datePickerEl = document.getElementById('datePickerInput');
        const readOnlyBanner = document.getElementById('readOnlyBanner');
        const readOnlyTitle = document.getElementById('readOnlyBannerTitle');
        const readOnlyDesc = document.getElementById('readOnlyBannerDesc');
        const readOnlyIcon = document.getElementById('readOnlyBannerIcon');

        if (titleEl) titleEl.textContent = displayDate;
        if (datePickerEl) datePickerEl.value = dateStr;

        if (todayBadgeEl) {
            todayBadgeEl.style.display = isToday ? 'inline-flex' : 'none';
        }
        if (yesterdayBadgeEl) {
            yesterdayBadgeEl.style.display = isYesterday ? 'inline-flex' : 'none';
        }

        if (greetingEl) {
            if (isToday) {
                const hour = new Date().getHours();
                greetingEl.textContent = `${RoutineEngine.getGreeting(hour)}! Today's Schedule:`;
            } else if (isYesterday) {
                greetingEl.textContent = `Yesterday's Catch-Up:`;
            } else if (isOlder) {
                greetingEl.textContent = `Past Record Archive:`;
            } else {
                greetingEl.textContent = `Upcoming Schedule Preview:`;
            }
        }

        // Lock / Read-Only Banner for Older Past (2+ days ago) and Future Dates
        if (readOnlyBanner) {
            if (isOlder) {
                readOnlyBanner.classList.remove('hidden');
                if (readOnlyIcon) readOnlyIcon.textContent = '📜';
                if (readOnlyTitle) readOnlyTitle.textContent = 'Past Record Archive (Read-Only)';
                if (readOnlyDesc) readOnlyDesc.textContent = 'Historical records older than yesterday cannot be modified.';
            } else if (isFuture) {
                readOnlyBanner.classList.remove('hidden');
                if (readOnlyIcon) readOnlyIcon.textContent = '🔮';
                if (readOnlyTitle) readOnlyTitle.textContent = 'Future Schedule Preview (Read-Only)';
                if (readOnlyDesc) readOnlyDesc.textContent = 'Future tasks will unlock for completion on that day.';
            } else {
                readOnlyBanner.classList.add('hidden');
            }
        }

        // Hide "+ Add Task" button on past days (older than yesterday)
        const addTopBtn = document.getElementById('addToListTopBtn');
        if (addTopBtn) {
            addTopBtn.style.display = isOlder ? 'none' : 'flex';
        }
    }

    renderChecklist() {
        const dateStr = this.getSelectedDateStr();
        const log = window.appStore.getDailyLog(dateStr);
        const isOlder = this.isOlderThanYesterday(this.selectedDate);
        const isFuture = this.isFuture(this.selectedDate);
        const isCheckable = this.canCheckTasks(this.selectedDate);
        const isLocked = !isCheckable;

        // 1. Get applicable routine items for this date (filters out tasks created after this date)
        const applicableRoutines = window.appStore.getApplicableRoutinesForDate(this.selectedDate);

        // 2. Get one-off tasks for this specific day
        const oneOffTasks = log.oneOffTasks || [];

        // Combine into unified list
        const allTasks = [
            ...applicableRoutines.map(r => ({ ...r, isOneOff: false })),
            ...oneOffTasks.map(t => ({ ...t, isOneOff: true }))
        ].sort((a, b) => {
            if (a.time && b.time) return a.time.localeCompare(b.time);
            return (a.order || 0) - (b.order || 0);
        });

        const totalTasks = allTasks.length;
        let completedTasks = 0;

        const container = document.getElementById('checklistContainer');
        if (!container) return;

        container.innerHTML = '';

        if (totalTasks === 0) {
            container.innerHTML = `
                <div class="glass-card rounded-2xl p-8 text-center text-slate-400">
                    <i data-lucide="calendar-x" class="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-60"></i>
                    <h3 class="text-lg font-semibold text-slate-200">No tasks on this date</h3>
                    <p class="text-sm mt-1 mb-4">${isOlder ? 'No tasks existed on this past date.' : 'Add tasks to your recurring routine or add a task for this date.'}</p>
                    ${!isOlder ? `
                        <button onclick="window.app.openAddTaskModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition">
                            + Add Task
                        </button>
                    ` : ''}
                </div>
            `;
            this.updateProgress(0, 0);
            return;
        }

        allTasks.forEach(task => {
            const isChecked = task.isOneOff ? !!task.completed : (log.completedTaskIds || []).includes(task.id);
            if (isChecked) completedTasks++;

            const itemEl = this.createTaskElement({
                id: task.id,
                title: task.title,
                time: task.time,
                duration: task.duration,
                notes: task.notes,
                icon: task.icon,
                isChecked: isChecked,
                isOneOff: task.isOneOff,
                isCheckable: isCheckable,
                isLocked: isLocked
            });
            container.appendChild(itemEl);
        });

        this.updateProgress(completedTasks, totalTasks);
    }

    createTaskElement({ id, title, time, duration, notes, isChecked, isOneOff, isCheckable, isLocked }) {
        const el = document.createElement('div');
        el.className = `task-item glass-card rounded-xl p-3.5 flex items-center justify-between gap-3 ${isChecked ? 'completed' : ''} ${isLocked ? 'read-only opacity-90' : ''}`;
        el.dataset.taskId = id;
        el.dataset.isOneOff = isOneOff;

        const settings = window.appStore.getSettings();
        const formattedTime = time ? RoutineEngine.formatTime(time, settings.timeFormat) : '';

        el.innerHTML = `
            <div class="flex items-center gap-3.5 flex-1 min-w-0">
                <button type="button" class="custom-checkbox ${isChecked ? 'checked' : ''}" ${!isCheckable ? 'disabled title="Only today and yesterday can be marked done"' : 'aria-label="Toggle task"'}>
                    <svg class="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </button>

                <div class="flex-1 min-w-0 ${isCheckable ? 'cursor-pointer' : 'cursor-default'} task-text-container">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="task-title font-medium text-slate-100 text-sm sm:text-base leading-snug">${this.escapeHtml(title)}</span>
                        ${isOneOff ? `<span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">This Date Only</span>` : ''}
                    </div>
                    
                    <div class="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        ${formattedTime ? `
                            <span class="flex items-center gap-1 font-medium text-indigo-400">
                                <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                                ${formattedTime}
                            </span>
                        ` : ''}
                        ${duration ? `
                            <span class="flex items-center gap-1 text-slate-400">
                                <i data-lucide="hourglass" class="w-3.5 h-3.5"></i>
                                ${duration}
                            </span>
                        ` : ''}
                        ${notes ? `
                            <span class="flex items-center gap-1 text-slate-400 italic truncate max-w-[200px]" title="${this.escapeHtml(notes)}">
                                <i data-lucide="info" class="w-3.5 h-3.5"></i>
                                ${this.escapeHtml(notes)}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Clearly Visible Action Buttons with Dedicated Handlers -->
            ${isCheckable ? `
                <div class="task-actions-wrapper flex items-center gap-1.5 flex-shrink-0">
                    <button type="button" class="edit-task-btn flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 transition text-xs font-semibold shadow-sm" title="Edit Task">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                        <span class="hidden sm:inline">Edit</span>
                    </button>
                    
                    <button type="button" class="delete-task-btn flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition text-xs font-semibold shadow-sm" title="Delete Task">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        <span class="hidden sm:inline">Delete</span>
                    </button>
                </div>
            ` : `
                <div class="text-[11px] text-slate-500 font-semibold px-2 py-0.5 rounded border border-slate-800 bg-slate-900/40">
                    Locked
                </div>
            `}
        `;

        if (isCheckable) {
            const toggleCheckboxHandler = (e) => {
                this.handleTaskToggle(id, isOneOff);
            };

            el.querySelector('.custom-checkbox').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCheckboxHandler(e);
            });

            el.querySelector('.task-text-container').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCheckboxHandler(e);
            });

            // Dedicated Edit Button Listener
            el.querySelector('.edit-task-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isOneOff) {
                    this.openEditOneOffModal(id);
                } else {
                    this.openEditRoutineModal(id);
                }
            });

            // Dedicated Delete Button Listener
            el.querySelector('.delete-task-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isOneOff) {
                    if (confirm(`Delete task "${title}"?`)) {
                        window.appStore.deleteOneOffTask(this.getSelectedDateStr(), id);
                        this.renderChecklist();
                        this.renderStats();
                    }
                } else {
                    this.openDeleteRoutineChoiceModal(id, title);
                }
            });
        }

        return el;
    }

    openDeleteRoutineChoiceModal(routineId, title) {
        this.pendingDeleteRoutineId = routineId;
        const modal = document.getElementById('deleteRoutineModal');
        const titlePreview = document.getElementById('deleteTaskTitlePreview');
        if (titlePreview) titlePreview.textContent = title;
        modal.classList.remove('hidden');
    }

    closeDeleteRoutineChoiceModal() {
        const modal = document.getElementById('deleteRoutineModal');
        modal.classList.add('hidden');
        this.pendingDeleteRoutineId = null;
    }

    handleTaskToggle(taskId, isOneOff) {
        if (!this.canCheckTasks(this.selectedDate)) {
            alert('Only tasks for Today and Yesterday (1 previous day) can be checked off.');
            return;
        }

        const dateStr = this.getSelectedDateStr();
        const { completed } = window.appStore.toggleTaskCompletion(dateStr, taskId, isOneOff);

        if (completed) {
            window.soundEffects.playCheck();
        } else {
            window.soundEffects.playUncheck();
        }

        this.renderChecklist();
        this.renderStats();
    }

    updateProgress(completed, total) {
        const safeCompleted = Math.min(completed, total);
        const rawPercentage = total > 0 ? Math.round((safeCompleted / total) * 100) : 0;
        // Strictly clamped between 0% and 100%
        const percentage = Math.min(100, Math.max(0, rawPercentage));

        const dateStr = this.getSelectedDateStr();
        const isToday = this.isToday(this.selectedDate);

        // Update Text
        const counterEl = document.getElementById('taskCounterText');
        const percentEl = document.getElementById('progressPercentageText');
        const progressBar = document.getElementById('mainProgressBar');
        const celebrationBanner = document.getElementById('celebrationBanner');

        // Update Navbar live counter for the current selected day
        const navDoneCounterText = document.getElementById('navDoneCounterText');
        const navDonePercentText = document.getElementById('navDonePercentText');
        const selectedDayDoneVal = document.getElementById('selectedDayCompletedValue');

        if (navDoneCounterText) navDoneCounterText.textContent = `${safeCompleted} / ${total} Done`;
        if (navDonePercentText) navDonePercentText.textContent = `${percentage}%`;
        if (selectedDayDoneVal) selectedDayDoneVal.textContent = `${safeCompleted} / ${total}`;

        if (counterEl) counterEl.textContent = `${safeCompleted} of ${total} tasks done`;
        if (percentEl) percentEl.textContent = `${percentage}%`;
        if (progressBar) progressBar.style.width = `${percentage}%`;

        // Update Circular Ring
        const ring = document.getElementById('progressRingCircle');
        if (ring) {
            const circumference = 2 * Math.PI * 36; // r=36
            const offset = circumference - (percentage / 100) * circumference;
            ring.style.strokeDasharray = `${circumference} ${circumference}`;
            ring.style.strokeDashoffset = offset;
        }

        // Celebration trigger at 100%
        if (percentage === 100 && total > 0) {
            if (celebrationBanner) celebrationBanner.classList.remove('hidden');
            
            if (isToday && !this.celebratedDates.has(dateStr)) {
                this.celebratedDates.add(dateStr);
                window.soundEffects.playCelebration();
                this.triggerConfetti();
            }
        } else {
            if (celebrationBanner) celebrationBanner.classList.add('hidden');
            this.celebratedDates.delete(dateStr);
        }
    }

    triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            }, 250);
        }
    }

    renderStats() {
        const stats = window.appStore.calculateStats(this.selectedDate);

        const currentStreakEl = document.getElementById('currentStreakValue');
        const bestStreakEl = document.getElementById('bestStreakValue');

        if (currentStreakEl) currentStreakEl.textContent = stats.currentStreak;
        if (bestStreakEl) bestStreakEl.textContent = stats.bestStreak;

        // Render 7-day strip
        const weekStripEl = document.getElementById('weekConsistencyStrip');
        if (weekStripEl) {
            weekStripEl.innerHTML = '';
            stats.last7Days.forEach(day => {
                const dayPill = document.createElement('div');
                dayPill.className = `flex flex-col items-center p-2 rounded-xl border text-center transition cursor-pointer ${
                    day.isSelected ? 'bg-indigo-600/30 border-indigo-500 shadow-sm ring-1 ring-indigo-500/50' : 
                    day.isToday ? 'bg-indigo-950/40 border-indigo-500/40' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`;
                dayPill.onclick = () => {
                    this.selectedDate = new Date(day.dateStr + 'T00:00:00');
                    this.renderAll();
                };

                let statusColor = 'bg-slate-700 text-slate-400';
                if (day.rate === 100) statusColor = 'bg-emerald-500 text-white';
                else if (day.rate > 0) statusColor = 'bg-amber-500/80 text-white';

                dayPill.innerHTML = `
                    <span class="text-[11px] font-medium text-slate-400">${day.dayName}</span>
                    <span class="text-sm font-bold my-1 text-slate-200">${day.dayNumber}</span>
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${statusColor}">
                        ${day.rate === 100 ? '✓' : `${day.rate}%`}
                    </div>
                `;
                weekStripEl.appendChild(dayPill);
            });
        }
    }

    renderDailyNotes() {
        const dateStr = this.getSelectedDateStr();
        const log = window.appStore.getDailyLog(dateStr);
        const notesInput = document.getElementById('dailyNotesTextarea');
        const isEditable = this.canCheckTasks(this.selectedDate);
        if (notesInput) {
            notesInput.value = log.notes || '';
            notesInput.readOnly = !isEditable;
            notesInput.placeholder = !isEditable ? "No notes recorded for this past archive date." : "Wins of the day, ideas, or quick thoughts...";
        }
    }

    // --- Routine Manager View ---
    renderRoutineManagerList() {
        const listEl = document.getElementById('routineManagerItemsList');
        if (!listEl) return;

        const items = window.appStore.getRoutineItems();
        listEl.innerHTML = '';

        if (items.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8 text-slate-400">
                    <p>Your master schedule is currently empty.</p>
                    <button onclick="window.app.openBulkAddModal()" class="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition">
                        ⚡ Bulk Add Tasks Now
                    </button>
                </div>
            `;
            return;
        }

        const settings = window.appStore.getSettings();

        items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'glass-card rounded-xl p-3.5 flex items-center justify-between gap-3 border border-slate-800';
            const formattedTime = item.time ? RoutineEngine.formatTime(item.time, settings.timeFormat) : '';
            const recurrenceLabel = RoutineEngine.getRecurrenceLabel(item.days);

            card.innerHTML = `
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="flex flex-col gap-0.5 text-slate-500">
                        <button class="p-0.5 hover:text-indigo-400 move-up-btn" ${index === 0 ? 'disabled class="opacity-20"' : ''} title="Move Up">
                            <i data-lucide="chevron-up" class="w-4 h-4"></i>
                        </button>
                        <button class="p-0.5 hover:text-indigo-400 move-down-btn" ${index === items.length - 1 ? 'disabled class="opacity-20"' : ''} title="Move Down">
                            <i data-lucide="chevron-down" class="w-4 h-4"></i>
                        </button>
                    </div>

                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-semibold text-slate-100">${this.escapeHtml(item.title)}</span>
                            <span class="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                                ${recurrenceLabel}
                            </span>
                        </div>
                        <div class="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            ${formattedTime ? `<span><i data-lucide="clock" class="inline w-3 h-3 text-indigo-400 mr-1"></i>${formattedTime}</span>` : ''}
                            ${item.duration ? `<span><i data-lucide="hourglass" class="inline w-3 h-3 text-slate-400 mr-1"></i>${item.duration}</span>` : ''}
                            ${item.notes ? `<span class="truncate italic opacity-80 max-w-[200px]">${this.escapeHtml(item.notes)}</span>` : ''}
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-1.5">
                    <button class="edit-btn px-2.5 py-1.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 rounded-lg transition" title="Edit Routine Item">
                        Edit
                    </button>
                    <button class="delete-btn px-2.5 py-1.5 text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 rounded-lg transition" title="Delete Routine Item">
                        Delete
                    </button>
                </div>
            `;

            card.querySelector('.edit-btn').onclick = () => this.openEditRoutineModal(item.id);
            card.querySelector('.delete-btn').onclick = () => {
                if (confirm(`Remove "${item.title}" from your master routine schedule?`)) {
                    window.appStore.deleteRoutineItem(item.id, this.getSelectedDateStr());
                    this.renderAll();
                }
            };

            const upBtn = card.querySelector('.move-up-btn');
            if (upBtn && index > 0) {
                upBtn.onclick = () => {
                    const orderedIds = items.map(i => i.id);
                    const temp = orderedIds[index];
                    orderedIds[index] = orderedIds[index - 1];
                    orderedIds[index - 1] = temp;
                    window.appStore.reorderRoutineItems(orderedIds);
                    this.renderAll();
                };
            }

            const downBtn = card.querySelector('.move-down-btn');
            if (downBtn && index < items.length - 1) {
                downBtn.onclick = () => {
                    const orderedIds = items.map(i => i.id);
                    const temp = orderedIds[index];
                    orderedIds[index] = orderedIds[index + 1];
                    orderedIds[index + 1] = temp;
                    window.appStore.reorderRoutineItems(orderedIds);
                    this.renderAll();
                };
            }

            listEl.appendChild(card);
        });

        this.updateLucideIcons();
    }

    // --- Modal Management (Single Task) ---
    openAddTaskModal() {
        if (this.isOlderThanYesterday(this.selectedDate)) {
            alert('Cannot add tasks to past archive dates. Please jump to Today or Yesterday.');
            return;
        }

        const modal = document.getElementById('addTaskModal');
        const form = document.getElementById('addTaskForm');
        form.reset();

        document.getElementById('taskModalTitle').textContent = 'Add New Task';
        document.getElementById('taskIdEditInput').value = '';
        document.getElementById('taskIsOneOffEditInput').value = '';
        document.getElementById('taskScopeSelectionContainer').style.display = 'block';
        document.getElementById('taskTypeRoutine').checked = true;
        this.setTimeFields(''); // Clear 12H Time & AM/PM selectors
        this.toggleTaskTypeFields();

        modal.classList.remove('hidden');
    }

    openEditRoutineModal(routineId) {
        const items = window.appStore.getRoutineItems();
        const item = items.find(i => i.id === routineId);
        if (!item) return;

        const modal = document.getElementById('addTaskModal');
        document.getElementById('taskModalTitle').textContent = 'Edit Master Routine Item';
        document.getElementById('taskIdEditInput').value = item.id;
        document.getElementById('taskIsOneOffEditInput').value = 'false';
        document.getElementById('taskTitleInput').value = item.title;
        this.setTimeFields(item.time || ''); // Populate Hour, Minute, and AM/PM
        document.getElementById('taskDurationInput').value = item.duration || '';
        document.getElementById('taskNotesInput').value = item.notes || '';

        document.getElementById('taskScopeSelectionContainer').style.display = 'none';

        const recurrenceSelect = document.getElementById('taskRecurrenceInput');
        if (item.days === 'all' || item.days === 'weekdays' || item.days === 'weekends') {
            recurrenceSelect.value = item.days;
        } else {
            recurrenceSelect.value = 'all';
        }

        this.toggleTaskTypeFields();
        modal.classList.remove('hidden');
    }

    openEditOneOffModal(taskId) {
        const log = window.appStore.getDailyLog(this.getSelectedDateStr());
        const task = (log.oneOffTasks || []).find(t => t.id === taskId);
        if (!task) return;

        const modal = document.getElementById('addTaskModal');
        document.getElementById('taskModalTitle').textContent = 'Edit Task (This Date Only)';
        document.getElementById('taskIdEditInput').value = task.id;
        document.getElementById('taskIsOneOffEditInput').value = 'true';
        document.getElementById('taskTitleInput').value = task.title;
        this.setTimeFields(task.time || ''); // Populate Hour, Minute, and AM/PM
        document.getElementById('taskDurationInput').value = task.duration || '';
        document.getElementById('taskNotesInput').value = task.notes || '';

        document.getElementById('taskScopeSelectionContainer').style.display = 'none';
        document.getElementById('recurrenceFieldContainer').style.display = 'none';

        modal.classList.remove('hidden');
    }

    closeAddTaskModal() {
        const modal = document.getElementById('addTaskModal');
        modal.classList.add('hidden');
    }

    toggleTaskTypeFields() {
        const isRoutine = document.getElementById('taskTypeRoutine').checked;
        const recurrenceField = document.getElementById('recurrenceFieldContainer');
        if (recurrenceField) {
            recurrenceField.style.display = isRoutine ? 'block' : 'none';
        }
    }

    handleTaskFormSubmit(e) {
        e.preventDefault();
        const editId = document.getElementById('taskIdEditInput').value;
        const isOneOffEdit = document.getElementById('taskIsOneOffEditInput').value === 'true';
        const isRoutine = document.getElementById('taskTypeRoutine').checked;
        const title = document.getElementById('taskTitleInput').value;
        const time = this.getTimeFromFields(); // Assemble 12H + AM/PM into HH:mm
        const duration = document.getElementById('taskDurationInput').value;
        const notes = document.getElementById('taskNotesInput').value;
        const days = document.getElementById('taskRecurrenceInput').value;
        const currentDateStr = this.getSelectedDateStr();

        if (!title.trim()) return;

        if (editId) {
            if (isOneOffEdit) {
                window.appStore.updateOneOffTask(currentDateStr, editId, {
                    title,
                    time,
                    duration,
                    notes
                });
            } else {
                window.appStore.updateRoutineItem(editId, {
                    title,
                    time,
                    duration,
                    notes,
                    days
                });
            }
        } else if (isRoutine) {
            window.appStore.addRoutineItem({
                title,
                time,
                duration,
                notes,
                days
            }, currentDateStr);
        } else {
            window.appStore.addOneOffTask(currentDateStr, {
                title,
                time,
                duration,
                notes
            });
        }

        this.closeAddTaskModal();
        this.renderAll();
    }

    // --- Bulk Add Multiple Tasks Controller ---
    openBulkAddModal() {
        const modal = document.getElementById('bulkAddTaskModal');
        const textarea = document.getElementById('bulkTasksTextarea');
        if (modal) {
            modal.classList.remove('hidden');
            this.updateBulkPreview();
            if (textarea) textarea.focus();
        }
    }

    closeBulkAddModal() {
        const modal = document.getElementById('bulkAddTaskModal');
        if (modal) modal.classList.add('hidden');
    }

    switchToBulkAddModal() {
        this.closeAddTaskModal();
        this.openBulkAddModal();
    }

    parseBulkTasks(rawText, defaultRecurrence = 'all') {
        const lines = rawText.split('\n');
        const parsed = [];

        lines.forEach(line => {
            let cleaned = line.trim();
            if (!cleaned) return;

            // Remove leading bullet characters or numbers (e.g. "1. ", "- ", "* ")
            cleaned = cleaned.replace(/^(\d+[\.\)]|\-|\*)\s*/, '');

            let time = '';
            let duration = '';
            let notes = '';

            // 1. Check for time at start (e.g. "07:00 AM - " or "7:30pm " or "14:00 ")
            const timeMatch = cleaned.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])\s*(am|pm)?\s*[-–:]*\s*/i);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1], 10);
                const min = timeMatch[2];
                const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

                if (ampm === 'pm' && hour < 12) hour += 12;
                if (ampm === 'am' && hour === 12) hour = 0;

                time = `${String(hour).padStart(2, '0')}:${min}`;
                cleaned = cleaned.slice(timeMatch[0].length).trim();
            }

            // 2. Check for duration at end with pipe or parenthesis e.g. "| 30m" or "(45m)"
            const durMatch = cleaned.match(/[\|\(]\s*(\d+\s*(m|min|mins|h|hr|hours))\s*[\)]?$/i);
            if (durMatch) {
                duration = durMatch[1].trim();
                cleaned = cleaned.replace(/[\|\(]\s*(\d+\s*(m|min|mins|h|hr|hours))\s*[\)]?$/i, '').trim();
            }

            if (cleaned) {
                parsed.push({
                    title: cleaned,
                    time: time,
                    duration: duration,
                    notes: notes,
                    days: defaultRecurrence
                });
            }
        });

        return parsed;
    }

    updateBulkPreview() {
        const textarea = document.getElementById('bulkTasksTextarea');
        const recurrenceSelect = document.getElementById('bulkRecurrenceSelect');
        const previewContainer = document.getElementById('bulkPreviewContainer');
        const countBadge = document.getElementById('bulkParsedCountBadge');

        if (!textarea || !previewContainer) return;

        const recurrence = recurrenceSelect ? recurrenceSelect.value : 'all';
        const tasks = this.parseBulkTasks(textarea.value, recurrence);

        if (countBadge) {
            countBadge.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'} detected`;
        }

        if (tasks.length === 0) {
            previewContainer.innerHTML = `<p class="italic text-center py-2 text-slate-600">Start typing tasks above (1 per line) to see live preview...</p>`;
            return;
        }

        const settings = window.appStore.getSettings();

        previewContainer.innerHTML = tasks.map((t, idx) => {
            const formattedTime = t.time ? RoutineEngine.formatTime(t.time, settings.timeFormat) : 'Anytime';
            return `
                <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="text-indigo-400 font-mono font-bold">${idx + 1}.</span>
                        <span class="font-semibold text-slate-200 truncate">${this.escapeHtml(t.title)}</span>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0 text-[11px] text-slate-400">
                        ${t.time ? `<span class="text-indigo-300 font-medium">${formattedTime}</span>` : ''}
                        ${t.duration ? `<span class="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">${t.duration}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    handleBulkAddSubmit() {
        const textarea = document.getElementById('bulkTasksTextarea');
        const recurrenceSelect = document.getElementById('bulkRecurrenceSelect');
        const destinationSelect = document.getElementById('bulkDestinationSelect');

        if (!textarea) return;

        const recurrence = recurrenceSelect ? recurrenceSelect.value : 'all';
        const destination = destinationSelect ? destinationSelect.value : 'master';
        const tasks = this.parseBulkTasks(textarea.value, recurrence);

        if (tasks.length === 0) {
            alert('Please enter at least one task title.');
            return;
        }

        const currentDateStr = this.getSelectedDateStr();

        if (destination === 'master') {
            window.appStore.addMultipleRoutineItems(tasks, currentDateStr);
        } else {
            tasks.forEach(t => {
                window.appStore.addOneOffTask(currentDateStr, {
                    title: t.title,
                    time: t.time,
                    duration: t.duration,
                    notes: t.notes
                });
            });
        }

        textarea.value = '';
        this.closeBulkAddModal();
        this.renderAll();
    }

    // --- Routine Manager Modal ---
    openRoutineManagerModal() {
        document.getElementById('routineManagerModal').classList.remove('hidden');
        this.renderRoutineManagerList();
    }

    closeRoutineManagerModal() {
        document.getElementById('routineManagerModal').classList.add('hidden');
        this.renderAll();
    }

    openSettingsModal() {
        const settings = window.appStore.getSettings();
        document.getElementById('settingTimeFormat').value = settings.timeFormat || '12h';
        document.getElementById('settingSoundToggle').checked = settings.soundEnabled !== false;
        document.getElementById('settingTheme').value = settings.theme || 'dark';

        document.getElementById('settingsModal').classList.remove('hidden');
    }

    closeSettingsModal() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    saveSettingsFromModal() {
        const timeFormat = document.getElementById('settingTimeFormat').value;
        const soundEnabled = document.getElementById('settingSoundToggle').checked;
        const theme = document.getElementById('settingTheme').value;

        window.appStore.updateSettings({
            timeFormat,
            soundEnabled,
            theme
        });

        window.soundEffects.enabled = soundEnabled;
        this.applyTheme(theme);
        this.closeSettingsModal();
        this.renderAll();
    }

    loadPresetTemplate(presetKey) {
        const preset = PRESET_TEMPLATES[presetKey];
        if (!preset) return;

        if (confirm(`Load the "${preset.name}" template? This will set your master routine schedule.`)) {
            const newItems = preset.items.map((item, index) => ({
                id: 'routine-' + Date.now() + '-' + index,
                title: item.title,
                time: item.time,
                duration: item.duration,
                days: item.days,
                icon: item.icon,
                notes: '',
                order: index + 1,
                createdAtDate: '2020-01-01',
                deletedAtDate: null,
                enabled: true
            }));
            window.appStore.saveRoutineItems(newItems);
            this.renderAll();
        }
    }

    // --- Export / Import ---
    exportDataToFile() {
        const dataStr = window.appStore.exportAllData();
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daypulse_backup_${this.getSelectedDateStr()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importDataFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = window.appStore.importData(e.target.result);
            if (result.success) {
                alert('Schedule data imported successfully!');
                this.renderAll();
                this.closeSettingsModal();
            } else {
                alert('Error importing data: ' + result.error);
            }
        };
        reader.readAsText(file);
    }

    applyTheme(theme) {
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    // --- Global Event Listeners ---
    setupEventListeners() {
        // Date navigation buttons
        document.getElementById('prevDateBtn')?.addEventListener('click', () => {
            this.selectedDate.setDate(this.selectedDate.getDate() - 1);
            this.renderAll();
        });

        document.getElementById('nextDateBtn')?.addEventListener('click', () => {
            this.selectedDate.setDate(this.selectedDate.getDate() + 1);
            this.renderAll();
        });

        document.getElementById('todayBtn')?.addEventListener('click', () => {
            this.selectedDate = new Date();
            this.renderAll();
        });

        // Direct Native Date Picker Change Event
        document.getElementById('datePickerInput')?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.selectedDate = new Date(e.target.value + 'T00:00:00');
                this.renderAll();
            }
        });

        // Quick add buttons
        document.getElementById('openAddTaskBtn')?.addEventListener('click', () => this.openAddTaskModal());
        document.getElementById('manageRoutinesBtn')?.addEventListener('click', () => this.openRoutineManagerModal());
        document.getElementById('openSettingsBtn')?.addEventListener('click', () => this.openSettingsModal());
        document.getElementById('printChecklistBtn')?.addEventListener('click', () => window.print());

        // Single Task Modal triggers
        document.getElementById('closeAddTaskModalBtn')?.addEventListener('click', () => this.closeAddTaskModal());
        document.getElementById('cancelAddTaskBtn')?.addEventListener('click', () => this.closeAddTaskModal());
        document.getElementById('addTaskForm')?.addEventListener('submit', (e) => this.handleTaskFormSubmit(e));
        document.getElementById('clearTimeBtn')?.addEventListener('click', () => {
            this.setTimeFields('');
        });

        document.getElementById('taskTypeRoutine')?.addEventListener('change', () => this.toggleTaskTypeFields());
        document.getElementById('taskTypeOneOff')?.addEventListener('change', () => this.toggleTaskTypeFields());

        // Bulk Add Modal triggers
        document.getElementById('routineManagerBulkAddBtn')?.addEventListener('click', () => this.openBulkAddModal());
        document.getElementById('closeBulkAddModalBtn')?.addEventListener('click', () => this.closeBulkAddModal());
        document.getElementById('cancelBulkAddModalBtn')?.addEventListener('click', () => this.closeBulkAddModal());
        document.getElementById('confirmBulkAddBtn')?.addEventListener('click', () => this.handleBulkAddSubmit());

        document.getElementById('bulkTasksTextarea')?.addEventListener('input', () => this.updateBulkPreview());
        document.getElementById('bulkRecurrenceSelect')?.addEventListener('change', () => this.updateBulkPreview());

        // Delete choice modal actions
        document.getElementById('deleteForTodayBtn')?.addEventListener('click', () => {
            if (this.pendingDeleteRoutineId) {
                window.appStore.deleteRoutineTaskForTodayOnly(this.getSelectedDateStr(), this.pendingDeleteRoutineId);
                this.closeDeleteRoutineChoiceModal();
                this.renderAll();
            }
        });

        document.getElementById('deletePermanentlyBtn')?.addEventListener('click', () => {
            if (this.pendingDeleteRoutineId) {
                window.appStore.deleteRoutineItem(this.pendingDeleteRoutineId, this.getSelectedDateStr());
                this.closeDeleteRoutineChoiceModal();
                this.renderAll();
            }
        });

        document.getElementById('cancelDeleteModalBtn')?.addEventListener('click', () => {
            this.closeDeleteRoutineChoiceModal();
        });

        // Routine Manager Modal Actions
        document.getElementById('closeRoutineManagerBtn')?.addEventListener('click', () => this.closeRoutineManagerModal());
        document.getElementById('routineManagerAddBtn')?.addEventListener('click', () => {
            this.closeRoutineManagerModal();
            this.openAddTaskModal();
        });

        // Routine Manager: Delete All Tasks Button
        document.getElementById('routineManagerDeleteAllBtn')?.addEventListener('click', () => {
            const currentRoutines = window.appStore.getRoutineItems();
            if (currentRoutines.length === 0) {
                alert('Your master routine is already empty.');
                return;
            }
            if (confirm(`Are you sure you want to DELETE ALL ${currentRoutines.length} tasks from your master routine schedule?`)) {
                window.appStore.deleteAllRoutineItems(this.getSelectedDateStr());
                this.renderAll();
            }
        });

        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.closeSettingsModal());
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.saveSettingsFromModal());

        // Preset templates
        document.getElementById('presetBalancedBtn')?.addEventListener('click', () => this.loadPresetTemplate('balanced'));
        document.getElementById('presetStudentBtn')?.addEventListener('click', () => this.loadPresetTemplate('student'));
        document.getElementById('presetMinimalistBtn')?.addEventListener('click', () => this.loadPresetTemplate('minimalist'));

        // Export/Import
        document.getElementById('exportBackupBtn')?.addEventListener('click', () => this.exportDataToFile());
        document.getElementById('importBackupInput')?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.importDataFromFile(e.target.files[0]);
            }
        });

        // Daily notes auto-save
        let notesTimeout;
        document.getElementById('dailyNotesTextarea')?.addEventListener('input', (e) => {
            if (!this.canCheckTasks(this.selectedDate)) return;
            clearTimeout(notesTimeout);
            notesTimeout = setTimeout(() => {
                window.appStore.saveDailyNotes(this.getSelectedDateStr(), e.target.value);
            }, 500);
        });

        // Keyboard shortcuts: ESC to close modals
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAddTaskModal();
                this.closeBulkAddModal();
                this.closeRoutineManagerModal();
                this.closeDeleteRoutineChoiceModal();
                this.closeSettingsModal();
            }
        });
    }

    updateLucideIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DayPulseApp();
});
