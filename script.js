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

    const state = {
      completed: false,
      status: task.status,
      isCollapsed: false,
    };

    const overdueIndicator = document.querySelector('[data-testid="test-todo-overdue-indicator"]');

    function updateTimeRemaining() {
      if (state.status === 'Done') {
        timeEl.textContent = "Completed";
        timeEl.className = "";
        overdueIndicator.style.display = "none";
        return;
      }

      const now = Date.now();
      const due = new Date(task.dueDate).getTime();
      const diffMs = due - now;

      const absMs = Math.abs(diffMs);
      const minutes = Math.floor(absMs / 60000);
      const hours = Math.floor(absMs / 3600000);
      const days = Math.floor(hours / 24);

      let text = "";
      let isOverdue = false;

      if (diffMs < 0) {
        isOverdue = true;
        if (hours < 1) text = `Overdue by ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        else if (hours <= 24) text = `Overdue by ${hours} hour${hours !== 1 ? 's' : ''}`;
        else text = `Overdue by ${days} day${days !== 1 ? 's' : ''}`;
      } else {
        if (hours < 1) text = `Due in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        else if (hours <= 48) text = `Due in ${hours} hour${hours !== 1 ? 's' : ''}`;
        else text = `Due in ${days} days`;
      }

      timeEl.textContent = text;

      if (isOverdue) {
        timeEl.className = "time-remaining--overdue";
        overdueIndicator.style.display = "inline-flex";
      } else {
        timeEl.className = "";
        overdueIndicator.style.display = "none";
      }
    }

    // Initial render + auto-refresh every 45s
    updateTimeRemaining();
    setInterval(updateTimeRemaining, 45000);

    const statusControl = document.querySelector('[data-testid="test-todo-status-control"]');
    const collSectionEl = document.querySelector('[data-testid="test-todo-collapsible-section"]');
    const collToggleBtn = document.querySelector('[data-testid="test-todo-expand-toggle"]');
    const collToggleLabel = collToggleBtn.querySelector('.expand-label');

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

      // Card body visually completed & check time display updates
      card.classList.toggle('todo-card--completed', state.completed);
      updateTimeRemaining();
    }

    // Checkbox → Status
    checkbox.addEventListener('change', function () {
      applyStatus(checkbox.checked ? 'Done' : 'Pending');
    });

    // Status Control → Checkbox + Display
    statusControl.addEventListener('change', function () {
      applyStatus(statusControl.value);
    });

    // ── Description Collapse ──
    function setCollapsedState(collapse) {
      state.isCollapsed = collapse;
      if (collapse) {
        collSectionEl.className = 'collapsible-section is-collapsed';
        collToggleBtn.setAttribute('aria-expanded', 'false');
        collToggleLabel.textContent = 'Show more';
      } else {
        collSectionEl.className = 'collapsible-section is-expanded';
        collToggleBtn.setAttribute('aria-expanded', 'true');
        collToggleLabel.textContent = 'Show less';
      }
    }

    function evaluateDescription() {
      const text = task.description.trim();
      const isLongChars = text.length > 120;

      // Unrestrict to measure true height
      collSectionEl.className = 'collapsible-section';
      collSectionEl.style.maxHeight = 'none';
      
      const computedStyle = window.getComputedStyle(descEl);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 22.4; // fallback for 1.6 * .875rem (14px)
      const realHeight = descEl.scrollHeight;
      const isLongLines = realHeight > (lineHeight * 3 + 2);

      collSectionEl.style.maxHeight = ''; // restore

      if (isLongChars || isLongLines) {
        collToggleBtn.style.display = 'inline-flex';
        setCollapsedState(true);
      } else {
        collToggleBtn.style.display = 'none';
        collSectionEl.className = 'collapsible-section'; // no clamping
      }
    }

    collToggleBtn.addEventListener('click', function () {
      setCollapsedState(!state.isCollapsed);
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
    const priorityIndicatorEl = document.querySelector('[data-testid="test-todo-priority-indicator"]');
    const dueDateEl      = document.querySelector('[data-testid="test-todo-due-date"]');

    function updatePriorityIndicator(priority) {
      const key = priority.toLowerCase();
      priorityIndicatorEl.className = 'priority-indicator priority-indicator--' + key;
      priorityIndicatorEl.setAttribute('aria-label', 'Priority: ' + priority);
    }

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

      // Update displayed description & evaluate collapse
      descEl.textContent = task.description;
      evaluateDescription();

      // Update priority badge
      priorityEl.textContent = task.priority;
      priorityEl.className   = 'badge badge--' + task.priority.toLowerCase();
      priorityEl.setAttribute('aria-label', 'Priority: ' + task.priority);

      // Update priority indicator dot
      updatePriorityIndicator(task.priority);

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
    evaluateDescription();