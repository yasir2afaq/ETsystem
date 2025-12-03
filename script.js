const ETS_KEYS = {
  user: "ets_user",
  users: "ets_users",
  expenses: "ets_expenses",
  wallets: "ets_wallets",
  settings: "ets_settings"
};

/* Settings helpers, now per user using key suffix */

function etsActiveUserKey() {
  return localStorage.getItem(ETS_KEYS.user) || "default";
}

function etsGetSettings() {
  const key = ETS_KEYS.settings + "_" + etsActiveUserKey();
  const raw = localStorage.getItem(key);
  const defaults = {
    currency: "$",
    monthIncome: 0,
    name: "Admin User",
    email: "admin@example.com",
    darkMode: false
  };
  if (!raw) {
    return defaults;
  }
  try {
    return Object.assign(defaults, JSON.parse(raw));
  } catch {
    return defaults;
  }
}

function etsSaveSettings(settings) {
  const key = ETS_KEYS.settings + "_" + etsActiveUserKey();
  localStorage.setItem(key, JSON.stringify(settings));
}

function etsFormatCurrency(amount) {
  const s = etsGetSettings();
  const num = Number(amount) || 0;
  return s.currency + " " + num.toFixed(2);
}

/* Data helpers */

function etsLoadExpenses() {
  try {
    return JSON.parse(localStorage.getItem(ETS_KEYS.expenses) || "[]");
  } catch {
    return [];
  }
}

function etsSaveExpenses(arr) {
  localStorage.setItem(ETS_KEYS.expenses, JSON.stringify(arr));
}

function etsLoadWallets() {
  try {
    return JSON.parse(localStorage.getItem(ETS_KEYS.wallets) || "[]");
  } catch {
    return [];
  }
}

function etsSaveWallets(arr) {
  localStorage.setItem(ETS_KEYS.wallets, JSON.stringify(arr));
}

/* User accounts for signup / login */

function etsLoadUsers() {
  try {
    return JSON.parse(localStorage.getItem(ETS_KEYS.users) || "[]");
  } catch {
    return [];
  }
}

function etsSaveUsers(users) {
  localStorage.setItem(ETS_KEYS.users, JSON.stringify(users));
}

function etsEnsureDefaultAdmin() {
  let users = etsLoadUsers();
  if (!users || users.length === 0) {
    users = [
      {
        username: "admin",
        password: "1234",
        fullName: "Admin User",
        email: "admin@example.com"
      }
    ];
    etsSaveUsers(users);
  }
}

/* Date helpers */

function etsTodayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

function etsSameMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function etsIsToday(dateStr) {
  if (!dateStr) return false;
  return dateStr === etsTodayISO();
}

/* Theme and profile */

function etsApplyTheme() {
  const settings = etsGetSettings();
  if (settings.darkMode) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

function etsFillProfile() {
  const settings = etsGetSettings();
  const activeUser = etsActiveUserKey();
  let displayName = settings.name;
  let displayEmail = settings.email;

  if (activeUser !== "default" && settings.name === "Admin User") {
    displayName = activeUser;
  }

  const nameIds = [
    "profile-name",
    "profile-name-exp",
    "profile-name-wallets",
    "profile-name-summary",
    "profile-name-settings"
  ];
  const emailIds = [
    "profile-email",
    "profile-email-exp",
    "profile-email-wallets",
    "profile-email-summary",
    "profile-email-settings"
  ];
  nameIds.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.textContent = displayName;
  });
  emailIds.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.textContent = displayEmail;
  });
}

/* Auth */

function etsRequireLogin(page) {
  if (page === "login" || page === "signup") return;
  const user = localStorage.getItem(ETS_KEYS.user);
  if (!user) {
    window.location.href = "login.html";
  }
}

function etsSetupLogoutButtons() {
  const ids = [
    "logout-btn",
    "logout-btn-exp",
    "logout-btn-wallets",
    "logout-btn-summary",
    "logout-btn-settings"
  ];
  ids.forEach(function (id) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", function () {
        localStorage.removeItem(ETS_KEYS.user);
        window.location.href = "login.html";
      });
    }
  });
}

/* Login */

function etsInitLogin() {
  const form = document.getElementById("login-form");
  if (!form) return;
  const msg = document.getElementById("login-msg");

  etsEnsureDefaultAdmin();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();

    const users = etsLoadUsers();
    const account = users.find(function (usr) {
      return usr.username === u && usr.password === p;
    });

    if (account) {
      localStorage.setItem(ETS_KEYS.user, account.username);
      window.location.href = "index.html";
    } else {
      if (msg) {
        msg.textContent = "Invalid username or password";
      }
    }
  });
}

/* Signup */

