import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

export function render(url: string) {
  const queryClient = new QueryClient();
  const helmetContext = {};

  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <StaticRouter location={url}>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider context={helmetContext}>
            <App />
          </HelmetProvider>
        </QueryClientProvider>
      </StaticRouter>
    </React.StrictMode>
  );

  return { html, helmetContext };
} 