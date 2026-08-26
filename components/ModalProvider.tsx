"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import Modal from "./Modal";

type View = "login" | "signup";

type ModalContextValue = {
  isOpen: boolean;
  open: (mode?: View) => void;
  close: () => void;
};

const ModalContext = createContext<ModalContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<View>("signup");

  const open = (m: View = "signup") => {
    setMode(m);
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  return (
    <ModalContext.Provider value={{ isOpen, open, close }}>
      {children}
      <Modal isOpen={isOpen} onClose={close} mode={mode} />
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
