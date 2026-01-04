// Starting point: Dynamic, editable, cloud-ready roadmap app
// This file includes:
// ✅ Editable goals/subtasks
// ✅ LocalStorage persistence
// ✅ Export/import support (JSON)
// ✅ Dashboard summary

/*************************************************
 * DATA LAYER (LocalStorage + Sync Ready)
 *************************************************/

const STORAGE_KEY = "milestonesData";

function getMilestonesData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : { Q1: [], Q2: [], Q3: [], Q4: [] };
}

function saveMilestonesData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/*************************************************
 * INITIALIZATION
 *************************************************/

function initApp() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    saveMilestonesData({ Q1: [], Q2: [], Q3: [], Q4: [] });
  }
  renderQuarterButtons();
  updateDashboard();
  renderExportImportButtons();
}

window.addEventListener("DOMContentLoaded", initApp);

/*************************************************
 * UI STATE + Quarter Selector
 *************************************************/

let activeQuarter = null;

function renderQuarterButtons() {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const container = document.querySelector(".quarter-selector");
  container.innerHTML = "";
  quarters.forEach(q => {
    const btn = document.createElement("button");
    btn.textContent = q;
    btn.onclick = () => loadQuarter(q);
    container.appendChild(btn);
  });
}

function setActiveQuarterButton(quarter) {
  activeQuarter = quarter;
  document.querySelectorAll(".quarter-selector button").forEach(btn => {
    btn.classList.toggle("active", btn.textContent === quarter);
  });
}

/*************************************************
 * RENDERING GOALS + FORM
 *************************************************/

function loadQuarter(quarter) {
  setActiveQuarterButton(quarter);
  const data = getMilestonesData();
  const container = document.getElementById("milestones");
  container.innerHTML = `<h2>${quarter} Goals</h2>`;

  data[quarter].forEach((goal, goalIndex) => {
    renderGoal(container, quarter, goal, goalIndex);
  });

  renderAddGoalForm(container, quarter);
  updateDashboard();
}

function renderGoal(container, quarter, goal, goalIndex) {
  const goalId = `${quarter}-goal-${goalIndex}`;
  const goalDiv = document.createElement("div");
  goalDiv.className = "milestone";

  // Editable title
  const titleInput = document.createElement("input");
  titleInput.value = goal.title;
  titleInput.onchange = () => {
    const data = getMilestonesData();
    data[quarter][goalIndex].title = titleInput.value;
    saveMilestonesData(data);
  };

  // Delete button
const deleteBtn = document.createElement("button");
deleteBtn.textContent = "🗑";
deleteBtn.setAttribute("aria-label", "Delete goal"); // ✅ Add this line
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

  // Add new subtask
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
 * STORAGE HELPERS
 *************************************************/

function isSubtaskComplete(q, g, s) {
  return localStorage.getItem(`${q}-goal-${g}-sub-${s}`) === "true";
}

function setSubtaskCompletion(q, g, s, value) {
  localStorage.setItem(`${q}-goal-${g}-sub-${s}`, value);
}

/*************************************************
 * DASHBOARD
 *************************************************/

function updateDashboard() {
  const data = getMilestonesData();
  const summary = document.getElementById("progress-summary");
  const fill = document.getElementById("progress-fill");

  summary.innerHTML = "";
  let totalSubs = 0, completedSubs = 0;

  for (const [quarter, goals] of Object.entries(data)) {
    goals.forEach((goal, gIndex) => {
      goal.subtasks.forEach((_, sIndex) => {
        totalSubs++;
        if (isSubtaskComplete(quarter, gIndex, sIndex)) completedSubs++;
      });
    });
  }

  const percent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;
  fill.style.width = `${percent}%`;
  document.getElementById("progress-bar").setAttribute("aria-valuenow", percent);

  summary.textContent = `${completedSubs} of ${totalSubs} subtasks complete (${percent}%)`;
}

/*************************************************
 * EXPORT / IMPORT SUPPORT
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
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target.result);
        saveMilestonesData(imported);
        loadQuarter(activeQuarter || "Q1");
        updateDashboard();
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  dashboard.append(exportBtn, importInput);
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./service-worker.js') // 👈 include ./ for relative path
    .then(() => console.log("✅ Service Worker registered"))
    .catch(err => console.error("❌ Service Worker error", err));
}