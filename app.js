import { firebaseConfig } from "./firebase-config.js";

const ADMIN_EMAILS = [
  "fveronica73@gmail.com",
  "fspagnoli02@gmail.com"
];

const STAFF_PASSWORD = "Proloco@(16D)";

const DEFAULT_DAILY_CAPACITY = 80;
const FIRST_BOOKING_TIME = "19:30";
const LAST_BOOKING_TIME = "21:30";
const ALLOWED_DATES = [
  "2026-07-24",
  "2026-07-25",
  "2026-07-26",
  "2026-07-31",
  "2026-08-01",
  "2026-08-02",
  "2026-08-07",
  "2026-08-08",
  "2026-08-09",
  "2026-08-10",
  "2026-08-11",
  "2026-08-12",
  "2026-08-13",
  "2026-08-14",
  "2026-08-15",
  "2026-08-16"
];
const CALENDAR_DATES = [
  "2026-07-24",
  "2026-07-25",
  "2026-07-26",
  "2026-07-27",
  "2026-07-28",
  "2026-07-29",
  "2026-07-30",
  "2026-07-31",
  "2026-08-01",
  "2026-08-02",
  "2026-08-03",
  "2026-08-04",
  "2026-08-05",
  "2026-08-06",
  "2026-08-07",
  "2026-08-08",
  "2026-08-09",
  "2026-08-10",
  "2026-08-11",
  "2026-08-12",
  "2026-08-13",
  "2026-08-14",
  "2026-08-15",
  "2026-08-16"
];

const RESTAURANT = {
  address: "Vicolo di mezzo, Rocca Priora (RM) 00079",
  mapsUrl: "https://maps.app.goo.gl/PEeqY1f2epLdSSA57",
  mapsEmbed: "https://www.google.com/maps?q=Vicolo%20di%20mezzo%2C%20Rocca%20Priora%20RM%2000079&output=embed",
  contacts: [
    { label: "WhatsApp", value: "3395715216", href: "https://wa.me/393395715216", icon: "./assets/whatsapp.svg" }
  ]
};

const MENU_ITEMS = [
  {
    key: "castello",
    name: "Tagliere Castello",
    description: "Salumi e formaggi",
    image: "./assets/tagliere-castello-foto-reale.jpeg?v=2"
  },
  {
    key: "lePrata",
    name: "Tagliere Le Prata",
    description: "Tagliere vegetariano",
    image: "./assets/tagliere-le-prata-foto-reale.jpeg?v=2"
  },
  {
    key: "prosciutto",
    name: "Panino Prosciutto",
    description: "Panino rustico con prosciutto",
    image: "./assets/panino-prosciutto.png"
  },
  {
    key: "porchetta",
    name: "Panino Porchetta",
    description: "Panino rustico con porchetta",
    image: "./assets/panino-porchetta.png"
  }
];

const state = {
  firebase: null,
  currentUser: null,
  role: "viewer",
  bookings: [],
  availability: new Map(),
  localMode: Object.values(firebaseConfig).some((value) => String(value).startsWith("INSERISCI"))
};

const el = {
  publicApp: document.querySelector("#publicApp"),
  adminApp: document.querySelector("#adminApp"),
  bookingDialog: document.querySelector("#bookingDialog"),
  bookingForm: document.querySelector("#bookingForm"),
  bookingMessage: document.querySelector("#bookingMessage"),
  soldOutMessage: document.querySelector("#soldOutMessage"),
  menuGrid: document.querySelector("#menuGrid"),
  addressText: document.querySelector("#addressText"),
  mapsButton: document.querySelector("#mapsButton"),
  mapsFrame: document.querySelector("#mapsFrame"),
  contactList: document.querySelector("#contactList"),
  loginPanel: document.querySelector("#loginPanel"),
  dashboardPanel: document.querySelector("#dashboardPanel"),
  loginForm: document.querySelector("#loginForm"),
  loginMessage: document.querySelector("#loginMessage"),
  logoutButton: document.querySelector("#logoutButton"),
  roleLabel: document.querySelector("#roleLabel"),
  availabilityForm: document.querySelector("#availabilityForm"),
  availabilityMessage: document.querySelector("#availabilityMessage"),
  phoneBookingForm: document.querySelector("#phoneBookingForm"),
  bookingList: document.querySelector("#bookingList"),
  adminDateFilter: document.querySelector("#adminDateFilter"),
  productSummary: document.querySelector("#productSummary"),
  todayBookings: document.querySelector("#todayBookings"),
  todayPeople: document.querySelector("#todayPeople"),
  freeSeats: document.querySelector("#freeSeats"),
  futureBookings: document.querySelector("#futureBookings")
};

