import React from 'react';
import Input from '@/components/ui/input.jsx';
import Button from '@/components/ui/button.jsx';

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid place-items-center">
      <form className="w-[360px] space-y-3 card p-6">
        <h1 className="text-xl font-bold">Register</h1>
        <Input placeholder="Nama" />
        <Input placeholder="Email" />
        <Input placeholder="Password" type="password" />
        <Button className="w-full">Daftar</Button>
      </form>
    </div>
  );
}