function etsInitSignup() {
  const form = document.getElementById("signup-form");
  if (!form) return;
  const msg = document.getElementById("signup-msg");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const fullName = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const confirm = document.getElementById("signup-confirm").value.trim();

    if (!fullName || !email || !username || !password) {
      if (msg) msg.textContent = "Please fill all fields";
      return;
    }
    if (password.length < 4) {
      if (msg) msg.textContent = "Password must be at least 4 characters";
      return;
    }
    if (password !== confirm) {
      if (msg) msg.textContent = "Passwords do not match";
      return;
    }

    const users = etsLoadUsers();
    const exists = users.some(function (u) {
      return u.username === username;
    });
    if (exists) {
      if (msg) msg.textContent = "Username already exists";
      return;
    }

    users.push({
      username: username,
      password: password,
      fullName: fullName,
      email: email
    });
    etsSaveUsers(users);

    localStorage.setItem(ETS_KEYS.user, username);

    const initialSettings = {
      currency: "$",
      monthIncome: 0,
      name: fullName || "Admin User",
      email: email || "admin@example.com",
      darkMode: false
    };
    etsSaveSettings(initialSettings);

    window.location.href = "index.html";
  });
}

/* Dashboard */

function etsInitDashboard() {
  const periodSelect = document.getElementById("dash-period");
  if (!periodSelect) return;
  const expenses = etsLoadExpenses();
  const wallets = etsLoadWallets();

  function recompute() {
    const period = periodSelect.value;
    const label = document.getElementById("dash-period-label");
    if (label) {
      if (period === "today") label.textContent = "Today " + etsTodayISO();
      else if (period === "month") label.textContent = "This month";
      else label.textContent = "All time";
    }

    let filtered = expenses.slice();
    if (period === "today") {
      filtered = filtered.filter(function (e) {
        return etsIsToday(e.date);
      });
    } else if (period === "month") {
      filtered = filtered.filter(function (e) {
        return etsSameMonth(e.date);
      });
    }

    const total = filtered.reduce(function (sum, e) {
      return sum + Number(e.amount || 0);
    }, 0);

    const totalEl = document.getElementById("dash-total-spent");
    if (totalEl) totalEl.textContent = etsFormatCurrency(total);
    const transEl = document.getElementById("dash-total-transactions");
    if (transEl) transEl.textContent = filtered.length.toString();

    const byCat = {};
    filtered.forEach(function (e) {
      const c = e.category || "Other";
      if (!byCat[c]) byCat[c] = 0;
      byCat[c] += Number(e.amount || 0);
    });

    let topCat = "None";
    let topVal = 0;
    Object.keys(byCat).forEach(function (c) {
      if (byCat[c] > topVal) {
        topVal = byCat[c];
        topCat = c;
      }
    });

    const topCatEl = document.getElementById("dash-top-category");
    if (topCatEl) topCatEl.textContent = topCat;
    const topCatAmtEl = document.getElementById("dash-top-category-amount");
    if (topCatAmtEl) {
      if (topVal > 0) {
        topCatAmtEl.textContent = etsFormatCurrency(topVal);
      } else {
        topCatAmtEl.textContent = "";
      }
    }

    const walletCountEl = document.getElementById("dash-wallet-count");
    if (walletCountEl) walletCountEl.textContent = wallets.length.toString();

    const recentBody = document.getElementById("dash-recent-body");
    if (recentBody) {
      recentBody.innerHTML = "";
      const recent = expenses
        .slice()
        .sort(function (a, b) {
          return (b.date || "").localeCompare(a.date || "");
        })
        .slice(0, 5);
      if (recent.length === 0) {
        recentBody.innerHTML =
          '<tr><td colspan="4" class="text-center text-muted small">No expenses yet</td></tr>';
      } else {
        recent.forEach(function (e) {
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" +
            (e.date || "") +
            "</td><td>" +
            e.name +
            "</td><td>" +
            (e.category || "") +
            '</td><td class="text-end">' +
            etsFormatCurrency(e.amount) +
            "</td>";
          recentBody.appendChild(tr);
        });
      }
    }

    const catContainer = document.getElementById("dash-category-breakdown");
    if (catContainer) {
      catContainer.innerHTML = "";
      const cats = Object.keys(byCat);
      if (cats.length === 0) {
        catContainer.innerHTML =
          '<p class="text-muted small mb-0">No data yet</p>';
      } else {
        cats.forEach(function (c) {
          const val = byCat[c];
          const percent = topVal ? Math.round((val / topVal) * 100) : 0;
          const block = document.createElement("div");
          block.className = "mb-2";
          block.innerHTML =
            '<div class="d-flex justify-content-between">' +
            "<span>" +
            c +
            "</span><span>" +
            etsFormatCurrency(val) +
            "</span></div>" +
            '<div class="progress bg-light"><div class="progress-bar" style="width:' +
            percent +
            '%"></div></div>';
          catContainer.appendChild(block);
        });
      }
    }
  }

  periodSelect.addEventListener("change", recompute);
  recompute();
}

