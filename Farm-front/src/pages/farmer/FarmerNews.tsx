import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Newspaper,
  RefreshCw,
  Sparkles,
  Building2,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAppSelector } from '@/hooks/useRedux';
import { toNewsApiLang } from '@/lib/i18n';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

type NewsArticle = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  summary: string;
};

type OfficialPortal = { id: string; title: string; url: string };

type AiStatus =
  | 'fresh'
  | 'cached'
  | 'stale_cache'
  | 'missing_key'
  | 'error'
  | 'no_articles';

const FarmerNews = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { toast } = useToast();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [snapshot, setSnapshot] = useState<string[] | null>(null);
  const [officialPortals, setOfficialPortals] = useState<OfficialPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rssFetchedAt, setRssFetchedAt] = useState<string | null>(null);
  const [rssFromCache, setRssFromCache] = useState(false);
  const [snapshotGeneratedAt, setSnapshotGeneratedAt] = useState<string | null>(null);
  const [snapshotFromCache, setSnapshotFromCache] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState('');

  const lang = toNewsApiLang(currentLanguage);

  const load = useCallback(
    async (refresh: boolean) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setNotice(null);
      try {
        const res = await apiService.ai.farmerNews({ lang, refresh });
        const data = res.data;
        setArticles(data.articles || []);
        setSnapshot(data.snapshot?.length ? data.snapshot : null);
        setOfficialPortals(data.officialPortals || []);
        setRssFetchedAt(data.rssFetchedAt ?? null);
        setRssFromCache(!!data.rssFromCache);
        setSnapshotGeneratedAt(data.snapshotGeneratedAt ?? null);
        setSnapshotFromCache(!!data.snapshotFromCache);
        setAiStatus((data.aiStatus as AiStatus) || null);
        setDisclaimer(data.disclaimer || '');
        if (data.notice) setNotice(data.notice);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e instanceof Error ? e.message : '');
        toast({
          title: lang === 'hi' ? 'लोड विफल' : 'Could not load',
          description: msg || (lang === 'hi' ? 'पुनः प्रयास करें।' : 'Please try again.'),
          variant: 'destructive',
        });
        setArticles([]);
        setSnapshot(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lang, toast]
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const title = lang === 'hi' ? 'किसान समाचार' : 'Farmer news';
  const subtitle =
    lang === 'hi'
      ? 'हाल के शीर्षक सार्वजनिक फ़ीड से — एआई संक्षेप शीर्षकों पर आधारित'
      : 'Recent headlines from public feeds — AI snapshot from titles only';

  const rssMeta =
    rssFetchedAt &&
    (lang === 'hi'
      ? `फ़ीड अपडेट: ${new Date(rssFetchedAt).toLocaleString('hi-IN')}${rssFromCache ? ' (कैश)' : ''}`
      : `Feeds updated: ${new Date(rssFetchedAt).toLocaleString('en-IN')}${rssFromCache ? ' (cached)' : ''}`);

  const snapMeta =
    snapshotGeneratedAt &&
    (lang === 'hi'
      ? `एआई सार: ${new Date(snapshotGeneratedAt).toLocaleString('hi-IN')}${snapshotFromCache ? ' (कैश)' : ''}`
      : `AI snapshot: ${new Date(snapshotGeneratedAt).toLocaleString('en-IN')}${snapshotFromCache ? ' (cached)' : ''}`);

  return (
    <Layout>
      <div className="min-h-screen bg-[#f6f1e7] bg-[linear-gradient(rgba(138,79,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.05)_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="container mx-auto min-w-0 max-w-3xl px-3 py-5 sm:px-4 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0 rounded-lg border border-[#d7c7a8] bg-[#fffaf0] text-[#315f3b] hover:bg-[#f6eddc] hover:text-[#315f3b]"
              asChild
            >
              <Link to="/farmer/dashboard" aria-label={lang === 'hi' ? 'वापस' : 'Back'}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-[#315f3b]">
                <Newspaper className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  {lang === 'hi' ? 'किसान के लिए' : 'For farmers'}
                </span>
              </div>
              <h1 className={`text-2xl font-bold tracking-tight text-[#2f3a2f] ${lang === 'hi' ? 'font-hindi' : ''}`}>
                {title}
              </h1>
              <p className={`mt-1 text-[#6f6552] ${lang === 'hi' ? 'font-hindi' : ''}`}>{subtitle}</p>
              {rssMeta ? <p className="mt-2 text-xs text-[#6f6552]">{rssMeta}</p> : null}
              {snapMeta ? <p className="text-xs text-[#6f6552]">{snapMeta}</p> : null}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 gap-2 self-start border-[#d7c7a8] bg-[#fffaf0] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b] sm:self-auto"
            disabled={loading || refreshing}
            onClick={() => void load(true)}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {lang === 'hi' ? 'रीफ़्रेश' : 'Refresh'}
          </Button>
        </div>

        <Alert className="mb-6 border-[#d7c7a8] bg-[#fff7e8] text-[#2f3a2f]">
          <Sparkles className="h-4 w-4 text-[#d89b2b]" />
          <AlertTitle className={lang === 'hi' ? 'font-hindi' : ''}>
            {lang === 'hi' ? 'महत्वपूर्ण' : 'Important'}
          </AlertTitle>
          <AlertDescription className={`text-sm ${lang === 'hi' ? 'font-hindi' : ''}`}>
            {disclaimer ||
              (lang === 'hi'
                ? 'समाचार तृतीय-पक्ष स्रोतों से हैं; एआई केवल शीर्षकों पर आधारित है।'
                : 'Headlines are from third-party sources; AI uses titles only.')}
          </AlertDescription>
        </Alert>

        {notice ? (
          <Alert
            variant={aiStatus === 'missing_key' ? 'default' : 'destructive'}
            className={`mb-6 ${aiStatus === 'missing_key' ? 'border-[#d7c7a8] bg-[#fffaf0] text-[#2f3a2f]' : 'border-[#e1c1b1] bg-[#f6e5dc] text-[#8a4f2a]'}`}
          >
            <AlertDescription className={lang === 'hi' ? 'font-hindi' : ''}>{notice}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-[#6f6552]">
            <Loader2 className="h-10 w-10 animate-spin text-[#315f3b]" />
            <p className={lang === 'hi' ? 'font-hindi' : ''}>
              {lang === 'hi' ? 'समाचार लोड हो रहा है…' : 'Loading headlines…'}
            </p>
          </div>
        ) : (
          <>
            {snapshot && snapshot.length > 0 ? (
              <Card className="mb-6 border border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#d89b2b]" />
                    <CardTitle className={`text-lg text-[#2f3a2f] ${lang === 'hi' ? 'font-hindi' : ''}`}>
                      {lang === 'hi' ? 'आज की झलक (एआई)' : "Today's snapshot (AI)"}
                    </CardTitle>
                  </div>
                  <CardDescription className={`text-[#6f6552] ${lang === 'hi' ? 'font-hindi' : ''}`}>
                    {lang === 'hi'
                      ? 'नीचे दिए शीर्षकों से बनाया गया — पूरा लेख नहीं पढ़ा गया।'
                      : 'Built from the headlines below — full articles were not read.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul
                    className={`list-disc space-y-2 pl-5 text-sm text-[#2f3a2f] ${lang === 'hi' ? 'font-hindi' : ''}`}
                  >
                    {snapshot.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            <h2 className={`mb-3 text-lg font-semibold text-[#2f3a2f] ${lang === 'hi' ? 'font-hindi' : ''}`}>
              {lang === 'hi' ? 'ताज़ा शीर्षक' : 'Latest headlines'}
            </h2>

            {articles.length === 0 ? (
              <p className={`py-8 text-center text-[#6f6552] ${lang === 'hi' ? 'font-hindi' : ''}`}>
                {lang === 'hi' ? 'कोई समाचार शीर्षक नहीं मिला।' : 'No headlines loaded.'}
              </p>
            ) : (
              <div className="space-y-4 mb-8">
                {articles.map((a) => (
                  <Card key={a.id} className="overflow-hidden border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                    <CardHeader className="space-y-2 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="max-w-[100%] truncate bg-[#f3ebdd] font-normal text-[#6c5a3d] hover:bg-[#f3ebdd]">
                          {a.source}
                        </Badge>
                        {a.publishedAt ? (
                          <span className="text-xs text-[#6f6552]">
                            {new Date(a.publishedAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        ) : null}
                      </div>
                      <CardTitle className="text-base leading-snug text-[#2f3a2f]">{a.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {a.summary ? (
                        <p className={`line-clamp-4 text-sm text-[#6f6552] ${lang === 'hi' ? 'font-hindi' : ''}`}>
                          {a.summary}
                        </p>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                        asChild
                      >
                        <a href={a.link} target="_blank" rel="noopener noreferrer">
                          {lang === 'hi' ? 'पूरा लेख पढ़ें' : 'Read full article'}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {officialPortals.length > 0 ? (
              <Accordion
                type="single"
                collapsible
                className="rounded-lg border border-[#d7c7a8] bg-[#fffaf0] px-2 shadow-[0_16px_40px_rgba(95,70,40,0.08)]"
              >
                <AccordionItem value="portals" className="border-0">
                  <AccordionTrigger className={`text-sm font-medium hover:no-underline ${lang === 'hi' ? 'font-hindi' : ''}`}>
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#6f6552]" />
                      {lang === 'hi' ? 'सरकारी पोर्टल (शॉर्टकट)' : 'Government portals (shortcuts)'}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pb-2">
                      {officialPortals.map((p) => (
                        <li key={p.id}>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-[#315f3b] hover:underline"
                          >
                            {p.title}
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : null}
          </>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default FarmerNews;
