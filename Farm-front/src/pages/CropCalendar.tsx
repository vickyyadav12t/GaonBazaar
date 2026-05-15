import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Filter,
  Search,
  Sprout,
  Scissors,
  Leaf,
  Info,
  TrendingUp,
  Sparkles,
  Clock,
  Sun,
  List,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Printer,
  FileDown,
  ExternalLink,
  CalendarClock,
  ArrowDownAZ,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { enHi, scriptFontClass, toNewsApiLang } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector } from '@/hooks/useRedux';
import { cropCalendar, cropCategories } from '@/data/mockData';
import { CropActivity, CropCalendarEntry, CropCategory, Season } from '@/types';
import {
  AGRO_ZONES,
  type AgroZoneId,
  DEFAULT_AGRO_ZONE,
  getAgroZoneMeta,
  parseAgroZoneParam,
  prepareEntriesForAgroZone,
} from '@/lib/calendarZones';
import { downloadCropScheduleIcs } from '@/lib/cropScheduleIcs';
import { getCropCalendarReferenceLinks } from '@/lib/cropCalendarReferences';
import { mapCalendarGuideFromApi } from '@/lib/mapCalendarGuideFromApi';
import { apiService } from '@/services/api';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
function applyCalendarSearchParams(
  prev: URLSearchParams,
  opts: { month: number; tab: 'calendar' | 'list'; cropId: string | null; zone: AgroZoneId }
) {
  const next = new URLSearchParams(prev);
  const nowM = new Date().getMonth() + 1;
  if (opts.month >= 1 && opts.month <= 12 && opts.month !== nowM) next.set('month', String(opts.month));
  else next.delete('month');
  if (opts.tab === 'list') next.set('tab', 'list');
  else next.delete('tab');
  if (opts.cropId) next.set('crop', opts.cropId);
  else next.delete('crop');
  if (opts.zone !== DEFAULT_AGRO_ZONE) next.set('zone', opts.zone);
  else next.delete('zone');
  return next;
}

const SEASON_SORT_ORDER: Record<Season, number> = {
  winter: 0,
  spring: 1,
  summer: 2,
  monsoon: 3,
};