/* Expenses */

function etsInitExpenses() {
  const form = document.getElementById("expense-form");
  const tableBody = document.getElementById("expense-table");
  const filterCat = document.getElementById("filter-category");
  if (!form || !tableBody || !filterCat) return;

  let expenses = etsLoadExpenses();

  const dateInput = document.getElementById("exp-date");
  if (dateInput && !dateInput.value) {
    dateInput.value = etsTodayISO();
  }

  function render() {
    const cat = filterCat.value;
    const filtered =
      cat === "all"
        ? expenses
        : expenses.filter(function (e) {
            return e.category === cat;
          });

    tableBody.innerHTML = "";
    if (filtered.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted small">No expenses yet</td></tr>';
    } else {
      filtered.forEach(function (e) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" +
          (e.date || "") +
          "</td><td>" +
          e.name +
          "</td><td>" +
          (e.category || "") +
          "</td><td>" +
          (e.wallet || "") +
          '</td><td class="text-end">' +
          etsFormatCurrency(e.amount) +
          '</td><td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger" data-id="' +
          e.id +
          '">Delete</button></td>';
        tableBody.appendChild(tr);
      });
    }

    const sum = filtered.reduce(function (s, e) {
      return s + Number(e.amount || 0);
    }, 0);
    const label = document.getElementById("exp-summary-label");
    if (label) {
      label.textContent =
        filtered.length +
        " expenses, total " +
        etsFormatCurrency(sum);
    }
    etsSaveExpenses(expenses);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("exp-name").value.trim();
    const amount = Number(
      document.getElementById("exp-amount").value.trim() || "0"
    );
    const category = document.getElementById("exp-category").value;
    const date = document.getElementById("exp-date").value || etsTodayISO();
    const wallet = document.getElementById("exp-wallet").value.trim();
    if (!name || !amount) {
      alert("Please enter name and amount");
      return;
    }
    const id = Date.now().toString();
    expenses.push({
      id: id,
      name: name,
      amount: amount,
      category: category,
      date: date,
      wallet: wallet
    });
    form.reset();
    if (dateInput) {
      dateInput.value = etsTodayISO();
    }
    render();
  });

  tableBody.addEventListener("click", function (e) {
    const target = e.target;
    if (target.matches("button[data-id]")) {
      const id = target.getAttribute("data-id");
      expenses = expenses.filter(function (ex) {
        return ex.id !== id;
      });
      render();
    }
  });

  filterCat.addEventListener("change", render);

  render();
}

/* Wallets */

function etsInitWallets() {
  const form = document.getElementById("wallet-form");
  const tableBody = document.getElementById("wallet-table");
  if (!form || !tableBody) return;

  let wallets = etsLoadWallets();

  function render() {
    tableBody.innerHTML = "";
    if (wallets.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="4" class="text-center text-muted small">No wallets yet</td></tr>';
    } else {
      wallets.forEach(function (w) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" +
          w.name +
          "</td><td>" +
          (w.number || "") +
          '</td><td class="text-end">' +
          etsFormatCurrency(w.balance) +
          '</td><td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger" data-id="' +
          w.id +
          '">Delete</button></td>';
        tableBody.appendChild(tr);
      });
    }
    etsSaveWallets(wallets);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("wallet-name").value.trim();
    const number = document.getElementById("wallet-number").value.trim();
    const balance = Number(
      document.getElementById("wallet-balance").value.trim() || "0"
    );
    if (!name) {
      alert("Please enter wallet name");
      return;
    }
    const id = Date.now().toString() + Math.random().toString(16).slice(2);
    wallets.push({
      id: id,
      name: name,
      number: number,
      balance: balance
    });
    form.reset();
    render();
  });

  tableBody.addEventListener("click", function (e) {
    const target = e.target;
    if (target.matches("button[data-id]")) {
      const id = target.getAttribute("data-id");
      wallets = wallets.filter(function (w) {
        return w.id !== id;
      });
      render();
    }
  });

  render();
}

/* Summary */

