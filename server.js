import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();
  
  // 本番環境では、Viteのビルド済みアセットを提供
  // 開発環境では、Viteのミドルウェアを使用
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(vite.ssrLoadModule);
  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // 1. index.htmlを読み込み
      let template = fs.readFileSync(
        path.resolve(__dirname, 'index.html'),
        'utf-8'
      );

      // 2. Viteのトランスフォームを適用
      template = await vite.transformIndexHtml(url, template);

      // 3. サーバーサイドのエントリーを読み込み
      const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');

      // 4. アプリをHTMLにレンダリング
      const { html: appHtml, helmetContext } = render(url);

      // 5. Helmet情報を取得
      const { helmet } = helmetContext;

      // 6. レンダリングされたアプリHTMLをテンプレートに注入
      let renderedHtml = template
        .replace('<!--ssr-outlet-->', appHtml)
        .replace('<title></title>', helmet ? helmet.title.toString() : '<title>リズムファインドハーモニー</title>')
        .replace('<!--helmet-meta-->', helmet ? helmet.meta.toString() + helmet.link.toString() : '');

      // 7. レンダリングされたHTMLを返す
      res.status(200).set({ 'Content-Type': 'text/html' }).end(renderedHtml);
    } catch (e) {
      // エラーが発生した場合は、Viteがエラーを修正して完全なスタックトレースを提供
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(3000, () => {
    console.log('SSRサーバーが http://localhost:3000 で起動しました');
  });
}

createServer(); 