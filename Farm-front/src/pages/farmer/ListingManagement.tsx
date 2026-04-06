import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Package,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Mic,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAppSelector } from '@/hooks/useRedux';
import { Product, CropCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import {
  parseListingQuantity,
  validatePrice,
  validateQuantity,
  validateRequired,
} from '@/lib/validators';
import { resolveFarmerAvatarUrl } from '@/lib/farmerAvatarUrl';
import { useCopilot } from '@/context/CopilotContext';

type ListingCoachSuggestions = {
  name: string;
  nameHindi: string;
  description: string;
  category: CropCategory;
  unit: string;
  suggestedPrice: number | null;
  suggestedAvailableQuantity: number | null;
  suggestedMinOrderQuantity: number | null;
  suggestedHarvestDate: string | null;
  honestyHints: string[];
  isOrganicGuess: boolean;
  isNegotiableGuess: boolean;
};

const ListingManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  /** Single dialog: add (editingProductId null) or edit (set to product id). */
  const [isListingFormOpen, setIsListingFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [listings, setListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    nameHindi: '',
    category: 'vegetables' as CropCategory,
    description: '',
    price: '',
    unit: 'kg',
    minOrderQuantity: '',
    availableQuantity: '',
    harvestDate: '',
    isOrganic: false,
    isNegotiable: true,
    imageUrls: [] as string[],
    imageUrlInput: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [coachNotes, setCoachNotes] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachSuggestions, setCoachSuggestions] = useState<ListingCoachSuggestions | null>(null);
  const [coachDisclaimer, setCoachDisclaimer] = useState('');
  const [coachError, setCoachError] = useState<string | null>(null);
  const [isListeningCoach, setIsListeningCoach] = useState(false);
  const coachRecognitionRef = useRef<SpeechRecognition | null>(null);
  const { setCopilotContext } = useCopilot();

  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<Array<{ id: string; file: File; previewUrl: string }>>(
    []
  );

  /** Always read after `await` so quantities match what the farmer sees (fixes stale closure during image upload). */
  const newProductRef = useRef(newProduct);
  const imageFilesRef = useRef(imageFiles);
  newProductRef.current = newProduct;
  imageFilesRef.current = imageFiles;

  const addImageUrl = () => {
    const url = (newProduct.imageUrlInput || '').trim();
    if (!url) return;
    setNewProduct((prev) => ({
      ...prev,
      imageUrls: Array.from(new Set([...(prev.imageUrls || []), url])).slice(0, 5),
      imageUrlInput: '',
    }));
  };

  const removeImageUrl = (url: string) => {
    setNewProduct((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((u) => u !== url),
    }));
  };

  const handleImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const maxFileSizeBytes = 2 * 1024 * 1024; // 2MB per image

    const selected = Array.from(files).filter((f) => {
      if (f.size <= maxFileSizeBytes) return true;
      toast({
        title: currentLanguage === 'en' ? 'Image too large' : 'छवि बहुत बड़ी है',
        description:
          currentLanguage === 'en'
            ? 'Please choose an image under 2MB.'
            : 'कृपया 2MB से छोटी छवि चुनें।',
        variant: 'destructive',
      });
      return false;
    });

    if (selected.length === 0) return;

    setImageFiles((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const next = [...prev];
      for (const f of selected) {
        const id = `${f.name}-${f.size}-${f.lastModified}`;
        if (existingIds.has(id)) continue;
        next.push({ id, file: f, previewUrl: URL.createObjectURL(f) });
      }
      return next.slice(0, 5);
    });
  };

  const removeImageFile = (id: string) => {
    setImageFiles((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  useEffect(() => {
    return () => {
      imageFiles.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
  }, [imageFiles]);

  useEffect(() => {
    setCopilotContext({
      page: 'listing',
      listing: {
        title: (newProduct.name || newProduct.nameHindi).trim() || undefined,
        description: newProduct.description.trim() || undefined,
        category: newProduct.category,
        unit: newProduct.unit,
        notes: coachNotes.trim() || undefined,
      },
      harvest: {
        crop: newProduct.category,
        notes: newProduct.harvestDate.trim()
          ? `Listed harvest: ${newProduct.harvestDate.trim()}`
          : undefined,
      },
    });
    return () => setCopilotContext(null);
  }, [
    newProduct.name,
    newProduct.nameHindi,
    newProduct.description,
    newProduct.category,
    newProduct.unit,
    newProduct.harvestDate,
    coachNotes,
    setCopilotContext,
  ]);

  const stopCoachVoice = useCallback(() => {
    try {
      coachRecognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    coachRecognitionRef.current = null;
    setIsListeningCoach(false);
  }, []);

  const resetListingForm = useCallback(() => {
    stopCoachVoice();
    setCoachNotes('');
    setCoachSuggestions(null);
    setCoachDisclaimer('');
    setCoachError(null);
    setCoachLoading(false);
    setEditingProductId(null);
    setImageFiles((prev) => {
      prev.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      return [];
    });
    setNewProduct({
      name: '',
      nameHindi: '',
      category: 'vegetables',
      description: '',
      price: '',
      unit: 'kg',
      minOrderQuantity: '',
      availableQuantity: '',
      harvestDate: '',
      isOrganic: false,
      isNegotiable: true,
      imageUrls: [],
      imageUrlInput: '',
    });
    setFormErrors({});
  }, [stopCoachVoice]);

  const harvestDateToInputValue = (iso: string | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
    return d.toISOString().slice(0, 10);
  };

  const openAddListingDialog = () => {
    resetListingForm();
    setIsListingFormOpen(true);
  };

  const openEditListingDialog = (listing: Product) => {
    stopCoachVoice();
    setCoachNotes('');
    setCoachSuggestions(null);
    setCoachDisclaimer('');
    setCoachError(null);
    setImageFiles((prev) => {
      prev.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      return [];
    });
    setEditingProductId(listing.id);
    setNewProduct({
      name: listing.name,
      nameHindi: listing.nameHindi || '',
      category: listing.category,
      description: listing.description || '',
      price: String(listing.price),
      unit: listing.unit,
      minOrderQuantity: String(listing.minOrderQuantity ?? 1),
      availableQuantity: String(listing.availableQuantity),
      harvestDate: harvestDateToInputValue(listing.harvestDate),
      isOrganic: !!listing.isOrganic,
      isNegotiable: !!listing.isNegotiable,
      imageUrls: [...(listing.images || [])].slice(0, 5),
      imageUrlInput: '',
    });
    setFormErrors({});
    setIsListingFormOpen(true);
  };

  function getListingFormErrors(p: typeof newProduct): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!validateRequired(p.name)) {
      errors.name =
        currentLanguage === 'en'
          ? 'Product name is required'
          : 'उत्पाद नाम आवश्यक है';
    }

    if (!validateRequired(p.price) || !validatePrice(p.price)) {
      errors.price =
        currentLanguage === 'en'
          ? 'Enter a valid price greater than 0'
          : '0 से अधिक मान्य कीमत दर्ज करें';
    }

    if (
      !validateRequired(p.availableQuantity) ||
      !validateQuantity(p.availableQuantity, 1)
    ) {
      errors.availableQuantity =
        currentLanguage === 'en'
          ? 'Enter a valid whole number for available quantity (no decimals).'
          : 'उपलब्ध मात्रा के लिए पूर्ण संख्या दर्ज करें (दशमलव नहीं)।';
    }

    if (p.minOrderQuantity && !validateQuantity(p.minOrderQuantity, 1)) {
      errors.minOrderQuantity =
        currentLanguage === 'en'
          ? 'Enter a valid whole number for minimum order (no decimals).'
          : 'न्यूनतम ऑर्डर के लिए पूर्ण संख्या दर्ज करें (दशमलव नहीं)।';
    }

    const availParsed = parseListingQuantity(p.availableQuantity);
    const minParsed =
      p.minOrderQuantity != null && String(p.minOrderQuantity).trim() !== ''
        ? parseListingQuantity(p.minOrderQuantity)
        : 1;
    if (
      availParsed !== null &&
      minParsed !== null &&
      minParsed > availParsed
    ) {
      errors.minOrderQuantity =
        currentLanguage === 'en'
          ? 'Minimum order cannot be greater than available quantity.'
          : 'न्यूनतम ऑर्डर उपलब्ध मात्रा से अधिक नहीं हो सकता।';
    }

    return errors;
  }

  const validateNewProduct = () => {
    const errors = getListingFormErrors(newProduct);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchCoachSuggestions = async () => {
    setCoachError(null);
    setCoachLoading(true);
    try {
      const { data } = await apiService.ai.listingCoach({
        notes: coachNotes,
        district: user?.location?.district,
        state: user?.location?.state,
      });
      const c = data?.suggestions?.category;
      const safeCategory: CropCategory =
        c === 'vegetables' ||
        c === 'fruits' ||
        c === 'grains' ||
        c === 'pulses' ||
        c === 'spices' ||
        c === 'dairy' ||
        c === 'other'
          ? c
          : 'other';
      setCoachSuggestions({ ...data.suggestions, category: safeCategory });
      setCoachDisclaimer(data.disclaimer || '');
      toast({
        title:
          currentLanguage === 'en'
            ? 'Suggestions ready — please review'
            : 'सुझाव तैयार — कृपया जाँच करें',
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        (currentLanguage === 'en'
          ? 'Could not get suggestions.'
          : 'सुझाव नहीं मिल सके।');
      setCoachError(msg);
      toast({
        title: currentLanguage === 'en' ? 'Coach error' : 'कोच त्रुटि',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setCoachLoading(false);
    }
  };

  const applyCoachToForm = () => {
    if (!coachSuggestions) return;
    setNewProduct((prev) => ({
      ...prev,
      name: coachSuggestions.name,
      nameHindi: coachSuggestions.nameHindi || prev.nameHindi,
      description: coachSuggestions.description,
      category: coachSuggestions.category,
      unit: coachSuggestions.unit,
      price:
        coachSuggestions.suggestedPrice != null
          ? String(coachSuggestions.suggestedPrice)
          : prev.price,
      availableQuantity:
        coachSuggestions.suggestedAvailableQuantity != null
          ? String(Math.round(coachSuggestions.suggestedAvailableQuantity))
          : prev.availableQuantity,
      minOrderQuantity:
        coachSuggestions.suggestedMinOrderQuantity != null
          ? String(Math.round(coachSuggestions.suggestedMinOrderQuantity))
          : prev.minOrderQuantity,
      harvestDate: coachSuggestions.suggestedHarvestDate || prev.harvestDate,
      isOrganic: coachSuggestions.isOrganicGuess,
      isNegotiable: coachSuggestions.isNegotiableGuess,
    }));
    toast({
      title:
        currentLanguage === 'en'
          ? 'Applied to form'
          : 'फ़ॉर्म में लगा दिया',
      description:
        currentLanguage === 'en'
          ? 'Edit every field, then post when you are sure.'
          : 'हर फ़ील्ड बदलें, फिर पोस्ट करें जब आप सुनिश्चित हों।',
    });
  };

  const toggleCoachVoice = () => {
    if (isListeningCoach) {
      stopCoachVoice();
      return;
    }
    type SpeechRecCtor = new () => SpeechRecognition;
    const w = window as typeof window & {
      SpeechRecognition?: SpeechRecCtor;
      webkitSpeechRecognition?: SpeechRecCtor;
    };
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) {
      toast({
        title:
          currentLanguage === 'en'
            ? 'Voice not supported'
            : 'आवाज़ समर्थित नहीं',
        description:
          currentLanguage === 'en'
            ? 'Try Chrome or Edge on desktop, or type your notes.'
            : 'डेस्कटॉप पर Chrome या Edge आज़माएँ, या टाइप करें।',
        variant: 'destructive',
      });
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      const t = text.trim();
      if (t) {
        setCoachNotes((prev) => (prev ? `${prev} ${t}` : t));
      }
    };
    recognition.onerror = () => {
      stopCoachVoice();
      toast({
        title: currentLanguage === 'en' ? 'Mic error' : 'माइक त्रुटि',
        variant: 'destructive',
      });
    };
    recognition.onend = () => {
      coachRecognitionRef.current = null;
      setIsListeningCoach(false);
    };
    coachRecognitionRef.current = recognition;
    setIsListeningCoach(true);
    try {
      recognition.start();
    } catch {
      stopCoachVoice();
      toast({
        title: currentLanguage === 'en' ? 'Could not start mic' : 'माइक शुरू नहीं हुआ',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    return () => {
      try {
        coachRecognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      coachRecognitionRef.current = null;
    };
  }, []);

  const loadListings = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await apiService.products.getAllMine();
      const backendProducts = res.data?.products || [];

      const mapped: Product[] = backendProducts.map((p: any) => ({
        id: p._id || p.id,
        farmerId: p.farmer?._id || p.farmer || '',
        farmerName: p.farmer?.name || 'Farmer',
        farmerAvatar: resolveFarmerAvatarUrl(p.farmer?.avatar),
        farmerRating: 4.8,
        farmerLocation: p.farmer?.location
          ? `${p.farmer.location.district}, ${p.farmer.location.state}`
          : '',
        name: p.name,
        nameHindi: p.nameHindi,
        category: p.category,
        description: p.description || '',
        images:
          p.images && p.images.length > 0
            ? p.images
            : ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600'],
        price: p.price,
        unit: p.unit,
        minOrderQuantity: p.minOrderQuantity || 1,
        availableQuantity: p.availableQuantity,
        harvestDate: p.harvestDate || new Date().toISOString(),
        isOrganic: !!p.isOrganic,
        isNegotiable: !!p.isNegotiable,
        status: (p.status as Product['status']) || 'active',
        createdAt: p.createdAt || new Date().toISOString(),
        views: p.views || 0,
        inquiries: 0,
      }));

      setListings(mapped);
    } catch (error: any) {
      console.error('Failed to load listings', error);
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to load listings.'
            : 'लिस्टिंग लोड करने में विफल।'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, currentLanguage, toast]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  /** Deep link from dashboard: /farmer/listings?coach=1 opens Add Listing dialog with AI coach visible. */
  useEffect(() => {
    const c = searchParams.get('coach');
    if (c !== '1' && c !== 'true') return;
    resetListingForm();
    setIsListingFormOpen(true);
  }, [searchParams, resetListingForm]);

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortLowStockFirst = useMemo(() => {
    const s = searchParams.get('sort');
    return s === 'quantity' || s === 'stock';
  }, [searchParams]);

  const displayedListings = useMemo(() => {
    if (!sortLowStockFirst) return filteredListings;
    return [...filteredListings].sort((a, b) => a.availableQuantity - b.availableQuantity);
  }, [filteredListings, sortLowStockFirst]);

  const clearStockSort = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('sort');
        return next;
      },
      { replace: true }
    );
  };

  const handleStatusToggle = async (productId: string) => {
    const listing = listings.find((p) => p.id === productId);
    if (!listing || togglingId) return;
    const previousStatus = listing.status;
    const newStatus = listing.status === 'active' ? 'hidden' : 'active';
    setTogglingId(productId);
    setListings((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, status: newStatus as Product['status'] } : p
      )
    );
    try {
      await apiService.products.update(productId, { status: newStatus });
      toast({
        title:
          newStatus === 'active'
            ? currentLanguage === 'en'
              ? 'Listing activated'
              : 'लिस्टिंग सक्रिय'
            : currentLanguage === 'en'
              ? 'Listing hidden'
              : 'लिस्टिंग छिपाई गई',
      });
    } catch (error: any) {
      setListings((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, status: previousStatus } : p
        )
      );
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Could not update listing status.'
            : 'लिस्टिंग स्थिति अपडेट नहीं हो सकी।'),
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await apiService.products.delete(productId);
      setListings((prev) => prev.filter((p) => p.id !== productId));
      toast({
        title:
          currentLanguage === 'en'
            ? 'Listing Deleted'
            : 'लिस्टिंग हटाई गई',
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to delete listing.'
            : 'लिस्टिंग हटाने में विफल।'),
        variant: 'destructive',
      });
    }
  };

  const handleSaveListing = async () => {
    if (!validateNewProduct()) {
      toast({
        title: currentLanguage === 'en' ? 'Please fix the errors' : 'कृपया त्रुटियाँ सुधारें',
        description:
          currentLanguage === 'en'
            ? 'Some listing fields are missing or invalid.'
            : 'कुछ लिस्टिंग फ़ील्ड गायब हैं या अमान्य हैं।',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingImages(true);

      const filesSnapshot = imageFilesRef.current.map((x) => x);
      let uploadedUrls: string[] = [];
      if (filesSnapshot.length > 0) {
        const uploadRes = await apiService.uploads.uploadImages(
          filesSnapshot.map((x) => x.file)
        );
        uploadedUrls = (uploadRes.data?.urls || []).filter(Boolean);
      }

      // Let React flush any pending state updates from edits during upload before reading the ref.
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

      const latest = newProductRef.current;
      const postUploadErrors = getListingFormErrors(latest);
      if (Object.keys(postUploadErrors).length > 0) {
        setFormErrors(postUploadErrors);
        toast({
          title: currentLanguage === 'en' ? 'Please fix the errors' : 'कृपया त्रुटियाँ सुधारें',
          description:
            currentLanguage === 'en'
              ? 'Values may have changed while images were uploading. Check min order and available quantity, then save again.'
              : 'छवि अपलोड के दौरान मान बदल सकते हैं। न्यूनतम ऑर्डर और उपलब्ध मात्रा जाँचकर फिर सहेजें।',
          variant: 'destructive',
        });
        return;
      }

      const availQ = parseListingQuantity(latest.availableQuantity);
      const minQ =
        latest.minOrderQuantity != null && String(latest.minOrderQuantity).trim() !== ''
          ? parseListingQuantity(latest.minOrderQuantity)
          : 1;
      if (availQ === null || minQ === null) {
        toast({
          title: currentLanguage === 'en' ? 'Invalid quantities' : 'अमान्य मात्रा',
          variant: 'destructive',
        });
        return;
      }

      const finalImages = Array.from(
        new Set([...(latest.imageUrls || []), ...uploadedUrls])
      ).slice(0, 5);

      const payload = {
        name: latest.name,
        nameHindi: latest.nameHindi,
        category: latest.category,
        description: latest.description,
        price: parseFloat(latest.price),
        unit: latest.unit,
        minOrderQuantity: minQ,
        availableQuantity: availQ,
        harvestDate: latest.harvestDate || undefined,
        isOrganic: latest.isOrganic,
        isNegotiable: latest.isNegotiable,
        images:
          finalImages && finalImages.length > 0
            ? finalImages
            : ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600'],
      };

      const isEdit = Boolean(editingProductId);

      if (isEdit) {
        await apiService.products.update(editingProductId!, payload);
        await loadListings();
        setIsListingFormOpen(false);
        toast({
          title:
            currentLanguage === 'en'
              ? 'Listing updated'
              : 'लिस्टिंग अपडेट हो गई',
        });
      } else {
        await apiService.products.create(payload);
        await loadListings();
        setIsListingFormOpen(false);
        toast({
          title:
            currentLanguage === 'en'
              ? 'Listing Added Successfully!'
              : 'लिस्टिंग सफलतापूर्वक जोड़ी गई!',
        });
      }
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? editingProductId
              ? 'Failed to update listing.'
              : 'Failed to add listing.'
            : editingProductId
              ? 'लिस्टिंग अपडेट नहीं हो सकी।'
              : 'लिस्टिंग जोड़ने में विफल।'),
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImages(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success">{currentLanguage === 'en' ? 'Active' : 'सक्रिय'}</Badge>;
      case 'sold_out':
        return <Badge className="bg-destructive/10 text-destructive">{currentLanguage === 'en' ? 'Sold Out' : 'बिक गया'}</Badge>;
      case 'hidden':
        return <Badge className="bg-muted text-muted-foreground">{currentLanguage === 'en' ? 'Hidden' : 'छिपा हुआ'}</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              {currentLanguage === 'en' ? 'My Listings' : 'मेरी लिस्टिंग'}
            </h1>
            <p className="text-muted-foreground">
              {currentLanguage === 'en' ? 'Manage your crop listings' : 'अपनी फसल लिस्टिंग प्रबंधित करें'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void loadListings()}
              disabled={isLoading}
              title={currentLanguage === 'en' ? 'Refresh listings' : 'लिस्टिंग रिफ्रेश'}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog
              open={isListingFormOpen}
              onOpenChange={(open) => {
                setIsListingFormOpen(open);
                if (!open) {
                  resetListingForm();
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete('coach');
                      return next;
                    },
                    { replace: true }
                  );
                }
              }}
            >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProductId
                    ? currentLanguage === 'en'
                      ? 'Edit Listing'
                      : 'लिस्टिंग संपादित करें'
                    : currentLanguage === 'en'
                      ? 'Add New Listing'
                      : 'नई लिस्टिंग जोड़ें'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {user?.role === 'farmer' && (
                  <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                      <div>
                        <p className="font-semibold text-sm">
                          {currentLanguage === 'en'
                            ? 'Mandi-ready listing coach'
                            : 'मंडी-तैयार लिस्टिंग कोच'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {currentLanguage === 'en'
                            ? 'Write like you talk: crop name, how much (number + quintal or kg), your area, how the stock looks (clean, fresh, bagged…), and if the rate is fixed or you want to talk on call. AI fills the form below — always read and change before posting.'
                            : 'जैसे बोलते हैं वैसे लिखें: कौन सी फसल, कितनी मात्रा (संख्या + क्विंटल/किलो), कहाँ का माल, माल कैसा है (साफ, ताज़ा, बोरी…), और रेट तय है या फोन पर बात होगी। AI नीचे फ़ॉर्म भरेगा — पोस्ट से पहले खुद पढ़कर बदल लें।'}
                        </p>
                      </div>
                    </div>
                    <Textarea
                      value={coachNotes}
                      onChange={(e) => setCoachNotes(e.target.value)}
                      rows={3}
                      disabled={coachLoading}
                      placeholder={
                        currentLanguage === 'en'
                          ? 'e.g. 50 quintal chawal, apna khet ka, fresh hai, Madhubani se'
                          : 'जैसे: 50 क्विंटल चावल, अपना खेत का, ताज़ा है, मधुबनी से'
                      }
                      className="resize-y min-h-[4.5rem]"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={coachLoading || coachNotes.trim().length < 8}
                        onClick={() => void fetchCoachSuggestions()}
                      >
                        {coachLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            {currentLanguage === 'en' ? 'Working…' : 'चल रहा है…'}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {currentLanguage === 'en' ? 'Get suggestions' : 'सुझाव लें'}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={coachLoading}
                        onClick={toggleCoachVoice}
                        className={isListeningCoach ? 'ring-2 ring-primary ring-offset-2' : ''}
                        title={
                          currentLanguage === 'en'
                            ? 'Speak your notes (browser mic)'
                            : 'नोट्स बोलें (ब्राउज़र माइक)'
                        }
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        {isListeningCoach
                          ? currentLanguage === 'en'
                            ? 'Listening… tap to stop'
                            : 'सुन रहा है… रोकने टैप करें'
                          : currentLanguage === 'en'
                            ? 'Speak notes'
                            : 'बोलकर लिखें'}
                      </Button>
                    </div>
                    {coachError && (
                      <p className="text-xs text-destructive" role="alert">
                        {coachError}
                      </p>
                    )}
                    {coachDisclaimer && (
                      <p className="text-xs text-muted-foreground border-l-2 border-amber-500/70 pl-2 leading-relaxed">
                        {coachDisclaimer}
                      </p>
                    )}
                    {coachSuggestions && (
                      <div className="rounded-lg border bg-card p-3 space-y-2 text-sm">
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                          {currentLanguage === 'en'
                            ? 'Suggested draft — not posted. Honesty tips:'
                            : 'सुझाया गया ड्राफ्ट — पोस्ट नहीं। ईमानदारी के टिप्स:'}
                        </p>
                        <div className="text-xs space-y-1 text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">
                              {currentLanguage === 'en' ? 'Title (EN): ' : 'शीर्षक (EN): '}
                            </span>
                            {coachSuggestions.name}
                          </p>
                          {coachSuggestions.nameHindi ? (
                            <p>
                              <span className="font-medium text-foreground">
                                {currentLanguage === 'en' ? 'Title (HI): ' : 'शीर्षक (HI): '}
                              </span>
                              {coachSuggestions.nameHindi}
                            </p>
                          ) : null}
                          <p>
                            <span className="font-medium text-foreground">
                              {currentLanguage === 'en' ? 'Category / unit: ' : 'श्रेणी / इकाई: '}
                            </span>
                            {coachSuggestions.category} · {coachSuggestions.unit}
                          </p>
                          {coachSuggestions.suggestedPrice != null ? (
                            <p>
                              <span className="font-medium text-foreground">₹ / unit: </span>
                              {coachSuggestions.suggestedPrice}
                            </p>
                          ) : null}
                        </div>
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                          {coachSuggestions.honestyHints.map((hint, idx) => (
                            <li key={idx}>{hint}</li>
                          ))}
                        </ul>
                        <Button type="button" variant="default" onClick={applyCoachToForm} className="w-full sm:w-auto">
                          {currentLanguage === 'en'
                            ? 'Apply suggestions to form'
                            : 'सुझाव फ़ॉर्म में लगाएँ'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Product Name (English)' : 'उत्पाद नाम (अंग्रेज़ी)'}</Label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Fresh Tomatoes"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-destructive">{formErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Product Name (Hindi)' : 'उत्पाद नाम (हिंदी)'}</Label>
                    <Input
                      value={newProduct.nameHindi}
                      onChange={(e) =>
                        setNewProduct((prev) => ({ ...prev, nameHindi: e.target.value }))
                      }
                      placeholder="जैसे, ताज़ा टमाटर"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>{currentLanguage === 'en' ? 'Category' : 'श्रेणी'}</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) =>
                      setNewProduct((prev) => ({ ...prev, category: value as CropCategory }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetables">{currentLanguage === 'en' ? 'Vegetables' : 'सब्जियां'}</SelectItem>
                      <SelectItem value="fruits">{currentLanguage === 'en' ? 'Fruits' : 'फल'}</SelectItem>
                      <SelectItem value="grains">{currentLanguage === 'en' ? 'Grains' : 'अनाज'}</SelectItem>
                      <SelectItem value="pulses">{currentLanguage === 'en' ? 'Pulses' : 'दालें'}</SelectItem>
                      <SelectItem value="spices">{currentLanguage === 'en' ? 'Spices' : 'मसाले'}</SelectItem>
                      <SelectItem value="dairy">{currentLanguage === 'en' ? 'Dairy' : 'डेयरी'}</SelectItem>
                      <SelectItem value="other">{currentLanguage === 'en' ? 'Other' : 'अन्य'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{currentLanguage === 'en' ? 'Description' : 'विवरण'}</Label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder={currentLanguage === 'en' ? 'Describe your product...' : 'अपने उत्पाद का वर्णन करें...'}
                    rows={3}
                  />
                </div>

                {/* Images */}
                <div>
                  <Label>{currentLanguage === 'en' ? 'Images' : 'छवियाँ'}</Label>
                  <div className="mt-2 grid gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageFiles(e.target.files)}
                      disabled={isUploadingImages}
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newProduct.imageUrlInput}
                        onChange={(e) =>
                          setNewProduct((prev) => ({ ...prev, imageUrlInput: e.target.value }))
                        }
                        placeholder={currentLanguage === 'en' ? 'Or paste image URL' : 'या छवि URL पेस्ट करें'}
                      />
                      <Button type="button" variant="outline" onClick={addImageUrl}>
                        {currentLanguage === 'en' ? 'Add' : 'जोड़ें'}
                      </Button>
                    </div>

                    {(imageFiles.length > 0 || (newProduct.imageUrls && newProduct.imageUrls.length > 0)) && (
                      <div className="grid grid-cols-3 gap-3">
                        {imageFiles.map((it) => (
                          <div
                            key={it.id}
                            className="relative flex h-24 items-center justify-center overflow-hidden rounded-lg border bg-muted"
                          >
                            <img
                              src={it.previewUrl}
                              alt="preview"
                              className="max-h-full max-w-full object-contain p-1"
                            />
                            <button
                              type="button"
                              onClick={() => removeImageFile(it.id)}
                              className="absolute top-1 right-1 bg-background/80 border border-border rounded px-2 py-1 text-xs"
                            >
                              {currentLanguage === 'en' ? 'Remove' : 'हटाएं'}
                            </button>
                          </div>
                        ))}
                        {(newProduct.imageUrls || []).map((url) => (
                          <div
                            key={url}
                            className="relative flex h-24 items-center justify-center overflow-hidden rounded-lg border bg-muted"
                          >
                            <img
                              src={url}
                              alt="preview"
                              className="max-h-full max-w-full object-contain p-1"
                            />
                            <button
                              type="button"
                              onClick={() => removeImageUrl(url)}
                              className="absolute top-1 right-1 bg-background/80 border border-border rounded px-2 py-1 text-xs"
                            >
                              {currentLanguage === 'en' ? 'Remove' : 'हटाएं'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {currentLanguage === 'en'
                        ? 'You can add up to 5 images. If none are provided, a default image will be used.'
                        : 'आप अधिकतम 5 छवियाँ जोड़ सकते हैं। अगर कोई छवि नहीं है, तो डिफ़ॉल्ट छवि लगेगी।'}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Price (₹)' : 'कीमत (₹)'}</Label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct((prev) => ({ ...prev, price: e.target.value }))
                      }
                      placeholder="100"
                    />
                    {formErrors.price && (
                      <p className="mt-1 text-xs text-destructive">{formErrors.price}</p>
                    )}
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Unit' : 'इकाई'}</Label>
                    <Select
                      value={newProduct.unit}
                      onValueChange={(value) =>
                        setNewProduct((prev) => ({ ...prev, unit: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="quintal">Quintal</SelectItem>
                        <SelectItem value="ton">Ton</SelectItem>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="dozen">Dozen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Min Order' : 'न्यूनतम ऑर्डर'}</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={newProduct.minOrderQuantity}
                      onChange={(e) =>
                        setNewProduct((prev) => ({ ...prev, minOrderQuantity: e.target.value }))
                      }
                      placeholder="10"
                    />
                    {formErrors.minOrderQuantity && (
                      <p className="mt-1 text-xs text-destructive">{formErrors.minOrderQuantity}</p>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Available Quantity' : 'उपलब्ध मात्रा'}</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={newProduct.availableQuantity}
                      onChange={(e) =>
                        setNewProduct((prev) => ({ ...prev, availableQuantity: e.target.value }))
                      }
                      placeholder="500"
                    />
                    {formErrors.availableQuantity && (
                      <p className="mt-1 text-xs text-destructive">{formErrors.availableQuantity}</p>
                    )}
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Harvest Date' : 'कटाई की तारीख'}</Label>
                    <Input
                      type="date"
                      value={newProduct.harvestDate}
                      onChange={(e) =>
                        setNewProduct((prev) => ({ ...prev, harvestDate: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newProduct.isOrganic}
                      onCheckedChange={(checked) =>
                        setNewProduct((prev) => ({ ...prev, isOrganic: checked }))
                      }
                    />
                    <Label>{currentLanguage === 'en' ? 'Organic' : 'जैविक'}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newProduct.isNegotiable}
                      onCheckedChange={(checked) =>
                        setNewProduct((prev) => ({ ...prev, isNegotiable: checked }))
                      }
                    />
                    <Label>{currentLanguage === 'en' ? 'Price Negotiable' : 'कीमत पर बातचीत संभव'}</Label>
                  </div>
                </div>

                <Button
                  onClick={() => void handleSaveListing()}
                  disabled={isUploadingImages}
                  className="btn-primary-gradient mt-4"
                >
                  {editingProductId ? (
                    currentLanguage === 'en' ? (
                      'Save changes'
                    ) : (
                      'बदलाव सहेजें'
                    )
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {currentLanguage === 'en' ? 'Add Listing' : 'लिस्टिंग जोड़ें'}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
            <Button className="btn-primary-gradient" type="button" onClick={openAddListingDialog}>
              <Plus className="w-5 h-5 mr-2" />
              {currentLanguage === 'en' ? 'Add New Listing' : 'नई लिस्टिंग जोड़ें'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{listings.length}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Total' : 'कुल'}</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{listings.filter(l => l.status === 'active').length}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Active' : 'सक्रिय'}</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{listings.reduce((sum, l) => sum + l.views, 0)}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Views' : 'व्यूज'}</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{listings.reduce((sum, l) => sum + l.inquiries, 0)}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Inquiries' : 'पूछताछ'}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={currentLanguage === 'en' ? 'Search listings...' : 'लिस्टिंग खोजें...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{currentLanguage === 'en' ? 'All Status' : 'सभी स्थिति'}</SelectItem>
              <SelectItem value="active">{currentLanguage === 'en' ? 'Active' : 'सक्रिय'}</SelectItem>
              <SelectItem value="sold_out">{currentLanguage === 'en' ? 'Sold Out' : 'बिक गया'}</SelectItem>
              <SelectItem value="hidden">{currentLanguage === 'en' ? 'Hidden' : 'छिपा हुआ'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {sortLowStockFirst && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-amber-500/40 bg-amber-50/80 px-4 py-3 text-sm dark:bg-amber-950/25 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-foreground">
              {currentLanguage === 'en'
                ? 'Sorted by available quantity (lowest first).'
                : 'उपलब्ध मात्रा के अनुसार क्रमबद्ध (सबसे कम पहले)।'}
            </span>
            <Button type="button" variant="outline" size="sm" className="shrink-0 w-fit" onClick={clearStockSort}>
              {currentLanguage === 'en' ? 'Clear sort' : 'क्रम हटाएं'}
            </Button>
          </div>
        )}

        {/* Listings Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {currentLanguage === 'en'
                  ? 'Loading listings...'
                  : 'लिस्टिंग लोड हो रही हैं...'}
              </p>
            </div>
          ) : (
          displayedListings.map((listing) => (
            <div key={listing.id} className="card-elevated overflow-hidden">
              <div className="relative bg-muted">
                <div className="flex h-44 w-full items-center justify-center p-3 sm:h-52">
                  <img
                    src={listing.images[0]}
                    alt={listing.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="absolute top-2 right-2">
                  {getStatusBadge(listing.status)}
                </div>
                {listing.isOrganic && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-success text-white">
                      {currentLanguage === 'en' ? 'Organic' : 'जैविक'}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">{listing.name}</h3>
                <p className="text-lg font-bold text-primary">
                  ₹{listing.price.toLocaleString()}/{listing.unit}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> {listing.views}
                  </span>
                  <span>
                    {currentLanguage === 'en' ? 'Min' : 'न्यूनतम'} {listing.minOrderQuantity}{' '}
                    {listing.unit}
                  </span>
                  <span>
                    {listing.availableQuantity} {listing.unit}{' '}
                    {currentLanguage === 'en' ? 'available' : 'उपलब्ध'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleStatusToggle(listing.id)}
                    disabled={togglingId === listing.id}
                    className="flex-1"
                  >
                    {listing.status === 'active' ? (
                      <><EyeOff className="w-4 h-4 mr-1" /> {currentLanguage === 'en' ? 'Hide' : 'छिपाएं'}</>
                    ) : (
                      <><Eye className="w-4 h-4 mr-1" /> {currentLanguage === 'en' ? 'Show' : 'दिखाएं'}</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditListingDialog(listing)}
                    title={currentLanguage === 'en' ? 'Edit listing' : 'लिस्टिंग संपादित करें'}
                    aria-label={currentLanguage === 'en' ? 'Edit listing' : 'लिस्टिंग संपादित करें'}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(listing.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )))}
        </div>

        {displayedListings.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {currentLanguage === 'en' ? 'No listings found' : 'कोई लिस्टिंग नहीं मिली'}
            </h3>
            <p className="text-muted-foreground">
              {currentLanguage === 'en' ? 'Try adjusting your search or filters' : 'अपनी खोज या फ़िल्टर बदलें'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ListingManagement;