function etsInitSummary() {
  const totalEl = document.getElementById("sum-total-spent");
  if (!totalEl) return;
  const monthEl = document.getElementById("sum-month-spent");
  const savingsEl = document.getElementById("sum-month-savings");
  const incomeLabel = document.getElementById("sum-income-label");
  const catContainer = document.getElementById("sum-category-breakdown");
  const allBody = document.getElementById("sum-all-body");

  const expenses = etsLoadExpenses();
  const settings = etsGetSettings();

  const total = expenses.reduce(function (s, e) {
    return s + Number(e.amount || 0);
  }, 0);

  const thisMonth = expenses.filter(function (e) {
    return etsSameMonth(e.date);
  });

  const monthTotal = thisMonth.reduce(function (s, e) {
    return s + Number(e.amount || 0);
  }, 0);

  totalEl.textContent = etsFormatCurrency(total);
  monthEl.textContent = etsFormatCurrency(monthTotal);

  const net = (Number(settings.monthIncome) || 0) - monthTotal;
  savingsEl.textContent = etsFormatCurrency(net);
  if (incomeLabel) {
    incomeLabel.textContent =
      "Based on monthly income " + etsFormatCurrency(settings.monthIncome);
  }

  const byCat = {};
  thisMonth.forEach(function (e) {
    const c = e.category || "Other";
    if (!byCat[c]) byCat[c] = 0;
    byCat[c] += Number(e.amount || 0);
  });

  catContainer.innerHTML = "";
  const cats = Object.keys(byCat);
  if (cats.length === 0) {
    catContainer.innerHTML =
      '<p class="text-muted small mb-0">No data yet</p>';
  } else {
    const maxVal = Math.max.apply(
      null,
      cats.map(function (c) {
        return byCat[c];
      })
    );
    cats.forEach(function (c) {
      const val = byCat[c];
      const percent = maxVal ? Math.round((val / maxVal) * 100) : 0;
      const block = document.createElement("div");
      block.className = "mb-2";
      block.innerHTML =
        '<div class="d-flex justify-content-between"><span>' +
        c +
        "</span><span>" +
        etsFormatCurrency(val) +
        '</span></div><div class="progress bg-light"><div class="progress-bar" style="width:' +
        percent +
        '%"></div></div>';
      catContainer.appendChild(block);
    });
  }

  allBody.innerHTML = "";
  if (expenses.length === 0) {
    allBody.innerHTML =
      '<tr><td colspan="4" class="text-center text-muted small">No expenses yet</td></tr>';
  } else {
    const sorted = expenses
      .slice()
      .sort(function (a, b) {
        return (b.date || "").localeCompare(a.date || "");
      });
    sorted.forEach(function (e) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        (e.date || "") +
        "</td><td>" +
        e.name +
        "</td><td>" +
        (e.category || "") +
        '</td><td class="text-end">' +
        etsFormatCurrency(e.amount) +
        "</td>";
      allBody.appendChild(tr);
    });
  }
}

/* Settings */

function etsInitSettings() {
  const profileForm = document.getElementById("profile-form");
  if (!profileForm) return;
  const financeForm = document.getElementById("finance-form");
  const financeMsg = document.getElementById("finance-msg");
  const darkToggle = document.getElementById("set-dark-mode");

  const settings = etsGetSettings();

  document.getElementById("set-name").value = settings.name;
  document.getElementById("set-email").value = settings.email;
  document.getElementById("set-currency").value = settings.currency;
  document.getElementById("set-month-income").value =
    settings.monthIncome || "";

  if (darkToggle) {
    darkToggle.checked = settings.darkMode;
  }

  profileForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const s = etsGetSettings();
    s.name = document.getElementById("set-name").value.trim() || s.name;
    s.email = document.getElementById("set-email").value.trim() || s.email;
    etsSaveSettings(s);
    etsFillProfile();
    alert("Profile saved");
  });

  financeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const s = etsGetSettings();
    s.currency = document.getElementById("set-currency").value;
    s.monthIncome = Number(
      document.getElementById("set-month-income").value.trim() || "0"
    );
    etsSaveSettings(s);
    if (financeMsg) {
      financeMsg.textContent =
        "Saved finance settings, used on dashboard and summary";
    }
  });

  if (darkToggle) {
    darkToggle.addEventListener("change", function () {
      const s = etsGetSettings();
      s.darkMode = darkToggle.checked;
      etsSaveSettings(s);
      etsApplyTheme();
    });
  }
}

/* Boot */

document.addEventListener("DOMContentLoaded", function () {
  const page = document.body.getAttribute("data-page") || "";
  etsApplyTheme();
  etsFillProfile();
  etsRequireLogin(page);
  etsSetupLogoutButtons();

  if (page === "login") etsInitLogin();
  if (page === "signup") etsInitSignup();
  if (page === "dashboard") etsInitDashboard();
  if (page === "expenses") etsInitExpenses();
  if (page === "wallets") etsInitWallets();
  if (page === "summary") etsInitSummary();
  if (page === "settings") etsInitSettings();
});
