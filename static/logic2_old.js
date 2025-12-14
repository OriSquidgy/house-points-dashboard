// static/logic2.js — place poles explicitly, position flags relative to poles
window.addEventListener("DOMContentLoaded", () => {
  const palette = { Joy: 'DC2626', Peace: '1E3A8A', Faith: 'FACC15', Hope: '16A34A' };

  if (!window.DATA || !Array.isArray(DATA.houses)) {
    console.error('DATA.houses not found or invalid. Make sure data.js is loaded before this script.');
    return;
  }

  const data = (DATA.houses).map((h, i) => {
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

  data.sort((a,b) => b.points - a.points);

  // layout constants
  const poleH   = 440;
  const ground  = 130;
  const flagH   = 104;
  const topSafe = 40;
  const maxPts  = Math.max(1, ...data.map(d => d.total));

  const row = document.getElementById('row');
  row.innerHTML = '';

  // Choose a poleLeft (px) to move poles to the right inside each column.
  // Increase this value to move all poles (and therefore flags) more to the right.
  const poleWidth = 6;      // expected pole width in px

  data.forEach((d, idx) => {
    const col = document.createElement('div');
    col.className = 'col';
    col.style.position = 'relative'; // ensure positioning context
    row.appendChild(col);

    // create pole as an absolutely-positioned element inside col
    const pole = document.createElement('div');
    pole.className = 'pole';
    // set inline styles to guarantee placement
    pole.style.position = 'absolute';
    pole.style.left = '50%';
    pole.style.transform = "translateX(-50%)";
    pole.style.top = '40px';
    pole.style.width = poleWidth + 'px';
    pole.style.height = poleH + 'px';
    pole.style.background = 'linear-gradient(180deg,#444 0%, #1f2937 100%)';
    pole.style.borderRadius = '3px';
    pole.style.boxShadow = '0 6px 14px rgba(2,6,23,0.06), inset 0 1px 0 rgba(255,255,255,0.02)';
    // keep pole behind flags visually
    pole.style.zIndex = '1';
    col.appendChild(pole);

    // finial on top of the pole
    const fin = document.createElement('div');
    fin.className = 'finial';
    fin.style.position = 'absolute';
    fin.style.width = '18px';
    fin.style.height = '18px';
    fin.style.left = '50%'; // center fin over pole
    fin.style.top = (40 - 9) + 'px';
    fin.style.transform = 'translateX(-50%)';
    fin.style.background = 'linear-gradient(180deg,#ffd54d,#c68600)';
    fin.style.borderRadius = '50%';
    fin.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
    fin.style.zIndex = '4';
    col.appendChild(fin);

    // Compute vertical placement for flag
    const minY = ground + flagH / 2 + 8;
    const maxY = ground + poleH - flagH / 2 - 8 - topSafe;
    const yEarned = ground + (d.points / maxPts) * poleH;
    const clampedYEarned = Math.min(Math.max(yEarned, minY), maxY);

    // Flag (button) — positioned absolutely relative to col
    const flag = document.createElement('button');
    flag.className = 'flag';
    flag.type = 'button';
    flag.setAttribute('aria-label', `${d.house} — ${d.points} points`);
    // position vertically based on points
    flag.style.position = 'absolute';
    flag.style.bottom = (clampedYEarned - flagH / 2 - 150) + 'px';
    // set width/height and styling inline to avoid external overrides
    flag.style.width = '160px';
    flag.style.height = '100px';
    flag.style.borderRadius = '12px';
    flag.style.paddingLeft = '0px';
    flag.style.display = 'inline-flex';
    flag.style.alignItems = 'center';
    flag.style.justifyContent = 'center';
    flag.style.textAlign = 'center';
    flag.style.fontWeight = '700';
    flag.style.color = '#fff';
    flag.style.boxShadow = '0 18px 30px rgba(2,6,23,0.08)';
    flag.style.zIndex = '3';
    flag.style.cursor = 'pointer';
    flag.style.border = 'none';
    flag.style.outline = 'none';
    // background color + subtle overlay
    flag.style.background = `linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.03)), #${d.color}`;

    // place left edge of flag exactly at the pole's right edge:
    const offsetFromCenter = poleWidth / 2;
    flag.style.left = `calc(50% + ${offsetFromCenter}px)`;

    // badge inside flag
    const badge = document.createElement('div');
    badge.className = 'flag-badge';
    badge.textContent = d.points;
    badge.style.marginLeft = '0px';
    badge.style.background = 'rgba(255,255,255,0.14)';
    badge.style.padding = '6px 10px';
    badge.style.borderRadius = '999px';
    badge.style.fontWeight = '800';
    badge.style.color = 'rgba(255,255,255,0.98)';
    badge.style.boxShadow = '0 6px 12px rgba(2,6,23,0.08)';
    flag.appendChild(badge);

    // click behaviour
    flag.addEventListener('click', () => {
      if (d.link && d.link !== '#') window.location.href = d.link;
    });

    col.appendChild(flag);

    // entrance animation (inline)
    flag.style.transform = 'translateY(26px) rotate(6deg) scale(0.98)';
    flag.style.opacity = '0';
    flag.style.transition = 'transform 700ms cubic-bezier(.22,.9,.32,1), opacity 600ms ease';
    setTimeout(() => {
      flag.style.transform = 'translateY(0) rotate(0) scale(1)';
      flag.style.opacity = '1';
    }, 120 + idx * 120);

    // subtle idle motion implemented with JS (doesn't rely on CSS keyframes)
    setTimeout(() => {
      let state = 0;
      setInterval(() => {
        state = 1 - state;
        if (state === 0) {
          flag.style.transform = 'translateY(0) rotate(0) scale(1)';
        } else {
          flag.style.transform = 'translateY(-3px) rotate(-0.9deg) scale(1)';
        }
      }, 2800 + idx * 100);
    }, 900 + idx * 60);

    // Ground labels
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
