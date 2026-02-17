import { useState } from 'react';
import { Calendar, Filter, Search, Sprout, Scissors, Leaf, Info, TrendingUp, Sparkles, Clock, Sun, List } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector } from '@/hooks/useRedux';
import { cropCalendar, cropCategories } from '@/data/mockData';
import { CropCalendarEntry, CropCategory } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';

const CropCalendar = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedCategory, setSelectedCategory] = useState<CropCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<CropCalendarEntry | null>(null);

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

  const getSeason = (month: number): 'spring' | 'summer' | 'monsoon' | 'winter' => {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'monsoon';
    if (month >= 9 && month <= 11) return 'winter';
    return 'winter';
  };

  const getSeasonName = (season: string) => {
    const names = {
      spring: { en: 'Spring', hi: 'वसंत' },
      summer: { en: 'Summer', hi: 'गर्मी' },
      monsoon: { en: 'Monsoon', hi: 'मानसून' },
      winter: { en: 'Winter', hi: 'सर्दी' },
    };
    return names[season as keyof typeof names]?.[currentLanguage] || season;
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

  const filteredCrops = cropCalendar.filter(crop => {
    const matchesCategory = selectedCategory === 'all' || crop.category === selectedCategory;
    const matchesSearch = 
      crop.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.cropNameHindi.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const cropsForMonth = filteredCrops.filter(crop => {
    const activity = getActivityForMonth(crop, selectedMonth);
    return activity !== null;
  });

  const content = {
    en: {
      title: 'Crop Calendar & Seasonal Guide',
      subtitle: 'Know when to plant and harvest your crops',
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
      allCategories: 'All Categories',
      currentMonth: 'Current Month',
    },
    hi: {
      title: 'फसल कैलेंडर और मौसमी गाइड',
      subtitle: 'जानें कब अपनी फसलें लगानी और काटनी हैं',
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
      allCategories: 'सभी श्रेणियां',
      currentMonth: 'वर्तमान महीना',
    },
  };

  const t = content[currentLanguage];
  const currentMonth = new Date().getMonth() + 1;

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
        return 'bg-primary/10 text-primary border-primary/20';
      case 'growing':
        return 'bg-success/10 text-success border-success/20';
      case 'harvesting':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground';
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
  const currentSeason = getSeason(selectedMonth);
  const cropsThisMonth = cropsForMonth.length;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <AnimateOnScroll animation="fade-in">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {currentLanguage === 'en' ? 'Seasonal Planning Guide' : 'मौसमी योजना गाइड'}
                </span>
              </div>
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.title}
              </h1>
              <p className={`text-xl text-muted-foreground max-w-2xl mx-auto ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          {/* Season Navigation Bar */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <Card className="mb-8 border-2 shadow-lg bg-gradient-to-br from-card to-muted/30">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <span className={`text-base font-semibold text-foreground flex items-center gap-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                    <Sun className="w-5 h-5 text-secondary" />
                    {currentLanguage === 'en' ? 'Browse by Season:' : 'मौसम से ब्राउज़ करें:'}
                  </span>
                  {[
                    { id: 'winter', name: 'Winter', nameHi: 'सर्दी', months: [12, 1, 2], emoji: '❄️', color: 'from-blue-500/20 to-blue-600/10 text-blue-600 border-blue-500/30' },
                    { id: 'spring', name: 'Spring', nameHi: 'वसंत', months: [3, 4, 5], emoji: '🌷', color: 'from-green-500/20 to-green-600/10 text-green-600 border-green-500/30' },
                    { id: 'monsoon', name: 'Monsoon', nameHi: 'मानसून', months: [6, 7, 8], emoji: '🌧️', color: 'from-purple-500/20 to-purple-600/10 text-purple-600 border-purple-500/30' },
                    { id: 'autumn', name: 'Autumn', nameHi: 'शरद', months: [9, 10, 11], emoji: '🍂', color: 'from-orange-500/20 to-orange-600/10 text-orange-600 border-orange-500/30' },
                  ].map((season) => {
                    const isActive = season.months.includes(selectedMonth);
                    const seasonCrops = getCropsBySeason(season.id);
                    return (
                      <button
                        key={season.id}
                        onClick={() => {
                          if (!season.months.includes(selectedMonth)) {
                            setSelectedMonth(season.months[0]);
                          }
                        }}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                          isActive 
                            ? `bg-gradient-to-br ${season.color} border-current font-bold shadow-lg scale-105` 
                            : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-muted'
                        }`}
                      >
                        <span className="text-2xl">{season.emoji}</span>
                        <span className={`text-sm font-semibold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          {currentLanguage === 'en' ? season.name : season.nameHi}
                        </span>
                        <Badge variant="secondary" className="ml-1 text-xs font-bold">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {currentLanguage === 'en' ? 'Current Month' : 'वर्तमान महीना'}
                      </p>
                      <p className={`text-2xl font-bold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {currentLanguage === 'hi' ? currentMonthData.nameHi : currentMonthData.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-secondary/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {getSeasonName(currentSeason)}
                      </p>
                      <p className="text-2xl font-bold">
                        {cropsThisMonth} {currentLanguage === 'en' ? 'Crops' : 'फसलें'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-success/20 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {currentLanguage === 'en' ? 'Total Crops' : 'कुल फसलें'}
                      </p>
                      <p className="text-2xl font-bold">
                        {filteredCrops.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AnimateOnScroll>

          {/* Filters */}
          <AnimateOnScroll animation="slide-up" delay={0.3}>
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-6 text-lg border-2 focus:border-primary"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={(v: any) => setSelectedCategory(v)}>
                <SelectTrigger className="w-full md:w-56 py-6 border-2">
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

              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-full md:w-56 py-6 border-2">
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
            </div>
          </AnimateOnScroll>

          <Tabs defaultValue="calendar" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-muted p-1 rounded-xl">
              <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                {t.calendar}
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <List className="w-4 h-4 mr-2" />
                {t.list}
              </TabsTrigger>
            </TabsList>

            {/* Calendar View */}
            <TabsContent value="calendar" className="space-y-6">
              {/* Month Overview */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        {currentLanguage === 'en' 
                          ? currentMonthData.name 
                          : currentMonthData.nameHi} - {getSeasonName(getSeason(selectedMonth))}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {currentLanguage === 'en' 
                          ? `Crops to plant, grow, and harvest in ${currentMonthData.name}`
                          : `${currentMonthData.nameHi} में लगाने, बढ़ने और काटने वाली फसलें`}
                      </CardDescription>
                    </div>
                    <Badge className="text-lg px-4 py-2 bg-primary text-primary-foreground">
                      {cropsThisMonth} {currentLanguage === 'en' ? 'Crops' : 'फसलें'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {cropsForMonth.length > 0 ? (
                    <StaggerContainer staggerDelay={0.05} animation="slide-up" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cropsForMonth.map((crop) => {
                        const activity = getActivityForMonth(crop, selectedMonth);
                        return (
                          <Card 
                            key={crop.id} 
                            className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-primary/50 group"
                            onClick={() => setSelectedCrop(crop)}
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
                      <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-muted rounded-full mb-6">
                          <Calendar className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h3 className={`text-xl font-bold text-foreground mb-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          {t.noCrops}
                        </h3>
                        <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          {t.tryDifferent}
                        </p>
                      </div>
                    </AnimateOnScroll>
                  )}
                </CardContent>
              </Card>

              {/* Year Calendar Grid */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {currentLanguage === 'en' ? 'Annual Calendar' : 'वार्षिक कैलेंडर'}
                  </CardTitle>
                  <CardDescription>
                    {currentLanguage === 'en' 
                      ? 'View all crops throughout the year - Click any month to see crops' 
                      : 'पूरे वर्ष सभी फसलें देखें - किसी भी महीने पर क्लिक करें'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      <div className="grid grid-cols-12 gap-3">
                        {months.map((month) => {
                          const monthCrops = filteredCrops.filter(c => getActivityForMonth(c, month.num) !== null).length;
                          const isSelected = selectedMonth === month.num;
                          const isCurrent = month.num === currentMonth;
                          return (
                            <button
                              key={month.num}
                              onClick={() => setSelectedMonth(month.num)}
                              className={`text-center p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                                isSelected 
                                  ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg scale-105' 
                                  : 'border-border hover:border-primary/50 bg-card'
                              } ${isCurrent && !isSelected ? 'ring-2 ring-primary/30' : ''}`}
                            >
                              <p className={`text-sm font-bold mb-1 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {currentLanguage === 'hi' ? month.shortHi : month.short}
                              </p>
                              <p className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                {monthCrops} {currentLanguage === 'en' ? 'crops' : 'फसलें'}
                              </p>
                              {isCurrent && (
                                <div className="mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {currentLanguage === 'en' ? 'Now' : 'अभी'}
                                  </Badge>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCrops.map((crop) => (
                <Card 
                  key={crop.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedCrop(crop)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{crop.icon}</div>
                      <div>
                        <CardTitle className="text-lg">
                          {currentLanguage === 'hi' ? crop.cropNameHindi : crop.cropName}
                        </CardTitle>
                        <CardDescription>
                          {getSeasonName(crop.season)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Sprout className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">{t.plantingTime}:</span>
                        <span className="font-medium">
                          {crop.plantingMonths.map(m => currentLanguage === 'hi' ? months[m-1].shortHi : months[m-1].short).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Scissors className="w-4 h-4 text-warning" />
                        <span className="text-muted-foreground">{t.harvestTime}:</span>
                        <span className="font-medium">
                          {crop.harvestingMonths.map(m => currentLanguage === 'hi' ? months[m-1].shortHi : months[m-1].short).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Leaf className="w-4 h-4 text-success" />
                        <span className="text-muted-foreground">{t.growingPeriod}:</span>
                        <span className="font-medium">{crop.growingPeriod} {t.days}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCrop(crop);
                      }}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      {t.viewDetails}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Crop Detail Dialog */}
        <Dialog open={!!selectedCrop} onOpenChange={() => setSelectedCrop(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedCrop && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span className="text-4xl">{selectedCrop.icon}</span>
                    <div>
                      <h2 className="text-2xl">
                        {currentLanguage === 'hi' ? selectedCrop.cropNameHindi : selectedCrop.cropName}
                      </h2>
                      <Badge variant="outline" className="mt-1">
                        {getSeasonName(selectedCrop.season)}
                      </Badge>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Description */}
                  <div>
                    <h3 className="font-semibold mb-2">{t.description}</h3>
                    <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {currentLanguage === 'hi' ? selectedCrop.descriptionHindi : selectedCrop.description}
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sprout className="w-4 h-4 text-primary" />
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

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-warning" />
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
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="text-muted-foreground">{t.growingPeriod}</span>
                    <span className="font-bold text-lg">{selectedCrop.growingPeriod} {t.days}</span>
                  </div>

                  {/* Tips */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      {t.tips}
                    </h3>
                    <ul className="space-y-2">
                      {(currentLanguage === 'hi' ? selectedCrop.tipsHindi : selectedCrop.tips).map((tip, index) => (
                        <li key={index} className={`flex items-start gap-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          <span className="text-primary mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Monthly Activity Chart */}
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
                                ? 'bg-primary/20 border-primary' 
                                : activity === 'growing'
                                ? 'bg-success/20 border-success'
                                : activity === 'harvesting'
                                ? 'bg-warning/20 border-warning'
                                : 'bg-muted border-border'
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
                        <div className="w-3 h-3 bg-primary/20 border border-primary rounded" />
                        <span>{t.planting}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-success/20 border border-success rounded" />
                        <span>{t.growing}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-warning/20 border border-warning rounded" />
                        <span>{t.harvesting}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </Layout>
  );
};

export default CropCalendar;

