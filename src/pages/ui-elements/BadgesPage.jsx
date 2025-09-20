import React from 'react';
const Badge = ({ children, color='bg-blue-600' }) => (
  <span className={['inline-block text-xs px-2 py-1 rounded-full text-white', color].join(' ')}>{children}</span>
);
export default function BadgesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Badges</h2>
      <div className="space-x-2">
        <Badge>Default</Badge>
        <Badge color="bg-green-600">Success</Badge>
        <Badge color="bg-yellow-600">Warning</Badge>
        <Badge color="bg-red-600">Danger</Badge>
      </div>
    </div>
  );
}
