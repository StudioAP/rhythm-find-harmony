import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';
import sirv from 'sirv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createProductionServer() {
  const app = express();

  // Compression middleware
  app.use(compression());

  // 静的ファイルの配信
  app.use('/', sirv('./dist/client', {
    extensions: []
  }));

  // サーバーサイドレンダリング
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // 1. index.htmlを読み込み
      const template = fs.readFileSync(
        path.resolve(__dirname, 'dist/client/index.html'),
        'utf-8'
      );

      // 2. サーバーサイドのエントリーを読み込み
      const { render } = await import('./dist/server/entry-server.js');

      // 3. アプリをHTMLにレンダリング
      const { html: appHtml, helmetContext } = render(url);

      // 4. Helmet情報を取得
      const { helmet } = helmetContext;

      // 5. レンダリングされたアプリHTMLをテンプレートに注入
      let renderedHtml = template
        .replace('<!--ssr-outlet-->', appHtml)
        .replace('<title></title>', helmet ? helmet.title.toString() : '<title>リズムファインドハーモニー</title>')
        .replace('<!--helmet-meta-->', helmet ? helmet.meta.toString() + helmet.link.toString() : '');

      // 6. レンダリングされたHTMLを返す
      res.status(200).set({ 'Content-Type': 'text/html' }).end(renderedHtml);
    } catch (e) {
      console.error('SSR Error:', e);
      res.status(500).end('Internal Server Error');
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`本番SSRサーバーが http://localhost:${port} で起動しました`);
  });
}

createProductionServer(); 