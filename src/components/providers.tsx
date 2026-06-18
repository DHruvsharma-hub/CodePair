"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/context/socket-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocketProvider>
        {children}
      </SocketProvider>
    </SessionProvider>
  );
}
