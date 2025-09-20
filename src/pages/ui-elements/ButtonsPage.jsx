import React from 'react';
import Button from '@/components/ui/button.jsx';
export default function ButtonsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Buttons</h2>
      <div className="flex gap-2 flex-wrap">
        <Button>Primary</Button>
        <Button className="bg-transparent border text-foreground">Outline</Button>
        <Button className="bg-muted text-foreground border">Muted</Button>
        <Button className="bg-green-600">Success</Button>
        <Button className="bg-red-600">Danger</Button>
      </div>
    </div>
  );
}