init();

async function init() {
  renderPublicContent();
  renderBookingForm(el.bookingForm, "Online");
  renderBookingForm(el.phoneBookingForm, "Telefonica");
  bindEvents();

  if (!state.localMode) {
    await setupFirebase();
  } else {
    seedLocalMode();
  }

  route();
  await refreshData();
}

function bindEvents() {
  document.querySelector("[data-open-booking]").addEventListener("click", () => openBookingDialog());
  window.addEventListener("popstate", route);
  const adminLink = document.querySelector("[data-admin-link]");
  if (adminLink) {
    adminLink.addEventListener("click", (event) => {
      event.preventDefault();
      history.pushState(null, "", adminLink.getAttribute("href"));
      route();
    });
  }
  el.bookingForm.addEventListener("submit", handleBookingSubmit);
  el.phoneBookingForm.addEventListener("submit", handleBookingSubmit);
  el.loginForm.addEventListener("submit", handleLogin);
  el.logoutButton.addEventListener("click", handleLogout);
  el.availabilityForm.addEventListener("submit", handleAvailabilitySubmit);
  el.adminDateFilter.addEventListener("change", renderAdmin);
}

function route() {
  const isAdmin = location.pathname.endsWith("/admin") || location.pathname.endsWith("/admin.html");
  el.publicApp.hidden = isAdmin;
  el.adminApp.hidden = !isAdmin;
  document.body.classList.toggle("is-admin", isAdmin);
  if (isAdmin) renderAdminShell();
}

function renderPublicContent() {
  el.menuGrid.innerHTML = MENU_ITEMS.map((item) => `
    <article class="menu-card">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
      </div>
    </article>
  `).join("");

  el.addressText.textContent = RESTAURANT.address;
  el.mapsButton.href = RESTAURANT.mapsUrl;
  el.mapsFrame.src = RESTAURANT.mapsEmbed;
  el.contactList.innerHTML = RESTAURANT.contacts.map((contact) => {
    if (contact.href) {
      return `
        <a class="contact-link" href="${contact.href}" target="_blank" rel="noreferrer">
          ${contact.icon ? `<img src="${contact.icon}" alt="">` : ""}
          <span>${contact.label}: ${contact.value}</span>
        </a>
      `;
    }
    return `<span>${contact.label}: ${contact.value}</span>`;
  }).join("");
}

