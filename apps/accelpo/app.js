import { ACCELPO_ROUTES, hashForRoute, routeFromHash as parseRouteHash } from "./src/chassis/route-registry.js";

const app = document.querySelector("#app");
const routes = ACCELPO_ROUTES;

const previewCases = [
  {
    id: "chairs",
    title: "Office chairs",
    category: "Workplace",
    status: "Needs review",
    tone: "amber",
    next: "Choose a provider",
    amount: 2180,
    neededBy: "Sep 20",
    location: "Main office",
    provider: "3 offers ready",
    requester: "You",
    timeline: [
      ["Request started", "Sep 12", "done"],
      ["Approval", "Approved · Sep 13", "done"],
      ["Provider", "Choose from 3 offers", "active"],
      ["Delivery", "Not started", "upcoming"],
    ],
  },
  {
    id: "laptops",
    title: "Laptop stands",
    category: "Equipment",
    status: "In progress",
    tone: "blue",
    next: "Confirm delivery",
    amount: 486,
    neededBy: "Sep 18",
    location: "Main office",
    provider: "Northstar Office Supply",
    requester: "Jordan Lee",
    timeline: [
      ["Request started", "Sep 8", "done"],
      ["Approval", "Approved · Sep 9", "done"],
      ["Provider", "Order confirmed", "done"],
      ["Delivery", "Expected Sep 18", "active"],
    ],
  },
  {
    id: "training",
    title: "Safety training",
    category: "Services",
    status: "Complete",
    tone: "green",
    next: "View purchase",
    amount: 1250,
    neededBy: "Sep 5",
    location: "Remote",
    provider: "Harbor Safety Group",
    requester: "You",
    timeline: [
      ["Request started", "Aug 22", "done"],
      ["Approval", "Approved · Aug 23", "done"],
      ["Provider", "Order confirmed", "done"],
      ["Delivery", "Completed · Sep 5", "done"],
    ],
  },
  {
    id: "shipping",
    title: "Shipping supplies",
    category: "Operations",
    status: "Draft",
    tone: "slate",
    next: "Finish request",
    amount: 0,
    neededBy: "Sep 24",
    location: "Warehouse",
    provider: "Not selected",
    requester: "You",
    timeline: [
      ["Request started", "Not submitted", "active"],
      ["Approval", "Waiting to start", "upcoming"],
      ["Provider", "Waiting to start", "upcoming"],
      ["Delivery", "Waiting to start", "upcoming"],
    ],
  },
];

const previewTasks = [
  { id: "task-chairs", type: "Offer review", title: "Choose a provider for office chairs", detail: "3 offers · Needed Sep 20", tone: "blue", caseId: "chairs" },
  { id: "task-receipt", type: "Receipt needed", title: "Add the receipt for laptop stands", detail: "Laptop stands · Due Sep 21", tone: "amber", caseId: "laptops" },
  { id: "task-delivery", type: "Delivery", title: "Confirm the laptop stands arrived", detail: "Main office · Expected today", tone: "green", caseId: "laptops" },
];

const state = {
  view: "home",
  selectedCase: null,
  sheet: null,
  newStep: 1,
  filter: "All",
  query: "",
  draft: { title: "", description: "", amount: "", neededBy: "", location: "" },
  notice: "",
};

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
const money = (value) => value ? `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—";
const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

function icon(name, size = 20) {
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-6h6v6"/>',
    bag: '<path d="M5 8h14l1 13H4L5 8Z"/><path d="M8 8a4 4 0 0 1 8 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 4 4L19 6"/><path d="M4 3h16v18H4z"/>',
    building: '<path d="M4 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M16 9h3a1 1 0 0 1 1 1v11M8 7h4M8 11h4M8 15h4M8 19h4M12 21v-3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevron: '<path d="m8 10 4 4 4-4"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    sparkle: '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3ZM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z"/>',
    people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.7 12H1.5a2 2 0 1 1 0-4h.2a2 2 0 0 0 1.4-3.4L3 4.5a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.3.4V.2a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 20.9 8h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.5 3Z"/>',
    dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
  };
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.dots}</svg>`;
}

