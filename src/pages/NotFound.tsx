import { useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="space-y-2">
          <div className="text-6xl font-bold text-muted-foreground">404</div>
          <h1 className="text-2xl font-bold text-foreground">페이지를 찾을 수 없습니다</h1>
          <p className="text-muted-foreground">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            이전 페이지
          </Button>
          <Button 
            asChild
            variant="default"
          >
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              홈으로 가기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