function renderBookingForm(form, type) {
  const menuControls = MENU_ITEMS.map((item) => `
    <article class="quantity-item" data-menu-item="${item.key}">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <strong>${item.name}</strong>
        <div class="quantity-controls">
          <button type="button" data-minus="${item.key}" aria-label="Diminuisci ${item.name}">-</button>
          <output id="${type}-${item.key}-qty">0</output>
          <button type="button" data-plus="${item.key}" aria-label="Aumenta ${item.name}">+</button>
        </div>
        <input type="hidden" name="${item.key}" value="0">
      </div>
    </article>
  `).join("");

  form.innerHTML = `
    <label>Nome e Cognome <input name="fullName" autocomplete="name" required></label>
    <label>Numero di telefono <input name="phone" autocomplete="tel" inputmode="tel" required></label>
    <input name="date" type="hidden" required>
    <section class="date-picker full" aria-label="Calendario date disponibili">
      <strong>Scegli la data</strong>
      <div class="date-calendar" data-date-calendar></div>
      <p class="selected-date" data-selected-date>Nessuna data selezionata</p>
    </section>
    <label>Orario <input name="time" type="time" min="${FIRST_BOOKING_TIME}" max="${LAST_BOOKING_TIME}" step="900" required></label>
    <p class="form-hint full">Orari prenotabili dalle 19:30 alle 21:30.</p>
    <label>Numero persone <input name="people" type="number" min="1" step="1" required></label>
    <fieldset class="choice-row full">
      <legend>Vuoi gia comunicarci cosa desideri mangiare?</legend>
      <label><input type="radio" name="menuChoice" value="later" checked> Comunicheremo la scelta sul posto</label>
      <label><input type="radio" name="menuChoice" value="now"> Comunica gia la scelta</label>
    </fieldset>
    <div class="quantity-list full" hidden>${menuControls}</div>
    <button class="primary-button full" type="submit">${type === "Telefonica" ? "Aggiungi prenotazione telefonica" : "Conferma prenotazione"}</button>
  `;

  form.dataset.bookingType = type;
  form.querySelectorAll("[name='menuChoice']").forEach((input) => {
    input.addEventListener("change", () => {
      form.querySelector(".quantity-list").hidden = input.value !== "now" || !input.checked;
    });
  });
  form.querySelectorAll("[data-plus], [data-minus]").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(form, button.dataset.plus || button.dataset.minus, Boolean(button.dataset.plus)));
  });
  renderDateCalendar(form);
}

function changeQuantity(form, key, increase) {
  const input = form.querySelector(`[name='${key}']`);
  const next = Math.max(0, Number(input.value) + (increase ? 1 : -1));
  input.value = String(next);
  form.querySelector(`[id$='-${key}-qty']`).value = String(next);
}

function renderDateCalendars() {
  document.querySelectorAll("form[data-booking-type]").forEach((form) => renderDateCalendar(form));
}

function renderDateCalendar(form) {
  const calendar = form.querySelector("[data-date-calendar]");
  if (!calendar) return;

  const selectedDate = form.querySelector("[name='date']").value;
  calendar.innerHTML = CALENDAR_DATES.map((date) => {
    const allowed = isAllowedDate(date);
    const soldOut = allowed && isSoldOut(date);
    const disabled = !allowed || soldOut;
    const className = [
      "date-button",
      selectedDate === date ? "is-selected" : "",
      soldOut ? "is-soldout" : "",
      !allowed ? "is-unavailable" : ""
    ].filter(Boolean).join(" ");
    const status = soldOut ? "Sold out" : allowed ? "Disponibile" : "Non prenotabile";
    return `<button class="${className}" type="button" data-date="${date}" ${disabled ? "disabled" : ""}>
      <span>${formatCalendarDate(date)}</span>
      <small>${status}</small>
    </button>`;
  }).join("");

  calendar.querySelectorAll("[data-date]:not(:disabled)").forEach((button) => {
    button.addEventListener("click", () => selectBookingDate(form, button.dataset.date));
  });
}

function selectBookingDate(form, date) {
  form.querySelector("[name='date']").value = date;
  form.querySelector("[data-selected-date]").textContent = `Data selezionata: ${formatLongDate(date)}`;
  renderDateCalendar(form);
}

async function openBookingDialog() {
  resetMessage(el.bookingMessage);
  el.soldOutMessage.hidden = true;
  el.bookingDialog.showModal();
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = form === el.bookingForm ? el.bookingMessage : el.availabilityMessage;
  resetMessage(message);

  if (form.dataset.bookingType === "Telefonica" && !canEdit()) {
    message.textContent = "Accesso in sola lettura: non puoi inserire prenotazioni.";
    return;
  }

  const booking = formToBooking(form);
  const validationMessage = validateBookingSlot(booking);
  if (validationMessage) {
    message.textContent = validationMessage;
    return;
  }

  const hasSeats = await checkAvailability(booking.date, booking.people, null);
  if (!hasSeats) {
    if (form === el.bookingForm) el.soldOutMessage.hidden = false;
    message.textContent = "POSTI ESAURITI - PRENOTAZIONI SOLD OUT";
    return;
  }

  await saveBooking(booking);
  form.reset();
  renderBookingForm(form, form.dataset.bookingType);
  await refreshData();
  message.textContent = form.dataset.bookingType === "Telefonica" ? "Prenotazione telefonica aggiunta." : "Prenotazione ricevuta. Grazie!";
}

