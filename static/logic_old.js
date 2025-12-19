// logic.js - full chart logic with clickable bars (navigate to house pages)
// and earned numbers shifted slightly left inside the coloured segment.
// Keeps bottom toggles for Earned/Lost visibility.

// Example DATA (replace or set window.DATA before this script runs)
const DATA = window.DATA || {
  houses: ['Peace','Joy','Hope','Faith'],
  totalPoints: [2000, 2000, 2000, 2000],
  lostPoints: [517, 517, 517, 517],
  // links not used directly; we map house -> page below
  links: {}
};

Chart.register(ChartDataLabels);

window.addEventListener('DOMContentLoaded', () => {
  // hook bottom buttons if present
  const btnEarned = document.getElementById('btnToggleEarned');
  const btnLost = document.getElementById('btnToggleLost');

  let showEarned = true;
  let showLost = true;

  function updateButtonUI() {
    if (btnEarned) btnEarned.classList.toggle('active', showEarned);
    if (btnLost) btnLost.classList.toggle('active', showLost);
  }

  btnEarned?.addEventListener('click', () => {
    showEarned = !showEarned;
    updateButtonUI();
    if (window._houseChart) {
      window._houseChart.getDatasetMeta(0).hidden = !showEarned;
      window._houseChart.update();
    }
  });

  btnLost?.addEventListener('click', () => {
    showLost = !showLost;
    updateButtonUI();
    if (window._houseChart) {
      window._houseChart.getDatasetMeta(1).hidden = !showLost;
      window._houseChart.update();
    }
  });

  updateButtonUI();
  // tiny delay to allow CSS sizing
  setTimeout(drawChart, 20);
});

