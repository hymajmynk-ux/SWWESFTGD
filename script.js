const USERS = [
  { username: "مينا", password: "123456789" }
];

const POINTS = 10;
const OPEN_HOUR = 21; // الخميس الساعة 9 مساءً
const STORAGE = "athanasius_school_demo_v4";

const $ = id => document.getElementById(id);

function load() {
  return JSON.parse(localStorage.getItem(STORAGE) || '{"users":{}}');
}
function save(data) {
  localStorage.setItem(STORAGE, JSON.stringify(data));
}
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatDate(d) {
  return d.toLocaleDateString("ar-EG", {
    weekday:"long", day:"numeric", month:"long", year:"numeric"
  });
}
function isThursday(d) {
  return d.getDay() === 4;
}
function getUser(name) {
  const data = load();
  if (!data.users[name]) data.users[name] = { points:0, attendance:[] };
  save(data);
  return data.users[name];
}
function isOpenNow() {
  const now = new Date();
  return isThursday(now) && now.getHours() >= OPEN_HOUR;
}
function getThursdays(count=10) {
  const out = [];
  const d = new Date();
  d.setHours(12,0,0,0);
  for (let i=0; i<80 && out.length<count; i++) {
    if (isThursday(d)) out.push(new Date(d));
    d.setDate(d.getDate()+1);
  }
  return out;
}


function getTotalAttendance(user) {
  return user.attendance.length;
}

function render(name) {
  const user = getUser(name);
  const now = new Date();

  $("userName").textContent = name;
  $("points").textContent = user.points;
  $("days").textContent = user.attendance.length;
  $("todayTitle").textContent = formatDate(now);

  const total = getTotalAttendance(user);
  $("total").textContent = total;
  $("groupCount").textContent = `${total} حضور`;

  const todayDone = user.attendance.some(x => x.date === dateKey(now));
  const open = isOpenNow();

  $("attendanceBtn").disabled = !open || todayDone;
  $("attendanceBtn").textContent =
    todayDone ? "تم تسجيل حضورك ✓" :
    open ? `سجّل حضوري +${POINTS} ⭐` :
    "الحضور يفتح الخميس الساعة 9 م";

  $("attendanceMessage").textContent =
    todayDone ? "برافو عليك! حضورك اتحسب النهارده 🔥" :
    open ? "الوقت مفتوح دلوقتي، سجّل حضورك وخد نقاطك." :
    "الموقع شغال، لكن تسجيل الحضور مقفول لحد الخميس الساعة 9 مساءً.";

  renderThursdays(user);
  renderHistory(user);
}

function renderThursdays(user) {
  const list = $("thursdayList");
  list.innerHTML = "";
  const now = new Date();

  getThursdays().forEach(d => {
    const key = dateKey(d);
    const done = user.attendance.some(x => x.date === key);
    let cls = "locked";
    let state = "مقفول";

    if (done) {
      cls = "done";
      state = "تم الحضور ✓";
    } else if (
      isThursday(d) &&
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate() &&
      now.getHours() >= OPEN_HOUR
    ) {
      cls = "open";
      state = "مفتوح الآن";
    } else if (
      isThursday(d) &&
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    ) {
      cls = "locked";
      state = "يفتح 9:00 م";
    }

    const row = document.createElement("div");
    row.className = `thursday-row ${cls}`;
    row.innerHTML = `<div><b>${formatDate(d)}</b><br><small>تسجيل الحضور الساعة 9:00 م</small></div><span class="state">${state}</span>`;
    list.appendChild(row);
  });
}

function renderHistory(user) {
  const list = $("historyList");
  list.innerHTML = "";
  const items = [...user.attendance].reverse().slice(0,10);

  if (!items.length) {
    list.innerHTML = `<div class="history-row"><small>لسه مفيش حضور مسجل.</small><span class="points">استنى الخميس ✨</span></div>`;
    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `<div><b>${new Date(item.date+"T12:00:00").toLocaleDateString("ar-EG")}</b><br><small>${item.time}</small></div><span class="points">+${item.points} ⭐</span>`;
    list.appendChild(row);
  });
}

$("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const username = $("username").value.trim();
  const password = $("password").value;
  const valid = USERS.some(u => u.username === username && u.password === password);

  if (!valid) {
    $("loginError").textContent = "اسم المستخدم أو كلمة المرور غير صحيحة.";
    return;
  }

  sessionStorage.setItem("loggedInUser", username);
  $("loginError").textContent = "";
  $("loginPage").classList.add("hidden");
  $("homePage").classList.remove("hidden");
  render(username);
});

$("attendanceBtn").addEventListener("click", () => {
  const name = sessionStorage.getItem("loggedInUser");
  if (!name || !isOpenNow()) return;

  const data = load();
  const user = getUser(name);
  const key = dateKey(new Date());

  if (user.attendance.some(x => x.date === key)) return;

  const now = new Date();
  user.attendance.push({
    date:key,
    time:now.toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}),
    points:POINTS
  });
  user.points += POINTS;
  data.users[name] = user;
  save(data);
  render(name);
});

$("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("loggedInUser");
  $("homePage").classList.add("hidden");
  $("loginPage").classList.remove("hidden");
  $("password").value = "";
});

setInterval(() => {
  const name = sessionStorage.getItem("loggedInUser");
  if (name) render(name);
}, 30000);

const existing = sessionStorage.getItem("loggedInUser");
if (existing) {
  $("loginPage").classList.add("hidden");
  $("homePage").classList.remove("hidden");
  render(existing);
}
