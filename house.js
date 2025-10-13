const ctx = document.getElementById('housePointsChart').getContext('2d');

// Example Data (replace with real values)
const houses = ["Peace", "Joy", "Faith", "Hope"];
const totalPoints = [1000, 700, 625, 800];  // total points
const lostPoints = [20, 30, 10, 15];       // how much they lost
const earnedPoints = totalPoints.map((t, i) => t - lostPoints[i]); // actual points after losses
//  Sort houses by earned points (descending)
const sortedData = houses.map((h, i) => ({
  house: h,
  earned: earnedPoints,
  lost: lostPoints,
  total: totalPoints,
  color: ["#1E3A8A", "#DC2626", "#FACC15", "#16A34A"][i]
})).sort((a, b) => b.earned - a.earned);

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
          font: { size: 16, weight: 'bold'},
          color: '#333'
        }
      },
      title: { display: false }
    },
    scales: {
      x: { stacked: true, 
        beginAtZero: true, 
        barPercentage: 0.6 
      },
      y: { stacked: true }
    },
  },
  plugins: [ChartDataLabels]
});
// Ghost label (total points)
const ghostLbl = document.createElement('div');
ghostLbl.className = `ghost-label ${d.color}`;
ghostLbl.textContent = `Total: ${d.total}`;
ghostLbl.style.position = 'absolute';
ghostLbl.style.bottom = (Math.min(Math.max(yTotal, minY), maxY) + flagH/2 + 4) + 'px';
ghostLbl.style.left = '50%';
ghostLbl.style.transform = 'translateX(-50%)';
col.appendChild(ghostLbl);
