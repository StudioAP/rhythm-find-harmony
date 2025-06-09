declare module 'react-helmet-async' {
  export interface HelmetContext {
    helmet?: {
      title: { toString: () => string };
      meta: { toString: () => string };
      link: { toString: () => string };
    };
  }
} 