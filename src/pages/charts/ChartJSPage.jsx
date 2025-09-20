import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const labels = Array.from({length:12}).map((_,i)=>`M${i+1}`);
const dataset = () => labels.map(() => Math.round(Math.random()*100+20));

export default function ChartJSPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">ChartJS</h2>
      <div className="card p-4">
        <Line data={{ labels, datasets:[{label:'Revenue', data:dataset()}] }} />
      </div>
      <div className="card p-4">
        <Bar data={{ labels, datasets:[{label:'Expenses', data:dataset()}] }} />
      </div>
    </div>
  );
}
