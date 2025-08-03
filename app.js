document.addEventListener("DOMContentLoaded", () => {
	// ---- Get all necessary elements from the DOM ----
	const taskList = document.getElementById("task-list");
	const newTaskInput = document.getElementById("new-task");
	const addTaskButton = document.getElementById("add-task");
	const finishDayButton = document.getElementById("finish-day");
	const reminderTimeInput = document.getElementById("task-reminder");
	const streakDisplay = document.getElementById("streak");
	const lastCompletionDisplay = document.getElementById("last-completion");
	const calendarDays = document.getElementById("calendarDays");
	const monthTitle = document.getElementById("monthTitle");
	const prevBtn = document.getElementById("prevMonth");
	const nextBtn = document.getElementById("nextMonth");
	const modal = document.getElementById("modal");
	const modalTitle = document.getElementById("modal-title");
	const modalMessage = document.getElementById("modal-message");
	const modalConfirm = document.getElementById("modal-confirm");
	const modalCancel = document.getElementById("modal-cancel");

	// ---- Initialize state variables ----
	let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
	let streak = Number(localStorage.getItem("streak")) || 0;
	let lastCompletion = localStorage.getItem("lastCompletion") || null;
	let currentDate = new Date();

	// ---- Initial Setup ----
	checkStreakHealth();
	tasks.forEach((_, i) => scheduleReminderForTask(i));
	renderTasks();
	renderCalendar();
	updateStreakDisplay();

	// ---- Event Listeners ----
	addTaskButton.addEventListener("click", addNewTask);
	finishDayButton.addEventListener("click", handleFinishDay);
	prevBtn.addEventListener("click", showPreviousMonth);
	nextBtn.addEventListener("click", showNextMonth);

	// ---- Task Functions ----
	function addNewTask() {
		const text = newTaskInput.value.trim();
		const reminderTime = reminderTimeInput.value;
		if (!text) return;

		tasks.push({ text, completed: false, reminderTime });
		newTaskInput.value = "";
		reminderTimeInput.value = "";

		saveTasks();
		renderTasks();
		scheduleReminderForTask(tasks.length - 1);
	}

	// ✨ --- THIS FUNCTION HAS BEEN UPDATED --- ✨
	function renderTasks() {
		const emptyStateMessage = document.getElementById("empty-state-message");
		taskList.innerHTML = ""; // Clear the list before rendering

		// Show or hide the welcome message based on task count
		if (tasks.length > 0) {
			if (emptyStateMessage) emptyStateMessage.style.display = "none";
		} else {
			if (emptyStateMessage) emptyStateMessage.style.display = "block";
			return; // Exit if there are no tasks
		}

		tasks.forEach((task, index) => {
			const li = document.createElement("li");
			li.className = "flex items-center justify-between";

			const label = document.createElement("label");
			label.className = "flex items-center gap-2 cursor-pointer";

			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.className = "task-checkbox";
			checkbox.checked = task.completed;

			const span = document.createElement("span");
			span.textContent = task.text;
			span.className = "transition-colors duration-200"; 

			// On initial render, apply strikethrough if task is completed
			if (task.completed) {
				span.classList.add("line-through", "text-gray-400");
			}

			// Add event listener to toggle styles and state on change
			checkbox.addEventListener("change", () => {
				tasks[index].completed = checkbox.checked;
				saveTasks();

				// Toggle classes for instant visual feedback
				if (checkbox.checked) {
					span.classList.add("line-through", "text-gray-400");
				} else {
					span.classList.remove("line-through", "text-gray-400");
				}
			});

			label.appendChild(checkbox);
			label.appendChild(span);

			// Add reminder time if it exists
			if (task.reminderTime) {
				const reminderLabel = document.createElement("span");
				reminderLabel.className = "text-xs text-gray-500 ml-2";
				const timeParts = task.reminderTime.split(":");
				const hours = parseInt(timeParts[0]);
				const minutes = timeParts[1];
				const ampm = hours >= 12 ? "PM" : "AM";
				const formattedHours = hours % 12 || 12; // Convert 0 to 12
				reminderLabel.textContent = `⏰ ${formattedHours}:${minutes} ${ampm}`;
				label.appendChild(reminderLabel);
			}

			const removeBtn = document.createElement("button");
			removeBtn.textContent = "🗑️";
			removeBtn.className =
				"text-red-500 text-sm remove-task hover:text-red-700";
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

	// ---- Streak Functions ----
	function checkStreakHealth() {
		if (!lastCompletion) return;

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const lastDate = new Date(lastCompletion);
		lastDate.setHours(0, 0, 0, 0);

		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);

		if (
			lastDate.getTime() !== today.getTime() &&
			lastDate.getTime() !== yesterday.getTime()
		) {
			streak = 0;
			lastCompletion = null;
			localStorage.setItem("streak", "0");
			localStorage.removeItem("lastCompletion");
		}
	}

	function handleFinishDay() {
		const incomplete = tasks.some((task) => !task.completed);
		if (incomplete && tasks.length > 0) {
			showModal(
				"Not Done",
				"You still have unfinished tasks. Mark them complete anyway?"
			);
		} else {
			completeDay();
		}
	}

	function completeDay() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStr = `${today.getFullYear()}-${String(
			today.getMonth() + 1
		).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

		if (lastCompletion !== todayStr) {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			yesterday.setHours(0, 0, 0, 0);
			const yStr = `${yesterday.getFullYear()}-${String(
				yesterday.getMonth() + 1
			).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

			streak = lastCompletion === yStr ? streak + 1 : 1;
			lastCompletion = todayStr;
			localStorage.setItem("streak", streak.toString());
			localStorage.setItem("lastCompletion", todayStr);
			updateStreakDisplay();
			renderCalendar();
		}
		tasks = tasks.map((t) => ({ ...t, completed: false }));
		saveTasks();
		renderTasks();
		showNotification("Great job! Your streak continues!");
	}

	function updateStreakDisplay() {
		if (!streakDisplay || !lastCompletionDisplay) return;

		streakDisplay.textContent = streak;
		lastCompletionDisplay.textContent = lastCompletion || "None";

		if (streak > 0) {
			const parentP = streakDisplay.parentElement;
			if (parentP) {
				parentP.classList.add("pop-animation");
				setTimeout(() => parentP.classList.remove("pop-animation"), 300);
			}
		}
	}

	// ---- Calendar Functions ----
	function renderCalendar() {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStr = `${today.getFullYear()}-${String(
			today.getMonth() + 1
		).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const firstDayOfMonth = new Date(year, month, 1).getDay();

		calendarDays.innerHTML = "";
		monthTitle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            ${currentDate.toLocaleString("default", { month: "long" })} ${year}
        `;

		const completedDates = new Set();
		let streakStartDate = null;
		if (lastCompletion && streak > 0) {
			const lastDate = new Date(lastCompletion);
			for (let i = 0; i < streak; i++) {
				const d = new Date(lastDate);
				d.setDate(d.getDate() - i);
				completedDates.add(
					`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
						2,
						"0"
					)}-${String(d.getDate()).padStart(2, "0")}`
				);
			}
			streakStartDate = new Date(lastDate);
			streakStartDate.setDate(lastDate.getDate() - (streak - 1));
			streakStartDate.setHours(0, 0, 0, 0);
		}

		for (let i = 0; i < firstDayOfMonth; i++) {
			calendarDays.appendChild(document.createElement("div"));
		}

		for (let day = 1; day <= daysInMonth; day++) {
			const dateObj = new Date(year, month, day);
			const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
				day
			).padStart(2, "0")}`;
			const cell = document.createElement("div");
			cell.textContent = day;
			cell.className =
				"rounded-lg py-1 text-sm text-center transition duration-200";
			const isBeforeToday = dateObj < today;

			if (completedDates.has(dateStr)) {
				cell.classList.add("bg-green-400", "text-white", "font-bold");
			} else if (
				isBeforeToday &&
				streakStartDate &&
				dateObj >= streakStartDate
			) {
				cell.classList.add("bg-red-300", "text-white", "italic");
			} else {
				cell.classList.add("bg-gray-100", "text-gray-600");
			}

			if (dateStr === todayStr) {
				cell.classList.add("border-2", "border-blue-500", "font-bold");
			}

			calendarDays.appendChild(cell);
		}
	}

	function showPreviousMonth() {
		currentDate.setMonth(currentDate.getMonth() - 1);
		renderCalendar();
	}

	function showNextMonth() {
		currentDate.setMonth(currentDate.getMonth() + 1);
		renderCalendar();
	}

	// ---- Modal Functions ----
	function showModal(title, message) {
		modalTitle.textContent = title;
		modalMessage.textContent = message;
		modal.classList.remove("hidden");
		modal.classList.add("flex");

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

	// ---- Notification Functions ----
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

	function showNotification(message) {
		if (Notification.permission === "granted") {
			navigator.serviceWorker.getRegistration().then((reg) => {
				if (reg) {
					reg.showNotification("Optima", {
						body: message,
						icon: "./icons/icon-192.png",
					});
				}
			});
		}
	}

	// ---- App Setup ----
	if ("Notification" in window) {
		Notification.requestPermission();
	}

	if ("serviceWorker" in navigator) {
		window.addEventListener("load", () => {
			navigator.serviceWorker
				.register("./service-worker.js")
				.then((reg) => console.log("Service Worker registered successfully."))
				.catch((err) =>
					console.log("Service Worker registration failed:", err)
				);
		});
	}
});
