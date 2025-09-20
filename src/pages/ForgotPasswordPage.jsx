import React from 'react';
import Input from '@/components/ui/input.jsx';
import Button from '@/components/ui/button.jsx';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen grid place-items-center">
      <form className="w-[360px] space-y-3 card p-6">
        <h1 className="text-xl font-bold">Forgot Password</h1>
        <Input placeholder="Email" />
        <Button className="w-full">Kirim Link Reset</Button>
      </form>
    </div>
  );
}
