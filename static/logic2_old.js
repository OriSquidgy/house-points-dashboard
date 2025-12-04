window.addEventListener("DOMContentLoaded", () => {
  const palette = { Joy: 'DC2626', Peace: '1E3A8A', Faith: 'FACC15', Hope: '16A34A' };

  const data = (DATA.houses).map((h, i) => {
    const total = Number(DATA.totalPoints[i]);
    const lost = Number(DATA.lostPoints[i]);
    return {
      house: h,
      points: total - lost,
      total: total,
      color: palette[h],
      link: DATA.links[h]
    };
  });

  data.sort((a, b) => b.points - a.points);

  const poleH = 440;
  const ground = 130;
  const flagH = 104;
  const topSafe = 40;
  const maxPts = Math.max(...data.map(d=>d.total));

  const row = document.getElementById('row');

  data.forEach((d, idx) => {
    const col = document.createElement('div');
    col.className = 'col';
    row.appendChild(col);

    const pole = document.createElement('div'); 
    pole.className = 'pole';
    const fin  = document.createElement('div'); 
    fin.className = 'finial';
    col.appendChild(pole); 
    col.appendChild(fin);

    const minY = ground + flagH/2 + 8;
    const maxY = ground + poleH - flagH/2 - 8 - topSafe;

    const yEarned = ground + (d.points / maxPts) * poleH;
    const yTotal  = ground + (d.total  / maxPts) * poleH;

    // Real flag
    const flag = document.createElement('div');
    flag.className = 'flag';
    flag.style.backgroundColor = '#' + d.color;
    flag.style.bottom = (Math.min(Math.max(yEarned, minY), maxY) - flagH/2) + 'px';
    flag.style.animationDelay = (idx * 150) + 'ms';
    flag.style.cursor = "pointer";
    flag.addEventListener("click", () => {
      window.location.href = d.link;
    });
    col.appendChild(flag);


    // Ground labels (earned + lost)
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
})

// --- EVENT RESULTS SECTION (same as bar view) ---
window.addEventListener("DOMContentLoaded", () => {
  try {
    const ev = window.EVENTS;
    if (!ev) return;

    const container = document.getElementById("eventResults");
    if (!container) return;

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
      const key = `Category ${r.category} ${r.gender} ${r.eventName}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    container.innerHTML = `<h2>Event Results (most recent first)</h2>`;

    Object.keys(groups).forEach(key => {
      const results = groups[key];

      const details = document.createElement("details");
      details.className = "event-group";

      const summary = document.createElement("summary");
      summary.textContent = key;
      details.appendChild(summary);

      const list = document.createElement("ol");
      list.style.listStyle = "none";

      results.forEach(r => {
        const li = document.createElement("li");
        const num = parseInt(r.place);
        li.innerHTML = `${num}. <span class="house-${r.house.toLowerCase()}">${r.house}</span> (${r.points} points)`;
        list.appendChild(li);
      });

      details.appendChild(list);
      container.appendChild(details);
    });
  } catch (e) {
    console.error("Error building event results:", e);
  }
});
