import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CloudRain, Droplets, Loader2, MapPin, RefreshCw, Sun, Thermometer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types';
import {
  assessWeeklyPlantHarvestRisk,
  fetchWeekForecast,
  geocodeLocation,
  type DailyForecast,
  type GeocodeHit,
  type WeeklyRisk,
} from '@/lib/openMeteo';

type Props = {
  user: User | null;
  currentLanguage: string;
};

export function FarmerWeatherWidget({ user, currentLanguage }: Props) {
  const isHi = currentLanguage === 'hi';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geo, setGeo] = useState<GeocodeHit | null>(null);
  const [daily, setDaily] = useState<DailyForecast | null>(null);
  const [risk, setRisk] = useState<WeeklyRisk | null>(null);

  const loc = user?.location;
  const locKey = [loc?.village, loc?.district, loc?.state].join('|');

  const load = useCallback(async () => {
    if (!loc?.district?.trim() && !loc?.state?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const g = await geocodeLocation({
        district: loc.district,
        state: loc.state,
        village: loc.village,
      });
      if (!g) {
        setError('geocode');
        setGeo(null);
        setDaily(null);
        setRisk(null);
        return;
      }
      const f = await fetchWeekForecast(g.latitude, g.longitude);
      if (!f) {
        setError('forecast');
        setGeo(g);
        setDaily(null);
        setRisk(null);
        return;
      }
      setGeo(g);
      setDaily(f);
      setRisk(assessWeeklyPlantHarvestRisk(f));
    } catch {
      setError('network');
      setGeo(null);
      setDaily(null);
      setRisk(null);
    } finally {
      setLoading(false);
    }
  }, [loc?.district, loc?.state, loc?.village]);

  useEffect(() => {
    if (!loc?.district?.trim() && !loc?.state?.trim()) return;
    void load();
  }, [load, locKey, loc?.district, loc?.state]);

  const riskVariant =
    risk?.level === 'high'
      ? 'destructive'
      : risk?.level === 'moderate'
        ? 'secondary'
        : 'outline';

  if (!user || user.role !== 'farmer') return null;

  if (!loc?.district?.trim() && !loc?.state?.trim()) {
    return (
      <Card className="mb-10 border-2 border-sky-200/70 bg-sky-50/40 dark:border-sky-900/50 dark:bg-sky-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CloudRain className="h-5 w-5 text-sky-600" />
            {isHi ? 'इस सप्ताह मौसम व जोखिम' : 'Weather & risk this week'}
          </CardTitle>
          <CardDescription className={isHi ? 'font-hindi' : ''}>
            {isHi
              ? 'अपने खेत के पास का मौसम दिखाने के लिए प्रोफ़ाइल में ज़िला और राज्य जोड़ें।'
              : 'Add district and state on your profile to show local rain and plant/harvest hints.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <Link to="/farmer/profile">{isHi ? 'प्रोफ़ाइल खोलें' : 'Open profile'}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-10 border-2 border-sky-200/70 shadow-md dark:border-sky-900/45">
      <CardHeader className="space-y-1 border-b border-border/60 bg-gradient-to-r from-sky-500/10 to-blue-500/5 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CloudRain className="h-5 w-5 text-sky-600 shrink-0" />
              <span className={isHi ? 'font-hindi' : ''}>
                {isHi ? 'इस सप्ताह मौसम व जोखिम' : 'Weather & plant/harvest risk'}
              </span>
            </CardTitle>
            <CardDescription className="mt-1 flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {geo ? (
                  <span>{geo.displayName}</span>
                ) : loading ? (
                  <span>{isHi ? 'स्थान ढूँढ रहे हैं…' : 'Finding location…'}</span>
                ) : (
                  <span>{[loc.village, loc.district, loc.state].filter(Boolean).join(', ')}</span>
                )}
              </span>
              {geo?.isApproximate ? (
                <span className="text-[11px] text-muted-foreground pl-5">
                  {isHi
                    ? 'गाँव न मिला — ज़िला/जिला-केंद्र के आसपास का मौसम दिखाया जा रहा है।'
                    : 'Village not found in map data — showing weather for the district / nearest match.'}
                </span>
              ) : null}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {isHi ? 'रीफ्रेश' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {loading && !daily ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isHi ? 'मौसम डेटा लोड हो रहा है…' : 'Loading forecast…'}
          </div>
        ) : null}

        {error === 'geocode' || error === 'forecast' || error === 'network' ? (
          <p className="text-sm text-destructive">
            {error === 'network'
              ? isHi
                ? 'नेटवर्क त्रुटि। बाद में फिर कोशिश करें।'
                : 'Network error. Try again shortly.'
              : error === 'forecast'
                ? isHi
                  ? 'पूर्वानुमान लोड नहीं हो सका। रीफ्रेश करें या बाद में कोशिश करें।'
                  : 'Forecast could not be loaded. Refresh or try again shortly.'
                : isHi
                  ? 'मानचित्र पर स्थान नहीं मिला। प्रोफ़ाइल में ज़िला/राज्य सही लिखें या बड़े कस्बे/ज़िला मुख्यालय का नाम आज़माएँ।'
                  : 'Location not found in map data. Check spelling of district/state on your profile, or try a larger nearby place.'}
          </p>
        ) : null}

        {risk && daily ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={riskVariant} className="text-xs font-semibold uppercase tracking-wide">
                {risk.level === 'high'
                  ? isHi
                    ? 'उच्च जोखिम'
                    : 'High risk'
                  : risk.level === 'moderate'
                    ? isHi
                      ? 'मध्यम'
                      : 'Moderate'
                    : isHi
                      ? 'कम'
                      : 'Low'}
              </Badge>
              <span className={`font-semibold text-foreground ${isHi ? 'font-hindi' : ''}`}>
                {isHi ? risk.headlineHi : risk.headlineEn}
              </span>
            </div>
            <p className={`text-sm text-muted-foreground leading-relaxed ${isHi ? 'font-hindi' : ''}`}>
              {isHi ? risk.detailHi : risk.detailEn}
            </p>

            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {isHi ? 'अगले ७ दिन (संकेत)' : 'Next 7 days (indicative)'}
              </p>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs">
                {daily.dates.map((date, i) => {
                  const mm = daily.precipitationMm[i] ?? 0;
                  const pop = daily.precipProbMax[i] ?? 0;
                  const tMax = daily.tempMaxC[i];
                  const d = new Date(date + 'T12:00:00');
                  const label = d.toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', { weekday: 'short' });
                  const rainy = mm >= 5 || pop >= 50;
                  return (
                    <div
                      key={date}
                      className={`rounded-lg border px-0.5 py-2 sm:px-1 ${rainy ? 'bg-sky-100/80 dark:bg-sky-950/40 border-sky-200' : 'bg-background/80'}`}
                    >
                      <div className="font-semibold text-foreground truncate">{label}</div>
                      {rainy ? (
                        <Droplets className="h-3.5 w-3.5 mx-auto my-1 text-sky-600" />
                      ) : (
                        <Sun className="h-3.5 w-3.5 mx-auto my-1 text-amber-500 opacity-80" />
                      )}
                      <div className="tabular-nums text-muted-foreground">{mm.toFixed(0)} mm</div>
                      <div className="text-[9px] text-muted-foreground">{Math.round(pop)}%</div>
                      {tMax != null && (
                        <div className="flex items-center justify-center gap-0.5 text-[9px] text-muted-foreground mt-0.5">
                          <Thermometer className="h-3 w-3" />
                          {Math.round(tMax)}°
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug">
              {isHi
                ? 'डेटा Open-Meteo से — केवल सामान्य मार्गदर्शन; स्थानीय मौसम विभाग/KVK से पुष्टि करें।'
                : 'Data from Open-Meteo — general guidance only; confirm with local weather advisories or KVK.'}
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