function syncRouteFromHash() {
  const route = parseRouteHash(window.location.hash);
  state.view = route.view;
  state.selectedCase = route.caseId;
  if (route.view === "new") state.sheet = "new";
  else if (route.view === "purchase-detail") state.sheet = "details";
  else state.sheet = null;
}

function navigate(view, caseId = null) {
  const nextHash = `#${hashForRoute(view, caseId)}`;
  if (window.location.hash === nextHash) return render();
  window.location.hash = nextHash;
}

function navLink(view, mobile = false) {
  const route = routes[view];
  const isActive = state.view === view || (view === "purchases" && state.view === "purchase-detail");
  const active = isActive ? " active" : "";
  const taskBadge = view === "tasks" ? '<span class="nav-badge">3</span>' : "";
  return `<button class="nav-item${active}" data-action="navigate" data-view="${view}" aria-current="${isActive ? "page" : "false"}">${icon(route.icon, mobile ? 21 : 19)}<span>${route.label}</span>${taskBadge}</button>`;
}

function renderTopbar() {
  return `<header class="topbar">
    <button class="brand" data-action="navigate" data-view="home" aria-label="AccelPO home">
      <span class="brand-mark">AP</span><span class="brand-name">Accel<span>PO</span></span>
    </button>
    <div class="topbar-center">
      <button class="workspace-switcher" data-action="workspace"><span class="workspace-dot"></span><span>Your organization</span>${icon("chevron", 16)}</button>
    </div>
    <div class="topbar-actions">
      <button class="icon-button" data-action="notifications" aria-label="Notifications"><span class="notification-dot"></span>${icon("bell", 20)}</button>
      <button class="avatar" data-action="profile" aria-label="Open profile">JS</button>
    </div>
  </header>`;
}

function renderSidebar() {
  return `<aside class="sidebar" aria-label="Primary navigation">
    <div class="sidebar-section">
      ${navLink("home")}${navLink("purchases")}
      <button class="new-nav" data-action="new"><span class="new-nav-icon">${icon("plus", 18)}</span><span>New purchase</span></button>
      ${navLink("tasks")}${navLink("organization")}
    </div>
  </aside>`;
}

function renderBottomNav() {
  return `<nav class="bottom-nav" aria-label="Primary navigation">
    ${navLink("home", true)}${navLink("purchases", true)}
    <button class="bottom-new" data-action="new" aria-label="Start a new purchase"><span>${icon("plus", 22)}</span><small>New</small></button>
    ${navLink("tasks", true)}${navLink("organization", true)}
  </nav>`;
}

function statusChip(label, tone = "slate") {
  return `<span class="status-chip ${tone}"><span class="status-dot"></span>${esc(label)}</span>`;
}

function caseCard(item, compact = false) {
  return `<button class="case-card${compact ? " compact" : ""}" data-action="case" data-case-id="${esc(item.id)}">
    <span class="case-icon ${item.tone}">${icon(item.category === "Services" ? "sparkle" : "bag", compact ? 17 : 19)}</span>
    <span class="case-copy"><strong>${esc(item.title)}</strong><span>${esc(item.category)} · ${esc(item.next)}</span></span>
    <span class="case-right"><span>${statusChip(item.status, item.tone)}</span><strong>${money(item.amount)}</strong>${icon("arrow", 17)}</span>
  </button>`;
}

