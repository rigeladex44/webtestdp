import React, { useState } from 'react';
export default function ChatPage() {
  const [msgs, setMsgs] = useState([{ me:false, text:'Halo!'}]);
  const [txt, setTxt] = useState('');
  const send = () => { if(!txt.trim())return; setMsgs([...msgs, {me:true, text:txt}]); setTxt(''); };
  return (
    <div className="card p-4 h-[70vh] flex flex-col">
      <div className="flex-1 overflow-auto space-y-2">
        {msgs.map((m,i)=>(
          <div key={i} className={m.me?'text-right':''}>
            <span className={['inline-block px-3 py-2 rounded-lg', m.me?'bg-primary':'bg-muted'].join(' ')}>{m.text}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input className="flex-1 h-10 rounded-md border bg-background px-3 text-sm" value={txt} onChange={e=>setTxt(e.target.value)} />
        <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground" onClick={send}>Kirim</button>
      </div>
    </div>
  );
}