function formToBooking(form) {
  const data = new FormData(form);
  const menuChoice = data.get("menuChoice");
  const menu = Object.fromEntries(MENU_ITEMS.map((item) => [item.key, menuChoice === "now" ? Number(data.get(item.key) || 0) : 0]));
  return {
    fullName: String(data.get("fullName")).trim(),
    phone: String(data.get("phone")).trim(),
    date: String(data.get("date")),
    time: String(data.get("time")),
    people: Number(data.get("people")),
    menu,
    bookingType: form.dataset.bookingType,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdByUid: state.currentUser?.uid || null
  };
}

async function setupFirebase() {
  const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
  ]);

  const app = initializeApp(firebaseConfig);
  state.firebase = {
    auth: authModule.getAuth(app),
    db: firestoreModule.getFirestore(app),
    ...authModule,
    ...firestoreModule
  };

  state.firebase.onAuthStateChanged(state.firebase.auth, async (user) => {
    state.currentUser = user;
    state.role = user && isAdminEmail(user.email) ? "admin" : "viewer";
    await refreshData();
    renderAdminShell();
  });
}

async function refreshData() {
  if (state.localMode) {
    state.bookings = readLocal("bookings", []);
    state.availability = new Map(Object.entries(readLocal("availability", {})));
  } else if (state.firebase) {
    const { collection, getDocs, orderBy, query } = state.firebase;
    const bookingSnap = await getDocs(query(collection(state.firebase.db, "bookings"), orderBy("date"), orderBy("time")));
    const availabilitySnap = await getDocs(collection(state.firebase.db, "availability"));
    state.bookings = bookingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    state.availability = new Map(availabilitySnap.docs.map((doc) => [doc.id, doc.data()]));
  }
  renderDateCalendars();
  renderAdmin();
}

