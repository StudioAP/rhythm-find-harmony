import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

const SEOHead = ({
  title = "ピアノ教室・リトミック教室検索.org",
  description = "全国のピアノ教室・リトミック教室を検索できるサイトです。お近くの教室を見つけて、音楽の素晴らしさを体験してください。",
  keywords = "ピアノ教室,リトミック教室,音楽教室,習い事,子供,大人,レッスン",
  ogTitle,
  ogDescription,
  ogImage,
  canonicalUrl
}: SEOHeadProps) => {
  const baseUrl = "https://piano-ritomikku-kyoshitsu-kensaku.org";
  const fullTitle = title === "ピアノ教室・リトミック教室検索.org" ? title : `${title} | ピアノ教室・リトミック教室検索.org`;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:site_name" content="ピアノ教室・リトミック教室検索.org" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || fullTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={`${baseUrl}${canonicalUrl}`} />}
      
      {/* Viewport and mobile optimization */}
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      
      {/* Additional meta tags for better SEO */}
      <meta name="robots" content="index,follow" />
      <meta name="language" content="ja" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
};

export default SEOHead; 