// static/logic2.js — place poles explicitly, position flags relative to poles
window.addEventListener("DOMContentLoaded", () => {
  const palette = { Joy: 'DC2626', Peace: '1E3A8A', Faith: 'FACC15', Hope: '16A34A' };

  if (!window.DATA || !Array.isArray(DATA.houses)) {
    console.error('DATA.houses not found or invalid. Make sure data.js is loaded before this script.');
    return;
  }

  const data = DATA.houses.map((h, i) => {
    const totalPoints = Number(DATA.totalPoints?.[i] ?? 0);
    const lostPoints  = Number(DATA.lostPoints?.[i] ?? 0);
    return {
      house: h,
      points: Math.max(0, totalPoints - lostPoints),
      total: Math.max(0, totalPoints),
      color: palette[h] ?? '999999',
      link: (DATA.links && DATA.links[h]) || '#'
    };
  });

  // Sort by points descending
  data.sort((a, b) => b.points - a.points);

  const isMobile = window.matchMedia('(pointer: coarse)').matches;

  // layout constants
  const poleH   = isMobile ? 320 : 440;
  const ground  = isMobile ? 110 : 130;
  const flagH   = isMobile ? 84  : 104;
  const flagW   = isMobile ? 130 : 160;
  const topSafe = 40;
  const poleOffsetY = isMobile ? 110 : 150;
  const poleWidth = 6;

  const GAP_PER_POINT = 7; // 10px gap per point difference

  const row = document.getElementById('row');
  row.innerHTML = '';

  let cumulativeGap = 0;
  let prevPoints = data[0]?.points ?? 0;

  data.forEach((d, idx) => {
    const col = document.createElement('div');
    col.className = 'col';
    col.style.position = 'relative';
    row.appendChild(col);

    // pole
    const pole = document.createElement('div');
    pole.className = 'pole';
    pole.style.position = 'absolute';
    pole.style.left = '50%';
    pole.style.transform = 'translateX(-50%)';
    pole.style.top = '40px';
    pole.style.width = poleWidth + 'px';
    pole.style.height = poleH + 'px';
    pole.style.background = 'linear-gradient(180deg,#444 0%, #1f2937 100%)';
    pole.style.borderRadius = '3px';
    pole.style.zIndex = '1';
    col.appendChild(pole);

    

    // ⭐ cumulative gap logic
    if (idx > 0) {
      const diff = prevPoints - d.points;
      cumulativeGap += diff * GAP_PER_POINT;
    }
    prevPoints = d.points;

    // base vertical position (top-down)
    let y = ground + poleH - cumulativeGap;

    // clamp
    const minY = ground + flagH / 2 + 8;
    const maxY = ground + poleH - flagH / 2 - topSafe;
    y = Math.min(Math.max(y, minY), maxY);

    // flag
    const flag = document.createElement('button');
    flag.className = 'flag';
    flag.type = 'button';
    flag.style.position = 'absolute';
    flag.style.bottom = (y - flagH / 2 - poleOffsetY) + 'px';
    flag.style.left = `calc(50% + ${poleWidth / 2}px)`;
    flag.style.width = flagW + 'px';
    flag.style.height = flagH + 'px';
    flag.style.borderRadius = '12px';
    flag.style.display = 'inline-flex';
    flag.style.alignItems = 'center';
    flag.style.justifyContent = 'center';
    flag.style.fontWeight = '700';
    flag.style.color = '#fff';
    flag.style.border = 'none';
    flag.style.cursor = 'pointer';
    flag.style.zIndex = '3';
    flag.style.background = `linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.03)), #${d.color}`;

    const badge = document.createElement('div');
    badge.textContent = d.points;
    badge.style.background = 'rgba(255,255,255,0.14)';
    badge.style.padding = '6px 10px';
    badge.style.borderRadius = '999px';
    badge.style.fontWeight = '800';
    flag.appendChild(badge);

    flag.addEventListener('click', () => {
      if (d.link && d.link !== '#') window.location.href = d.link;
    });

    col.appendChild(flag);

    // entrance animation
    flag.style.transform = 'translateY(26px) rotate(6deg)';
    flag.style.opacity = '0';
    flag.style.transition = 'transform 700ms cubic-bezier(.22,.9,.32,1), opacity 600ms ease';
    setTimeout(() => {
      flag.style.transform = 'translateY(0) rotate(0)';
      flag.style.opacity = '1';
    }, 120 + idx * 120);

    // ground label
    const lost = d.total - d.points;
    const groundLbl = document.createElement('div');
    groundLbl.className = 'ground';
    groundLbl.innerHTML = `
      <div class="name">${d.house}</div>
      <div class="total">${d.points}</div>
      <div class="sub">points</div>
      <div class="lost">Lost: ${lost}</div>
    `;
    col.appendChild(groundLbl);
  });
});