async function saveBooking(booking) {
  if (state.localMode) {
    const bookings = readLocal("bookings", []);
    bookings.push({ ...booking, id: crypto.randomUUID() });
    writeLocal("bookings", bookings);
    return;
  }
  const { addDoc, collection, serverTimestamp } = state.firebase;
  await addDoc(collection(state.firebase.db, "bookings"), {
    ...booking,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

async function updateBooking(id, patch) {
  if (!canEdit()) return;
  if (state.localMode) {
    const bookings = readLocal("bookings", []).map((booking) => booking.id === id ? { ...booking, ...patch, updatedAt: new Date() } : booking);
    writeLocal("bookings", bookings);
    await refreshData();
    return;
  }
  const { doc, updateDoc, serverTimestamp } = state.firebase;
  await updateDoc(doc(state.firebase.db, "bookings", id), { ...patch, updatedAt: serverTimestamp() });
  await refreshData();
}

async function deleteBooking(id) {
  if (!canEdit()) return;
  if (state.localMode) {
    writeLocal("bookings", readLocal("bookings", []).filter((booking) => booking.id !== id));
    await refreshData();
    return;
  }
  const { deleteDoc, doc } = state.firebase;
  await deleteDoc(doc(state.firebase.db, "bookings", id));
  await refreshData();
}

async function handleLogin(event) {
  event.preventDefault();
  resetMessage(el.loginMessage);
  const data = new FormData(event.currentTarget);
  const email = String(data.get("email")).trim();
  const password = String(data.get("password"));

  if (password !== STAFF_PASSWORD) {
    el.loginMessage.textContent = "Password non corretta.";
    return;
  }

  if (state.localMode) {
    state.currentUser = { uid: "local-staff", email };
    state.role = isAdminEmail(email) ? "admin" : "viewer";
    renderAdminShell();
    return;
  }

  try {
    await state.firebase.signInWithEmailAndPassword(state.firebase.auth, email, password);
  } catch (error) {
    if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
      try {
        await state.firebase.createUserWithEmailAndPassword(state.firebase.auth, email, password);
      } catch (createError) {
        el.loginMessage.textContent = "Non riesco a creare l'accesso per questa email. Controlla che Email/Password sia abilitato su Firebase.";
      }
      return;
    }
    el.loginMessage.textContent = "Email o password non corretti.";
  }
}

async function handleLogout() {
  if (state.localMode) {
    state.currentUser = null;
    renderAdminShell();
    return;
  }
  await state.firebase.signOut(state.firebase.auth);
}

async function handleAvailabilitySubmit(event) {
  event.preventDefault();
  if (!canEdit()) {
    el.availabilityMessage.textContent = "Accesso in sola lettura: non puoi modificare la disponibilita.";
    return;
  }
  const data = new FormData(event.currentTarget);
  const date = String(data.get("date"));
  const maxSeats = Number(data.get("maxSeats"));

  if (!isAllowedDate(date)) {
    el.availabilityMessage.textContent = "Questa data non e disponibile per le prenotazioni.";
    return;
  }
  if (maxSeats > DEFAULT_DAILY_CAPACITY) {
    el.availabilityMessage.textContent = "La capienza massima giornaliera e di 80 coperti.";
    return;
  }

  const item = {
    date,
    maxSeats,
    updatedAt: new Date(),
    updatedByUid: state.currentUser?.uid || "local"
  };

  if (state.localMode) {
    const availability = readLocal("availability", {});
    availability[date] = item;
    writeLocal("availability", availability);
  } else {
    const { doc, serverTimestamp, setDoc } = state.firebase;
    await setDoc(doc(state.firebase.db, "availability", date), { ...item, updatedAt: serverTimestamp() });
  }

  await refreshData();
  el.availabilityMessage.textContent = "Disponibilita salvata.";
}

function renderAdminShell() {
  const logged = Boolean(state.currentUser);
  el.loginPanel.hidden = logged;
  el.dashboardPanel.hidden = !logged;
  if (logged) {
    el.roleLabel.textContent = state.role === "admin" ? "Accesso admin: modifiche abilitate." : "Accesso visualizzatore: sola lettura.";
    renderAdmin();
  }
}

function renderAdmin() {
  if (!state.currentUser) return;
  const today = todayString();
  const selectedDate = el.adminDateFilter.value || today;
  const todayItems = state.bookings.filter((booking) => booking.date === today);
  const futureItems = state.bookings.filter((booking) => booking.date > today);
  const maxSeats = getAvailabilityLimit(selectedDate);
  const usedSeats = seatsForDate(selectedDate);

  el.todayBookings.textContent = String(todayItems.length);
  el.todayPeople.textContent = String(todayItems.reduce((sum, booking) => sum + Number(booking.people || 0), 0));
  el.futureBookings.textContent = String(futureItems.length);
  el.freeSeats.textContent = typeof maxSeats === "number" ? String(Math.max(0, maxSeats - usedSeats)) : "-";

  el.availabilityForm.querySelector("button").disabled = !canEdit();
  el.phoneBookingForm.querySelector("button").disabled = !canEdit();
  renderBookingList(selectedDate);
  renderProductSummary();
}

function renderBookingList(date) {
  const bookings = state.bookings.filter((booking) => !date || booking.date === date);
  if (!bookings.length) {
    el.bookingList.innerHTML = "<p>Nessuna prenotazione per questa data.</p>";
    return;
  }

  el.bookingList.innerHTML = bookings.map((booking) => `
    <article class="booking-row">
      <div>
        <strong>${booking.time} - ${booking.fullName}</strong>
        <div class="booking-meta">${booking.people} persone - ${booking.phone} - ${booking.bookingType}</div>
        <div class="booking-menu">${menuSummary(booking.menu)}</div>
      </div>
      ${canEdit() ? `
        <div class="row-actions">
          <button type="button" data-edit="${booking.id}">Modifica persone</button>
          <button class="danger" type="button" data-delete="${booking.id}">Elimina</button>
        </div>
      ` : ""}
    </article>
  `).join("");

  el.bookingList.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteBooking(button.dataset.delete));
  });
  el.bookingList.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", async () => {
      const booking = state.bookings.find((item) => item.id === button.dataset.edit);
      const value = prompt("Nuovo numero persone", booking.people);
      if (!value) return;
      const people = Number(value);
      if (people > 0 && validateBookingSlot({ ...booking, people }) === "" && await checkAvailability(booking.date, people, booking.id)) {
        await updateBooking(booking.id, { people });
      } else {
        alert("POSTI ESAURITI - PRENOTAZIONI SOLD OUT");
      }
    });
  });
}

