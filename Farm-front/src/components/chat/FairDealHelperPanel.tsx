import { useCallback, useState } from 'react';
import { Scale, Copy, MessageSquareText, ListChecks, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface FairDealHelperPanelProps {
  chatId: string;
  lang: 'en' | 'hi';
  /** Put AI text into the chat composer (replace or append). */
  onInsertIntoComposer: (text: string, options?: { append?: boolean }) => void;
  onClose?: () => void;
  className?: string;
}

export function FairDealHelperPanel({
  chatId,
  lang,
  onInsertIntoComposer,
  onClose,
  className = '',
}: FairDealHelperPanelProps) {
  const { toast } = useToast();
  const en = lang === 'en';

  const [draft, setDraft] = useState('');
  const [rephraseLoading, setRephraseLoading] = useState(false);
  const [neutralDraft, setNeutralDraft] = useState<string | null>(null);
  const [rephraseNotes, setRephraseNotes] = useState<string | null>(null);

  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questions, setQuestions] = useState<string[] | null>(null);

  const [term, setTerm] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainEn, setExplainEn] = useState<string | null>(null);
  const [explainHi, setExplainHi] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: en ? 'Copied' : 'कॉपी हो गया' });
      } catch {
        toast({
          title: en ? 'Copy failed' : 'कॉपी नहीं हुआ',
          variant: 'destructive',
        });
      }
    },
    [toast, en]
  );

  const runRephrase = async () => {
    const t = draft.trim();
    if (!t) {
      toast({
        title: en ? 'Type something first' : 'पहले कुछ लिखें',
        variant: 'destructive',
      });
      return;
    }
    setRephraseLoading(true);
    setNeutralDraft(null);
    setRephraseNotes(null);
    try {
      const { data } = await apiService.ai.fairDealCoach({
        chatId,
        mode: 'rephrase',
        draftText: t,
      });
      if (data.neutralDraft) {
        setNeutralDraft(data.neutralDraft);
        setRephraseNotes(data.notes ?? null);
      }
    } catch (e: any) {
      toast({
        title: en ? 'Could not rephrase' : 'नहीं बदल सके',
        description: e?.response?.data?.message || e?.message,
        variant: 'destructive',
      });
    } finally {
      setRephraseLoading(false);
    }
  };

  const loadQuestions = async () => {
    setQuestionsLoading(true);
    setQuestions(null);
    try {
      const { data } = await apiService.ai.fairDealCoach({
        chatId,
        mode: 'questions',
      });
      setQuestions(data.questions || []);
    } catch (e: any) {
      toast({
        title: en ? 'Could not load ideas' : 'सुझाव नहीं मिले',
        description: e?.response?.data?.message || e?.message,
        variant: 'destructive',
      });
    } finally {
      setQuestionsLoading(false);
    }
  };

  const runExplain = async () => {
    const w = term.trim();
    if (!w) {
      toast({
        title: en ? 'Enter a word or phrase' : 'शब्द लिखें',
        variant: 'destructive',
      });
      return;
    }
    setExplainLoading(true);
    setExplainEn(null);
    setExplainHi(null);
    try {
      const { data } = await apiService.ai.fairDealCoach({
        chatId,
        mode: 'explain_term',
        term: w,
      });
      setExplainEn(data.simpleEnglish || null);
      setExplainHi(data.simpleHindi || null);
    } catch (e: any) {
      toast({
        title: en ? 'Could not explain' : 'समझा नहीं सके',
        description: e?.response?.data?.message || e?.message,
        variant: 'destructive',
      });
    } finally {
      setExplainLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full min-h-0 bg-card ${className}`}>
      <div className="shrink-0 border-b border-border p-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Scale className="h-5 w-5 text-primary shrink-0" aria-hidden />
          <div>
            <h3 className="font-semibold text-sm leading-tight">
              {en ? 'Fair deal helper' : 'सौदा सहायक'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {en
                ? 'Neutral wording, question ideas, simple meanings — not price advice.'
                : 'समझदार लफ़्ज़, सवाल के आइडियो, आसान अर्थ — कीमत की सलाह नहीं।'}
            </p>
          </div>
        </div>
        {onClose && (
          <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={onClose}>
            {en ? 'Close' : 'बंद'}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          <p className="text-xs text-muted-foreground border-l-2 border-amber-500/70 pl-2 leading-relaxed">
            {en
              ? 'Suggestions only. Does not set prices or “win” a deal for you. Read before sending.'
              : 'सिर्फ सुझाव। कीमत तय नहीं करता और सौदा “जितवाता” नहीं। भेजने से पहले पढ़ें।'}
          </p>

          {/* Rephrase */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              {en ? 'Neutral tone' : 'नरम लहजा'}
            </div>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={800}
              placeholder={
                en
                  ? 'Paste or type what you want to say…'
                  : 'जो कहना चाहते हैं वो यहाँ लिखें…'
              }
              className="resize-y text-sm min-h-[4.5rem]"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={rephraseLoading}
              onClick={() => void runRephrase()}
              className="w-full sm:w-auto"
            >
              {rephraseLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {en ? 'Make it neutral' : 'नरम करें'}
            </Button>
            {neutralDraft && (
              <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
                <p className="whitespace-pre-wrap">{neutralDraft}</p>
                {rephraseNotes ? (
                  <p className="text-xs text-muted-foreground">{rephraseNotes}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => copy(neutralDraft)}>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    {en ? 'Copy' : 'कॉपी'}
                  </Button>
                  <Button type="button" size="sm" onClick={() => onInsertIntoComposer(neutralDraft)}>
                    {en ? 'Put in message box' : 'मैसेज बॉक्स में डालें'}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Questions */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              {en ? 'Questions to ask' : 'पूछने के सवाल'}
            </div>
            <p className="text-xs text-muted-foreground">
              {en
                ? 'Ideas to understand grade, delivery, timing — you choose what to send.'
                : 'ग्रेड, पहुँच, समय समझने के लिए — भेजना आप तय करें।'}
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={questionsLoading}
              onClick={() => void loadQuestions()}
              className="w-full sm:w-auto"
            >
              {questionsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {en ? 'Get ideas' : 'आइडिया लें'}
            </Button>
            {questions && questions.length > 0 && (
              <ul className="space-y-2 text-sm">
                {questions.map((q, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-border/80 bg-background/50 p-2 flex flex-col gap-2"
                  >
                    <span>{q}</span>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => copy(q)}>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        {en ? 'Copy' : 'कॉपी'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onInsertIntoComposer(q, { append: true })}
                      >
                        {en ? 'Add to message' : 'मैसेज में जोड़ें'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Explain term */}
          <section className="space-y-2 pb-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              {en ? 'Explain a term' : 'शब्द समझाएँ'}
            </div>
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                maxLength={120}
                placeholder={en ? 'e.g. FOB, quintal, mandi' : 'जैसे: क्विंटल, मंडी'}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={explainLoading}
                onClick={() => void runExplain()}
              >
                {explainLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : en ? 'Explain' : 'समझाएँ'}
              </Button>
            </div>
            {(explainEn || explainHi) && (
              <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
                {explainEn ? (
                  <p>
                    <span className="text-xs font-medium text-muted-foreground block mb-0.5">English</span>
                    {explainEn}
                  </p>
                ) : null}
                {explainHi ? (
                  <p>
                    <span className="text-xs font-medium text-muted-foreground block mb-0.5">हिंदी</span>
                    {explainHi}
                  </p>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
