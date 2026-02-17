import { Link, useLocation } from "react-router-dom";
import { Home, Search, ArrowLeft } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/useRedux";

const NotFound = () => {
  const location = useLocation();
  const { currentLanguage } = useAppSelector((state) => state.language);

  const content = {
    en: {
      title: "404",
      heading: "Page Not Found",
      message: "Oops! The page you're looking for doesn't exist.",
      backHome: "Return to Home",
      browse: "Browse Marketplace",
      goBack: "Go Back",
    },
    hi: {
      title: "404",
      heading: "पृष्ठ नहीं मिला",
      message: "उफ़! आप जिस पृष्ठ की तलाश कर रहे हैं वह मौजूद नहीं है।",
      backHome: "होम पर वापस जाएं",
      browse: "बाज़ार देखें",
      goBack: "वापस जाएं",
    },
  };

  const t = content[currentLanguage];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-8xl font-bold text-primary/20 mb-4">{t.title}</div>
          
          <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
            {t.heading}
          </h1>
          
          <p className={`text-lg text-muted-foreground mb-8 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
            {t.message}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="btn-primary-gradient">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                {t.backHome}
              </Link>
            </Button>
            
            <Button asChild variant="outline">
              <Link to="/marketplace">
                <Search className="w-4 h-4 mr-2" />
                {t.browse}
              </Link>
            </Button>

            <Button 
              asChild 
              variant="ghost"
              onClick={() => window.history.back()}
            >
              <Link to="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.goBack}
              </Link>
            </Button>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-muted rounded-lg text-left">
              <p className="text-sm text-muted-foreground">
                <strong>Path:</strong> {location.pathname}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;

