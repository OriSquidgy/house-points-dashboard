window.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById('housePointsChart')?.getContext('2d');

  // Fetch data from data.json
  let houses = [], totalPoints = [], lostPoints = [], links = {};
  try {
    const d = DATA;
    houses      = d.houses || [];
    totalPoints = (d.totalPoints || []).map(n => Number(n) || 0);
    lostPoints  = (d.lostPoints  || []).map(n => Number(n) || 0);
    links       = d.links || {};
  } catch (err) {
    console.error("Error fetching house points:", err);
    return;
  }

  const earnedPoints = totalPoints.map((t, i) => t - lostPoints[i]);

  //  Sort houses by earned points (descending)
  const palette = {Peace: "#1E3A8A", Joy: "#DC2626", Faith: "#FACC15", Hope: "#16A34A"};
  const sortedData = houses.map((h, i) => ({
    house: h,
    earned: earnedPoints[i],
    lost:   lostPoints[i],
    total:  totalPoints[i],
    link:   links[h],
    color:  palette[h] || "#888888"
  })).sort((a,b) => b.earned - a.earned);

  // Extract sorted arrays
  const sortedHouses = sortedData.map(d => d.house);
  const sortedEarned = sortedData.map(d => d.earned);
  const sortedLost = sortedData.map(d => d.lost);
  const sortedColors = sortedData.map(d => d.color);
  const sortedLinks = Object.fromEntries(sortedData.map(d => [d.house, d.link]));

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedHouses,
      datasets: [
        {
          label: 'House Points (after losses)',
          data: sortedEarned,
          backgroundColor: sortedColors,
          borderRadius: 8,
          datalabels: {
            color: '#ffffff',
            anchor: 'end',
            align: 'left',   // inside bar
            offset: -10,     // small padding so it doesn’t touch black bar
            clamp: true,
            font: ctx => {
              const barHeight = ctx.chart.scales.y.getPixelForTick(1) - ctx.chart.scales.y.getPixelForTick(0);
              return {
                weight: '900',
                size: Math.floor(barHeight * 0.6)
              };
            },
            formatter: (value) => value
          }
        },
        {
          label: 'Lost Points',
          data: sortedLost,
          backgroundColor: "#000000",
          borderRadius: 8,
          datalabels: { display: false }
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          position: 'bottom',
          labels: {
            font: { size: 16, weight: 'bold' },
            color: '#333'
          }
        },
        title: { display: false }
      },
      scales: {
        x: { stacked: true, beginAtZero: true },
        y: { stacked: true }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const house = sortedHouses[index];
          window.location.href = sortedLinks[house];
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  try {
    const eventsData = window.EVENTS;
    if (!eventsData) return;

    const container = document.getElementById("eventResults");
    if (!container) return;

    // Parse dd/mm/yyyy → Date
    const parseDMY = (str) => {
      const [d, m, y] = str.split("/").map(Number);
      return new Date(y, m - 1, d);
    };

    // Turn arrays into row objects + store parsed date
    let rows = (eventsData.dates || []).map((date, i) => ({
      date,
      dateObj: parseDMY(eventsData.dates?.[i] || "01/01/1970"), // ⭐ store parsed date
      eventName: eventsData.events?.[i],
      category: eventsData.category?.[i],
      gender: eventsData.gender?.[i],
      house: eventsData.houses?.[i],
      points: eventsData.points?.[i],
      place: eventsData.places?.[i]
    })).filter(r =>
      r.eventName && r.category && r.gender && r.house && r.points != null && r.place
    );

    if (!rows.length) return;

    // ⭐ Sort rows by dateObj (most recent → oldest)
    rows.sort((a, b) => b.dateObj - a.dateObj);

    // Group rows into events
    const groups = {};
    rows.forEach(r => {
      const key = `Category ${r.category} ${r.gender} ${r.eventName}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    const placeOrder = { "1st": 1, "2nd": 2, "3rd": 3 };

    // Clear UI and add heading
    container.innerHTML = "";
    const heading = document.createElement("h2");
    heading.textContent = "Event Results (most recent first)";
    container.appendChild(heading);

    // ⭐ Sort groups by the FIRST (latest) dateObj inside them
    const sortedGroupEntries = Object.entries(groups).sort(([, a], [, b]) => {
      return b[0].dateObj - a[0].dateObj;  // compare first rows
    });

    // Build dropdowns
    sortedGroupEntries.forEach(([key, groupRows]) => {
      const results = groupRows
        .filter(r => placeOrder[r.place] !== undefined)
        .sort((a, b) => placeOrder[a.place] - placeOrder[b.place]);

      if (!results.length) return;

      const details = document.createElement("details");
      details.classList.add("event-group");

      const summary = document.createElement("summary");
      summary.textContent = key;
      details.appendChild(summary);

      // Ordered 1, 2, 3 list
      const list = document.createElement("ol");
      results.forEach(r => {
        const li = document.createElement("li");
        const placeNumber = parseInt(r.place);
        li.innerHTML = `${placeNumber}. <span class="house-${r.house.toLowerCase()}">${r.house}</span> (${r.points} points)`;
        list.appendChild(li);
      });

      details.appendChild(list);
      container.appendChild(details);
    });

  } catch (err) {
    console.error("Error building event list:", err);
  }
});

// Ghost label (total points)
/* const ghostLbl = document.createElement('div');
ghostLbl.className = `ghost-label ${d.color}`;
ghostLbl.textContent = `Total: ${d.total}`;
ghostLbl.style.position = 'absolute';
ghostLbl.style.bottom = (Math.min(Math.max(yTotal, minY), maxY) + flagH/2 + 4) + 'px';
ghostLbl.style.left = '50%';
ghostLbl.style.transform = 'translateX(-50%)';
col.appendChild(ghostLbl);
*/