document.addEventListener("DOMContentLoaded", () => {
	// ---- Task Handling ----
	const taskList = document.getElementById("task-list");
	const newTaskInput = document.getElementById("new-task");
	const addTaskButton = document.getElementById("add-task");
	const finishDayButton = document.getElementById("finish-day");
	const reminderTimeInput = document.getElementById("task-reminder"); // FIX: Corrected ID from "notification-time"

	let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
	let streak = Number(localStorage.getItem("streak")) || 0;
	let lastCompletion = localStorage.getItem("lastCompletion") || null;

	// Initial render calls moved inside DOMContentLoaded
	tasks.forEach((_, i) => scheduleReminderForTask(i));
	renderTasks();
	renderCalendar();

	// Add New Task
	addTaskButton.addEventListener("click", () => {
		const text = newTaskInput.value.trim();
		const reminderTime = reminderTimeInput.value;
		if (!text) return;

		tasks.push({ text, completed: false, reminderTime });
		newTaskInput.value = "";
		reminderTimeInput.value = "";

		saveTasks();
		renderTasks(); // FIX: This ensures the new task renders immediately
		scheduleReminderForTask(tasks.length - 1);
	});

	// Render Task List
	function renderTasks() {
		taskList.innerHTML = "";
		tasks.forEach((task, index) => {
			const li = document.createElement("li");
			li.className = "flex items-center justify-between";

			const label = document.createElement("label");
			label.className = "flex items-center gap-2";

			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.checked = task.completed;
			checkbox.addEventListener("change", () => {
				tasks[index].completed = checkbox.checked;
				saveTasks();
			});

			const span = document.createElement("span");
			span.textContent = task.text;

			label.appendChild(checkbox);
			label.appendChild(span);

			if (task.reminderTime) {
				// FIX: Correctly parse and format the time for display
				const today = new Date().toISOString().slice(0, 10); // Get YYYY-MM-DD
				const time = new Date(
					`${today}T${task.reminderTime}`
				).toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				});
				const reminderLabel = document.createElement("span");
				reminderLabel.textContent = `⏰ ${time}`;
				reminderLabel.className = "text-xs text-gray-500 ml-2";
				label.appendChild(reminderLabel);
			}

			const removeBtn = document.createElement("button");
			removeBtn.textContent = "🗑️";
			removeBtn.className = "text-red-500 text-sm remove-task";
			removeBtn.addEventListener("click", () => {
				tasks.splice(index, 1);
				saveTasks();
				renderTasks();
			});

			li.appendChild(label);
			li.appendChild(removeBtn);
			taskList.appendChild(li);
		});
	}

	function saveTasks() {
		localStorage.setItem("tasks", JSON.stringify(tasks));
	}

	function scheduleReminderForTask(index) {
		const task = tasks[index];
		if (!task.reminderTime) return;

		const today = new Date().toISOString().slice(0, 10);
		const reminderDateTime = new Date(
			`${today}T${task.reminderTime}`
		).getTime();
		const delay = reminderDateTime - Date.now();

		if (delay > 0) {
			setTimeout(() => {
				showNotification(`Reminder: "${task.text}"`);
			}, delay);
		}
	}

	// ---- Streak Handling ----
	const streakDisplay = document.getElementById("streak");
	const lastCompletionDisplay = document.getElementById("last-completion");

	if (lastCompletion) {
		lastCompletionDisplay.textContent = lastCompletion;
		streakDisplay.textContent = streak;
	}

	finishDayButton.addEventListener("click", () => {
		const incomplete = tasks.some((task) => !task.completed);
		if (incomplete) {
			showModal(
				"Not Done",
				"You still have unfinished tasks. Mark them complete?"
			);
		} else {
			completeDay();
		}
	});

	function completeDay() {
		const today = new Date().toISOString().split("T")[0];
		if (lastCompletion !== today) {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const yStr = yesterday.toISOString().split("T")[0];
			streak = lastCompletion === yStr ? streak + 1 : 1;
			lastCompletion = today;
			localStorage.setItem("streak", streak);
			localStorage.setItem("lastCompletion", today);
			streakDisplay.textContent = streak;
			lastCompletionDisplay.textContent = today;
			renderCalendar();
		}
		tasks = tasks.map((t) => ({ ...t, completed: false }));
		saveTasks();
		renderTasks();
		showNotification("Great job! Your streak continues!");
	}

	// ---- Push Notification ----
	function showNotification(message) {
		if (Notification.permission === "granted") {
			navigator.serviceWorker.getRegistration().then((reg) => {
				if (reg) {
					reg.showNotification("Streak Buddy", {
						body: message,
						icon: "./icons/icon-192.png",
					});
				}
			});
		}
	}

	if ("Notification" in window && "serviceWorker" in navigator) {
		Notification.requestPermission();
	}

	// ---- Calendar ----
	const calendarDays = document.getElementById("calendarDays");
	const monthTitle = document.getElementById("monthTitle");
	const prevBtn = document.getElementById("prevMonth");
	const nextBtn = document.getElementById("nextMonth");

	let currentDate = new Date();

	function renderCalendar() {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
		const todayStr = today.toISOString().split("T")[0];
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const firstDay = new Date(year, month, 1).getDay();

		calendarDays.innerHTML = "";
		monthTitle.textContent = `📆 ${currentDate.toLocaleString("default", {
			month: "long",
		})} ${year}`;

		const completedDates = new Set();
		if (lastCompletion && streak > 0) {
			const lastDate = new Date(lastCompletion);
			for (let i = 0; i < streak; i++) {
				const d = new Date(lastDate);
				d.setDate(d.getDate() - i);
				completedDates.add(d.toISOString().split("T")[0]);
			}
		}

		for (let i = 0; i < firstDay; i++) {
			const empty = document.createElement("div");
			calendarDays.appendChild(empty);
		}

		for (let day = 1; day <= daysInMonth; day++) {
			const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
				day
			).padStart(2, "0")}`;
			const dateObj = new Date(dateStr);
			dateObj.setHours(0, 0, 0, 0); // Normalize for comparison
			const cell = document.createElement("div");
			cell.textContent = day;
			cell.className =
				"rounded-lg py-1 text-sm text-center transition duration-200";

			const isToday = dateStr === todayStr;
			const isCompleted = completedDates.has(dateStr);
			const isBeforeToday = dateObj < today;

			if (isCompleted) {
				cell.classList.add("bg-green-400", "text-white", "font-bold");
			} else {
				cell.classList.add("bg-gray-100", "text-gray-600");
			}

			if (isToday) {
				cell.classList.add("border-2", "border-blue-500", "font-bold");
			}

			calendarDays.appendChild(cell);
		}
	}

	prevBtn.addEventListener("click", () => {
		currentDate.setMonth(currentDate.getMonth() - 1);
		renderCalendar();
	});

	nextBtn.addEventListener("click", () => {
		currentDate.setMonth(currentDate.getMonth() + 1);
		renderCalendar();
	});

	// ---- Modal Handling ----
	const modal = document.getElementById("modal");
	const modalTitle = document.getElementById("modal-title");
	const modalMessage = document.getElementById("modal-message");
	const modalConfirm = document.getElementById("modal-confirm");
	const modalCancel = document.getElementById("modal-cancel");

	function showModal(title, message) {
		modalTitle.textContent = title;
		modalMessage.textContent = message;
		modal.classList.remove("hidden");
		modal.classList.add("flex"); // Use flex to center it as per tailwind classes

		const onConfirm = () => {
			completeDay();
			cleanup();
		};

		const onCancel = () => {
			cleanup();
		};

		function cleanup() {
			modal.classList.add("hidden");
			modal.classList.remove("flex");
			modalConfirm.removeEventListener("click", onConfirm);
			modalCancel.removeEventListener("click", onCancel);
		}

		modalConfirm.addEventListener("click", onConfirm);
		modalCancel.addEventListener("click", onCancel);
	}
});
