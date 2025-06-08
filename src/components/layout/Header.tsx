import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCircle, LayoutDashboard, Settings } from "lucide-react";

interface HeaderProps {
  variant?: "default" | "minimal";
}

const Header = ({ variant = "default" }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
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
                        ピアノ教室・リトミック教室検索.org
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

        {/* Auth Area */}
        <div className="space-x-2 flex items-center">
          {user ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/classroom/register">教室を掲載する</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-accent">
                    <UserCircle className="h-7 w-7" />
                    <span className="text-sm font-medium hidden md:inline">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        アカウント
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>教室管理画面</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account-settings')} disabled>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>アカウント設定</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ログアウト</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
            <Button variant="outline" asChild>
              <Link to="/auth">ログイン</Link>
            </Button>
            <Button asChild>
              <Link to="/classroom/register">教室を掲載する</Link>
            </Button>
            </>
          )}
          </div>
      </div>
    </header>
  );
};

export default Header; 