function renderProductSummary() {
  const totals = Object.fromEntries(MENU_ITEMS.map((item) => [item.key, 0]));
  state.bookings.forEach((booking) => {
    MENU_ITEMS.forEach((item) => {
      totals[item.key] += Number(booking.menu?.[item.key] || 0);
    });
  });

  el.productSummary.innerHTML = MENU_ITEMS.map((item) => `
    <article><span>${item.name}</span><strong>${totals[item.key]}</strong></article>
  `).join("");
}

async function checkAvailability(date, people, excludedBookingId) {
  if (!isAllowedDate(date)) return false;
  const limit = getAvailabilityLimit(date);
  if (typeof limit !== "number") return true;
  const used = seatsForDate(date, excludedBookingId);
  return used + Number(people) <= limit;
}

function getAvailabilityLimit(date) {
  if (!isAllowedDate(date)) return 0;
  return state.availability.get(date)?.maxSeats ?? DEFAULT_DAILY_CAPACITY;
}

function isSoldOut(date) {
  return isAllowedDate(date) && seatsForDate(date) >= getAvailabilityLimit(date);
}

function validateBookingSlot(booking) {
  if (!isAllowedDate(booking.date)) {
    return "Data non disponibile per le prenotazioni.";
  }
  if (!isAllowedTime(booking.time)) {
    return "Orario non disponibile. Puoi prenotare dalle 19:30 alle 21:30.";
  }
  return "";
}

function isAllowedDate(date) {
  return ALLOWED_DATES.includes(date);
}

function isAllowedTime(time) {
  return time >= FIRST_BOOKING_TIME && time <= LAST_BOOKING_TIME;
}

function formatCalendarDate(date) {
  const [, month, day] = date.split("-");
  const monthLabel = month === "07" ? "lug" : "ago";
  return `${Number(day)} ${monthLabel}`;
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${date}T12:00:00`));
}

function seatsForDate(date, excludedBookingId) {
  return state.bookings
    .filter((booking) => booking.date === date && booking.id !== excludedBookingId)
    .reduce((sum, booking) => sum + Number(booking.people || 0), 0);
}

function menuSummary(menu = {}) {
  const selected = MENU_ITEMS
    .map((item) => ({ name: item.name, qty: Number(menu[item.key] || 0) }))
    .filter((item) => item.qty > 0)
    .map((item) => `${item.name}: ${item.qty}`);
  return selected.length ? selected.join(" - ") : "Scelta menu sul posto";
}

function canEdit() {
  return state.role === "admin";
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email || "").trim().toLowerCase());
}

function resetMessage(node) {
  node.textContent = "";
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function readLocal(key, fallback) {
  return JSON.parse(localStorage.getItem(`vico-${key}`) || JSON.stringify(fallback));
}

function writeLocal(key, value) {
  localStorage.setItem(`vico-${key}`, JSON.stringify(value));
}

function seedLocalMode() {
  if (!localStorage.getItem("vico-availability")) {
    writeLocal("availability", Object.fromEntries(ALLOWED_DATES.map((date) => [
      date,
      { date, maxSeats: DEFAULT_DAILY_CAPACITY }
    ])));
  }
  el.loginMessage.textContent = "Inserisci email e password per accedere all'area riservata.";
}
