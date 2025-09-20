import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);
const miniData = {
  labels: Array.from({length:30}).map((_,i)=>i+1),
  datasets: [{ data: Array.from({length:30}).map(()=>Math.random()*100), borderColor:'#60a5fa', borderWidth:2, pointRadius:0, tension:.4 }]
};
export default function SparklinePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Sparkline</h2>
      <div className="card p-4"><Line height={80} data={miniData} options={{ plugins:{legend:{display:false}}, scales:{x:{display:false},y:{display:false}} }} /></div>
    </div>
  );
}
