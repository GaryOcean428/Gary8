'use client';

import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider } from "./ThemeProvider";
import { ConfigProvider } from "./ConfigProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <ConfigProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </ConfigProvider>
    </NextUIProvider>
  );
}
