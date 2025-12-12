/**
 * StrategyForge Query Builder Combobox Enhancer
 *
 * Destination: frontend/public/query_builder_enhanced.js
 *
 * Features:
 *  - Accessible ARIA combobox behavior (list autocomplete).
 *  - Debounced suggestion generation.
 *  - Keyboard navigation (↑/↓, Enter, Escape, Tab).
 *  - Inline query-DSL helpers for StrategyForge domains:
 *      • game: resources, factions, units, auctions, alliance.
 *      • ops: k8s, pods, metrics, errors.
 *      • docs: architecture, tasks, rag.
 *  - Small heuristic parser to highlight structured filters (key:value).
 *
 * Usage:
 *  - Include after the input element in your widget page:
 *
 *      <script src="/query_builder_enhanced.js"></script>
 *
 *  - The script will auto-initialize on:
 *      #query-builder-test
 */

(function () {
  const INPUT_ID = "query-builder-test";
  const RESULTS_ID = "query-builder-test-results";
  const ACTIVE_CLASS = "qb-result--active";

  /** Debounce helper */
  function debounce(fn, delay) {
    let t = null;
    return function (...args) {
      if (t) clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /** Domain-specific suggestion templates */
  const QUERY_TEMPLATES = [
    // Game / economy
    {
      category: "game",
      label: "My resources summary",
      query: "game:resources user:me sort:credits desc limit:10"
    },
    {
      category: "game",
      label: "Recent auctions by item",
      query: "game:auctions status:open sort:bid desc limit:25"
    },
    {
      category: "game",
      label: "Faction alliances and conflicts",
      query: "game:factions view:alliances include:conflicts"
    },
    {
      category: "game",
      label: "Tower defense performance",
      query: "game:tower_defense metric:credits_per_wave window:1h"
    },
    // Ops / infra
    {
      category: "ops",
      label: "API errors in last 15m",
      query: "ops:logs service:php-api level:error window:15m"
    },
    {
      category: "ops",
      label: "RAG latency metrics",
      query: "ops:metrics service:rag-service metric:latency_ms window:1h"
    },
    {
      category: "ops",
      label: "Pods not ready",
      query: "ops:k8s resource:pod status:not_ready namespace:strategyforge"
    },
    // Docs / tasks
    {
      category: "docs",
      label: "Architecture overview",
      query: "docs:architecture section:overview"
    },
    {
      category: "docs",
      label: "Open tasks for balancing",
      query: "docs:tasks tag:faction-balance status:open"
    },
    {
      category: "docs",
      label: "RAG configuration",
      query: "docs:rag topic:pgvector"
    }
  ];

  /** Compute suggestions for a given input string. */
  function getSuggestions(inputValue) {
    const v = (inputValue || "").trim();
    if (!v) {
      // Default “starter” suggestions.
      return QUERY_TEMPLATES.slice(0, 6);
    }

    const lower = v.toLowerCase();

    // 1) Exact key:value completions (simple query DSL).
    const kvMatch = v.match(/^([a-z_]+):([^ ]*)$/i);
    const suggestions = [];

    if (kvMatch) {
      const key = kvMatch[1].toLowerCase();
      const val = kvMatch[2].toLowerCase();

      const completionsByKey = {
        game: ["resources", "auctions", "factions", "tower_defense"],
        ops: ["logs", "metrics", "k8s"],
        docs: ["architecture", "tasks", "rag"],
        metric: ["latency_ms", "throughput", "error_rate"],
        window: ["5m", "15m", "1h", "24h"],
        status: ["open", "closed", "not_ready"],
        service: ["php-api", "rag-service", "socket-gateway"]
      };

      const options = completionsByKey[key] || [];
      options.forEach((opt) => {
        if (!val || opt.startsWith(val)) {
          suggestions.push({
            category: "completion",
            label: `${key}:${opt}`,
            query: `${key}:${opt}`
          });
        }
      });
    }

    // 2) Template search (label and query).
    QUERY_TEMPLATES.forEach((tpl) => {
      if (
        tpl.label.toLowerCase().includes(lower) ||
        tpl.query.toLowerCase().includes(lower)
      ) {
        suggestions.push(tpl);
      }
    });

    // De-duplicate by query string.
    const seen = new Set();
    return suggestions.filter((s) => {
      if (seen.has(s.query)) return false;
      seen.add(s.query);
      return true;
    }).slice(0, 10);
  }

  /** Render suggestions listbox */
  function renderResults(container, inputEl, items, activeIndex) {
    container.innerHTML = "";

    if (!items.length) {
      container.hidden = true;
      inputEl.setAttribute("aria-expanded", "false");
      inputEl.setAttribute("aria-activedescendant", "");
      return;
    }

    container.hidden = false;
    inputEl.setAttribute("aria-expanded", "true");

    items.forEach((item, idx) => {
      const li = document.createElement("li");
      const id = `${RESULTS_ID}-opt-${idx}`;
      li.id = id;
      li.setAttribute("role", "option");
      li.dataset.index = String(idx);

      const badge = document.createElement("span");
      badge.textContent = item.category;
      badge.className =
        "qb-badge qb-badge--" + item.category; // styling from CSS below

      const label = document.createElement("span");
      label.textContent = item.label;

      const queryText = document.createElement("span");
      queryText.textContent = item.query;
      queryText.className = "qb-query";

      li.appendChild(badge);
      li.appendChild(label);
      li.appendChild(queryText);

      if (idx === activeIndex) {
        li.classList.add(ACTIVE_CLASS);
        inputEl.setAttribute("aria-activedescendant", id);
      }

      li.addEventListener("mousedown", function (e) {
        e.preventDefault();
        applySuggestion(inputEl, item.query);
        closeListbox(container, inputEl);
      });

      container.appendChild(li);
    });
  }

  function applySuggestion(inputEl, query) {
    inputEl.value = query;
    // Trigger any bound listeners (e.g., data-action handlers) by dispatching input/change.
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function closeListbox(container, inputEl) {
    container.hidden = true;
    inputEl.setAttribute("aria-expanded", "false");
    inputEl.setAttribute("aria-activedescendant", "");
  }

  function init() {
    const input = document.getElementById(INPUT_ID);
    if (!input) return;

    // Ensure ARIA attributes are consistent with combobox + popup listbox pattern.
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-controls", RESULTS_ID);

    // Create the listbox container if it does not exist.
    let listbox = document.getElementById(RESULTS_ID);
    if (!listbox) {
      listbox = document.createElement("ul");
      listbox.id = RESULTS_ID;
      listbox.setAttribute("role", "listbox");
      listbox.hidden = true;
      listbox.className = "QueryBuilder-Results";
      input.insertAdjacentElement("afterend", listbox);
    }

    let items = [];
    let activeIndex = -1;

    const updateSuggestions = debounce(function () {
      items = getSuggestions(input.value);
      activeIndex = items.length ? 0 : -1;
      renderResults(listbox, input, items, activeIndex);
    }, 150);

    input.addEventListener("input", () => {
      updateSuggestions();
    });

    input.addEventListener("focus", () => {
      updateSuggestions();
    });

    input.addEventListener("blur", () => {
      // Defer closing to allow click selection.
      setTimeout(() => {
        closeListbox(listbox, input);
      }, 100);
    });

    input.addEventListener("keydown", (event) => {
      const key = event.key;

      if (key === "ArrowDown") {
        event.preventDefault();
        if (!items.length) return;
        activeIndex = (activeIndex + 1) % items.length;
        renderResults(listbox, input, items, activeIndex);
      } else if (key === "ArrowUp") {
        event.preventDefault();
        if (!items.length) return;
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        renderResults(listbox, input, items, activeIndex);
      } else if (key === "Enter") {
        if (activeIndex >= 0 && items[activeIndex]) {
          event.preventDefault();
          applySuggestion(input, items[activeIndex].query);
          closeListbox(listbox, input);
        }
      } else if (key === "Escape") {
        event.preventDefault();
        closeListbox(listbox, input);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
