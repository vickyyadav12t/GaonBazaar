import { Link, useLocation } from "react-router-dom";
import { Home, Search, ArrowLeft } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/useRedux";
import { scriptFontClass, toNewsApiLang } from '@/lib/i18n';

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

  const t = content[toNewsApiLang(currentLanguage)];

  return (
    <Layout>
      <section className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden bg-[#fbf7eb] text-[#213525]">
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(49,95,59,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(49,95,59,0.07)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="container relative z-10 mx-auto min-w-0 px-3 py-12 sm:px-4 sm:py-16">
        <div className="mx-auto max-w-2xl rounded-lg border-2 border-[#d7c7a8] bg-[#fffaf0] p-6 text-center shadow-sm sm:p-10">
          <div className="mb-4 text-8xl font-bold text-[#315f3b]/15">{t.title}</div>
          
          <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${scriptFontClass(currentLanguage)}`}>
            {t.heading}
          </h1>
          
          <p className={`text-lg text-muted-foreground mb-8 ${scriptFontClass(currentLanguage)}`}>
            {t.message}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="rounded-md bg-[#d89b2b] font-bold text-[#24170c] hover:bg-[#c8871f]">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                {t.backHome}
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="rounded-md border-2 border-[#315f3b] text-[#315f3b] hover:bg-[#315f3b] hover:text-[#fff8e8]">
              <Link to="/marketplace">
                <Search className="w-4 h-4 mr-2" />
                {t.browse}
              </Link>
            </Button>

            <Button 
              asChild 
              variant="ghost"
              className="text-[#315f3b] hover:bg-[#f1e5cc] hover:text-[#8a4f2a]"
              onClick={() => window.history.back()}
            >
              <Link to="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.goBack}
              </Link>
            </Button>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-8 rounded-md border border-[#d7c7a8] bg-[#f1e5cc] p-4 text-left">
              <p className="text-sm text-muted-foreground">
                <strong>Path:</strong> {location.pathname}
              </p>
            </div>
          )}
        </div>
      </div>
      </section>
    </Layout>
  );
};

export default NotFound;
