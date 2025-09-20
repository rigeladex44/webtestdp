import React from 'react';
export default function Button({ className = '', ...props }) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center h-10 px-4 rounded-md',
        'border border-border/60 bg-primary text-primary-foreground',
        'shadow-sm hover:bg-primary/90',
        'text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2 ring-offset-background',
        'disabled:opacity-50 disabled:pointer-events-none',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
