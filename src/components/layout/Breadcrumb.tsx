import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const PageBreadcrumb = ({ items, className }: PageBreadcrumbProps) => {
  const location = useLocation();
  
  // デフォルトパンくずを生成
  const generateDefaultBreadcrumb = (): BreadcrumbItem[] => {
    const path = location.pathname;
    
    if (path === "/") {
      return [{ label: "ホーム" }];
    }
    
    if (path.startsWith("/search")) {
      return [
        { label: "ホーム", href: "/" },
        { label: "教室を探す" }
      ];
    }
    
    if (path.startsWith("/classrooms/")) {
      return [
        { label: "ホーム", href: "/" },
        { label: "教室を探す", href: "/search" },
        { label: "教室詳細" }
      ];
    }
    
    if (path.startsWith("/classroom/register")) {
      return [
        { label: "ホーム", href: "/" },
        { label: "教室登録" }
      ];
    }
    
    if (path.startsWith("/dashboard")) {
      return [
        { label: "ホーム", href: "/" },
        { label: "管理画面" }
      ];
    }
    
    if (path.startsWith("/about")) {
      return [
        { label: "ホーム", href: "/" },
        { label: "About" }
      ];
    }
    
    if (path.startsWith("/contact")) {
      return [
        { label: "ホーム", href: "/" },
        { label: "お問い合わせ" }
      ];
    }
    
    if (path.startsWith("/terms")) {
      return [
        { label: "ホーム", href: "/" },
        { label: "利用規約" }
      ];
    }
    
    if (path.startsWith("/privacy")) {
      return [
        { label: "ホーム", href: "/" },
        { label: "プライバシーポリシー" }
      ];
    }
    
    return [
      { label: "ホーム", href: "/" },
      { label: "ページ" }
    ];
  };

  const breadcrumbItems = items || generateDefaultBreadcrumb();

  if (breadcrumbItems.length <= 1) {
    return null; // ホームページでは表示しない
  }

  return (
    <nav 
      aria-label="パンくずリスト" 
      className={cn("mb-6", className)}
    >
      <ol className="flex items-center space-x-2 text-sm text-gray-600">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            )}
            
            {index === 0 && (
              <Home className="h-4 w-4 mr-2 text-gray-400" />
            )}
            
            {item.href ? (
              <Link 
                to={item.href}
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default PageBreadcrumb; 