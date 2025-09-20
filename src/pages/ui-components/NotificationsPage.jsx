import React from 'react';
import Button from '@/components/ui/button.jsx';
import { toast } from 'sonner';

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Notifications</h2>
      <div className="flex gap-2 flex-wrap">
        <Button onClick={()=>toast('Informasi',{description:'Contoh notifikasi info'})}>Info</Button>
        <Button className="bg-green-600" onClick={()=>toast.success('Sukses!',{description:'Data tersimpan'})}>Success</Button>
        <Button className="bg-red-600" onClick={()=>toast.error('Gagal!',{description:'Terjadi kesalahan'})}>Error</Button>
      </div>
    </div>
  );
}
