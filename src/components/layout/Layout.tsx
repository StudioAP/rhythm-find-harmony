import { ReactNode } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import PageBreadcrumb from "./Breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface LayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbItems?: BreadcrumbItem[];
  showHeader?: boolean;
  showBreadcrumb?: boolean;
  showFooter?: boolean;
  headerVariant?: "default" | "minimal";
  className?: string;
}

const Layout = ({ 
  children, 
  title,
  breadcrumbItems,
  showHeader = true,
  showBreadcrumb = true,
  showFooter = true,
  headerVariant = "default",
  className = ""
}: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      {showHeader && <Header variant={headerVariant} />}
      
      {/* Main Content */}
      <main className={`flex-1 ${className}`}>
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          {showBreadcrumb && <PageBreadcrumb items={breadcrumbItems} />}
          
          {/* Page Title */}
          {title && (
            <h1 className="text-3xl font-bold mb-6">{title}</h1>
          )}
          
          {/* Content */}
          {children}
        </div>
      </main>
      
      {/* Footer */}
      {showFooter && (
        <footer className="bg-gray-50 py-8 mt-auto">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500">© 2025 ピアノ教室・リトミック教室検索.org All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <Link to="/about" className="text-gray-500 hover:text-primary transition-colors">
                  About
                </Link>
                <Link to="/terms" className="text-gray-500 hover:text-primary transition-colors">
                  利用規約
                </Link>
                <Link to="/privacy" className="text-gray-500 hover:text-primary transition-colors">
                  プライバシーポリシー
                </Link>
                <Link to="/contact" className="text-gray-500 hover:text-primary transition-colors">
                  お問い合わせ
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout; 