function renderHome() {
  const attention = previewCases.find((item) => item.id === "chairs");
  return `<div class="page page-home">
    <div class="page-header">
      <div><p class="eyebrow">${esc(todayLabel)}</p><h1>Good morning, Jonathan</h1></div>
      <button class="primary-button" data-action="new">${icon("plus", 18)} New purchase</button>
    </div>
    <section class="home-grid" aria-label="Today">
      <article class="focus-card">
        <div class="focus-card-top"><span class="eyebrow">Next up</span>${statusChip(attention.status, attention.tone)}</div>
        <div class="focus-icon">${icon("sparkle", 24)}</div>
        <h2>${esc(attention.title)}</h2>
        <p class="focus-description">${esc(attention.next)} <span class="dot-separator">·</span> ${esc(attention.provider)}</p>
        <div class="focus-footer"><div><span class="metric-label">Estimated total</span><strong>${money(attention.amount)}</strong></div><div><span class="metric-label">Needed by</span><strong>${esc(attention.neededBy)}</strong></div><button class="secondary-button" data-action="case" data-case-id="${attention.id}">Review purchase ${icon("arrow", 16)}</button></div>
      </article>
      <article class="setup-card">
        <div class="setup-art"><span>${icon("building", 23)}</span><span>${icon("people", 20)}</span><span>${icon("check", 20)}</span></div>
        <p class="eyebrow">Setup</p><h3>Set up your team</h3><p>Invite people and set approval rules.</p>
        <button class="quiet-button" data-action="navigate" data-view="organization">Open organization <span>${icon("arrow", 16)}</span></button>
      </article>
    </section>
    <section class="section-block"><div class="section-heading"><div><p class="eyebrow">Activity</p><h2>Recent purchases</h2></div><button class="quiet-button" data-action="navigate" data-view="purchases">See all ${icon("arrow", 16)}</button></div><div class="case-list">${previewCases.slice(0, 3).map((item) => caseCard(item, true)).join("")}</div></section>
  </div>`;
}

function renderPurchases() {
  const filtered = previewCases.filter((item) => {
    const matchesQuery = `${item.title} ${item.category} ${item.status}`.toLowerCase().includes(state.query.toLowerCase());
    const matchesFilter = state.filter === "All" || (state.filter === "Needs attention" ? ["Needs review", "Draft"].includes(item.status) : state.filter === item.status);
    return matchesQuery && matchesFilter;
  });
  const filters = ["All", "Needs attention", "In progress", "Complete"];
  return `<div class="page page-list">
    <div class="page-header"><div><p class="eyebrow">Your organization</p><h1>Purchases</h1></div><button class="primary-button" data-action="new">${icon("plus", 18)} New purchase</button></div>
    <div class="toolbar"><label class="search-field">${icon("search", 19)}<input data-field="query" value="${esc(state.query)}" placeholder="Search purchases" aria-label="Search purchases" /></label><div class="filter-row" role="tablist" aria-label="Purchase filters">${filters.map((filter) => `<button class="filter-button${state.filter === filter ? " active" : ""}" data-action="filter" data-filter="${esc(filter)}" role="tab" aria-selected="${state.filter === filter}">${esc(filter)}</button>`).join("")}</div></div>
    <div class="list-summary"><span>${filtered.length} ${filtered.length === 1 ? "purchase" : "purchases"}</span><button class="sort-button" data-action="sort">Recently updated ${icon("chevron", 15)}</button></div>
    <div class="case-list large-list">${filtered.length ? filtered.map((item) => caseCard(item)).join("") : `<div class="empty-state"><span class="empty-icon">${icon("search", 24)}</span><h3>No purchases found</h3><p>Try another search or clear the filter.</p><button class="quiet-button" data-action="clear-filters">Clear filters</button></div>`}</div>
  </div>`;
}

