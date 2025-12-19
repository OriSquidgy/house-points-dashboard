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