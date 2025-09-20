// Simple toast API that can be swapped for a more advanced one later.
export function useToast() {
  return {
    toast: ({ title = 'Info', description = '' } = {}) => {
      // if you later import { toast } from 'sonner', you can forward here.
      if (typeof window !== 'undefined' && window?.alert) {
        alert([title, description].filter(Boolean).join('\n'));
      } else {
        console.log('TOAST:', title, description);
      }
    },
  };
}
