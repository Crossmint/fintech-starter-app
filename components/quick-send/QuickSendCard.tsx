"use client";

import { isEmail } from "@/lib/utils";

export interface Contact {
  id: string;
  name: string;
  address: string;
}

interface QuickSendCardProps {
  contacts: Contact[];
  onSelectContact?: (contact: Contact) => void;
  onAddContact?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRecipient(value: string): string {
  return isEmail(value) ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
}

const avatarColors = ["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-amber-500"];

export default function QuickSendCard({
  contacts,
  onSelectContact,
  onAddContact,
}: QuickSendCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-none lg:shadow-[0_4px_24px_-4px_rgba(16,24,40,0.08),0_2px_8px_-2px_rgba(16,24,40,0.03)]">
      <div className="flex items-center justify-between border-b border-gray-100/80 px-4 py-4 lg:px-6 lg:py-5">
        <h2 className="text-[15px] font-semibold text-gray-800 lg:text-base">Quick Send</h2>
        <button
          onClick={onAddContact}
          className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
        >
          + Add
        </button>
      </div>

      <div className="p-2">
        {contacts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">No contacts yet</p>
            <button
              onClick={onAddContact}
              className="mt-3 text-sm font-medium text-gray-900 transition-colors hover:text-gray-700"
            >
              Add a contact
            </button>
          </div>
        ) : (
          contacts.map((contact, index) => (
            <button
              key={contact.id}
              onClick={() => onSelectContact?.(contact)}
              className="flex w-full items-center gap-3 rounded-xl p-3 transition-colors hover:bg-emerald-50/50"
            >
              <div
                className={`h-10 w-10 ${avatarColors[index % avatarColors.length]} flex flex-shrink-0 items-center justify-center rounded-full shadow-sm`}
              >
                <span className="text-xs font-semibold text-white">
                  {getInitials(contact.name)}
                </span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-medium text-gray-800">{contact.name}</p>
                <p className="font-mono text-xs text-gray-500">
                  {formatRecipient(contact.address)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
