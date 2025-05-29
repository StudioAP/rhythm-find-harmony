import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HeaderProps {
  showAuth?: boolean;
  variant?: "default" | "minimal";
}

const Header = ({ showAuth = true, variant = "default" }: HeaderProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white shadow-sm py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo - 常にクリック可能であることを明示 */}
        <Link 
          to="/" 
          className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
        >
          Piano Search
        </Link>

        {/* Navigation Links - 現在位置を明示 */}
        {variant === "default" && (
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/search" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/search") ? "text-primary border-b-2 border-primary pb-1" : "text-gray-600"
              )}
            >
              教室を探す
            </Link>
            <Link 
              to="/about" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/about") ? "text-primary border-b-2 border-primary pb-1" : "text-gray-600"
              )}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive("/contact") ? "text-primary border-b-2 border-primary pb-1" : "text-gray-600"
              )}
            >
              お問い合わせ
            </Link>
          </nav>
        )}

        {/* Auth Buttons - 統一されたリンク */}
        {showAuth && (
          <div className="space-x-2">
            <Button variant="outline" asChild>
              <Link to="/auth">ログイン</Link>
            </Button>
            <Button asChild>
              <Link to="/classroom/register">教室を掲載する</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 