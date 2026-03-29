/* global GA4_COMMON_FIELDS, GA4_ITEM_FIELDS, GA4_EVENTS */

(function () {
  "use strict";

  // ── State ──────────────────────────────────────────────────────────────────
  let activeTab = "events";       // 'events' | 'common' | 'item'
  let expandedEvents = new Set(); // set of event names that are expanded

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const searchInput   = document.getElementById("search");
  const tabButtons    = document.querySelectorAll(".tab-btn");
  const eventsPanel   = document.getElementById("panel-events");
  const commonPanel   = document.getElementById("panel-common");
  const itemPanel     = document.getElementById("panel-item");
  const eventsList    = document.getElementById("events-list");
  const commonList    = document.getElementById("common-list");
  const itemList      = document.getElementById("item-list");
  const resultCount   = document.getElementById("result-count");

  // ── Tab switching ──────────────────────────────────────────────────────────
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      tabButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      eventsPanel.hidden = activeTab !== "events";
      commonPanel.hidden = activeTab !== "common";
      itemPanel.hidden   = activeTab !== "item";
      render();
    });
  });

  // ── Search ─────────────────────────────────────────────────────────────────
  searchInput.addEventListener("input", render);

  // ── Rendering ──────────────────────────────────────────────────────────────
  function getQuery() {
    return searchInput.value.trim().toLowerCase();
  }

  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return escapeHtml(text);
    return (
      escapeHtml(text.slice(0, idx)) +
      `<mark>${escapeHtml(text.slice(idx, idx + query.length))}</mark>` +
      escapeHtml(text.slice(idx + query.length))
    );
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderFieldRow(field, query) {
    const requiredBadge =
      field.required === true
        ? `<span class="badge badge-required">required</span>`
        : field.required === false
        ? `<span class="badge badge-optional">optional</span>`
        : "";
    return `
      <tr>
        <td class="field-name">${highlightMatch(field.name, query)}</td>
        <td class="field-type">${escapeHtml(field.type)}</td>
        <td>${requiredBadge}</td>
        <td class="field-desc">${highlightMatch(field.description, query)}</td>
      </tr>`;
  }

  function renderCommonOrItemFields(container, fields, query) {
    const filtered = fields.filter(
      (f) =>
        !query ||
        f.name.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query)
    );
    if (filtered.length === 0) {
      container.innerHTML = `<p class="empty">No fields match your search.</p>`;
      return 0;
    }
    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Field</th><th>Type</th><th>Required</th><th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((f) => renderFieldRow(f, query)).join("")}
        </tbody>
      </table>`;
    return filtered.length;
  }

  function renderEvents(container, events, query) {
    const filtered = events.filter((ev) => {
      if (!query) return true;
      if (ev.name.toLowerCase().includes(query)) return true;
      if (ev.description.toLowerCase().includes(query)) return true;
      return ev.parameters.some(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    });

    if (filtered.length === 0) {
      container.innerHTML = `<p class="empty">No events match your search.</p>`;
      return 0;
    }

    // Auto-expand all when searching
    if (query) {
      filtered.forEach((ev) => expandedEvents.add(ev.name));
    }

    container.innerHTML = filtered
      .map((ev) => {
        const isExpanded = expandedEvents.has(ev.name);
        const paramsHtml =
          ev.parameters.length === 0
            ? `<p class="no-params">No event-specific parameters.</p>`
            : `<table>
                <thead>
                  <tr>
                    <th>Parameter</th><th>Type</th><th>Required</th><th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${ev.parameters.map((p) => renderFieldRow(p, query)).join("")}
                </tbody>
               </table>`;

        return `
          <div class="event-card ${isExpanded ? "expanded" : ""}">
            <button class="event-header" data-event="${escapeHtml(ev.name)}" aria-expanded="${isExpanded}">
              <span class="event-name">${highlightMatch(ev.name, query)}</span>
              <span class="event-desc">${highlightMatch(ev.description, query)}</span>
              <span class="chevron" aria-hidden="true">▾</span>
            </button>
            <div class="event-body" ${isExpanded ? "" : 'hidden'}>
              ${paramsHtml}
            </div>
          </div>`;
      })
      .join("");

    // Attach toggle listeners
    container.querySelectorAll(".event-header").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.event;
        const card = btn.closest(".event-card");
        const body = card.querySelector(".event-body");
        if (expandedEvents.has(name)) {
          expandedEvents.delete(name);
          card.classList.remove("expanded");
          body.hidden = true;
          btn.setAttribute("aria-expanded", "false");
        } else {
          expandedEvents.add(name);
          card.classList.add("expanded");
          body.hidden = false;
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });

    return filtered.length;
  }

  function render() {
    const query = getQuery();
    let count = 0;

    if (activeTab === "events") {
      count = renderEvents(eventsList, GA4_EVENTS, query);
      resultCount.textContent = `${count} event${count !== 1 ? "s" : ""}`;
    } else if (activeTab === "common") {
      count = renderCommonOrItemFields(commonList, GA4_COMMON_FIELDS, query);
      resultCount.textContent = `${count} field${count !== 1 ? "s" : ""}`;
    } else {
      count = renderCommonOrItemFields(itemList, GA4_ITEM_FIELDS, query);
      resultCount.textContent = `${count} field${count !== 1 ? "s" : ""}`;
    }
  }

  // ── Initial render ─────────────────────────────────────────────────────────
  render();
})();
