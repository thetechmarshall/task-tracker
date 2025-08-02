const defaultTasks = [
	"JS Sessions (10am - 12pm)",
	"UI/UX Lessons (2pm - 4pm)",
	"Code Practice (4pm - 5pm)",
	"Backtesting & Journaling (9pm - 12am)",
];

const taskList = document.getElementById("task-list");
const completeBtn = document.getElementById("complete-btn");
const streakDisplay = document.getElementById("streak");
const lastCompletion = document.getElementById("last-completion");
const calendarDays = document.getElementById("calendarDays");
const monthTitle = document.getElementById("monthTitle");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const newTaskInput = document.getElementById("new-task-input");
const addTaskBtn = document.getElementById("add-task-btn");

let selectedDate = new Date();
let currentStreak = parseInt(localStorage.getItem("streak")) || 0;
let lastDate = localStorage.getItem("lastCompletion") || null;
let completedDays = JSON.parse(localStorage.getItem("completedDays") || "{}");
let userTasks = JSON.parse(
	localStorage.getItem("userTasks") || JSON.stringify(defaultTasks)
);

function renderTasks() {
	taskList.innerHTML = "";
	userTasks.forEach((task, index) => {
		const li = document.createElement("li");
		li.className = "flex justify-between items-center";
		li.innerHTML = `
      <label class="flex-1"><input type="checkbox" class="mr-2"> ${task}</label>
      <button class="text-red-500 hover:underline text-xs remove-btn" data-index="${index}">✕</button>
    `;
		taskList.appendChild(li);
	});
}

function saveTasks() {
	localStorage.setItem("userTasks", JSON.stringify(userTasks));
}

addTaskBtn.onclick = () => {
	const task = newTaskInput.value.trim();
	if (task) {
		userTasks.push(task);
		saveTasks();
		renderTasks();
		newTaskInput.value = "";
	}
};

taskList.addEventListener("click", (e) => {
	if (e.target.classList.contains("remove-btn")) {
		const index = parseInt(e.target.dataset.index);
		userTasks.splice(index, 1);
		saveTasks();
		renderTasks();
	}
});

completeBtn.onclick = () => {
	const today = new Date().toISOString().split("T")[0];
	if (completedDays[today]) return alert("Already marked complete today!");

	completedDays[today] = true;
	localStorage.setItem("completedDays", JSON.stringify(completedDays));
	lastDate = today;
	localStorage.setItem("lastCompletion", today);

	// Streak logic
	if (getYesterday() === Object.keys(completedDays).slice(-2)[0]) {
		currentStreak++;
	} else {
		currentStreak = 1;
	}

	localStorage.setItem("streak", currentStreak);
	updateStats();
	renderCalendar();
};

function getYesterday() {
	const d = new Date();
	d.setDate(d.getDate() - 1);
	return d.toISOString().split("T")[0];
}

function updateStats() {
	streakDisplay.textContent = currentStreak;
	lastCompletion.textContent = lastDate || "None";
}

function renderCalendar() {
	calendarDays.innerHTML = "";

	const year = selectedDate.getFullYear();
	const month = selectedDate.getMonth();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const firstDay = new Date(year, month, 1).getDay();

	monthTitle.textContent = `📆 ${selectedDate.toLocaleString("default", {
		month: "long",
	})} ${year}`;

	// Add empty boxes before first day
	for (let i = 0; i < firstDay; i++) {
		calendarDays.innerHTML += `<div></div>`;
	}

	for (let d = 1; d <= daysInMonth; d++) {
		const dateKey = new Date(year, month, d).toISOString().split("T")[0];
		const isCompleted = completedDays[dateKey];
		calendarDays.innerHTML += `
      <div class="rounded-lg p-1 ${
				isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"
			}">
        ${d}
      </div>`;
	}
}

prevMonth.onclick = () => {
	selectedDate.setMonth(selectedDate.getMonth() - 1);
	renderCalendar();
};

nextMonth.onclick = () => {
	selectedDate.setMonth(selectedDate.getMonth() + 1);
	renderCalendar();
};

// Init
renderTasks();
updateStats();
renderCalendar();
