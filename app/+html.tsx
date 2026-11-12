import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#F6F7FB" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                height: 100dvh;
                min-height: 100dvh;
                background-color: #F6F7FB;
                font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                overscroll-behavior: none;
                -webkit-tap-highlight-color: transparent;
                -webkit-font-smoothing: antialiased;
              }
              #root {
                height: 100dvh;
                display: flex;
                flex-direction: column;
              }
              input, textarea, select {
                font-size: 16px;
              }
              button, a, [role="button"] {
                touch-action: manipulation;
                user-select: none;
                -webkit-user-select: none;
              }
              @media (hover: hover) and (pointer: fine) {
                [role="button"]:hover {
                  cursor: pointer;
                }
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
