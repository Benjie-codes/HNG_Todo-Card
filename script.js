const task = {
      id: "task-001",
      title: "Finalize Design System Tokens",
      description:
        "",
      priority: "High",
      status: "In Progress",
      dueDate: new Date("2026-05-01T18:00:00Z"),
      tags: [
        { id: "work",   label: "Work"   },
        { id: "urgent", label: "Urgent" },
        { id: "design", label: "Design" },
      ],
      completed: false,
    };

    const card      = document.querySelector('[data-testid="test-todo-card"]');
    const checkbox  = document.querySelector('[data-testid="test-todo-complete-toggle"]');
    const titleEl   = document.querySelector('[data-testid="test-todo-title"]');
    const statusEl  = document.querySelector('[data-testid="test-todo-status"]');
    const timeEl    = document.getElementById("time-remaining");
    const editBtn   = document.querySelector('[data-testid="test-todo-edit-button"]');
    const deleteBtn = document.querySelector('[data-testid="test-todo-delete-button"]');

    function getTimeRemaining(dueDate) {
      const now = Date.now();
      const due = new Date(dueDate).getTime();
      const diffMs = due - now;
      const diffMinutes = Math.round(diffMs / 60000);
      const diffHours   = Math.round(diffMs / 3600000);
      const diffDays    = Math.round(diffMs / 86400000);

      if (diffMs <= 0) {
        const overMs    = Math.abs(diffMs);
        const overMins  = Math.round(overMs / 60000);
        const overHours = Math.round(overMs / 3600000);
        const overDays  = Math.round(overMs / 86400000);

        if (overMins  < 2) return "Due now!";
        if (overHours < 1) return `Overdue by ${overMins} minute${overMins > 1 ? "s" : ""}`;
        if (overDays  < 1) return `Overdue by ${overHours} hour${overHours > 1 ? "s" : ""}`;
        return `Overdue by ${overDays} day${overDays > 1 ? "s" : ""}`;
      }

      if (diffMinutes < 2)  return "Due now!";
      if (diffHours   < 1)  return `Due in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
      if (diffHours   < 24) return `Due in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
      if (diffDays   === 1) return "Due tomorrow";
      return `Due in ${diffDays} days`;
    }

    function getTimeColor(text) {
      if (text.startsWith("Overdue")) return "#CC0000";
      if (text === "Due now!")        return "var(--color-accent)";
      if (text.includes("minute"))    return "var(--color-accent)";
      if (text.includes("hour"))      return "var(--color-text-secondary)";
      if (text === "Due tomorrow")    return "var(--color-text-secondary)";
      return "var(--color-text-muted)";
    }

    function updateTimeRemaining() {
      const text = getTimeRemaining(task.dueDate);
      timeEl.textContent = text;
      timeEl.style.color = getTimeColor(text);
    }

    // Initial render + auto-refresh every 60s
    updateTimeRemaining();
    setInterval(updateTimeRemaining, 60000);

    const state = {
      completed: false,
      status: task.status,
    };

    const statusControl = document.querySelector('[data-testid="test-todo-status-control"]');

    function slugify(str) {
      return str.toLowerCase().replace(/\s+/g, "-");
    }

    function applyStatus(newStatus) {
      state.status   = newStatus;
      task.status    = newStatus;
      state.completed = (newStatus === 'Done');

      // Checkbox sync
      checkbox.checked = state.completed;

      // Title strike-through
      card.classList.toggle('todo-card--completed', state.completed);

      // Status badge display
      statusEl.textContent = newStatus;
      statusEl.className   = 'badge badge--' + slugify(newStatus);
      statusEl.setAttribute('aria-label', 'Status: ' + newStatus);

      // Status control sync
      statusControl.value     = newStatus;
      statusControl.className = 'status-control status-control--' + slugify(newStatus);

      // Card body opacity
      card.classList.toggle('todo-card--completed', state.completed);
    }

    // Checkbox → Status
    checkbox.addEventListener('change', function () {
      applyStatus(checkbox.checked ? 'Done' : 'Pending');
    });

    // Status Control → Checkbox + Display
    statusControl.addEventListener('change', function () {
      applyStatus(statusControl.value);
    });

    // ── Edit Mode ──
    const editForm       = document.querySelector('[data-testid="test-todo-edit-form"]');
    const editTitleInput  = document.querySelector('[data-testid="test-todo-edit-title-input"]');
    const editDescInput   = document.querySelector('[data-testid="test-todo-edit-description-input"]');
    const editPrioritySelect = document.querySelector('[data-testid="test-todo-edit-priority-select"]');
    const editDueDateInput   = document.querySelector('[data-testid="test-todo-edit-due-date-input"]');
    const cancelBtn      = document.querySelector('[data-testid="test-todo-cancel-button"]');
    const titleError     = editForm.querySelector('.error-message');
    const descEl         = document.querySelector('[data-testid="test-todo-description"]');
    const priorityEl     = document.querySelector('[data-testid="test-todo-priority"]');
    const dueDateEl      = document.querySelector('[data-testid="test-todo-due-date"]');

    function enterEditMode() {
      // Pre-populate fields with current displayed values
      editTitleInput.value    = titleEl.textContent.trim();
      editDescInput.value     = descEl.textContent.trim();
      editPrioritySelect.value = task.priority;

      const d    = task.dueDate;
      const yyyy = d.getUTCFullYear();
      const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd   = String(d.getUTCDate()).padStart(2, '0');
      editDueDateInput.value = `${yyyy}-${mm}-${dd}`;

      // Clear previous errors
      titleError.textContent = '';

      // Enter edit mode
      card.classList.add('todo-card--editing');

      // Focus the title input
      editTitleInput.focus();
    }

    function exitEditMode() {
      card.classList.remove('todo-card--editing');
      editBtn.focus();
    }

    // Clear title error on input
    editTitleInput.addEventListener('input', function () {
      if (editTitleInput.value.trim()) {
        titleError.textContent = '';
      }
    });

    // Edit button opens edit mode
    editBtn.addEventListener('click', enterEditMode);

    // Cancel discards changes
    cancelBtn.addEventListener('click', exitEditMode);

    // Save validates & persists
    editForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const newTitle = editTitleInput.value.trim();
      if (!newTitle) {
        titleError.textContent = 'Title cannot be empty';
        editTitleInput.focus();
        return;
      }

      // Update task data
      task.title       = newTitle;
      task.description = editDescInput.value.trim();
      task.priority    = editPrioritySelect.value;
      task.dueDate     = new Date(editDueDateInput.value + 'T18:00:00Z');

      // Update displayed title
      titleEl.textContent = task.title;

      // Update displayed description
      descEl.textContent = task.description;

      // Update priority badge
      priorityEl.textContent = task.priority;
      priorityEl.className   = 'badge badge--' + task.priority.toLowerCase();
      priorityEl.setAttribute('aria-label', 'Priority: ' + task.priority);

      // Update due date display
      const opts = { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' };
      dueDateEl.textContent = 'Due ' + task.dueDate.toLocaleDateString('en-US', opts);
      dueDateEl.setAttribute('datetime', task.dueDate.toISOString());
      timeEl.setAttribute('datetime', task.dueDate.toISOString());

      // Update button aria-labels to reflect new title
      editBtn.setAttribute('aria-label', 'Edit task: ' + task.title);
      deleteBtn.setAttribute('aria-label', 'Delete task: ' + task.title);

      // Refresh countdown
      updateTimeRemaining();

      exitEditMode();
    });

    deleteBtn.addEventListener("click", () => {
      alert(`Delete task "${task.title}"?`);
    });

    // Initial state
    applyStatus(task.status);