// --- EVENT RESULTS SECTION (same as bar view) ---
window.addEventListener("DOMContentLoaded", () => {
  try {
    const ev = window.EVENTS;
    if (!ev) return;

    const container = document.getElementById("eventResults");
    if (!container) return;

    container.innerHTML = "";

    /* ===============================
       SEARCH TOOLBAR
    =============================== */
    const toolbar = document.createElement("div");
    toolbar.className = "event-toolbar";
    toolbar.innerHTML = `
      <button id="openSearch" class="search-btn"><i class="fa-solid fa-magnifying-glass"></i> Search events</button>
    `;
    container.appendChild(toolbar);

    const searchBar = document.createElement("div");
    searchBar.id = "searchBar";
    searchBar.className = "search-bar hidden";
    searchBar.innerHTML = `
      <input
        id="eventSearchInput"
        type="text"
        placeholder="Search by event, house, category, or gender..."
      />
    `;
    container.appendChild(searchBar);

    // Parse dd/mm/yyyy
    const parseDMY = (str) => {
      const [d, m, y] = str.split("/").map(Number);
      return new Date(y, m - 1, d);
    };

    // Build row objects
    let rows = (ev.dates || []).map((date, i) => ({
      date,
      dateObj: parseDMY(date),
      eventName: ev.events[i],
      category: ev.category[i],
      gender: ev.gender[i],
      house: ev.houses[i],
      points: ev.points[i],
      place: ev.places[i]
    }));

    // Sort by most recent → oldest
    rows.sort((a, b) => b.dateObj - a.dateObj);

    // Group by event title
    const groups = {};
    rows.forEach(r => {
      let key;
      if (["MS", "HS", "ES", "EY", "MS/HS", "Group 1", "Group 2", "Group 3", "Group 4"].includes(r.category)) {
        // Middle/High/Elementary/Early Years — show category directly, no "Category"
        key = `${r.category} ${r.gender} ${r.eventName}`;
      } else if (r.category === "All House") {
        // All House — remove category entirely
        key = `${r.eventName}`;
      } else {
        // Normal categories
        key = `Category ${r.category} ${r.gender} ${r.eventName}`;
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    const CATEGORY_ORDER = [
      "A","B","C","D","E","F",
      "EY","ES","MS","HS","MS/HS","All House"
    ];

    const categoryBuckets = {};
    CATEGORY_ORDER.forEach(c => categoryBuckets[c] = []);

    Object.entries(groups).forEach(([key, events]) => {
      const sample = events[0];
      const cat = sample.category;

      if (CATEGORY_ORDER.includes(cat)) {
        categoryBuckets[cat].push({ key, events });
      }
    });

    const heading = document.createElement("h2");
    heading.textContent = "Event Results (events are updated after their respective prize distribution)";
    container.appendChild(heading);

    // Accordion wrapper (matches peace.html structure)
    const accordion = document.createElement("section");
    accordion.className = "accordion";
    container.appendChild(accordion);

    // Make newest groups appear first (since rows are already sorted newest→oldest,
    // the first row inside each group is newest; but we also want group ordering by newest)
    const keys = Object.keys(groups).sort((a, b) => {
      const aDate = groups[a][0]?.dateObj?.getTime?.() ?? 0;
      const bDate = groups[b][0]?.dateObj?.getTime?.() ?? 0;
      return bDate - aDate;
    });

    CATEGORY_ORDER.forEach(cat => {
      const items = categoryBuckets[cat];
      if (!items || items.length === 0) return;

      const panel = document.createElement("div");
      panel.className = "typePanel categoryPanel";

      const header = document.createElement("div");
      header.className = "typeHeader";
      header.innerHTML = `
        <div class="title">
          ${cat === "All House" ? "All House" : `Category ${cat}`}
        </div>
        <div class="meta">${items.length} events</div>
      `;

      header.addEventListener("click", () => {
        panel.classList.toggle("open");
        accordion.querySelectorAll(".typePanel").forEach(p => {
          if (p !== panel) p.classList.remove("open");
        });
      });

      const body = document.createElement("div");
      body.className = "typeBody";

      // 👇 THIS is your existing event-card logic, unchanged
      items.forEach(({ key, events }) => {
        const subPanel = document.createElement("div");
        subPanel.className = "typePanel eventPanel";

        const subHeader = document.createElement("div");
        subHeader.className = "typeHeader";
        subHeader.innerHTML = `<div class="title">${escapeHtml(key)}</div>`;

        subHeader.addEventListener("click", (e) => {
        e.stopPropagation(); // 🔑 prevent category from toggling
        subPanel.classList.toggle("open");

        // close sibling event panels inside SAME category
        body.querySelectorAll(".eventPanel").forEach(p => {
          if (p !== subPanel) p.classList.remove("open");
        });
      });


        const subBody = document.createElement("div");
        subBody.className = "typeBody";

        events.forEach(r => {
          const row = document.createElement("div");
          row.className = "eventRow";

          const placeNum = parseInt(r.place);
          const badgeText = ordinal(placeNum);

          row.innerHTML = `
            <div class="eventLeft">
              <div class="badge place-${placeNum}">${badgeText}</div>
              <div class="eventTitle"><b>${escapeHtml(r.house)}</b></div>
            </div>
            <div class="eventRight">
              <div class="eventPts">${r.points} pts</div>
            </div>
          `;
          subBody.appendChild(row);
        });

        subPanel.appendChild(subHeader);
        subPanel.appendChild(subBody);
        body.appendChild(subPanel);
      });

      panel.appendChild(header);
      panel.appendChild(body);
      accordion.appendChild(panel);
    });


    /* ===============================
       SEARCH LOGIC
    =============================== */
    const panels = Array.from(accordion.querySelectorAll(".typePanel"));
    const openSearchBtn = document.getElementById("openSearch");
    const searchInput = document.getElementById("eventSearchInput");

    openSearchBtn.addEventListener("click", () => {
      searchBar.classList.toggle("hidden");
      searchInput.value = "";
      searchInput.focus();
      panels.forEach(p => p.style.display = "");
    });

    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase();
      panels.forEach(panel => {
        panel.style.display =
          panel.innerText.toLowerCase().includes(q) ? "" : "none";
      });
    });


    // helper copied from peace.html pattern
    function escapeHtml(s){
      return String(s || "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;");
    }


  } catch (e) {
    console.error("Error building event results:", e);
  }
});

function ordinal(n) {
  if (!n || isNaN(n)) return "";
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}<sup>th</sup>`;
  switch (n % 10) {
    case 1: return `${n}<sup>st</sup>`;
    case 2: return `${n}<sup>nd</sup>`;
    case 3: return `${n}<sup>rd</sup>`;
    default: return `${n}<sup>th</sup>`;
  }
}

// ===== Feedback side panel =====
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("fb-toggle");
  const panel = document.getElementById("fb-panel");
  const close = document.getElementById("fb-close");
  const backdrop = document.getElementById("fb-backdrop");

  // Safety check (important if some pages don't have the panel)
  if (!toggle || !panel || !close || !backdrop) return;

  function openPanel() {
    panel.classList.add("is-open");
    backdrop.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
  }

  function closePanel() {
    panel.classList.remove("is-open");
    backdrop.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
  }

  toggle.addEventListener("click", () => {
    panel.classList.contains("is-open") ? closePanel() : openPanel();
  });

  close.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });
});