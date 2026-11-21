import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import type { orpc } from "@/utils/orpc";

import Header from "../components/header";

import appCss from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

const AppShell = () => {
  const interview = useRouterState({
    select: (state) => state.location.pathname.startsWith("/interview/"),
  });
  return interview ? (
    <div className="grid h-svh grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
      <Outlet />
    </div>
  ) : (
    <div className="grid h-svh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)]">
      <Header />
      <Outlet />
    </div>
  );
};

const RootDocument = () => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <HeadContent />
    </head>
    <body>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AppShell />
        <Toaster richColors />
      </ThemeProvider>
      <Scripts />
    </body>
  </html>
);

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "AgentFluency",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/statics/logo/agf-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        rel: "icon",
        href: "/statics/logo/agf-light.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      { rel: "preconnect", href: "https://api.fontshare.com" },
      {
        rel: "preconnect",
        href: "https://cdn.fontshare.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://api.fontshare.com/v2/css?f%5B%5D=chillax@1&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
});