function drawChart() {
  const canvas = document.getElementById('housePointsChart');
  if (!canvas) { console.error('Canvas not found'); return; }
  const ctx = canvas.getContext('2d');
  if (!ctx) { console.error('2D context not available'); return; }
  const isMobile = window.matchMedia("(pointer: coarse)").matches;

  // destroy previous instance if present
  if (window._houseChart && typeof window._houseChart.destroy === 'function') {
    window._houseChart.destroy();
    window._houseChart = null;
  }

  // prepare data
  const d = DATA;
  const houses = Array.isArray(d.houses) ? d.houses.slice() : [];
  const total = (d.totalPoints || []).map(n => Number(n) || 0);
  const lost = (d.lostPoints || []).map(n => Number(n) || 0);

  const earned = total.map((t, i) => t - (lost[i] || 0));

  // colour palette tuned to reference
  const palette = {
    Peace: '#1E3A8A', // blue
    Joy:   '#D32F2F', // red
    Hope:  '#16A34A', // green
    Faith: '#F5C400'  // yellow
  };

  // map houses to pages (click targets)
  const pageMap = {
    Peace: '../peace.html',
    Joy:   '../joy.html',
    Hope:  '../hope.html',
    Faith: '../faith.html'
  };

  // build sorted data (largest earned at top)
  const sorted = houses.map((h, i) => ({
    house: h,
    earned: earned[i] || 0,
    lost: lost[i] || 0,
    color: palette[h] || '#888',
    link: pageMap[h] || '#'
  })).sort((a, b) => b.earned - a.earned);

  const labels = sorted.map(s => s.house);
  const earnedData = sorted.map(s => s.earned);
  const lostData = sorted.map(s => s.lost);
  const colors = sorted.map(s => s.color);
  const linkMap = Object.fromEntries(sorted.map(s => [s.house, s.link]));

  // padded max so black block never flushes to viewport edge
  const rawMax = Math.max(...earnedData.map((v, i) => v + (lostData[i] || 0)));
  const maxWithPadding = Math.ceil(rawMax * 1.06);
  const rawMin = Math.min(...earnedData.map((v, i) => v + (lostData[i] || 0)));
  const minZoom = Math.floor(rawMin * 0.9 / 100) * 100;

  // compute maximum font size such that text fits inside the coloured segment width
  function computeMaxFontForSegment(chart, index, text, maxSize, minSize = 10, paddingPx = 12) {
    const xScale = chart.scales.x;
    const earnedVal = chart.data.datasets[0].data[index] || 0;
    const startPx = xScale.getPixelForValue(0);
    const endPx = xScale.getPixelForValue(earnedVal);
    const segWidth = Math.abs(endPx - startPx);

    const ctx = chart.ctx;
    for (let s = maxSize; s >= minSize; s--) {
      ctx.save();
      ctx.font = `900 ${s}px Montserrat, sans-serif`;
      const tw = ctx.measureText(String(text)).width;
      ctx.restore();
      if (tw + paddingPx * 2 <= segWidth) return s;
    }
    return minSize;
  }

  // Create chart
  window._houseChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        // Earned - coloured bars
        {
          label: 'House Points (after losses) \n (click to view events)',
          data: earnedData,
          backgroundColor: colors,
          borderRadius: 14,
          datalabels: {
            clip: isMobile,                 // clip on mobile so text can't spill out
            color: '#ffffff',
            anchor: 'center',            // vertically centered inside segment
            align: isMobile ? 'center' : 'right',              // place near end of coloured segment
            offset: isMobile ? 0 : -8,                  // shift slightly left inside the coloured segment
            clamp: true,
            formatter: v => v,
            // compute whether label should be displayed and the font size that fits
            display: function(context) {
              try {
                const chart = context.chart;
                const idx = context.dataIndex;
                const txt = context.dataset.data[idx];
                const h = chart.canvas.clientHeight || 700;
                const upper = Math.max(20, Math.floor(h * 0.08)); // upper bound on font
                const chosen = computeMaxFontForSegment(chart, idx, txt, upper, 10, 10);
                // cache chosen size
                context.dataset._computedFontSizes = context.dataset._computedFontSizes || {};
                context.dataset._computedFontSizes[idx] = chosen;
                return chosen >= 10;
              } catch (e) {
                return true;
              }
            },
            font: function(context) {
              const ds = context.dataset;
              const idx = context.dataIndex;
              const computed = ds._computedFontSizes && ds._computedFontSizes[idx];
              if (computed) return { weight: '900', size: computed };
              const h = context.chart.canvas.clientHeight || 700;
              return { weight: '900', size: Math.max(20, Math.floor(h * 0.06)) };
            }
          }
        },

        // Lost - black blocks (no internal label by default)
        {
          label: 'Lost Points',
          data: lostData,
          backgroundColor: '#000000',
          borderRadius: 14,
          datalabels: { display: false }
        }
      ]
    },

    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: window.devicePixelRatio || 1,
      animation: false,
      layout: {
        padding: {
          left: isMobile ? 10 : 24,
          right: isMobile ? 18 : 96,
          top: 12,
          bottom: 12
        }
      },

      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { font: { size: isMobile ? 13 : 16, weight: '700' }, boxWidth: 18, boxHeight: 12 },
          align: 'center'
        },
        datalabels: { display: true },
        tooltip: { enabled: true, padding: 12, bodyFont: { size: 14, weight: '600' } }
      },

      scales: {
        x: {
          stacked: true,
          min: minZoom,                 
          max: maxWithPadding - 75,
          ticks: { font: { size: 14 }, color: '#333', precision: 0 },
          grid: { color: 'rgba(0,0,0,0.06)' }
        },

        y: {
          stacked: true,
          ticks: { font: { size: isMobile ? 16 : 20, weight: '700' }, color: '#6b6b6b', padding: isMobile ? 6 : 12 },
          grid: { display: false }
        }
      },

      // click anywhere on a bar to navigate to the mapped page
      onClick: (evt, elements) => {
        if (!elements || elements.length === 0) return;
        const idx = elements[0].index;
        const house = labels[idx];
        const target = linkMap[house] || pageMap[house] || null;
        if (target) window.location.href = target;
      },

      onResize: (chart) => {
        // clear cached computed font sizes so they'll be recalculated on redraw
        chart.data.datasets.forEach(ds => { if (ds._computedFontSizes) ds._computedFontSizes = {}; });
        chart.update();
      }
    }
  });

  // Ensure toggles reflect dataset visibility initially
  const btnEarned = document.getElementById('btnToggleEarned');
  const btnLost = document.getElementById('btnToggleLost');
  if (btnEarned) btnEarned.classList.toggle('active', !window._houseChart.getDatasetMeta(0).hidden);
  if (btnLost) btnLost.classList.toggle('active', !window._houseChart.getDatasetMeta(1).hidden);

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
      <button id="openSearch" class="search-btn">Search events</button>
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
      if (["MS", "HS", "ES", "EY", "MS/HS"].includes(r.category)) {
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

    keys.forEach(key => {
      const results = groups[key];

      const panel = document.createElement("div");
      panel.className = "typePanel";     // same classname as peace.html

      const header = document.createElement("div");
      header.className = "typeHeader";
      header.innerHTML = `
        <div class="title">${escapeHtml(key)}</div>
      `;

      header.addEventListener("click", () => {
        // open/close this, close siblings (accordion behavior)
        const open = panel.classList.toggle("open");
        accordion.querySelectorAll(".typePanel").forEach(p => {
          if (p !== panel) p.classList.remove("open");
        });
      });

      const body = document.createElement("div");
      body.className = "typeBody";

      // Build rows like peace.html (badge left, points right)
      results.forEach(r => {
        const row = document.createElement("div");
        row.className = "eventRow";

        const placeMatch = String(r.place || "").match(/\d+/);
        const placeNum = placeMatch ? parseInt(placeMatch[0], 10) : null;

        function ordinal(n) {
          if (!n) return "?";
          if (n % 100 >= 11 && n % 100 <= 13) return `${n}<sup>th</sup>`;
          switch (n % 10) {
            case 1: return `${n}<sup>st</sup>`;
            case 2: return `${n}<sup>nd</sup>`;
            case 3: return `${n}<sup>rd</sup>`;
            default: return `${n}<sup>th</sup>`;
          }
        }

        const badgeText = ordinal(placeNum);

        row.innerHTML = `
          <div class="eventLeft">
            <div class="badge place-${placeNum}">${badgeText}</div>
            <div class="eventTitle">
              <b>${escapeHtml(r.house)}</b>
            </div>
          </div>
          <div class="eventRight">
            <div class="eventPts">${escapeHtml(String(r.points))} pts</div>
          </div>
        `;

        body.appendChild(row);
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
}

const flagsBtn = document.getElementById("flags-btn");
const warning = document.getElementById("mobile-warning");
const dismissBtn = document.getElementById("dismiss-warning");

flagsBtn?.addEventListener("click", () => {
  const isMobile = window.matchMedia("(pointer: coarse)").matches;

  if (isMobile) {
    // Mobile → show popup
    warning.classList.remove("hidden");
  } else {
    // Desktop → go to flags view
    window.location.href = "index2.html";
  }
});

dismissBtn?.addEventListener("click", () => {
  warning.classList.add("hidden");
});

warning?.addEventListener("click", (e) => {
  if (e.target === warning) {
    warning.classList.add("hidden");
  }
});