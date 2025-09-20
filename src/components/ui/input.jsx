import React from 'react';
const Input = React.forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={[
        'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background',
        'placeholder:text-muted-foreground focus:ring-2 focus:ring-ring',
        className,
      ].join(' ')}
      {...props}
    />
  );
});
export default Input;