const CropCalendar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [remoteCalendar, setRemoteCalendar] = useState<CropCalendarEntry[] | null>(null);
  const [calendarApiMeta, setCalendarApiMeta] = useState<{ lastUpdated: string | null } | null>(null);
  const [farmerGuideContext, setFarmerGuideContext] = useState<{
    categories: string[];
    source: string;
    matchingCropIds: string[];
  } | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const m = searchParams.get('month');
    const n = m != null ? Number.parseInt(m, 10) : NaN;
    return Number.isFinite(n) && n >= 1 && n <= 12 ? n : new Date().getMonth() + 1;
  });
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>(() =>
    searchParams.get('tab') === 'list' ? 'list' : 'calendar'
  );
  const [selectedCategory, setSelectedCategory] = useState<CropCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [listSort, setListSort] = useState<'name' | 'season' | 'planting'>('name');
  const [selectedCrop, setSelectedCrop] = useState<CropCalendarEntry | null>(() => {
    const id = searchParams.get('crop');
    const zone = parseAgroZoneParam(searchParams.get('zone'));
    const list = prepareEntriesForAgroZone(cropCalendar, zone);
    return id ? list.find((c) => c.id === id) ?? null : null;
  });

  const agroZone = parseAgroZoneParam(searchParams.get('zone'));
  const baseCalendar = remoteCalendar ?? cropCalendar;
  const zonedCalendar = useMemo(
    () => prepareEntriesForAgroZone(baseCalendar, agroZone),
    [baseCalendar, agroZone]
  );
  const zoneMeta = getAgroZoneMeta(agroZone);

  const farmerHighlightIds = useMemo(
    () => new Set(farmerGuideContext?.matchingCropIds ?? []),
    [farmerGuideContext]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiService.calendar.getGuide({ region: agroZone });
        if (cancelled) return;
        const raw = data?.entries;
        if (!Array.isArray(raw) || raw.length === 0) {
          setRemoteCalendar(null);
          setCalendarApiMeta(data?.meta ?? null);
          return;
        }
        setRemoteCalendar(raw.map((e: Record<string, unknown>) => mapCalendarGuideFromApi(e)));
        setCalendarApiMeta(data?.meta ?? null);
      } catch {
        if (!cancelled) {
          setRemoteCalendar(null);
          setCalendarApiMeta(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agroZone]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'farmer') {
      setFarmerGuideContext(null);
      return;
    }
    let cancelled = false;
    apiService.calendar
      .getFarmerContext({ month: selectedMonth })
      .then(({ data }) => {
        if (cancelled) return;
        setFarmerGuideContext({
          categories: Array.isArray(data?.categories) ? data.categories : [],
          source: typeof data?.source === 'string' ? data.source : 'none',
          matchingCropIds: Array.isArray(data?.matchingCropIds) ? data.matchingCropIds : [],
        });
      })
      .catch(() => {
        if (!cancelled) setFarmerGuideContext(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, isAuthenticated, user?.role, user?.id]);

  const pushCalendarQuery = useCallback(
    (month: number, tab: 'calendar' | 'list', cropId: string | null) => {
      setSearchParams(
        (prev) => {
          const zone = parseAgroZoneParam(prev.get('zone'));
          return applyCalendarSearchParams(prev, { month, tab, cropId, zone });
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    const m = searchParams.get('month');
    const monthNum = m != null ? Number.parseInt(m, 10) : NaN;
    if (Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12) {
      setSelectedMonth(monthNum);
    } else {
      setSelectedMonth(new Date().getMonth() + 1);
    }
    setActiveTab(searchParams.get('tab') === 'list' ? 'list' : 'calendar');
    const zone = parseAgroZoneParam(searchParams.get('zone'));
    const base = remoteCalendar ?? cropCalendar;
    const list = prepareEntriesForAgroZone(base, zone);
    const cid = searchParams.get('crop');
    setSelectedCrop(cid ? list.find((c) => c.id === cid) ?? null : null);
  }, [searchParams, remoteCalendar]);

  const months = [
    { num: 1, name: 'January', nameHi: 'जनवरी', short: 'Jan', shortHi: 'जन' },
    { num: 2, name: 'February', nameHi: 'फरवरी', short: 'Feb', shortHi: 'फर' },
    { num: 3, name: 'March', nameHi: 'मार्च', short: 'Mar', shortHi: 'मार' },
    { num: 4, name: 'April', nameHi: 'अप्रैल', short: 'Apr', shortHi: 'अप्रै' },
    { num: 5, name: 'May', nameHi: 'मई', short: 'May', shortHi: 'मई' },
    { num: 6, name: 'June', nameHi: 'जून', short: 'Jun', shortHi: 'जून' },
    { num: 7, name: 'July', nameHi: 'जुलाई', short: 'Jul', shortHi: 'जुल' },
    { num: 8, name: 'August', nameHi: 'अगस्त', short: 'Aug', shortHi: 'अग' },
    { num: 9, name: 'September', nameHi: 'सितंबर', short: 'Sep', shortHi: 'सित' },
    { num: 10, name: 'October', nameHi: 'अक्टूबर', short: 'Oct', shortHi: 'अक्टू' },
    { num: 11, name: 'November', nameHi: 'नवंबर', short: 'Nov', shortHi: 'नव' },
    { num: 12, name: 'December', nameHi: 'दिसंबर', short: 'Dec', shortHi: 'दिस' },
  ];

  /** Month bands aligned with “Browse by season” (India-oriented): winter Dec–Feb, spring Mar–May, monsoon Jun–Aug, autumn Sep–Nov. */
  type CalendarSeasonBand = 'winter' | 'spring' | 'monsoon' | 'autumn';

  const getCalendarSeasonForMonth = (month: number): CalendarSeasonBand => {
    if (month === 12 || month === 1 || month === 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'monsoon';
    return 'autumn';
  };

  /** Crop `season` from data (may include summer) + calendar bands for month UI. */
  const getSeasonName = (season: string) => {
    const names = {
      spring: { en: 'Spring', hi: 'वसंत' },
      summer: { en: 'Summer', hi: 'गर्मी' },
      monsoon: { en: 'Monsoon', hi: 'मानसून' },
      winter: { en: 'Winter', hi: 'सर्दी' },
      autumn: { en: 'Autumn', hi: 'शरद' },
    };
    const bucket = toNewsApiLang(currentLanguage);
    return names[season as keyof typeof names]?.[bucket] || season;
  };

  const getActivityForMonth = (crop: CropCalendarEntry, month: number): CropActivity | null => {
    if (crop.plantingMonths.includes(month)) return 'planting';
    if (crop.harvestingMonths.includes(month)) return 'harvesting';
    // Check if month is between planting and harvesting
    const plantingEnd = Math.max(...crop.plantingMonths);
    const harvestingStart = Math.min(...crop.harvestingMonths);
    if (month > plantingEnd && month < harvestingStart) return 'growing';
    // Handle year wrap-around
    if (plantingEnd > harvestingStart) {
      if (month > plantingEnd || month < harvestingStart) return 'growing';
    }
    return null;
  };

  const filteredCrops = zonedCalendar.filter((crop) => {
    const matchesCategory = selectedCategory === 'all' || crop.category === selectedCategory;
    const matchesSearch = 
      crop.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.cropNameHindi.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const hasActiveFilters = selectedCategory !== 'all' || searchQuery.trim().length > 0;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
  }, []);

  const sortedListCrops = useMemo(() => {
    const arr = [...filteredCrops];
    const minPlant = (c: CropCalendarEntry) => Math.min(...c.plantingMonths);
    if (listSort === 'name') {
      arr.sort((a, b) => {
        const na = currentLanguage === 'hi' ? a.cropNameHindi : a.cropName;
        const nb = currentLanguage === 'hi' ? b.cropNameHindi : b.cropName;
        return na.localeCompare(nb, currentLanguage === 'hi' ? 'hi' : 'en', { sensitivity: 'base' });
      });
    } else if (listSort === 'season') {
      arr.sort(
        (a, b) =>
          (SEASON_SORT_ORDER[a.season] ?? 9) - (SEASON_SORT_ORDER[b.season] ?? 9) ||
          a.cropName.localeCompare(b.cropName, 'en', { sensitivity: 'base' })
      );
    } else {
      arr.sort(
        (a, b) =>
          minPlant(a) - minPlant(b) ||
          a.cropName.localeCompare(b.cropName, 'en', { sensitivity: 'base' })
      );
    }
    return arr;
  }, [filteredCrops, listSort, currentLanguage]);

  const jumpToToday = useCallback(() => {
    const nowM = new Date().getMonth() + 1;
    setSelectedMonth(nowM);
    pushCalendarQuery(nowM, activeTab, selectedCrop?.id ?? null);
  }, [pushCalendarQuery, activeTab, selectedCrop?.id]);

  const cropsForMonth = filteredCrops.filter(crop => {
    const activity = getActivityForMonth(crop, selectedMonth);
    return activity !== null;
  });

  const content = {
    en: {
      title: 'Crop Calendar & Seasonal Guide',
      subtitle:
        'Typical planting–harvest windows and seasons — for farmers and anyone choosing fresh produce.',
      audienceNote: 'Buyers: use this to see what tends to be in season while you shop the marketplace.',
      guideDisclaimer:
        'Illustrative guide for broad patterns across India — not hyper-local advice. Timing varies by region, crop variety, and weather. Confirm with your local extension, KVK, or agronomist before planting or relying on these windows for decisions.',
      calendar: 'Calendar View',
      list: 'Crop List',
      search: 'Search crops...',
      filterBy: 'Filter By Category',
      selectMonth: 'Select Month',
      planting: 'Planting',
      growing: 'Growing',
      harvesting: 'Harvesting',
      available: 'Available',
      season: 'Season',
      plantingTime: 'Planting Time',
      harvestTime: 'Harvest Time',
      growingPeriod: 'Growing Period',
      days: 'days',
      tips: 'Growing Tips',
      description: 'Description',
      viewDetails: 'View Details',
      noCrops: 'No crops found for this month',
      tryDifferent: 'Try another month, category, or search term.',
      allCategories: 'All Categories',
      currentMonth: 'Current Month',
      statSelectedMonth: 'Selected month',
      browseCategoryMarketplace: 'Browse {category} on marketplace',
      agroZoneLabel: 'Region (illustrative)',
      agroZoneHelp:
        'Mock north/central/south shifts only — not a government agro-climatic map. Use local advisory for real planning.',
      printOrPdf: 'Print / save as PDF',
      downloadIcs: 'Download calendar (.ics)',
      exportHint: 'For offline or field use: print this sheet or add planting/harvest anchors to your phone calendar.',
      printScheduleTitle: 'Seasonal schedule',
      printGenerated: 'Generated',
      printZone: 'Region preset',
      jumpToToday: 'Jump to today',
      sortList: 'Sort list',
      sortNameAz: 'A–Z',
      sortSeason: 'By season',
      sortPlantingMonth: 'By planting month',
      listEmptyFiltered: 'Nothing matches your search or category.',
      clearFilters: 'Clear filters',
      scrollMonthsHint: 'Swipe to pick a month',
      trustLinksHeading: 'Official references',
      trustLinksNote:
        'Opens in a new tab. Always cross-check with your state agriculture department and local advisory.',
      noCropsThisMonthFiltered: 'No crops this month under current filters — try clearing filters or another month.',
      farmerGuideHighlightTitle: 'Your listing categories this month',
      farmerGuideHighlightListings:
        'Based on your active marketplace listings — {count} guide row(s) match this month.',
      farmerGuideHighlightProfile:
        'Based on categories saved on your profile — {count} guide row(s) match this month.',
      guideDatasetUpdated: 'Guide data updated',
    },
    hi: {
      title: 'फसल कैलेंडर और मौसमी गाइड',
      subtitle:
        'रोपण–कटाई के सामान्य समय और मौसम — किसानों और ताज़ी उपज चुनने वाले खरीदारों दोनों के लिए उपयोगी।',
      audienceNote:
        'खरीदार: बाज़ार में खरीदते समय क्या मौसम के अनुसार उपलब्ध हो सकता है, इसका अंदाज़ा लगाने में मदद मिल सकती है।',
      guideDisclaimer:
        'यह भारत भर के सामान्य पैटर्न के लिए दिशानिर्देश है — स्थानीय सलाह नहीं। समय क्षेत्र, किस्म और मौसम से बदलता है। बोने या निर्णय से पहले स्थानीय कृषि विस्तार, KVK या विशेषज्ञ से पुष्टि करें।',
      calendar: 'कैलेंडर दृश्य',
      list: 'फसल सूची',
      search: 'फसलें खोजें...',
      filterBy: 'श्रेणी से फ़िल्टर करें',
      selectMonth: 'महीना चुनें',
      planting: 'रोपण',
      growing: 'बढ़ रहा',
      harvesting: 'कटाई',
      available: 'उपलब्ध',
      season: 'मौसम',
      plantingTime: 'रोपण समय',
      harvestTime: 'कटाई समय',
      growingPeriod: 'बढ़ने की अवधि',
      days: 'दिन',
      tips: 'बढ़ने के सुझाव',
      description: 'विवरण',
      viewDetails: 'विवरण देखें',
      noCrops: 'इस महीने के लिए कोई फसल नहीं मिली',
      tryDifferent: 'दूसरा महीना, श्रेणी या खोज शब्द आज़माएं।',
      allCategories: 'सभी श्रेणियां',
      currentMonth: 'वर्तमान महीना',
      statSelectedMonth: 'चयनित महीना',
      browseCategoryMarketplace: 'बाज़ार में {category} देखें',
      agroZoneLabel: 'क्षेत्र (नमूना)',
      agroZoneHelp:
        'उत्तर/मध्य/दक्षिण के महीने केवल नमूना हैं — सरकारी कृषि-जलवायु मानचित्र नहीं। वास्तविक योजना हेतु स्थानीय सलाह लें।',
      printOrPdf: 'प्रिंट / PDF सहेजें',
      downloadIcs: 'कैलेंडर डाउनलोड (.ics)',
      exportHint:
        'ऑफ़लाइन या खेत में: यह पृष्ठ प्रिंट करें या फ़ोन कैलेंडर में रोपण/कटाई अनुस्मारक जोड़ें।',
      printScheduleTitle: 'मौसमी अनुसूची',
      printGenerated: 'बनाया गया',
      printZone: 'क्षेत्र प्रीसेट',
      jumpToToday: 'आज के महीने पर जाएं',
      sortList: 'क्रमबद्ध करें',
      sortNameAz: 'A–Z',
      sortSeason: 'मौसम के अनुसार',
      sortPlantingMonth: 'पहले रोपण महीने से',
      listEmptyFiltered: 'खोज या श्रेणी से कुछ नहीं मिला।',
      clearFilters: 'फ़िल्टर हटाएं',
      scrollMonthsHint: 'महीना चुनने के लिए स्वाइप करें',
      trustLinksHeading: 'आधिकारिक संदर्भ',
      trustLinksNote:
        'नई टैब में खुलता है। अपने राज्य के कृषि विभाग व स्थानीय सलाह से ज़रूर मिलाएं।',
      noCropsThisMonthFiltered:
        'वर्तमान फ़िल्टर में इस महीने कोई फसल नहीं — फ़िल्टर हटाएं या दूसरा महीना चुनें।',
      farmerGuideHighlightTitle: 'आपकी सूची वाली श्रेणियाँ (इस महीने)',
      farmerGuideHighlightListings:
        'आपकी सक्रिय बाज़ार सूचियों के आधार पर — इस महीने {count} गाइड पंक्ति मेल खाती हैं।',
      farmerGuideHighlightProfile:
        'प्रोफ़ाइल पर सहेजी श्रेणियों के आधार पर — इस महीने {count} गाइड पंक्ति मेल खाती हैं।',
      guideDatasetUpdated: 'गाइड डेटा अपडेट',
    },
  };

  const t = content[toNewsApiLang(currentLanguage)];
  const currentMonth = new Date().getMonth() + 1;

  const handleDownloadIcs = () => {
    if (!selectedCrop) return;
    const name = enHi(currentLanguage, selectedCrop.cropName, selectedCrop.cropNameHindi);
    downloadCropScheduleIcs(
      {
        crop: selectedCrop,
        cropDisplayName: name,
        zoneLabel: enHi(currentLanguage, zoneMeta.labelEn, zoneMeta.labelHi),
        year: new Date().getFullYear(),
        disclaimer: t.guideDisclaimer,
      },
      selectedCrop.id
    );
  };

  // Get crops by season for navigation
  const getCropsBySeason = (seasonId: string) => {
    const seasonMonths: Record<string, number[]> = {
      winter: [12, 1, 2],
      spring: [3, 4, 5],
      monsoon: [6, 7, 8],
      autumn: [9, 10, 11],
    };
    const months = seasonMonths[seasonId] || [];
    return filteredCrops.filter(crop => {
      return months.some(month => getActivityForMonth(crop, month) !== null);
    });
  };

  const getActivityColor = (activity: CropActivity) => {
    switch (activity) {
      case 'planting':
        return 'bg-[#eaf5ec] text-[#315f3b] border-[#bfd2bf]';
      case 'growing':
        return 'bg-[#eef5ee] text-[#58774e] border-[#c9d8c5]';
      case 'harvesting':
        return 'bg-[#fff4dd] text-[#9a6b12] border-[#e8cf96]';
      default:
        return 'bg-[#f3ebdd] text-[#6c5a3d]';
    }
  };

  const getActivityIcon = (activity: CropActivity) => {
    switch (activity) {
      case 'planting':
        return <Sprout className="w-4 h-4" />;
      case 'growing':
        return <Leaf className="w-4 h-4" />;
      case 'harvesting':
        return <Scissors className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const currentMonthData = months[selectedMonth - 1];
  const calendarSeasonForSelectedMonth = getCalendarSeasonForMonth(selectedMonth);
  const cropsThisMonth = cropsForMonth.length;

  return (
    <Layout>
      <div className="print:hidden min-h-screen min-w-0 overflow-x-hidden bg-[#f6f1e7] bg-[linear-gradient(rgba(138,79,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.05)_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="container mx-auto min-w-0 px-3 py-6 sm:px-4 sm:py-8">
          {/* Header Section */}
          <AnimateOnScroll animation="fade-in">
            <div className="text-center mb-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7c7a8] bg-[#fffaf0] px-4 py-2">
                <Calendar className="w-5 h-5 text-[#315f3b]" />
                <span className="text-sm font-semibold text-[#315f3b]">
                  {currentLanguage === 'en' ? 'Seasonal Planning Guide' : 'मौसमी योजना गाइड'}
                </span>
              </div>
              <h1 className={`mb-4 text-4xl font-extrabold text-[#2f3a2f] md:text-5xl lg:text-6xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.title}
              </h1>
              <p className={`mx-auto max-w-2xl text-xl text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.subtitle}
              </p>
              <p
                className={`mx-auto mt-3 max-w-2xl text-base text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
              >
                {t.audienceNote}
              </p>
              <Alert className="mx-auto mt-8 max-w-3xl border-[#d7c7a8] bg-[#fff7e8] text-left shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <Info className="h-5 w-5 text-[#d89b2b]" />
                <AlertDescription
                  className={`leading-relaxed text-[#2f3a2f] sm:text-[15px] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                >
                  {t.guideDisclaimer}
                </AlertDescription>
              </Alert>
            </div>
          </AnimateOnScroll>

          {/* Season Navigation Bar */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <Card className="mb-8 border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <span className={`flex items-center gap-2 text-base font-semibold text-[#2f3a2f] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                    <Sun className="w-5 h-5 text-[#d89b2b]" />
                    {currentLanguage === 'en' ? 'Browse by Season:' : 'मौसम से ब्राउज़ करें:'}
                  </span>
                  {[
                    { id: 'winter', name: 'Winter', nameHi: 'सर्दी', months: [12, 1, 2], emoji: '❄️', color: 'bg-[#f3ebdd] text-[#6c5a3d] border-[#d7c7a8]' },
                    { id: 'spring', name: 'Spring', nameHi: 'वसंत', months: [3, 4, 5], emoji: '🌷', color: 'bg-[#eaf5ec] text-[#315f3b] border-[#bfd2bf]' },
                    { id: 'monsoon', name: 'Monsoon', nameHi: 'मानसून', months: [6, 7, 8], emoji: '🌧️', color: 'bg-[#eef5ee] text-[#58774e] border-[#c9d8c5]' },
                    { id: 'autumn', name: 'Autumn', nameHi: 'शरद', months: [9, 10, 11], emoji: '🍂', color: 'bg-[#fff4dd] text-[#9a6b12] border-[#e8cf96]' },
                  ].map((season) => {
                    const isActive = season.months.includes(selectedMonth);
                    const seasonCrops = getCropsBySeason(season.id);
                    return (
                      <button
                        key={season.id}
                        onClick={() => {
                          if (!season.months.includes(selectedMonth)) {
                            const nm = season.months[0];
                            setSelectedMonth(nm);
                            pushCalendarQuery(nm, activeTab, selectedCrop?.id ?? null);
                          }
                        }}
                        className={`flex items-center gap-3 rounded-xl border px-6 py-3 transition-all duration-300 hover:scale-105 ${
                          isActive 
                            ? `${season.color} scale-105 font-bold shadow-[0_12px_28px_rgba(95,70,40,0.12)]`
                            : 'border-[#d7c7a8] bg-[#fffdf7] text-[#6f6552] hover:border-[#c8b38b] hover:bg-[#f6eddc]'
                        }`}
                      >
                        <span className="text-2xl">{season.emoji}</span>
                        <span className={`text-sm font-semibold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          {currentLanguage === 'en' ? season.name : season.nameHi}
                        </span>
                        <Badge className="ml-1 bg-[#fffaf0] text-[#6c5a3d] hover:bg-[#fffaf0] text-xs font-bold">
                          {seasonCrops.length}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Current Month Info Card */}
          <AnimateOnScroll animation="slide-up" delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#f3ebdd]">
                      <Calendar className="w-8 h-8 text-[#315f3b]" />
                    </div>
                    <div>
                      <p className={`mb-1 text-sm text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {t.statSelectedMonth}
                      </p>
                      <p className={`text-2xl font-bold text-[#2f3a2f] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {currentLanguage === 'hi' ? currentMonthData.nameHi : currentMonthData.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#fff4dd]">
                      <TrendingUp className="w-8 h-8 text-[#d89b2b]" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-[#6f6552]">
                        {getSeasonName(calendarSeasonForSelectedMonth)}
                      </p>
                      <p className="text-2xl font-bold text-[#2f3a2f]">
                        {cropsThisMonth} {currentLanguage === 'en' ? 'Crops' : 'फसलें'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#eaf5ec]">
                      <Sparkles className="w-8 h-8 text-[#315f3b]" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-[#6f6552]">
                        {currentLanguage === 'en' ? 'Total Crops' : 'कुल फसलें'}
                      </p>
                      <p className="text-2xl font-bold text-[#2f3a2f]">
                        {filteredCrops.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#f6e5dc]">
                      <MapPin className="w-8 h-8 text-[#8a4f2a]" />
                    </div>
                    <div className="min-w-0">
                      <p className={`mb-1 text-sm text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {t.agroZoneLabel}
                      </p>
                      <p className={`truncate text-xl font-bold text-[#2f3a2f] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {currentLanguage === 'hi' ? zoneMeta.shortHi : zoneMeta.shortEn}
                      </p>
                      <p className={`mt-1 line-clamp-2 text-xs text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {currentLanguage === 'hi' ? zoneMeta.labelHi : zoneMeta.labelEn}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AnimateOnScroll>

          {/* Filters */}
          <AnimateOnScroll animation="slide-up" delay={0.3}>
            <div className="flex flex-col md:flex-row md:flex-wrap gap-4 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#8b816f]" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-[#d7c7a8] bg-[#fffaf0] py-6 pl-12 text-lg text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={(v: any) => setSelectedCategory(v)}>
                <SelectTrigger className="w-full border-[#d7c7a8] bg-[#fffaf0] py-6 text-[#2f3a2f] md:w-56">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allCategories}</SelectItem>
                  {cropCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {currentLanguage === 'hi' ? cat.nameHindi : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => {
                  const nm = Number.parseInt(v, 10);
                  setSelectedMonth(nm);
                  pushCalendarQuery(nm, activeTab, selectedCrop?.id ?? null);
                }}
              >
                <SelectTrigger className="w-full border-[#d7c7a8] bg-[#fffaf0] py-6 text-[#2f3a2f] md:w-56">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.num} value={month.num.toString()}>
                      {currentLanguage === 'hi' ? month.nameHi : month.name}
                      {month.num === currentMonth && ` (${t.currentMonth})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedMonth !== currentMonth && (
                <Button
                  type="button"
                  variant="secondary"
                  className={`w-full gap-2 border-[#d7c7a8] bg-[#fffaf0] px-4 py-6 text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b] md:w-auto ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                  onClick={jumpToToday}
                >
                  <CalendarClock className="w-4 h-4 shrink-0" aria-hidden />
                  {t.jumpToToday}
                </Button>
              )}

              <Select
                value={agroZone}
                onValueChange={(v) => {
                  const z = v as AgroZoneId;
                  setSearchParams(
                    (prev) =>
                      applyCalendarSearchParams(prev, {
                        month: selectedMonth,
                        tab: activeTab,
                        cropId: selectedCrop?.id ?? null,
                        zone: z,
                      }),
                    { replace: false }
                  );
                }}
              >
                <SelectTrigger className="w-full border-[#d7c7a8] bg-[#fffaf0] py-6 text-[#2f3a2f] md:w-64">
                  <MapPin className="w-4 h-4 mr-2 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGRO_ZONES.map((z) => (
                    <SelectItem
                      key={z.id}
                      value={z.id}
                      className={currentLanguage === 'hi' ? 'font-hindi' : ''}
                    >
                      {currentLanguage === 'hi' ? z.labelHi : z.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p
              className={`mb-4 max-w-3xl text-xs text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
            >
              {t.agroZoneHelp}
            </p>
            {calendarApiMeta?.lastUpdated && remoteCalendar && (
              <p className="mb-6 max-w-3xl text-xs text-[#6f6552]">
                {t.guideDatasetUpdated}:{' '}
                {new Date(calendarApiMeta.lastUpdated).toLocaleString(
                  currentLanguage === 'hi' ? 'hi-IN' : 'en-IN',
                  { dateStyle: 'medium', timeStyle: 'short' }
                )}
              </p>
            )}
          </AnimateOnScroll>

          {isAuthenticated &&
            user?.role === 'farmer' &&
            farmerGuideContext &&
            farmerGuideContext.matchingCropIds.length > 0 && (
              <Alert className="mx-auto mb-6 max-w-3xl border-[#d7c7a8] bg-[#fff7e8]">
                <Sprout className="h-5 w-5 text-[#315f3b]" />
                <AlertDescription
                  className={`${currentLanguage === 'hi' ? 'font-hindi' : ''} text-[#2f3a2f]`}
                >
                  <span className="font-semibold block mb-1">{t.farmerGuideHighlightTitle}</span>
                  <span>
                    {(
                      farmerGuideContext.source === 'profile'
                        ? t.farmerGuideHighlightProfile
                        : t.farmerGuideHighlightListings
                    ).replace('{count}', String(farmerGuideContext.matchingCropIds.length))}
                  </span>
                </AlertDescription>
              </Alert>
            )}

          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              const tab = v === 'list' ? 'list' : 'calendar';
              setActiveTab(tab);
              pushCalendarQuery(selectedMonth, tab, selectedCrop?.id ?? null);
            }}
            className="space-y-6"
          >
            <TabsList className="mx-auto grid w-full max-w-md grid-cols-2 rounded-xl border border-[#d7c7a8] bg-[#f4ead7] p-1">
              <TabsTrigger value="calendar" className="rounded-lg text-[#6c5a3d] data-[state=active]:bg-[#fffaf0] data-[state=active]:text-[#315f3b]">
                <Calendar className="w-4 h-4 mr-2" />
                {t.calendar}
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-lg text-[#6c5a3d] data-[state=active]:bg-[#fffaf0] data-[state=active]:text-[#315f3b]">
                <List className="w-4 h-4 mr-2" />
                {t.list}
              </TabsTrigger>
            </TabsList>

            {/* Calendar View */}
            <TabsContent value="calendar" className="space-y-6">
              {/* Month Overview */}
              <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <CardHeader className="border-b border-[#e2d4b7] bg-[#f6eddc]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-2xl mb-2">
                        {currentLanguage === 'en' 
                          ? currentMonthData.name 
                          : currentMonthData.nameHi}{' '}
                        - {getSeasonName(calendarSeasonForSelectedMonth)}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {currentLanguage === 'en' 
                          ? `Crops to plant, grow, and harvest in ${currentMonthData.name}`
                          : `${currentMonthData.nameHi} में लगाने, बढ़ने और काटने वाली फसलें`}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {selectedMonth !== currentMonth && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`gap-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                          onClick={jumpToToday}
                        >
                          <CalendarClock className="w-4 h-4 shrink-0" aria-hidden />
                          {t.jumpToToday}
                        </Button>
                      )}
                      <Badge className="bg-[#315f3b] px-4 py-2 text-lg text-[#fffaf0] hover:bg-[#315f3b]">
                        {cropsThisMonth} {currentLanguage === 'en' ? 'Crops' : 'फसलें'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {cropsForMonth.length > 0 ? (
                    <StaggerContainer staggerDelay={0.05} animation="slide-up" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cropsForMonth.map((crop) => {
                        const activity = getActivityForMonth(crop, selectedMonth);
                        const farmerPick =
                          user?.role === 'farmer' && farmerHighlightIds.has(crop.id);
                        return (
                          <Card 
                            key={crop.id} 
                            className={cn(
                              'group cursor-pointer rounded-xl border border-[#d7c7a8] bg-[#fffdf7] transition-all duration-300 hover:scale-105 hover:border-[#c8b38b] hover:shadow-[0_16px_40px_rgba(95,70,40,0.12)]',
                              farmerPick && 'ring-2 ring-[#315f3b] border-[#315f3b] shadow-[0_16px_40px_rgba(95,70,40,0.12)]'
                            )}
                            onClick={() => {
                              setSelectedCrop(crop);
                              pushCalendarQuery(selectedMonth, activeTab, crop.id);
                            }}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="text-5xl group-hover:scale-110 transition-transform">{crop.icon}</div>
                                  <div>
                                    <h3 className="font-bold text-lg mb-2">
                                      {currentLanguage === 'hi' ? crop.cropNameHindi : crop.cropName}
                                    </h3>
                                    <Badge variant="outline" className="text-xs">
                                      {currentLanguage === 'hi' 
                                        ? cropCategories.find(c => c.id === crop.category)?.nameHindi
                                        : cropCategories.find(c => c.id === crop.category)?.name}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              {activity && (
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-semibold ${getActivityColor(activity)}`}>
                                  {getActivityIcon(activity)}
                                  <span className="text-sm">
                                    {activity === 'planting' ? t.planting :
                                     activity === 'growing' ? t.growing :
                                     activity === 'harvesting' ? t.harvesting : t.available}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </StaggerContainer>
                  ) : (
                    <AnimateOnScroll animation="zoom-in">
                      <div className="text-center py-16 px-2">
                        <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-[#f3ebdd]">
                          <Calendar className="h-12 w-12 text-[#8b816f]" />
                        </div>
                        <h3 className={`text-xl font-bold text-foreground mb-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          {t.noCrops}
                        </h3>
                        <p className={`mx-auto mb-6 max-w-md text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          {hasActiveFilters ? t.noCropsThisMonthFiltered : t.tryDifferent}
                        </p>
                        {hasActiveFilters && (
                          <Button type="button" onClick={clearFilters} className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                            {t.clearFilters}
                          </Button>
                        )}
                      </div>
                    </AnimateOnScroll>
                  )}
                </CardContent>
              </Card>

              {/* Year Calendar Grid */}
              <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <CardHeader className="border-b border-[#e2d4b7] bg-[#f6eddc]">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#315f3b]" />
                    {currentLanguage === 'en' ? 'Annual Calendar' : 'वार्षिक कैलेंडर'}
                  </CardTitle>
                  <CardDescription className="flex flex-col gap-1 sm:block">
                    <span>
                      {currentLanguage === 'en'
                        ? 'View all crops throughout the year — tap a month to focus it.'
                        : 'पूरे वर्ष की फसलें — किसी महीने पर टैप करके उस पर फ़ोकस करें।'}
                    </span>
                    <span className={`text-xs font-medium text-[#315f3b] md:hidden ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {t.scrollMonthsHint}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div
                    className="flex md:grid md:grid-cols-12 gap-2 md:gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch] md:mx-0 md:overflow-visible md:px-0 md:pb-0 md:snap-none"
                    role="list"
                    aria-label={currentLanguage === 'en' ? 'Months of the year' : 'वर्ष के महीने'}
                  >
                    {months.map((month) => {
                      const monthCrops = filteredCrops.filter((c) => getActivityForMonth(c, month.num) !== null).length;
                      const isSelected = selectedMonth === month.num;
                      const isCurrent = month.num === currentMonth;
                      return (
                        <button
                          key={month.num}
                          type="button"
                          role="listitem"
                          onClick={() => {
                            setSelectedMonth(month.num);
                            pushCalendarQuery(month.num, activeTab, selectedCrop?.id ?? null);
                          }}
                          className={`text-center rounded-xl border-2 transition-transform duration-200 touch-manipulation active:scale-[0.97] min-w-[5.5rem] shrink-0 snap-center min-h-[5.5rem] py-3 px-2 flex flex-col items-center justify-center md:min-w-0 md:min-h-0 md:w-full md:p-4 md:hover:scale-105 ${
                            isSelected
                              ? 'border-[#315f3b] bg-[#eaf5ec] shadow-[0_12px_28px_rgba(95,70,40,0.12)] md:scale-105'
                              : 'border-[#d7c7a8] bg-[#fffdf7] hover:border-[#c8b38b]'
                          } ${isCurrent && !isSelected ? 'ring-2 ring-[#d89b2b]/40' : ''}`}
                        >
                          <p className={`mb-1 text-sm font-bold ${isSelected ? 'text-[#315f3b]' : 'text-[#2f3a2f]'}`}>
                            {currentLanguage === 'hi' ? month.shortHi : month.short}
                          </p>
                          <p className={`text-xs font-semibold ${isSelected ? 'text-[#315f3b]' : 'text-[#6f6552]'}`}>
                            {monthCrops} {currentLanguage === 'en' ? 'crops' : 'फसलें'}
                          </p>
                          {isCurrent && (
                            <div className="mt-1">
                              <Badge className="bg-[#fff4dd] text-[#9a6b12] hover:bg-[#fff4dd] text-xs">
                                {currentLanguage === 'en' ? 'Now' : 'अभी'}
                              </Badge>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Select
                value={listSort}
                onValueChange={(v) => setListSort(v as 'name' | 'season' | 'planting')}
              >
                <SelectTrigger className="w-full border-[#d7c7a8] bg-[#fffaf0] py-6 text-[#2f3a2f] sm:w-72">
                  <ArrowDownAZ className="w-4 h-4 mr-2 shrink-0" aria-hidden />
                  <SelectValue placeholder={t.sortList} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t.sortNameAz}</SelectItem>
                  <SelectItem value="season">{t.sortSeason}</SelectItem>
                  <SelectItem value="planting">{t.sortPlantingMonth}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sortedListCrops.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d7c7a8] bg-[#fffaf0] px-4 py-16 text-center">
                <List className="mx-auto mb-4 h-12 w-12 text-[#8b816f]" aria-hidden />
                <h3 className={`text-lg font-semibold mb-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                  {t.listEmptyFiltered}
                </h3>
                {hasActiveFilters ? (
                  <Button type="button" onClick={clearFilters} className={`border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                    {t.clearFilters}
                  </Button>
                ) : null}
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedListCrops.map((crop) => {
                const farmerPick = user?.role === 'farmer' && farmerHighlightIds.has(crop.id);
                return (
                <Card 
                  key={crop.id}
                  className={cn(
                    'cursor-pointer border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)] transition-all hover:border-[#c8b38b] hover:shadow-[0_16px_40px_rgba(95,70,40,0.12)]',
                    farmerPick && 'ring-2 ring-[#315f3b] border-[#315f3b] shadow-[0_16px_40px_rgba(95,70,40,0.12)]'
                  )}
                  onClick={() => {
                    setSelectedCrop(crop);
                    pushCalendarQuery(selectedMonth, activeTab, crop.id);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{crop.icon}</div>
                      <div>
                        <CardTitle className="text-lg text-[#2f3a2f]">
                          {currentLanguage === 'hi' ? crop.cropNameHindi : crop.cropName}
                        </CardTitle>
                        <CardDescription className="text-[#6f6552]">
                          {getSeasonName(crop.season)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Sprout className="w-4 h-4 text-[#315f3b]" />
                        <span className="text-[#6f6552]">{t.plantingTime}:</span>
                        <span className="font-medium text-[#2f3a2f]">
                          {crop.plantingMonths.map(m => currentLanguage === 'hi' ? months[m-1].shortHi : months[m-1].short).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Scissors className="w-4 h-4 text-[#d89b2b]" />
                        <span className="text-[#6f6552]">{t.harvestTime}:</span>
                        <span className="font-medium text-[#2f3a2f]">
                          {crop.harvestingMonths.map(m => currentLanguage === 'hi' ? months[m-1].shortHi : months[m-1].short).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Leaf className="w-4 h-4 text-[#58774e]" />
                        <span className="text-[#6f6552]">{t.growingPeriod}:</span>
                        <span className="font-medium text-[#2f3a2f]">{crop.growingPeriod} {t.days}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="mt-4 w-full border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCrop(crop);
                        pushCalendarQuery(selectedMonth, activeTab, crop.id);
                      }}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      {t.viewDetails}
                    </Button>
                  </CardContent>
                </Card>
                );
              })}
            </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Crop Detail Dialog */}
        <Dialog
          open={!!selectedCrop}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCrop(null);
              pushCalendarQuery(selectedMonth, activeTab, null);
            }
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-[#d7c7a8] bg-[#fffaf0]">
            {selectedCrop && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span className="text-4xl">{selectedCrop.icon}</span>
                    <div>
                      <h2 className="text-2xl">
                        {currentLanguage === 'hi' ? selectedCrop.cropNameHindi : selectedCrop.cropName}
                      </h2>
                      <Badge variant="outline" className="mt-1 border-[#d7c7a8] bg-[#fffdf7] text-[#6c5a3d]">
                        {getSeasonName(selectedCrop.season)}
                      </Badge>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Description */}
                  <div>
                    <h3 className="mb-2 font-semibold text-[#2f3a2f]">{t.description}</h3>
                    <p className={`text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {currentLanguage === 'hi' ? selectedCrop.descriptionHindi : selectedCrop.description}
                    </p>
                  </div>

                  <div className="space-y-3 rounded-xl border border-[#e2d4b7] bg-[#fffdf7] p-4">
                    <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                      <ExternalLink className="w-4 h-4 shrink-0 text-[#315f3b]" aria-hidden />
                      <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>{t.trustLinksHeading}</span>
                    </h3>
                    <p className={`text-xs leading-relaxed text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {t.trustLinksNote}
                    </p>
                    <ul className="space-y-2.5">
                      {(selectedCrop.referenceLinks?.length
                        ? selectedCrop.referenceLinks
                        : getCropCalendarReferenceLinks(selectedCrop.id)
                      ).map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-start gap-1.5 break-words text-left text-sm text-[#315f3b] underline-offset-2 hover:underline ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                          >
                            <span>{currentLanguage === 'hi' ? link.labelHi : link.labelEn}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-80" aria-hidden />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-[#d7c7a8] bg-[#fffdf7]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sprout className="w-4 h-4 text-[#315f3b]" />
                          {t.plantingTime}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">
                          {selectedCrop.plantingMonths.map(m => 
                            currentLanguage === 'hi' ? months[m-1].nameHi : months[m-1].name
                          ).join(', ')}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-[#d7c7a8] bg-[#fffdf7]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-[#d89b2b]" />
                          {t.harvestTime}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">
                          {selectedCrop.harvestingMonths.map(m => 
                            currentLanguage === 'hi' ? months[m-1].nameHi : months[m-1].name
                          ).join(', ')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Growing Period */}
                  <div className="flex items-center justify-between rounded-lg bg-[#f3ebdd] p-4">
                    <span className="text-[#6f6552]">{t.growingPeriod}</span>
                    <span className="text-lg font-bold text-[#2f3a2f]">{selectedCrop.growingPeriod} {t.days}</span>
                  </div>

                  {/* Tips */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-[#315f3b]" />
                      {t.tips}
                    </h3>
                    <ul className="space-y-2">
                      {(currentLanguage === 'hi' ? selectedCrop.tipsHindi : selectedCrop.tips).map((tip, index) => (
                        <li key={index} className={`flex items-start gap-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          <span className="mt-1 text-[#315f3b]">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Monthly Activity Chart */}
                  <div className="print:hidden">
                    <p className={`mb-3 text-xs text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {t.exportHint}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button type="button" variant="outline" className="flex-1 gap-2 border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 shrink-0" aria-hidden />
                        <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>{t.printOrPdf}</span>
                      </Button>
                      <Button type="button" variant="outline" className="flex-1 gap-2 border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]" onClick={handleDownloadIcs}>
                        <FileDown className="h-4 w-4 shrink-0" aria-hidden />
                        <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>{t.downloadIcs}</span>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">
                      {currentLanguage === 'en' ? 'Monthly Activity' : 'मासिक गतिविधि'}
                    </h3>
                    <div className="grid grid-cols-12 gap-1">
                      {months.map((month) => {
                        const activity = getActivityForMonth(selectedCrop, month.num);
                        return (
                          <div
                            key={month.num}
                            className={`aspect-square rounded-lg flex items-center justify-center text-xs border-2 ${
                              activity === 'planting' 
                                ? 'border-[#315f3b] bg-[#eaf5ec]' 
                                : activity === 'growing'
                                ? 'border-[#58774e] bg-[#eef5ee]'
                                : activity === 'harvesting'
                                ? 'border-[#d89b2b] bg-[#fff4dd]'
                                : 'border-[#d7c7a8] bg-[#f3ebdd]'
                            }`}
                            title={`${month.name}: ${activity || 'inactive'}`}
                          >
                            {activity && (
                              <span className="text-xs">
                                {activity === 'planting' ? 'P' : activity === 'growing' ? 'G' : 'H'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded border border-[#315f3b] bg-[#eaf5ec]" />
                        <span>{t.planting}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded border border-[#58774e] bg-[#eef5ee]" />
                        <span>{t.growing}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded border border-[#d89b2b] bg-[#fff4dd]" />
                        <span>{t.harvesting}</span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const catMeta = cropCategories.find((c) => c.id === selectedCrop.category);
                    const catLabel =
                      currentLanguage === 'hi'
                        ? catMeta?.nameHindi ?? selectedCrop.category
                        : catMeta?.name ?? selectedCrop.category;
                    const browseLabel = t.browseCategoryMarketplace.replace('{category}', catLabel);
                    return (
                      <div className="pt-2 border-t">
                        <Button className="w-full gap-2 border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]" asChild>
                          <Link
                            to={`/marketplace?category=${encodeURIComponent(selectedCrop.category)}`}
                            className={`inline-flex w-full items-center justify-center gap-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                          >
                            <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="text-center">{browseLabel}</span>
                            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                          </Link>
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className={`calendar-print-sheet hidden print:block ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
        {selectedCrop ? (
          <>
            <h1 className="text-2xl font-bold mb-2">
              <span className="mr-2" aria-hidden>
                {selectedCrop.icon}
              </span>
              {currentLanguage === 'hi' ? selectedCrop.cropNameHindi : selectedCrop.cropName}
            </h1>
            <p className="mb-4 text-sm">
              <span className="font-semibold">{t.printZone}:</span>{' '}
              {currentLanguage === 'hi' ? zoneMeta.labelHi : zoneMeta.labelEn}
            </p>
            <h2 className="text-lg font-semibold mb-2">{t.printScheduleTitle}</h2>
            <table>
              <thead>
                <tr>
                  <th>{currentLanguage === 'en' ? 'Month' : 'महीना'}</th>
                  <th>{currentLanguage === 'en' ? 'Activity' : 'गतिविधि'}</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month) => {
                  const act = getActivityForMonth(selectedCrop, month.num);
                  const label =
                    act === 'planting'
                      ? t.planting
                      : act === 'growing'
                        ? t.growing
                        : act === 'harvesting'
                          ? t.harvesting
                          : '—';
                  return (
                    <tr key={month.num}>
                      <td>{currentLanguage === 'hi' ? month.nameHi : month.name}</td>
                      <td>{label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-4 text-sm">
              <span className="font-semibold">{t.plantingTime}:</span>{' '}
              {selectedCrop.plantingMonths
                .map((m) => (currentLanguage === 'hi' ? months[m - 1].nameHi : months[m - 1].name))
                .join(', ')}
            </p>
            <p className="mt-1 text-sm">
              <span className="font-semibold">{t.harvestTime}:</span>{' '}
              {selectedCrop.harvestingMonths
                .map((m) => (currentLanguage === 'hi' ? months[m - 1].nameHi : months[m - 1].name))
                .join(', ')}
            </p>
            <p className="mt-1 text-sm">
              <span className="font-semibold">{t.growingPeriod}:</span> {selectedCrop.growingPeriod} {t.days}
            </p>
            <h3 className="text-base font-semibold mt-4 mb-2">{t.tips}</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {(currentLanguage === 'hi' ? selectedCrop.tipsHindi : selectedCrop.tips).map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
            <p className="mt-6 text-xs leading-relaxed border-t border-neutral-400 pt-3">{t.guideDisclaimer}</p>
            <p className="mt-3 text-xs text-neutral-600">
              {t.printGenerated}: {new Date().toLocaleString(currentLanguage === 'hi' ? 'hi-IN' : 'en-IN')}
            </p>
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default CropCalendar;
