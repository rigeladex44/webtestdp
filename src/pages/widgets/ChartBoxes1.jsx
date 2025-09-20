import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip } from 'chart.js';
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

const mini = (color) => ({
  labels: Array.from({length:12}).map((_,i)=>i+1),
  datasets: [{ data: Array.from({length:12}).map(()=>Math.random()*100+20), borderColor: color, borderWidth: 2, pointRadius: 0, tension: .4 }],
});

export default function ChartBoxes1() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {['#60a5fa','#34d399','#f472b6','#f59e0b'].map((c,i)=>(
        <div key={i} className="card p-4">
          <div className="text-sm text-muted-foreground">Metric {i+1}</div>
          <div className="text-2xl font-semibold mb-2">{Math.round(Math.random()*1000)}</div>
          <Line height={60} data={mini(c)} options={{ responsive:true, plugins:{legend:{display:false}}, scales:{x:{display:false},y:{display:false}} }} />
        </div>
      ))}
    </div>
  );
}
