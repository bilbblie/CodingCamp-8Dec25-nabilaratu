// To-Do List Application
document.addEventListener('DOMContentLoaded', function () {
    // ====================
    // DOM ELEMENTS
    // ====================
    const addBtn = document.getElementById('add-btn');
    const taskModal = document.getElementById('task-modal');
    const deleteModal = document.getElementById('delete-modal');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const modalSubmitBtn = document.getElementById('modal-submit-btn');
    const taskList = document.getElementById('task-list');
    const filterSelect = document.getElementById('filter-select');
    const searchInput = document.getElementById('search-input');

    // Stat elements
    const totalTasksEl = document.getElementById('total-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');

    // Form elements
    const taskTitle = document.getElementById('task-title');
    const taskDescription = document.getElementById('task-description'); // DITAMBAHKAN
    const charCount = document.getElementById('char-count'); // DITAMBAHKAN
    const taskDate = document.getElementById('task-date');
    const titleError = document.getElementById('title-error');
    const dateError = document.getElementById('date-error');

    // Delete modal elements
    const deleteTaskTitle = document.getElementById('delete-task-title');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');

    // ====================
    // STATE VARIABLES
    // ====================
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentSearch = '';
    let editingTaskId = null;
    let deletingTaskId = null;

    // ====================
    // INITIALIZATION
    // ====================
    function initApp() {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        taskDate.min = today;

        // Set up event listeners
        addBtn.addEventListener('click', () => openTaskModal('add'));

        // Character counter untuk deskripsi
        taskDescription.addEventListener('input', updateCharCount);

        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                taskModal.classList.remove('show');
                deleteModal.classList.remove('show');
                resetForm();
            });
        });

        // Cancel delete button
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.remove('show');
        });

        // Confirm delete button
        confirmDeleteBtn.addEventListener('click', deleteTask);

        // Form submission
        taskForm.addEventListener('submit', handleTaskSubmit);

        // Filter and search
        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderTasks();
        });

        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            renderTasks();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === taskModal) {
                taskModal.classList.remove('show');
                resetForm();
            }
            if (e.target === deleteModal) {
                deleteModal.classList.remove('show');
            }
        });

        // Load and render initial tasks
        renderTasks();
        updateStats();
    }

    // ====================
    // CHARACTER COUNTER
    // ====================
    function updateCharCount() {
        const count = taskDescription.value.length;
        charCount.textContent = count;

        // Update class berdasarkan jumlah karakter
        const charCounter = document.querySelector('.char-counter');
        charCounter.classList.remove('warning', 'error');

        if (count > 450 && count <= 500) {
            charCounter.classList.add('warning');
        } else if (count > 500) {
            charCounter.classList.add('error');
        }
    }

    // ====================
    // MODAL FUNCTIONS
    // ====================
    function openTaskModal(mode, taskId = null) {
        if (mode === 'add') {
            modalTitle.textContent = 'Tambah Task Baru';
            modalSubmitBtn.innerHTML = '<i class="fas fa-plus"></i> Tambah Task';
            editingTaskId = null;
            resetForm();
        } else if (mode === 'edit' && taskId) {
            modalTitle.textContent = 'Edit Task';
            modalSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
            editingTaskId = taskId;
            fillFormWithTaskData(taskId);
        }

        taskModal.classList.add('show');
    }

    function fillFormWithTaskData(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        taskTitle.value = task.title;
        taskDescription.value = task.description || '';
        taskDate.value = task.date;

        // Update character count
        updateCharCount();
    }

    function resetForm() {
        taskForm.reset();
        taskDate.min = new Date().toISOString().split('T')[0];
        titleError.textContent = '';
        dateError.textContent = '';
        editingTaskId = null;

        // Reset character count
        charCount.textContent = '0';
        const charCounter = document.querySelector('.char-counter');
        charCounter.classList.remove('warning', 'error');
    }

    // ====================
    // FORM HANDLING
    // ====================
    function handleTaskSubmit(e) {
        e.preventDefault();

        // Reset errors
        titleError.textContent = '';
        dateError.textContent = '';

        // Validate form
        let isValid = true;

        if (taskTitle.value.trim().length < 3) {
            titleError.textContent = 'Nama task minimal 3 karakter';
            isValid = false;
        }

        if (taskTitle.value.trim().length > 100) {
            titleError.textContent = 'Nama task maksimal 100 karakter';
            isValid = false;
        }

        if (taskDescription.value.length > 500) {
            // Pesan error untuk deskripsi terlalu panjang
            const charCounter = document.querySelector('.char-counter');
            charCounter.classList.add('error');
            isValid = false;
        }

        if (!taskDate.value) {
            dateError.textContent = 'Harap pilih tanggal deadline';
            isValid = false;
        }

        if (!isValid) return;

        // Get form data
        const taskData = {
            id: editingTaskId || Date.now(),
            title: taskTitle.value.trim(),
            description: taskDescription.value.trim(), // DITAMBAHKAN
            date: taskDate.value,
            completed: false,
            createdAt: editingTaskId ? tasks.find(t => t.id === editingTaskId).createdAt : new Date().toISOString()
        };

        // Save task
        if (editingTaskId) {
            // Update existing task
            const index = tasks.findIndex(t => t.id === editingTaskId);
            if (index !== -1) {
                tasks[index] = taskData;
                showNotification('Task berhasil diperbarui!', 'success');
            }
        } else {
            // Add new task
            tasks.push(taskData);
            showNotification('Task berhasil ditambahkan!', 'success');
        }

        // Save to localStorage and update UI
        saveTasks();
        renderTasks();
        updateStats();

        // Close modal and reset form
        taskModal.classList.remove('show');
        resetForm();
    }

    // ====================
    // TASK MANAGEMENT
    // ====================
    function deleteTask() {
        if (!deletingTaskId) return;

        tasks = tasks.filter(task => task.id !== deletingTaskId);
        saveTasks();
        renderTasks();
        updateStats();

        deleteModal.classList.remove('show');
        showNotification('Task berhasil dihapus!', 'error');
        deletingTaskId = null;
    }

    function openDeleteModal(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        deletingTaskId = taskId;
        deleteTaskTitle.textContent = task.title;
        deleteModal.classList.add('show');
    }

    function toggleTaskCompletion(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;

        saveTasks();
        renderTasks();
        updateStats();

        const status = task.completed ? 'selesai' : 'belum selesai';
        showNotification(`Task ditandai sebagai ${status}`, 'info');
    }

    // ====================
    // RENDER TASKS
    // ====================
    function renderTasks() {
        // Clear the task list
        taskList.innerHTML = '';

        // Filter tasks
        let filteredTasks = [...tasks];

        // Apply search filter
        if (currentSearch) {
            filteredTasks = filteredTasks.filter(task =>
                task.title.toLowerCase().includes(currentSearch) ||
                (task.description && task.description.toLowerCase().includes(currentSearch))
            );
        }

        // Apply status filter
        if (currentFilter === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }

        // Sort tasks: incomplete first, then by date
        filteredTasks.sort((a, b) => {
            // Completed tasks go to bottom
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;

            // Then sort by date (closest first)
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;

            return 0;
        });

        // Render tasks or empty state
        if (filteredTasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';

            const icon = document.createElement('i');
            icon.className = 'fas fa-clipboard-list';

            const heading = document.createElement('h3');
            heading.textContent = getEmptyStateMessage();

            const message = document.createElement('p');
            message.textContent = currentSearch
                ? 'Coba gunakan kata kunci lain'
                : 'Klik "Tambah Task Baru" untuk mulai menambahkan tugas';

            emptyState.appendChild(icon);
            emptyState.appendChild(heading);
            emptyState.appendChild(message);
            taskList.appendChild(emptyState);
        } else {
            filteredTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                taskList.appendChild(taskElement);
            });
        }
    }

    function getEmptyStateMessage() {
        if (currentSearch) return 'Tidak ada task yang cocok';
        if (currentFilter === 'pending') return 'Tidak ada task yang belum selesai';
        if (currentFilter === 'completed') return 'Belum ada task yang selesai';
        return 'Belum ada task';
    }

    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.dataset.id = task.id;

        // Task content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'task-content';

        // Task header with title and status
        const headerDiv = document.createElement('div');
        headerDiv.className = 'task-header';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'task-title';
        titleDiv.textContent = task.title;

        const statusSpan = document.createElement('span');
        statusSpan.className = `task-status status-${task.completed ? 'completed' : 'pending'}`;
        statusSpan.textContent = task.completed ? 'SELESAI' : 'BELUM SELESAI';

        headerDiv.appendChild(titleDiv);
        headerDiv.appendChild(statusSpan);



        // Date information
        const dateInfoDiv = document.createElement('div');
        dateInfoDiv.className = 'task-date-info';

        const dateBadge = document.createElement('span');
        dateBadge.className = 'date-badge';

        const dateIcon = document.createElement('i');
        dateIcon.className = 'fas fa-calendar-day';

        const dateSpan = document.createElement('span');
        dateSpan.textContent = formatDate(task.date);

        const daysSpan = document.createElement('span');
        daysSpan.className = 'days-count';

        const daysText = getDaysText(task.date);
        daysSpan.textContent = daysText;

        // Add color class based on days
        const days = calculateDaysUntilDue(task.date);
        if (days < 0) {
            daysSpan.classList.add('days-overdue');
        } else if (days === 0) {
            daysSpan.classList.add('days-today');
        } else {
            daysSpan.classList.add('days-future');
        }

        dateBadge.appendChild(dateIcon);
        dateBadge.appendChild(dateSpan);
        dateBadge.appendChild(document.createTextNode(' • '));
        dateBadge.appendChild(daysSpan);

        dateInfoDiv.appendChild(dateBadge);

        contentDiv.appendChild(headerDiv);
        
        // Tambahkan deskripsi di sini (setelah header, sebelum date info)
        if (task.description && task.description.trim() !== '') {
            const descDiv = document.createElement('div');
            descDiv.className = 'task-description-text';
            descDiv.textContent = task.description;
            contentDiv.appendChild(descDiv);
        }
        
        contentDiv.appendChild(dateInfoDiv);

        // Task actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        // Complete button
        const completeBtn = document.createElement('button');
        completeBtn.className = 'action-btn complete-btn';
        completeBtn.innerHTML = task.completed ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-check"></i>';
        completeBtn.title = task.completed ? 'Tandai belum selesai' : 'Tandai selesai';
        completeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTaskCompletion(task.id);
        });

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Edit task';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTaskModal('edit', task.id);
        });

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Hapus task';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(task.id);
        });

        actionsDiv.appendChild(completeBtn);
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        taskElement.appendChild(contentDiv);
        taskElement.appendChild(actionsDiv);

        return taskElement;
    }

    // ====================
    // UTILITY FUNCTIONS
    // ====================
    function calculateDaysUntilDue(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(dateString);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    function getDaysText(dateString) {
        const days = calculateDaysUntilDue(dateString);

        if (days < 0) {
            return `${Math.abs(days)} hari lewat`;
        } else if (days === 0) {
            return 'Hari ini';
        } else if (days === 1) {
            return 'Besok';
        } else {
            return `${days} hari lagi`;
        }
    }

    function formatDate(dateString) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Tanggal tidak valid';
        }

        return date.toLocaleDateString('id-ID', options);
    }

    // ====================
    // STATISTICS & STORAGE
    // ====================
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;

        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // ====================
    // NOTIFICATION SYSTEM
    // ====================
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 2000;
            transform: translateX(150%);
            transition: transform 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        `;

        if (type === 'success') {
            notification.style.background = 'linear-gradient(to right, #10b981, #059669)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(to right, #ef4444, #dc2626)';
        } else {
            notification.style.background = 'linear-gradient(to right, #4f46e5, #7c3aed)';
        }

        // Add to body
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(150%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // ====================
    // ADDITIONAL CSS FOR NOTIFICATIONS
    // ====================
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 2000;
            transform: translateX(150%);
            transition: transform 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            background: linear-gradient(to right, #10b981, #059669);
        }
        
        .notification.error {
            background: linear-gradient(to right, #ef4444, #dc2626);
        }
        
        .notification.info {
            background: linear-gradient(to right, #4f46e5, #7c3aed);
        }
    `;
    document.head.appendChild(style);

    // ====================
    // START THE APPLICATION
    // ====================
    initApp();
});