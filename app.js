// HANDHOLD — Version 1.0
// 1) Create a Supabase project.
// 2) Paste your Project URL and anon/public key below.
// Never put a service_role key in browser code.

const SUPABASE_URL = "https://ekcsfufhkgxrjfanmhwb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pT5dKSW9nZfJOvI9MJFYqA_iRsnM--v";

const configured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_") &&
  !SUPABASE_ANON_KEY.includes("YOUR_");

const $ = (id) => document.getElementById(id);
let db = null;
let currentUser = null;
let transactions = [];
let authMode = "login";
let reminderTimer = null;
let lastReminderDate = "";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2
}).format(Number(value || 0));

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2600);
}

function setAuthMode(mode) {
  authMode = mode;
  $("loginTab").classList.toggle("active", mode === "login");
  $("signupTab").classList.toggle("active", mode === "signup");
  $("authTitle").textContent = mode === "login" ? "Welcome back" : "Create your account";
  $("authSubtitle").textContent = mode === "login"
    ? "Log in to see your money dashboard."
    : "Create a private account for your money records.";
  $("authSubmit").innerHTML = mode === "login" ? 'Log in <span>→</span>' : 'Create account <span>→</span>';
  $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("authMessage").textContent = "";
}

function showApp(isLoggedIn) {
  $("authView").classList.toggle("hidden", isLoggedIn);
  $("appView").classList.toggle("hidden", !isLoggedIn);
  $("logoutBtn").classList.toggle("hidden", !isLoggedIn);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

async function loadTransactions() {
  const { data, error } = await db.from("transactions")
    .select("id,type,amount,purpose,created_at")
    .order("created_at", { ascending: false });
  if (error) {
    showToast("Could not load records: " + error.message);
    return;
  }
  transactions = data || [];
  renderDashboard();
}

function totals() {
  return transactions.reduce((sum, item) => {
    const amount = Number(item.amount);
    if (item.type === "income") sum.income += amount;
    if (item.type === "expense") sum.expense += amount;
    if (item.type === "saving") sum.savings += amount;
    return sum;
  }, { income: 0, expense: 0, savings: 0 });
}

function renderDashboard() {
  const t = totals();
  const available = t.income - t.expense - t.savings;
  $("availableBalance").textContent = money(available);
  $("totalIncome").textContent = money(t.income);
  $("totalExpense").textContent = money(t.expense);
  $("totalSavings").textContent = money(t.savings);
  $("todayLabel").textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
  renderHistory();
  renderGoal(t.savings);
}

function renderHistory() {
  const filter = $("historyFilter").value;
  const filtered = transactions.filter(x => filter === "all" || x.type === filter);
  const host = $("historyList");
  if (!filtered.length) {
    host.innerHTML = '<div class="empty-state">No transactions yet. Add your first entry above.</div>';
    return;
  }
  host.innerHTML = filtered.map(item => {
    const symbol = item.type === "income" ? "＋" : item.type === "expense" ? "−" : "↗";
    const sign = item.type === "income" ? "+" : "−";
    return `<div class="history-item">
      <div class="history-icon ${item.type}">${symbol}</div>
      <div class="history-details"><strong>${escapeHTML(item.purpose)}</strong><small>${formatDate(item.created_at)}</small></div>
      <div class="history-amount ${item.type}">${sign}${money(item.amount)}</div>
    </div>`;
  }).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function renderGoal(saved) {
  const milestones = [1000, 10000, 20000, 50000, 100000];
  const next = milestones.find(n => saved < n) || 100000;
  const previous = milestones[milestones.indexOf(next) - 1] || 0;
  const percent = Math.min(100, (saved / next) * 100);
  $("goalTitle").textContent = saved >= 100000 ? "Legendary saver" : `Next: ${money(next)}`;
  $("goalCurrent").textContent = money(saved);
  $("goalTarget").textContent = `of ${money(next)}`;
  $("goalProgress").style.width = `${percent}%`;
  $("goalCaption").textContent = saved >= 100000
    ? "You reached the highest current milestone. Keep building good habits!"
    : `${money(Math.max(0, next - saved))} to your next milestone.`;
}

function openTransaction(type) {
  const details = {
    income: ["ADD POCKET MONEY", "Money received", "Enter only money your father actually gave you.", "Pocket money from father"],
    expense: ["ADD EXPENSE", "Record an expense", "Enter what you spent and what it was for.", "Lunch"],
    saving: ["MOVE TO SAVINGS", "Save some money", "This moves money from available balance into your savings total.", "Personal savings"]
  }[type];
  $("transactionType").value = type;
  $("modalEyebrow").textContent = details[0];
  $("modalTitle").textContent = details[1];
  $("modalDescription").textContent = details[2];
  $("purpose").value = details[3];
  $("amount").value = "";
  $("transactionMessage").textContent = "";
  $("transactionModal").classList.remove("hidden");
  $("amount").focus();
}

function closeTransaction() {
  $("transactionModal").classList.add("hidden");
}

function playCelebration() {
  // Original short celebratory tones created with Web Audio; no external music file.
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + index * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + index * 0.16 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.16 + 0.14);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime + index * 0.16);
      oscillator.stop(ctx.currentTime + index * 0.16 + 0.15);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch (_) { /* Sound is optional; celebration still appears. */ }
}

