import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "../common/Dialog";
import { isEmail, isValidAddress } from "@/lib/utils";

export interface Contact {
  id: string;
  name: string;
  address: string;
}

export function formatRecipient(value: string): string {
  return isEmail(value) ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
}

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (contact: Contact) => void;
}

export function AddContactModal({ open, onClose, onAdd }: AddContactModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const isRecipientValid = isValidAddress(address) || isEmail(address);
  const canSubmit = name.trim().length > 0 && isRecipientValid;

  const handleClose = () => {
    setName("");
    setAddress("");
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({ id: crypto.randomUUID(), name: name.trim(), address: address.trim() });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="flex flex-col rounded-3xl bg-white sm:max-w-md">
        <DialogClose />
        <DialogTitle className="text-center">Add Contact</DialogTitle>
        <div className="mt-2 flex w-full flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="focus:border-primary h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Email or wallet address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x... or email"
              className="focus:border-primary h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            {address && !isRecipientValid && (
              <div className="mt-1.5 text-sm text-red-600">
                Enter a valid email or wallet address
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-primary hover:bg-primary-hover mt-4 w-full rounded-full px-6 py-3 text-sm font-medium text-white transition disabled:bg-gray-100 disabled:text-gray-400"
          >
            Add Contact
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