function renderTasks() {
  return `<div class="page page-list">
    <div class="page-header"><div><p class="eyebrow">Work queue</p><h1>Tasks</h1></div><button class="quiet-button task-filter" data-action="task-filter">All tasks ${icon("chevron", 15)}</button></div>
    <section class="task-summary"><div><span class="summary-number">3</span><span class="summary-label">open tasks</span></div><div class="summary-rule"></div><div><span class="summary-number">1</span><span class="summary-label">due today</span></div><div class="summary-rule"></div><div><span class="summary-number">2</span><span class="summary-label">purchases moving</span></div></section>
    <section class="section-block task-block"><div class="section-heading"><div><p class="eyebrow">Needs attention</p><h2>Open tasks</h2></div></div><div class="task-list">${previewTasks.map((task) => `<button class="task-row" data-action="case" data-case-id="${task.caseId}"><span class="task-icon ${task.tone}">${icon(task.tone === "green" ? "check" : "sparkle", 19)}</span><span class="task-copy"><span class="task-type">${esc(task.type)}</span><strong>${esc(task.title)}</strong><span>${esc(task.detail)}</span></span><span class="task-arrow">${icon("arrow", 17)}</span></button>`).join("")}</div></section>
  </div>`;
}

function renderOrganization() {
  return `<div class="page page-organization">
    <div class="page-header"><div><p class="eyebrow">Workspace</p><h1>Organization</h1></div><button class="quiet-button" data-action="workspace">${icon("dots", 17)} More</button></div>
    <section class="organization-hero"><div class="org-monogram">YO</div><div><p class="eyebrow">Organization</p><h2>Your organization</h2><p>United States</p></div><button class="secondary-button" data-action="edit-org">Edit details ${icon("arrow", 16)}</button></section>
    <section class="org-grid">
      <button class="org-card" data-action="people"><span class="org-card-icon blue">${icon("people", 22)}</span><span><strong>People & seats</strong><small>3 of 3 seats in use</small></span>${icon("arrow", 17)}</button>
      <button class="org-card" data-action="policy"><span class="org-card-icon gold">${icon("settings", 22)}</span><span><strong>Approval & spending</strong><small>Set who reviews purchases</small></span>${icon("arrow", 17)}</button>
      <button class="org-card" data-action="providers"><span class="org-card-icon green">${icon("building", 22)}</span><span><strong>Providers</strong><small>Add the providers you use</small></span>${icon("arrow", 17)}</button>
      <button class="org-card" data-action="billing"><span class="org-card-icon slate">${icon("card", 22)}</span><span><strong>Plan & billing</strong><small>View plan and seats</small></span>${icon("arrow", 17)}</button>
    </section>
    <section class="org-progress"><div class="progress-heading"><div><p class="eyebrow">Getting started</p><h3>Make your first purchase</h3></div><strong>2 of 4</strong></div><div class="progress-track"><span style="width:50%"></span></div><div class="progress-steps"><span class="done">Workspace created</span><span class="done">First request started</span><span>Invite your team</span><span>Set approval rules</span></div></section>
  </div>`;
}

