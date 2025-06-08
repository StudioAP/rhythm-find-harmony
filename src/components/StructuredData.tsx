import { Helmet } from "react-helmet-async";
import { ClassroomWithSubscriptions } from "@/types/classroom";
import { translateLessonType } from "@/constants/classroomData";

interface StructuredDataProps {
  type: 'WebSite' | 'Organization' | 'LocalBusiness';
  classroom?: ClassroomWithSubscriptions;
}

interface SchemaOffer {
  "@type": string;
  description?: string;
  price?: number;
  priceRange?: string;
  priceCurrency?: string;
}

interface SchemaBase {
  "@context": string;
  "@type": string;
  name: string;
  description?: string;
  url?: string;
  [key: string]: unknown;
}

const StructuredData = ({ type, classroom }: StructuredDataProps) => {
  const baseUrl = "https://piano-ritomikku-kyoshitsu-kensaku.org";

  const generateWebSiteSchema = () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ピアノ教室・リトミック教室検索.org",
    "url": baseUrl,
    "description": "全国のピアノ教室・リトミック教室を検索できるサイトです。お近くの教室を見つけて、音楽の素晴らしさを体験してください。",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?keyword={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ピアノ教室・リトミック教室検索.org",
      "url": baseUrl
    }
  });

  const generateOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ピアノ教室・リトミック教室検索.org",
    "url": baseUrl,
    "description": "全国のピアノ教室・リトミック教室を検索・掲載できるプラットフォーム",
    "logo": `${baseUrl}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "ja"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Japan"
    },
    "serviceType": "教室検索・掲載サービス"
  });

  const generateLocalBusinessSchema = (): SchemaBase | null => {
    if (!classroom) return null;

    const lessonTypes = classroom.lesson_types?.map(type => translateLessonType(type)) || [];
    
    const schema: SchemaBase = {
      "@context": "https://schema.org",
      "@type": "MusicSchool",
      "name": classroom.name,
      "description": classroom.description || `${classroom.name}は${lessonTypes.join("・")}を提供する音楽教室です。`,
      "url": `${baseUrl}/classrooms/${classroom.id}`,
    };

    // 住所情報
    if (classroom.area) {
      schema.address = {
        "@type": "PostalAddress",
        "addressLocality": classroom.area,
        "addressCountry": "JP"
      };
    }

    // 連絡先情報
    if (classroom.phone || classroom.email) {
      schema.contactPoint = {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": "ja",
        ...(classroom.phone && { telephone: classroom.phone }),
        ...(classroom.email && { email: classroom.email })
      };
    }

    // ウェブサイト
    if (classroom.website_url) {
      schema.url = classroom.website_url;
    }

    // 画像
    if (classroom.image_urls?.[0] || classroom.thumbnail_url) {
      schema.image = classroom.image_urls?.[0] || classroom.thumbnail_url;
    }

    // 営業時間（開講曜日がある場合）
    if (classroom.available_days && classroom.available_days.length > 0) {
      schema.openingHours = classroom.available_days.map(day => {
        const dayMap: Record<string, string> = {
          monday: "Mo",
          tuesday: "Tu", 
          wednesday: "We",
          thursday: "Th",
          friday: "Fr",
          saturday: "Sa",
          sunday: "Su"
        };
        return dayMap[day] || day;
      });
    }

    // 提供サービス
    if (lessonTypes.length > 0) {
      schema.hasOfferCatalog = {
        "@type": "OfferCatalog",
        "name": "レッスンプログラム",
        "itemListElement": lessonTypes.map((lessonType) => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": `${lessonType}レッスン`,
            "description": `${classroom.name}の${lessonType}レッスンプログラム`
          }
        }))
      };
    }

    // 料金情報
    if (classroom.price_range || classroom.monthly_fee_min) {
      const offers: SchemaOffer = {
        "@type": "Offer",
        "description": "レッスン料金"
      };

      if (classroom.monthly_fee_min && classroom.monthly_fee_max) {
        offers.priceRange = `${classroom.monthly_fee_min}-${classroom.monthly_fee_max}`;
        offers.priceCurrency = "JPY";
      } else if (classroom.monthly_fee_min) {
        offers.price = classroom.monthly_fee_min;
        offers.priceCurrency = "JPY";
      }

      if (classroom.price_range) {
        offers.description = classroom.price_range;
      }

      schema.makesOffer = offers;
    }

    // 対象年齢
    if (classroom.age_range) {
      schema.audience = {
        "@type": "PeopleAudience",
        "suggestedMinAge": 0,
        "suggestedMaxAge": 100,
        "description": classroom.age_range
      };
    }

    return schema;
  };

  let schema;
  switch (type) {
    case 'WebSite':
      schema = generateWebSiteSchema();
      break;
    case 'Organization':
      schema = generateOrganizationSchema();
      break;
    case 'LocalBusiness':
      schema = generateLocalBusinessSchema();
      break;
    default:
      return null;
  }

  if (!schema) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default StructuredData; 