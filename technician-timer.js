const STORAGE_KEY = 'cyberjo-technician-timer';
const minutesPerVu = {
    1: 120,
    2: 90,
    3: 60,
    4: 45
};

const form = document.getElementById('task-form');
const taskNameInput = document.getElementById('task-name');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('tasks-empty');
const summaryOutput = document.getElementById('summary-output');
const copySummaryButton = document.getElementById('copy-summary');
const clearAllButton = document.getElementById('clear-all');
const taskCompleteModal = document.getElementById('task-complete-modal');
const taskCompleteForm = document.getElementById('task-complete-form');
const taskCompleteClose = document.getElementById('task-complete-close');
const taskCompleteCancel = document.getElementById('task-complete-cancel');
const taskCompleteError = document.getElementById('task-complete-error');
const taskTotalMinutes = document.getElementById('task-total-minutes');

let tasks = [];
let pendingTaskIndex = null;

function formatDuration(totalSeconds) {
    const totalMinutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
}

function formatMinutes(totalSeconds) {
    const minutes = (totalSeconds / 60).toFixed(1);
    return `${minutes} min`;
}

function getTaskElapsedSeconds(task) {
    if (task.isRunning && task.startedAt) {
        return task.elapsedSeconds + Math.floor((Date.now() - task.startedAt) / 1000);
    }

    return task.elapsedSeconds || 0;
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        tasks = [];
        return;
    }

    try {
        tasks = JSON.parse(stored);
    } catch (error) {
        tasks = [];
    }
}

function calculateAdjustedTime(tierMinutes, finalTier) {
    let totalVu = 0;

    Object.entries(tierMinutes).forEach(([tier, minutes]) => {
        if (!minutes) return;
        const tierNumber = Number(tier);
        totalVu += minutes / minutesPerVu[tierNumber];
    });

    const adjustedMinutes = totalVu * minutesPerVu[finalTier];
    const adjustedHours = adjustedMinutes / 60;

    return {
        totalVu: Number(totalVu.toFixed(2)),
        adjustedMinutes: Number(adjustedMinutes.toFixed(2)),
        adjustedHours: Number(adjustedHours.toFixed(2)),
        finalTier
    };
}

function buildTaskSummary(task) {
    const tierMinutes = {
        1: Number(task.tierMinutes?.[1]) || 0,
        2: Number(task.tierMinutes?.[2]) || 0,
        3: Number(task.tierMinutes?.[3]) || 0,
        4: Number(task.tierMinutes?.[4]) || 0
    };

    const highestTierWithTime = Object.entries(tierMinutes)
        .filter(([, minutes]) => minutes > 0)
        .map(([tier]) => Number(tier))
        .sort((a, b) => b - a)[0] || 3;

    const result = calculateAdjustedTime(tierMinutes, highestTierWithTime);
    const breakdownLines = Object.entries(tierMinutes)
        .filter(([, minutes]) => minutes > 0)
        .map(([tier, minutes]) => {
            const tierNumber = Number(tier);
            const tierVu = Number((minutes / minutesPerVu[tierNumber]).toFixed(2));
            return `Tier ${tierNumber}: ${minutes} minutes (${tierVu} VU)`;
        });

    return {
        ...result,
        summaryText: [
            'CyberJo task summary',
            `Task: ${task.name}`,
            `Total time spent: ${formatMinutes(task.elapsedSeconds || 0)}`,
            `Comment: ${task.comment || 'No comment provided'}`,
            `Final ticket tier: Tier ${result.finalTier}`,
            'Time breakdown:',
            ...breakdownLines,
            `Total VU: ${result.totalVu}`,
            `Adjusted booking time: ${result.adjustedMinutes} minutes (${result.adjustedHours} hours)`
        ].join('\n')
    };
}

function updateSummary() {
    const totalSeconds = tasks.reduce((sum, task) => sum + getTaskElapsedSeconds(task), 0);
    const lines = tasks.map((task) => {
        if (task.completed && task.summaryText) {
            return `${task.name}: ${task.summaryText}`;
        }

        return `${task.name}: ${formatDuration(getTaskElapsedSeconds(task))} (in progress)`;
    });

    if (!lines.length) {
        summaryOutput.value = 'No tasks recorded yet.';
        return;
    }

    summaryOutput.value = [
        'CyberJo technician timing summary',
        `Total tracked time: ${formatMinutes(totalSeconds)}`,
        '',
        ...lines
    ].join('\n');
}

