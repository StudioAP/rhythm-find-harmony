import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    strictPort: false, // ポートが使用中の場合は自動で別のポートを使用
    open: true, // 自動でブラウザを開く
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        // SSR用のエントリーポイントは build:ssr コマンドで別途指定
      }
    }
  },
  ssr: {
    // SSR用の設定
    noExternal: ['react-helmet-async']
  },
  optimizeDeps: {
    include: ['react-helmet-async']
  }
}));