function renderSheet() {
  if (!state.sheet) return "";
  if (state.sheet === "details") {
    const item = previewCases.find((candidate) => candidate.id === state.selectedCase) || previewCases[0];
    return `<div class="sheet-backdrop" data-action="close-sheet"><section class="sheet detail-sheet" data-sheet-surface role="dialog" aria-modal="true" aria-labelledby="detail-title"><div class="sheet-handle" aria-hidden="true"></div><div class="sheet-header"><div><p class="eyebrow">Purchase</p><h2 id="detail-title">${esc(item.title)}</h2></div><button class="icon-button sheet-close" data-action="close-sheet" aria-label="Close">${icon("close", 20)}</button></div><div class="detail-intro">${statusChip(item.status, item.tone)}<span class="detail-category">${esc(item.category)} · ${esc(item.location)}</span></div><div class="detail-next"><span class="next-label">Next action</span><strong>${esc(item.next)}</strong><button class="primary-button small" data-action="detail-next">${esc(item.next)} ${icon("arrow", 16)}</button></div><div class="detail-facts"><div><span>Estimated total</span><strong>${money(item.amount)}</strong></div><div><span>Needed by</span><strong>${esc(item.neededBy)}</strong></div><div><span>Requester</span><strong>${esc(item.requester)}</strong></div></div><div class="timeline"><div class="section-heading"><div><p class="eyebrow">Progress</p><h3>Purchase journey</h3></div></div>${item.timeline.map(([label, detail, status]) => `<div class="timeline-row ${status}"><span class="timeline-marker">${status === "done" ? icon("check", 13) : ""}</span><span><strong>${esc(label)}</strong><small>${esc(detail)}</small></span></div>`).join("")}</div><div class="sheet-footer"><button class="quiet-button" data-action="close-sheet">Close</button><button class="secondary-button" data-action="case-note">Add note ${icon("plus", 16)}</button></div></section></div>`;
  }
  if (state.sheet === "success") {
    return `<div class="sheet-backdrop centered" data-action="close-sheet"><section class="sheet success-sheet" data-sheet-surface role="dialog" aria-modal="true" aria-labelledby="success-title"><div class="success-mark">${icon("check", 30)}</div><p class="eyebrow">Purchase started</p><h2 id="success-title">Purchase saved</h2><p class="success-copy">Saved as a draft.</p><div class="success-preview"><span class="case-icon blue">${icon("bag", 18)}</span><span><strong>${esc(state.draft.title || "New purchase")}</strong><small>Draft · ${esc(state.draft.neededBy || "Needed date to be set")}</small></span></div><button class="primary-button full" data-action="view-purchases">View purchases ${icon("arrow", 17)}</button><button class="quiet-button full" data-action="close-sheet">Done</button></section></div>`;
  }
  const isChoice = state.newStep === 2;
  return `<div class="sheet-backdrop" data-action="close-sheet"><section class="sheet new-sheet" data-sheet-surface role="dialog" aria-modal="true" aria-labelledby="new-title"><div class="sheet-handle" aria-hidden="true"></div><div class="sheet-header"><div><p class="eyebrow">New purchase <span class="step-count">${isChoice ? "2 of 2" : "1 of 2"}</span></p><h2 id="new-title">${isChoice ? "How will you purchase this?" : "What do you need?"}</h2></div><button class="icon-button sheet-close" data-action="close-sheet" aria-label="Close">${icon("close", 20)}</button></div>${isChoice ? renderPurchaseChoice() : renderNeedForm()}</section></div>`;
}

function renderNeedForm() {
  return `<form class="new-form" data-action="need-form"><label class="field-label" for="need-title">Item or service <span>Required</span></label><input id="need-title" class="text-input large" data-field="draft-title" value="${esc(state.draft.title)}" placeholder="e.g. Office chairs" autocomplete="off" required /><label class="field-label" for="need-description">Details <span>Optional</span></label><textarea id="need-description" class="text-input" data-field="draft-description" placeholder="What should your team know?">${esc(state.draft.description)}</textarea><div class="form-row"><label class="field-label" for="need-amount">Estimated amount <span>Optional</span><input id="need-amount" class="text-input" data-field="draft-amount" inputmode="decimal" value="${esc(state.draft.amount)}" placeholder="$ 0" /></label><label class="field-label" for="need-date">Needed by <span>Optional</span><input id="need-date" class="text-input" data-field="draft-neededBy" value="${esc(state.draft.neededBy)}" placeholder="mm / dd / yyyy" /></label></div><label class="field-label" for="need-location">Location <span>Optional</span></label><div class="input-with-icon">${icon("pin", 18)}<input id="need-location" class="text-input" data-field="draft-location" value="${esc(state.draft.location)}" placeholder="Location or delivery method" /></div><div class="form-footer"><button type="button" class="quiet-button" data-action="close-sheet">Cancel</button><button type="submit" class="primary-button">Continue ${icon("arrow", 17)}</button></div></form>`;
}