function renderTasks() {
    taskList.innerHTML = '';

    if (!tasks.length) {
        emptyState.hidden = false;
        taskList.hidden = true;
        updateSummary();
        return;
    }

    emptyState.hidden = true;
    taskList.hidden = false;

    tasks.forEach((task, index) => {
        const card = document.createElement('article');
        card.className = 'task-card';

        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.name;

        const timer = document.createElement('div');
        timer.className = 'task-timer';
        timer.textContent = formatDuration(getTaskElapsedSeconds(task));

        const controls = document.createElement('div');
        controls.className = 'task-controls';

        const startButton = document.createElement('button');
        startButton.type = 'button';
        startButton.className = 'timer-primary-button';
        startButton.textContent = task.completed ? 'Completed' : (task.isRunning ? 'Running' : (task.elapsedSeconds > 0 ? 'Resume' : 'Start'));
        startButton.disabled = task.isRunning || task.completed;
        startButton.addEventListener('click', () => startTask(index));

        const pauseButton = document.createElement('button');
        pauseButton.type = 'button';
        pauseButton.className = 'timer-secondary-button';
        pauseButton.textContent = 'Pause';
        pauseButton.disabled = !task.isRunning || task.completed;
        pauseButton.addEventListener('click', () => pauseTask(index));

        const stopButton = document.createElement('button');
        stopButton.type = 'button';
        stopButton.className = 'timer-secondary-button';
        stopButton.textContent = 'Stop';
        stopButton.disabled = task.completed;
        stopButton.addEventListener('click', () => stopTask(index));

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'timer-link-button';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => removeTask(index));

        controls.append(startButton, pauseButton, stopButton, removeButton);
        card.append(title, timer);

        if (task.completed && task.summaryText) {
            const meta = document.createElement('div');
            meta.className = 'task-meta';
            meta.innerHTML = `<span><strong>Adjusted:</strong> ${formatMinutes(task.adjustedMinutes || 0)}</span><span><strong>Tier:</strong> ${task.finalTier ? `Tier ${task.finalTier}` : 'Tier 3'}</span>`;

            const comment = document.createElement('p');
            comment.className = 'task-comment';
            comment.textContent = task.comment ? `Comment: ${task.comment}` : 'Comment: No comment provided';

            const summaryTextarea = document.createElement('textarea');
            summaryTextarea.className = 'task-summary-output';
            summaryTextarea.readOnly = true;
            summaryTextarea.value = task.summaryText;

            const copyTaskButton = document.createElement('button');
            copyTaskButton.type = 'button';
            copyTaskButton.className = 'timer-secondary-button';
            copyTaskButton.textContent = 'Copy task summary';
            copyTaskButton.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(task.summaryText);
                    copyTaskButton.textContent = 'Copied';
                    setTimeout(() => {
                        copyTaskButton.textContent = 'Copy task summary';
                    }, 1200);
                } catch (error) {
                    copyTaskButton.textContent = 'Copy failed';
                    setTimeout(() => {
                        copyTaskButton.textContent = 'Copy task summary';
                    }, 1200);
                }
            });

            card.append(meta, comment, summaryTextarea, copyTaskButton);
        }

        card.append(controls);
        taskList.appendChild(card);
    });

    updateSummary();
}

function startTask(index) {
    const task = tasks[index];
    if (!task || task.isRunning || task.completed) {
        return;
    }

    task.isRunning = true;
    task.startedAt = Date.now();
    saveTasks();
    renderTasks();
}

function pauseTask(index) {
    const task = tasks[index];
    if (!task || !task.isRunning) {
        return;
    }

    const now = Date.now();
    task.elapsedSeconds += Math.floor((now - task.startedAt) / 1000);
    task.startedAt = null;
    task.isRunning = false;
    saveTasks();
    renderTasks();
}

