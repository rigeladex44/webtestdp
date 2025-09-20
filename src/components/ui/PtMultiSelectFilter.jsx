// src/components/ui/PtMultiSelectFilter.jsx
import React, { useState } from 'react';
import { PT_LIST } from '@/lib/constants.js';

// Komponen ini akan menjadi dropdown dengan checkbox
export default function PtMultiSelectFilter({ selectedPts, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectAll = (checked) => {
    if (checked) {
      onChange(PT_LIST.map(pt => pt.fullName));
    } else {
      onChange([]);
    }
  };

  const handlePtChange = (ptFullName, checked) => {
    if (checked) {
      onChange([...selectedPts, ptFullName]);
    } else {
      onChange(selectedPts.filter(name => name !== ptFullName));
    }
  };

  const isAllSelected = selectedPts.length === PT_LIST.length;
  const displayLabel = selectedPts.length === 0 
    ? "Pilih PT..." 
    : selectedPts.length === PT_LIST.length
    ? "Semua PT"
    : `${selectedPts.length} PT dipilih`;

  return (
    <div className="relative">
      <div>
        <label className="text-sm block">Filter PT</label>
        <button
          type="button"
          className="mt-1 h-10 w-full min-w-[150px] rounded-md border bg-background px-3 text-sm text-left flex justify-between items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{displayLabel}</span>
          <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full max-w-xs rounded-md border bg-background shadow-lg z-20">
          <div className="p-2">
            <label className="flex w-full items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span className="font-semibold">Pilih Semua</span>
            </label>
            <div className="my-1 border-t"></div>
            {PT_LIST.map(pt => (
              <label key={pt.tag} className="flex w-full items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded"
                  value={pt.fullName}
                  checked={selectedPts.includes(pt.fullName)}
                  onChange={(e) => handlePtChange(pt.fullName, e.target.checked)}
                />
                <span>{pt.tag}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}