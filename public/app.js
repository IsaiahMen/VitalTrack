async function postJSON(url, data) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return r;
}

// Register
const reg = document.getElementById('registerForm');
if (reg) reg.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(reg));
  const r = await postJSON('/api/auth/register', data);
  alert(r.ok ? 'Registered!' : (await r.json()).error);
});

// Login
const login = document.getElementById('loginForm');
if (login) login.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(login));
  const r = await postJSON('/api/auth/login', data);
  if (r.ok) {
    const me = await (await fetch('/api/auth/me')).json();
    const pre = document.getElementById('me');
    if (pre) pre.textContent = JSON.stringify(me, null, 2);
    alert('Logged in!');
  } else {
    alert((await r.json()).error);
  }
});

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', async () => {
  await postJSON('/api/auth/logout', {});
  alert('Logged out');
});

// ---------- Workouts (CRUD incl. EDIT) ----------
const workoutForm = document.getElementById('workoutForm');
const workoutList = document.getElementById('workoutList');
let editingWorkoutId = null;

async function apiFetch(path, options={}) {
  const r = await fetch(path, options);
  return r;
}

if (workoutForm) {
  workoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(workoutForm));
    let r;
    if (editingWorkoutId) {
      r = await apiFetch(`/api/workouts/${editingWorkoutId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      });
    } else {
      r = await apiFetch('/api/workouts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      });
    }
    if (r.ok) {
      editingWorkoutId = null;
      document.getElementById('workoutEditHint').style.display = 'none';
      await loadWorkouts();
      workoutForm.reset();
    } else {
      alert((await r.json()).error);
    }
  });

  async function loadWorkouts() {
    const r = await fetch('/api/workouts');
    if (!r.ok) { workoutList.innerHTML = '<li>Login required</li>'; return; }
    const rows = await r.json();
    workoutList.innerHTML = rows.map(w => `
      <li>
        <span>${w.date} — ${w.exercise} ${w.weight ?? ''} ${w.reps ?? ''}</span>
        <span>
          <button class="edit-workout" data-id="${w.id}"
            data-date="${w.date}" data-exercise="${w.exercise}" data-weight="${w.weight ?? ''}"
            data-reps="${w.reps ?? ''}" data-notes="${w.notes ?? ''}">Edit</button>
          <button data-id="${w.id}" class="del-workout">Delete</button>
        </span>
      </li>`).join('');
  }

  workoutList?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-workout');
    const delBtn  = e.target.closest('.del-workout');
    if (editBtn) {
      editingWorkoutId = editBtn.dataset.id;
      workoutForm.date.value = editBtn.dataset.date;
      workoutForm.exercise.value = editBtn.dataset.exercise;
      workoutForm.weight.value = editBtn.dataset.weight;
      workoutForm.reps.value = editBtn.dataset.reps;
      workoutForm.notes.value = editBtn.dataset.notes;
      document.getElementById('workoutEditHint').style.display = 'block';
    } else if (delBtn) {
      await fetch(`/api/workouts/${delBtn.dataset.id}`, { method: 'DELETE' });
      await loadWorkouts();
    }
  });

  loadWorkouts();
}

// ---------- Meals (CRUD incl. EDIT) ----------
const mealForm = document.getElementById('mealForm');
const mealList = document.getElementById('mealList');
let editingMealId = null;

if (mealForm) {
  mealForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(mealForm));
    let r;
    if (editingMealId) {
      r = await apiFetch(`/api/meals/${editingMealId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      });
    } else {
      r = await apiFetch('/api/meals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      });
    }
    if (r.ok) {
      editingMealId = null;
      document.getElementById('mealEditHint').style.display = 'none';
      await loadMeals();
      mealForm.reset();
    } else {
      alert((await r.json()).error);
    }
  });

  async function loadMeals() {
    const r = await fetch('/api/meals');
    if (!r.ok) { mealList.innerHTML = '<li>Login required</li>'; return; }
    const rows = await r.json();
    mealList.innerHTML = rows.map(m => `
      <li>
        <span>${m.date} — ${m.food} (${m.calories ?? 0} kcal)</span>
        <span>
          <button class="edit-meal" data-id="${m.id}"
            data-date="${m.date}" data-food="${m.food}" data-calories="${m.calories ?? ''}"
            data-protein="${m.protein ?? ''}" data-carbs="${m.carbs ?? ''}" data-fat="${m.fat ?? ''}"
            data-notes="${m.notes ?? ''}">Edit</button>
          <button data-id="${m.id}" class="del-meal">Delete</button>
        </span>
      </li>`).join('');
  }

  mealList?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-meal');
    const delBtn  = e.target.closest('.del-meal');
    if (editBtn) {
      editingMealId = editBtn.dataset.id;
      mealForm.date.value = editBtn.dataset.date;
      mealForm.food.value = editBtn.dataset.food;
      mealForm.calories.value = editBtn.dataset.calories;
      mealForm.protein.value = editBtn.dataset.protein;
      mealForm.carbs.value = editBtn.dataset.carbs;
      mealForm.fat.value = editBtn.dataset.fat;
      mealForm.notes.value = editBtn.dataset.notes;
      document.getElementById('mealEditHint').style.display = 'block';
    } else if (delBtn) {
      await fetch(`/api/meals/${delBtn.dataset.id}`, { method: 'DELETE' });
      await loadMeals();
    }
  });

  loadMeals();
}

// ------------------------
// Chart.js Visualization
// ------------------------
let mealChart;

async function updateMealChart() {
  const r = await fetch('/api/meals');
  if (!r.ok) return; // user not logged in
  const rows = await r.json();

  // Sort meals by date
  rows.sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = rows.map(m => m.date);
  const calories = rows.map(m => m.calories || 0);

  const ctx = document.getElementById('mealChart').getContext('2d');

  if (mealChart) {
    mealChart.data.labels = labels;
    mealChart.data.datasets[0].data = calories;
    mealChart.update();
  } else {
    mealChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Calories per Meal',
            data: calories,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Calories' },
          },
          x: {
            title: { display: true, text: 'Date' },
          },
        },
      },
    });
  }
}

// Refresh chart whenever meals are loaded
async function loadMeals() {
  const r = await fetch('/api/meals');
  if (!r.ok) {
    meallist.innerHTML = '<li>Login required</li>';
    return;
  }

  const rows = await r.json();
  meallist.innerHTML = rows
    .map(
      (m) => `
      <li>
        <span>${m.date} — ${m.food} (${m.calories ?? 0} kcal)</span>
        <span>
          <button class="edit-meal" data-id="${m.id}"
            data-date="${m.date}" data-food="${m.food}"
            data-calories="${m.calories ?? ''}" data-protein="${m.protein ?? ''}"
            data-carbs="${m.carbs ?? ''}" data-fat="${m.fat ?? ''}"
            data-notes="${m.notes ?? ''}">Edit</button>
          <button data-id="${m.id}" class="del-meal">Delete</button>
        </span>
      </li>`
    )
    .join('');

  // 🔁 Refresh chart data
  updateMealChart();
}