function stopTask(index) {
    const task = tasks[index];
    if (!task || task.completed) {
        return;
    }

    if (task.isRunning) {
        const now = Date.now();
        task.elapsedSeconds += Math.floor((now - task.startedAt) / 1000);
        task.startedAt = null;
        task.isRunning = false;
    }

    pendingTaskIndex = index;
    taskCompleteError.textContent = '';
    taskCompleteForm.reset();

    if (taskTotalMinutes) {
        const elapsedSeconds = getTaskElapsedSeconds(task);
        taskTotalMinutes.textContent = `Total time worked: ${formatMinutes(elapsedSeconds)}`;
    }

    if (taskCompleteModal) {
        taskCompleteModal.classList.add('is-open');
        taskCompleteModal.setAttribute('aria-hidden', 'false');
    }
}

function closeCompletionModal() {
    pendingTaskIndex = null;
    taskCompleteError.textContent = '';
    if (taskCompleteModal) {
        taskCompleteModal.classList.remove('is-open');
        taskCompleteModal.setAttribute('aria-hidden', 'true');
    }
}

function saveCompletedTask(event) {
    event.preventDefault();

    if (pendingTaskIndex === null) {
        return;
    }

    const task = tasks[pendingTaskIndex];
    const formData = new FormData(taskCompleteForm);
    const tierMinutes = {
        1: Number(formData.get('tier-1-minutes')) || 0,
        2: Number(formData.get('tier-2-minutes')) || 0,
        3: Number(formData.get('tier-3-minutes')) || 0,
        4: Number(formData.get('tier-4-minutes')) || 0
    };

    const totalEnteredMinutes = Object.values(tierMinutes).reduce((sum, value) => sum + value, 0);
    if (totalEnteredMinutes <= 0) {
        taskCompleteError.textContent = 'Please enter at least one tier minute value before saving.';
        return;
    }

    const comment = taskCompleteForm.querySelector('[name="task-comment"]').value.trim();
    const summary = buildTaskSummary({
        ...task,
        comment,
        tierMinutes
    });

    task.completed = true;
    task.comment = comment;
    task.tierMinutes = tierMinutes;
    task.adjustedMinutes = summary.adjustedMinutes;
    task.adjustedHours = summary.adjustedHours;
    task.finalTier = summary.finalTier;
    task.summaryText = summary.summaryText;
    task.completedAt = new Date().toISOString();

    saveTasks();
    renderTasks();
    closeCompletionModal();
}

function removeTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

function addTask(name) {
    tasks.unshift({
        name: name.trim(),
        elapsedSeconds: 0,
        isRunning: false,
        startedAt: null,
        completed: false,
        tierMinutes: null,
        comment: ''
    });

    saveTasks();
    renderTasks();
}

function tick() {
    if (!tasks.some((task) => task.isRunning)) {
        return;
    }

    renderTasks();
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = taskNameInput.value.trim();
    if (!name) {
        return;
    }

    addTask(name);
    form.reset();
    taskNameInput.focus();
});

copySummaryButton.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(summaryOutput.value);
        copySummaryButton.textContent = 'Copied';
        setTimeout(() => {
            copySummaryButton.textContent = 'Copy summary';
        }, 1200);
    } catch (error) {
        copySummaryButton.textContent = 'Copy failed';
        setTimeout(() => {
            copySummaryButton.textContent = 'Copy summary';
        }, 1200);
    }
});

clearAllButton.addEventListener('click', () => {
    tasks = [];
    saveTasks();
    renderTasks();
});

if (taskCompleteForm) {
    taskCompleteForm.addEventListener('submit', saveCompletedTask);
}

if (taskCompleteClose) {
    taskCompleteClose.addEventListener('click', closeCompletionModal);
}

if (taskCompleteCancel) {
    taskCompleteCancel.addEventListener('click', closeCompletionModal);
}

if (taskCompleteModal) {
    taskCompleteModal.addEventListener('click', (event) => {
        if (event.target === taskCompleteModal) {
            closeCompletionModal();
        }
    });
}

loadTasks();
renderTasks();
setInterval(tick, 1000);
