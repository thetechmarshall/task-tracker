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
	const congratsModal = document.getElementById("congrats-modal");
	const congratsMessage = document.getElementById("congrats-message");
	const congratsClose = document.getElementById("congrats-close");

	// ---- Initialize state variables ----
	let tasksData = JSON.parse(localStorage.getItem("tasksData")) || {
		date: null,
		tasks: [],
	};
	let tasks = tasksData.tasks;
	let streak = Number(localStorage.getItem("streak")) || 0;
	let lastCompletion = localStorage.getItem("lastCompletion") || null;
	let currentDate = new Date();

	// ---- Initial Setup ----
	checkStreakHealth();
	checkAndResetTasksForNewDay();
	updateFinishButtonState();
	tasks.forEach((_, i) => scheduleReminderForTask(i));
	renderTasks();
	renderCalendar();
	updateStreakDisplay();

	// ---- Event Listeners ----
	addTaskButton.addEventListener("click", addNewTask);
	finishDayButton.addEventListener("click", handleFinishDay);
	prevBtn.addEventListener("click", showPreviousMonth);
	nextBtn.addEventListener("click", showNextMonth);
	congratsClose.addEventListener("click", () => {
		const modalDiv = congratsModal.querySelector("div > div");
		modalDiv.classList.add("scale-95", "opacity-0");
		setTimeout(() => {
			congratsModal.classList.add("hidden");
			congratsModal.classList.remove("flex");
		}, 300);
	});

	function formatDate(date) {
		const day = String(date.getDate()).padStart(2, "0");
		const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
		const year = date.getFullYear();
		return `${day}-${month}-${year}`;
	}

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

	function renderTasks() {
		const emptyStateMessage = document.getElementById("empty-state-message");
		taskList.innerHTML = "";
		if (tasks.length > 0) {
			if (emptyStateMessage) emptyStateMessage.style.display = "none";
		} else {
			if (emptyStateMessage) emptyStateMessage.style.display = "block";
			return;
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
			if (task.completed) {
				span.classList.add("line-through", "text-gray-400");
			}
			checkbox.addEventListener("change", () => {
				tasks[index].completed = checkbox.checked;
				saveTasks();
				if (checkbox.checked) {
					span.classList.add("line-through", "text-gray-400");
				} else {
					span.classList.remove("line-through", "text-gray-400");
				}
			});
			label.appendChild(checkbox);
			label.appendChild(span);
			if (task.reminderTime) {
				const reminderLabel = document.createElement("span");
				reminderLabel.className = "text-xs text-gray-500 ml-2";
				const timeParts = task.reminderTime.split(":");
				const hours = parseInt(timeParts[0]);
				const minutes = timeParts[1];
				const ampm = hours >= 12 ? "PM" : "AM";
				const formattedHours = hours % 12 || 12;
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
		const todayStr = formatDate(new Date()); // Use helper function
		tasksData = { date: todayStr, tasks: tasks };
		localStorage.setItem("tasksData", JSON.stringify(tasksData));
	}

	// ---- Streak Functions ----
	function checkAndResetTasksForNewDay() {
		const todayStr = formatDate(new Date()); // Use helper function
		if (tasksData.date !== todayStr) {
			tasks = [];
			tasksData = { date: todayStr, tasks: [] };
			saveTasks();
		}
	}

	function checkStreakHealth() {
		if (!lastCompletion) return;
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Dates stored in DD-MM-YYYY format need to be parsed carefully
		const parts = lastCompletion.split("-");
		const lastDate = new Date(parts[2], parts[1] - 1, parts[0]);
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
		const todayStr = formatDate(today); // Use helper function

		if (lastCompletion !== todayStr) {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			yesterday.setHours(0, 0, 0, 0);
			const yStr = formatDate(yesterday); // Use helper function

			streak = lastCompletion === yStr ? streak + 1 : 1;
			lastCompletion = todayStr;
			localStorage.setItem("streak", streak.toString());
			localStorage.setItem("lastCompletion", todayStr);
			updateStreakDisplay();
			renderCalendar();
			showCongratsModal();
			updateFinishButtonState();
		}
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

	function updateFinishButtonState() {
		const todayStr = formatDate(new Date()); // Use helper function
		if (lastCompletion === todayStr) {
			finishDayButton.innerHTML = `✅ Completed`;
			finishDayButton.disabled = true;
			finishDayButton.classList.add(
				"bg-gray-400",
				"cursor-not-allowed",
				"hover:bg-gray-400"
			);
			finishDayButton.classList.remove("bg-green-600", "hover:bg-green-700");
		} else {
			finishDayButton.innerHTML = `Complete Today's Tasks`;
			finishDayButton.disabled = false;
			finishDayButton.classList.remove(
				"bg-gray-400",
				"cursor-not-allowed",
				"hover:bg-gray-400"
			);
			finishDayButton.classList.add("bg-green-600", "hover:bg-green-700");
		}
	}

	// ---- Calendar Functions ----
	function renderCalendar() {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStr = formatDate(today); // Use helper function

		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const firstDayOfMonth = new Date(year, month, 1).getDay();
		calendarDays.innerHTML = "";
		monthTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>${currentDate.toLocaleString(
			"default",
			{ month: "long" }
		)} ${year}`;
		const completedDates = new Set();
		let streakStartDate = null;

		if (lastCompletion && streak > 0) {
			const parts = lastCompletion.split("-");
			const lastDate = new Date(parts[2], parts[1] - 1, parts[0]);

			for (let i = 0; i < streak; i++) {
				const d = new Date(lastDate);
				d.setDate(d.getDate() - i);
				completedDates.add(formatDate(d)); // Use helper function
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
			const dateStr = formatDate(dateObj); // Use helper function
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
	function showCongratsModal() {
		const encouragement = [
			"You're on fire!",
			"Keep up the amazing work!",
			"Nothing can stop you now!",
			"Another day, another win!",
			"You're building an incredible habit.",
		];
		const randomMessage =
			encouragement[Math.floor(Math.random() * encouragement.length)];
		congratsMessage.innerHTML = `Your new streak is <strong class="text-blue-600">${streak} ${
			streak > 1 ? "days" : "day"
		}</strong>. <br/> ${randomMessage}`;
		congratsModal.classList.remove("hidden");
		congratsModal.classList.add("flex");
		setTimeout(() => {
			congratsModal
				.querySelector("div > div")
				.classList.remove("scale-95", "opacity-0");
		}, 10);
	}

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

	// ---- Notification & App Setup ----
	function scheduleReminderForTask(index) {
		const task = tasks[index];
		if (!task.reminderTime) return;
		const todayStr = new Date().toISOString().slice(0, 10);
		const reminderDateTime = new Date(
			`${todayStr}T${task.reminderTime}`
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
