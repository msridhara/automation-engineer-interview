const tabs = [...document.querySelectorAll('[role="tab"]')];
const tasks = [...document.querySelectorAll('[role="tabpanel"]')];
const complete = document.querySelector('#taskComplete');
const taskState = JSON.parse(localStorage.getItem('interview-progress') || '{}');
const answerBox = document.querySelector('#candidateAnswer');
const saveStatus = document.querySelector('#saveStatus');
const answers = JSON.parse(localStorage.getItem('interview-answers') || '{}');

function selectedTask() {
  return document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.task || '1';
}

function loadAnswer(number) {
  answerBox.value = answers[number] || '';
  saveStatus.textContent = answers[number]
    ? 'Saved automatically in this browser'
    : 'Start typing — your answer will be saved automatically';
}

function selectTask(number) {
  tabs.forEach((tab) => {
    const selected = tab.dataset.task === String(number);
    tab.setAttribute('aria-selected', selected);
    tab.tabIndex = selected ? 0 : -1;
  });

  tasks.forEach((task) => {
    const selected = task.id === `task-${number}`;
    task.hidden = !selected;
    task.classList.toggle('active', selected);
  });

  complete.checked = Boolean(taskState[number]);
  loadAnswer(number);
  window.location.hash = `task-${number}`;
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTask(tab.dataset.task));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = (index + direction + tabs.length) % tabs.length;
    tabs[next].focus();
    selectTask(tabs[next].dataset.task);
  });
});

complete.addEventListener('change', () => {
  const selected = selectedTask();
  taskState[selected] = complete.checked;
  localStorage.setItem('interview-progress', JSON.stringify(taskState));
});

let saveMessageTimer;
answerBox.addEventListener('input', () => {
  answers[selectedTask()] = answerBox.value;
  localStorage.setItem('interview-answers', JSON.stringify(answers));
  saveStatus.textContent = 'Saved';
  clearTimeout(saveMessageTimer);
  saveMessageTimer = setTimeout(() => {
    saveStatus.textContent = 'Saved automatically in this browser';
  }, 1200);
});

answerBox.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  event.preventDefault();
  const start = answerBox.selectionStart;
  const end = answerBox.selectionEnd;
  answerBox.setRangeText('    ', start, end, 'end');
  answerBox.dispatchEvent(new Event('input'));
});

document.querySelector('#clearAnswer').addEventListener('click', () => {
  if (!answerBox.value || !window.confirm('Clear the answer for this question?')) return;
  answerBox.value = '';
  delete answers[selectedTask()];
  localStorage.setItem('interview-answers', JSON.stringify(answers));
  saveStatus.textContent = 'Answer cleared';
  answerBox.focus();
});

document.querySelectorAll('.copy').forEach((button) => {
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(button.previousElementSibling.textContent);
    const original = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = original; }, 1200);
  });
});

const timerDisplay = document.querySelector('#timerDisplay');
const timerStart = document.querySelector('#timerStart');
const timerReset = document.querySelector('#timerReset');
const timerDuration = 7 * 60;
let seconds = timerDuration;
let intervalId;

function renderTime() {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainder = String(seconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${remainder}`;
}

timerStart.addEventListener('click', () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = undefined;
    timerStart.textContent = 'Start';
    return;
  }

  timerStart.textContent = 'Pause';
  intervalId = setInterval(() => {
    if (seconds === 0) {
      clearInterval(intervalId);
      intervalId = undefined;
      timerStart.textContent = 'Start';
      timerDisplay.setAttribute('aria-label', 'Time expired');
      return;
    }
    seconds -= 1;
    renderTime();
  }, 1000);
});

timerReset.addEventListener('click', () => {
  clearInterval(intervalId);
  intervalId = undefined;
  seconds = timerDuration;
  timerStart.textContent = 'Start';
  timerDisplay.removeAttribute('aria-label');
  renderTime();
});

const themeButton = document.querySelector('#themeButton');
themeButton.addEventListener('click', () => {
  document.body.classList.toggle('light');
  const light = document.body.classList.contains('light');
  themeButton.textContent = light ? 'Dark mode' : 'Light mode';
  localStorage.setItem('interview-theme', light ? 'light' : 'dark');
});

if (localStorage.getItem('interview-theme') === 'light') {
  document.body.classList.add('light');
  themeButton.textContent = 'Dark mode';
}

document.querySelector('#printButton').addEventListener('click', () => window.print());

const initialTask = window.location.hash.match(/^#task-([1-6])$/)?.[1] || '1';
selectTask(initialTask);
