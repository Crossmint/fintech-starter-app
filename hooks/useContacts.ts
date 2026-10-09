import { useCallback, useEffect, useState } from "react";
import type { Contact } from "@/components/quick-send/AddContactModal";

const storageKey = (walletAddress: string) => `fintech:contacts:${walletAddress.toLowerCase()}`;

function readContacts(walletAddress: string): Contact[] {
  try {
    const raw = window.localStorage.getItem(storageKey(walletAddress));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useContacts(walletAddress?: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    setContacts(walletAddress ? readContacts(walletAddress) : []);
  }, [walletAddress]);

  const addContact = useCallback(
    (contact: Contact) => {
      setContacts((prev) => {
        const next = [...prev, contact];
        if (walletAddress) {
          try {
            window.localStorage.setItem(storageKey(walletAddress), JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    },
    [walletAddress]
  );

  return { contacts, addContact };
}
