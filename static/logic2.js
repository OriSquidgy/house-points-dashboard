async function loadFlags() {

  const res = await fetch("/api/points/flag");
  const data = await res.json();

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
}

loadFlags();