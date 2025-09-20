import React from 'react';
export default function MailPage() {
  return (
    <div className="grid grid-cols-[300px_1fr] gap-4">
      <div className="card p-4">
        <div className="font-semibold mb-2">Folders</div>
        <ul className="space-y-1 text-sm">
          <li>Inbox</li><li>Sent</li><li>Drafts</li><li>Spam</li>
        </ul>
      </div>
      <div className="card p-4">
        <div className="font-semibold mb-2">Message</div>
        <div className="text-sm text-muted-foreground">Contoh layout mailbox.</div>
      </div>
    </div>
  );
}
