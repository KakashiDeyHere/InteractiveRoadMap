// interactive-roadmap-2026/script.js

/*************************************************
 * DATA LAYER
 *************************************************/

const STORAGE_KEY = "milestonesData";
const USER_KEY = "roadmapUser";

function getMilestonesData() {
  const user = localStorage.getItem(USER_KEY) || "default";
  const saved = localStorage.getItem(`${STORAGE_KEY}-${user}`);
  return saved ? JSON.parse(saved) : { Q1: [], Q2: [], Q3: [], Q4: [] };
}

function saveMilestonesData(data) {
  const user = localStorage.getItem(USER_KEY) || "default";
  localStorage.setItem(`${STORAGE_KEY}-${user}`, JSON.stringify(data));
  showSaveConfirmation();
}

function showSaveConfirmation() {
  const btn = document.getElementById("save-button");
  if (!btn) return;
  btn.textContent = "✅ Saved!";
  setTimeout(() => (btn.textContent = "💾 Save Progress"), 2000);
}

/*************************************************
 * INIT
 *************************************************/

let activeQuarter = null;
let goalChartInstance = null;

function initApp() {
  if (!localStorage.getItem(USER_KEY)) localStorage.setItem(USER_KEY, "default");
  loadQuarter("Q1");
  updateDashboard();
  renderExportImportButtons();
  document.getElementById("save-button")?.addEventListener("click", () => {
    const data = getMilestonesData();
    saveMilestonesData(data);
  });
}

window.addEventListener("DOMContentLoaded", initApp);

/*************************************************
 * UI STATE + GOALS
 *************************************************/

function setActiveQuarterButton(quarter) {
  activeQuarter = quarter;
  document.querySelectorAll(".quarter-selector button").forEach(btn => {
    btn.classList.toggle("active", btn.textContent === quarter);
  });
}

function loadQuarter(quarter) {
  setActiveQuarterButton(quarter);
  const data = getMilestonesData();
  const container = document.getElementById("milestones");
  container.innerHTML = `<h2>${quarter} Goals</h2>`;
  data[quarter].forEach((goal, goalIndex) => renderGoal(container, quarter, goal, goalIndex));
  renderAddGoalForm(container, quarter);
  updateDashboard();
}

function renderGoal(container, quarter, goal, goalIndex) {
  const goalDiv = document.createElement("div");
  goalDiv.className = "milestone";

  const titleInput = document.createElement("input");
  titleInput.value = goal.title;
  titleInput.onchange = () => {
    const data = getMilestonesData();
    data[quarter][goalIndex].title = titleInput.value;
    saveMilestonesData(data);
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "🗑";
  deleteBtn.onclick = () => {
    if (confirm("Delete this goal?")) {
      const data = getMilestonesData();
      data[quarter].splice(goalIndex, 1);
      saveMilestonesData(data);
      loadQuarter(quarter);
    }
  };

  const header = document.createElement("div");
  header.className = "goal-header";
  header.append(titleInput, deleteBtn);

  const subtaskList = document.createElement("ul");
  subtaskList.className = "subtasks";

  goal.subtasks.forEach((sub, subIndex) => {
    const subLi = document.createElement("li");
    const subInput = document.createElement("input");
    subInput.type = "checkbox";
    subInput.checked = isSubtaskComplete(quarter, goalIndex, subIndex);
    subInput.onchange = () => {
      setSubtaskCompletion(quarter, goalIndex, subIndex, subInput.checked);
      updateDashboard();
    };
    const subLabel = document.createElement("input");
    subLabel.value = sub;
    subLabel.onchange = () => {
      const data = getMilestonesData();
      data[quarter][goalIndex].subtasks[subIndex] = subLabel.value;
      saveMilestonesData(data);
    };
    subLi.append(subInput, subLabel);
    subtaskList.appendChild(subLi);
  });

  const addSub = document.createElement("button");
  addSub.textContent = "+ Add Subtask";
  addSub.onclick = () => {
    const data = getMilestonesData();
    data[quarter][goalIndex].subtasks.push("New Subtask");
    saveMilestonesData(data);
    loadQuarter(quarter);
  };

  goalDiv.append(header, subtaskList, addSub);
  container.appendChild(goalDiv);
}

function renderAddGoalForm(container, quarter) {
  const wrapper = document.createElement("div");
  wrapper.className = "add-goal-form";

  const input = document.createElement("input");
  input.placeholder = "New goal title";

  const btn = document.createElement("button");
  btn.textContent = "➕ Add Goal";
  btn.onclick = () => {
    const data = getMilestonesData();
    data[quarter].push({ title: input.value || "Untitled Goal", subtasks: [] });
    saveMilestonesData(data);
    loadQuarter(quarter);
  };

  wrapper.append(input, btn);
  container.appendChild(wrapper);
}

/*************************************************
 * SUBTASK STATE
 *************************************************/

function isSubtaskComplete(q, g, s) {
  const user = localStorage.getItem(USER_KEY) || "default";
  return localStorage.getItem(`${user}-${q}-goal-${g}-sub-${s}`) === "true";
}

function setSubtaskCompletion(q, g, s, value) {
  const user = localStorage.getItem(USER_KEY) || "default";
  localStorage.setItem(`${user}-${q}-goal-${g}-sub-${s}` , value);
}

/*************************************************
 * DASHBOARD + CHART
 *************************************************/

function updateDashboard() {
  const data = getMilestonesData();
  const summary = document.getElementById("progress-summary");

  let total = 0;
  let complete = 0;

  for (const [q, goals] of Object.entries(data)) {
    goals.forEach((g, gi) => {
      g.subtasks.forEach((_, si) => {
        total++;
        if (isSubtaskComplete(q, gi, si)) complete++;
      });
    });
  }

  const percent = total > 0 ? Math.round((complete / total) * 100) : 0;
  summary.textContent = `${complete} of ${total} subtasks complete (${percent}%)`;

  const ctx = document.getElementById("goalChart").getContext("2d");
  const chartData = {
    labels: ["Completed", "Remaining"],
    datasets: [{
      data: [complete, total - complete],
      backgroundColor: ["#4caf50", "#ccc"]
    }]
  };

  if (goalChartInstance) {
    goalChartInstance.data = chartData;
    goalChartInstance.update();
  } else {
    goalChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: chartData,
      options: {
        cutout: "70%",
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        }
      }
    });
  }
}

/*************************************************
 * EXPORT / IMPORT
 *************************************************/

function renderExportImportButtons() {
  const dashboard = document.getElementById("dashboard");

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "📤 Export Goals";
  exportBtn.onclick = () => {
    const dataStr = JSON.stringify(getMilestonesData(), null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "roadmap-2026.json";
    link.click();
  };

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = ".json";
  importInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const imported = JSON.parse(evt.target.result);
        saveMilestonesData(imported);
        loadQuarter(activeQuarter || "Q1");
        updateDashboard();
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  dashboard.append(exportBtn, importInput);
}

/*************************************************
 * PWA Service Worker
 *************************************************/

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./service-worker.js')
    .then(() => console.log("✅ Service Worker registered"))
    .catch(err => console.error("❌ Service Worker error", err));
}
