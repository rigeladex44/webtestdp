import React from 'react';
import Chart from 'react-apexcharts';

export default function ApexChartsPage() {
  const series = [{ name: 'Income', data: Array.from({length: 12}).map(()=>Math.round(Math.random()*100+20)) }];
  const options = {
    chart: { toolbar: { show: false }, background: 'transparent' },
    xaxis: { categories: Array.from({length:12}).map((_,i)=>`M${i+1}`) },
    theme: { mode: 'dark' },
  };
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Apex Charts</h2>
      <div className="card p-4">
        <Chart type="area" height={280} series={series} options={options} />
      </div>
    </div>
  );
}