function renderPurchaseChoice() {
  return `<div class="choice-body"><p class="form-lead">Choose a provider or RFxchange.</p><div class="choice-list"><button class="choice-card" data-action="choose-source" data-source="existing"><span class="choice-icon blue">${icon("building", 22)}</span><span><strong>Use an existing provider</strong><small>Add provider details next.</small></span>${icon("arrow", 17)}</button><button class="choice-card" data-action="choose-source" data-source="community"><span class="choice-icon gold">${icon("sparkle", 22)}</span><span><strong>Source through RFxchange</strong><small>Request offers from the RFxchange community.</small></span>${icon("external", 17)}</button></div><button class="quiet-button back-button" data-action="back-to-need">${icon("arrow", 16)} Back</button></div>`;
}

function renderMain() {
  if (state.view === "purchases") return renderPurchases();
  if (state.view === "purchase-detail") return renderPurchases();
  if (state.view === "tasks") return renderTasks();
  if (state.view === "organization") return renderOrganization();
  return renderHome();
}

function render() {
  syncRouteFromHash();
  app.innerHTML = `${renderTopbar()}<div class="app-layout">${renderSidebar()}<main class="main-content" id="main-content">${renderMain()}</main></div>${renderBottomNav()}${state.notice ? `<div class="toast" role="status">${icon("check", 16)}${esc(state.notice)}</div>` : ""}${renderSheet()}`;
  document.body.dataset.view = state.view;
}

function showNotice(message) {
  state.notice = message;
  render();
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => { state.notice = ""; render(); }, 2600);
}

app.addEventListener("click", (event) => {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;
  if (action === "navigate") return navigate(actionElement.dataset.view);
  if (action === "new") { state.newStep = 1; state.draft = { title: "", description: "", amount: "", neededBy: "", location: "" }; return navigate("new"); }
  if (action === "close-sheet") { if (event.target.closest("[data-sheet-surface]") && !event.target.closest(".sheet-close, [data-action='close-sheet']")) return; return navigate(state.view === "purchase-detail" ? "purchases" : "home"); }
  if (action === "case") return navigate("purchase-detail", actionElement.dataset.caseId);
  if (action === "filter") { state.filter = actionElement.dataset.filter; return render(); }
  if (action === "clear-filters") { state.filter = "All"; state.query = ""; return render(); }
  if (action === "sort") return showNotice("Sorted by recent activity.");
  if (["workspace", "profile", "notifications", "task-filter", "case-note", "detail-next"].includes(action)) return showNotice("Not available yet.");
  if (action === "back-to-need") { state.newStep = 1; return render(); }
  if (action === "view-purchases") return navigate("purchases");
  if (action === "choose-source") {
    const title = state.draft.title.trim() || "New purchase";
    previewCases.unshift({ id: `draft-${Date.now()}`, title, category: "New request", status: "Draft", tone: "slate", next: actionElement.dataset.source === "community" ? "Prepare supplier need" : "Add provider details", amount: Number(state.draft.amount) || 0, neededBy: state.draft.neededBy || "To be set", location: state.draft.location || "To be set", provider: "Not selected", requester: "You", timeline: [["Request started", "Just now", "active"], ["Approval", "Waiting to start", "upcoming"], ["Provider", "Waiting to start", "upcoming"], ["Delivery", "Waiting to start", "upcoming"]] });
    state.sheet = "success";
    return render();
  }
});

app.addEventListener("input", (event) => {
  const field = event.target.dataset.field;
  if (field === "query") { state.query = event.target.value; render(); const input = document.querySelector("[data-field='query']"); input?.focus(); input?.setSelectionRange(state.query.length, state.query.length); }
  if (field?.startsWith("draft-")) state.draft[field.replace("draft-", "")] = event.target.value;
});

app.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-action='need-form']");
  if (!form) return;
  event.preventDefault();
  const title = state.draft.title.trim();
  if (!title) { document.querySelector("#need-title")?.focus(); showNotice("Add an item or service to continue."); return; }
  state.newStep = 2;
  render();
});

window.addEventListener("hashchange", render);

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {}));
render();