function celebrateIfMilestone(oldSavings, newSavings) {
  const milestones = [1000, 10000, 20000, 50000, 100000];
  const reached = milestones.find(n => oldSavings < n && newSavings >= n);
  if (!reached) return;
  $("celebrationTitle").textContent = reached >= 10000 ? "SUPER SAVER!" : "FIRST MILESTONE!";
  $("celebrationText").textContent = `Congratulations! Your total savings have reached ${money(reached)}. Keep going!`;
  $("celebration").classList.remove("hidden");
  playCelebration();
}

async function saveTransaction(event) {
  event.preventDefault();
  const type = $("transactionType").value;
  const amount = Number($("amount").value);
  const purpose = $("purpose").value.trim();
  if (!Number.isFinite(amount) || amount <= 0 || !purpose) {
    $("transactionMessage").textContent = "Enter a valid amount and purpose.";
    return;
  }
  const current = totals();
  const available = current.income - current.expense - current.savings;
  if (type !== "income" && amount > available) {
    $("transactionMessage").textContent = `Not enough available money. Your balance is ${money(available)}.`;
    return;
  }
  $("saveTransaction").disabled = true;
  $("saveTransaction").textContent = "Saving...";
  const { error } = await db.from("transactions").insert({
    user_id: currentUser.id, type, amount, purpose
  });
  $("saveTransaction").disabled = false;
  $("saveTransaction").textContent = "Save transaction";
  if (error) {
    $("transactionMessage").textContent = error.message;
    return;
  }
  closeTransaction();
  await loadTransactions();
  const updated = totals();
  if (type === "saving") celebrateIfMilestone(current.savings, updated.savings);
  showToast("Transaction saved to your cloud account.");
}

async function handleAuth(event) {
  event.preventDefault();
  if (!db) return;
  $("authSubmit").disabled = true;
  $("authMessage").textContent = "";
  const email = $("email").value.trim();
  const password = $("password").value;
  let result;
  if (authMode === "signup") {
    result = await db.auth.signUp({ email, password });
    if (!result.error && !result.data.session) {
      $("authMessage").style.color = "var(--green)";
      $("authMessage").textContent = "Account created. Check your email to confirm, then log in.";
    }
  } else {
    result = await db.auth.signInWithPassword({ email, password });
  }
  if (result.error) $("authMessage").textContent = result.error.message;
  $("authSubmit").disabled = false;
}

async function enableReminder() {
  if (!("Notification" in window)) {
    $("reminderStatus").textContent = "This browser does not support notifications.";
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    $("reminderStatus").textContent = "Notifications are blocked. You can enable them in browser site settings.";
    return;
  }
  $("reminderStatus").textContent = "Reminder enabled. Keep HANDHOLD open for the 4 PM reminder.";
  checkReminder();
  if (reminderTimer) clearInterval(reminderTimer);
  reminderTimer = setInterval(checkReminder, 30000);
}

function checkReminder() {
  const now = new Date();
  const today = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  if (now.getHours() === 16 && now.getMinutes() >= 0 && lastReminderDate !== today &&
      "Notification" in window && Notification.permission === "granted") {
    new Notification("HANDHOLD — 4 PM money check", {
      body: "Did you receive pocket money today? Record only what you actually received. If you received nothing, add nothing.",
      tag: "handhold-daily-reminder"
    });
    lastReminderDate = today;
  }
}

async function startApp() {
  if (!configured) {
    $("setupNotice").classList.remove("hidden");
    $("authMessage").textContent = "Connect Supabase first. Follow the setup instructions in README.md.";
    return;
  }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    currentUser = session.user;
    showApp(true);
    await loadTransactions();
  } else showApp(false);

  db.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    showApp(Boolean(currentUser));
    if (currentUser) await loadTransactions();
  });
}

$("loginTab").addEventListener("click", () => setAuthMode("login"));
$("signupTab").addEventListener("click", () => setAuthMode("signup"));
$("authForm").addEventListener("submit", handleAuth);
$("logoutBtn").addEventListener("click", async () => { await db.auth.signOut(); transactions = []; showApp(false); });
document.querySelectorAll(".action-card").forEach(button => button.addEventListener("click", () => openTransaction(button.dataset.type)));
$("closeModal").addEventListener("click", closeTransaction);
$("transactionModal").addEventListener("click", event => { if (event.target.dataset.close) closeTransaction(); });
$("transactionForm").addEventListener("submit", saveTransaction);
$("historyFilter").addEventListener("change", renderHistory);
$("enableReminder").addEventListener("click", enableReminder);
$("celebrationClose").addEventListener("click", () => $("celebration").classList.add("hidden"));
startApp();
