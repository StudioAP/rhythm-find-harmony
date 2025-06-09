import fs from 'fs';
import path from 'path';

// Supabase接続は一時的に無効化
// const { createClient } = require('@supabase/supabase-js');
// const supabaseUrl = process.env.VITE_SUPABASE_URL;
// const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// サイトのベースURL
const BASE_URL = 'https://piano-rythmics.com'; // 実際のドメインに変更してください

// 基本的なページ
const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/search', priority: '0.9', changefreq: 'daily' },
  { url: '/about', priority: '0.5', changefreq: 'monthly' },
  { url: '/contact', priority: '0.5', changefreq: 'monthly' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
];

// 都道府県と市区町村のマッピング
const locationPages = [
  // 主要都市
  { url: '/search?prefecture=東京都', priority: '0.8', changefreq: 'weekly' },
  { url: '/search?prefecture=神奈川県', priority: '0.8', changefreq: 'weekly' },
  { url: '/search?prefecture=大阪府', priority: '0.8', changefreq: 'weekly' },
  { url: '/search?prefecture=愛知県', priority: '0.8', changefreq: 'weekly' },
  { url: '/search?prefecture=埼玉県', priority: '0.7', changefreq: 'weekly' },
  { url: '/search?prefecture=千葉県', priority: '0.7', changefreq: 'weekly' },
  { url: '/search?prefecture=兵庫県', priority: '0.7', changefreq: 'weekly' },
  { url: '/search?prefecture=北海道', priority: '0.7', changefreq: 'weekly' },
  { url: '/search?prefecture=福岡県', priority: '0.7', changefreq: 'weekly' },
  
  // レッスンタイプ別
  { url: '/search?lessonType=ピアノ', priority: '0.8', changefreq: 'weekly' },
  { url: '/search?lessonType=リトミック', priority: '0.8', changefreq: 'weekly' },
  { url: '/search?lessonType=ヴァイオリン', priority: '0.6', changefreq: 'weekly' },
  { url: '/search?lessonType=声楽', priority: '0.6', changefreq: 'weekly' },
  
  // 組み合わせ
  { url: '/search?prefecture=東京都&lessonType=ピアノ', priority: '0.9', changefreq: 'weekly' },
  { url: '/search?prefecture=東京都&lessonType=リトミック', priority: '0.9', changefreq: 'weekly' },
  { url: '/search?prefecture=神奈川県&lessonType=ピアノ', priority: '0.8', changefreq: 'weekly' },
  { url: '/search?prefecture=大阪府&lessonType=ピアノ', priority: '0.8', changefreq: 'weekly' },
];

async function fetchClassrooms() {
  // 一時的にモックデータを使用
  console.log('モックデータを使用してサンプル教室を生成...');
  
  const mockClassrooms = Array.from({ length: 50 }, (_, i) => ({
    id: `classroom-${i + 1}`,
    updated_at: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString() // 過去30日以内のランダムな日付
  }));
  
  return mockClassrooms;
}

function generateSitemap(pages) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  return sitemap;
}

async function generateSitemapFile() {
  try {
    console.log('サイトマップ生成を開始...');
    
    // 基本ページ
    const pages = staticPages.map(page => ({
      ...page,
      lastmod: new Date().toISOString().split('T')[0]
    }));
    
    // 地域・レッスンタイプページ
    const locationPagesWithDate = locationPages.map(page => ({
      ...page,
      lastmod: new Date().toISOString().split('T')[0]
    }));
    
    pages.push(...locationPagesWithDate);
    
    // 教室詳細ページ
    const classrooms = await fetchClassrooms();
    const classroomPages = classrooms.map(classroom => ({
      url: `/classroom/${classroom.id}`,
      lastmod: classroom.updated_at ? new Date(classroom.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.7'
    }));
    
    pages.push(...classroomPages);
    
    console.log(`合計 ${pages.length} ページのサイトマップを生成中...`);
    
    // サイトマップXMLを生成
    const sitemapXML = generateSitemap(pages);
    
    // publicディレクトリに保存
    const publicDir = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');
    
    console.log(`✅ サイトマップが生成されました: ${sitemapPath}`);
    console.log(`📊 含まれるページ数: ${pages.length}`);
    
    // robots.txtも生成
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml`;
    
    const robotsPath = path.join(publicDir, 'robots.txt');
    fs.writeFileSync(robotsPath, robotsTxt, 'utf8');
    
    console.log(`✅ robots.txtが生成されました: ${robotsPath}`);
    
  } catch (error) {
    console.error('❌ サイトマップ生成でエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
generateSitemapFile(); 