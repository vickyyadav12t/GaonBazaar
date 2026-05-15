import type { LandingContent } from './landingTypes';

export const LANDING_EN: LandingContent = {
  hero: {
    trustBadgeSoft: 'Building a direct farm-to-buyer network',
    title: 'GaonBazaar',
    subtitle: 'No middlemen, only fair deals',
    description:
      'Connect directly with buyers. Eliminate middlemen. Get fair prices for your hard work.',
    cta1: 'Join as Farmer',
    cta2: 'Join as Buyer',
    quickFarmers: 'Farmers',
    quickBuyers: 'Buyers',
    quickTx: 'Delivered orders',
    quickListings: 'Active listings',
    marketingHeroStrip: ['Direct from farms', 'Fair negotiation', 'Secure payments'],
  },
  features: {
    title: 'Why Choose Us?',
    subtitle: 'Everything you need to grow your agricultural business',
    items: [
      { title: 'No Middlemen', desc: 'Sell directly to buyers and keep more profit' },
      { title: 'Live Negotiation', desc: 'Chat and negotiate prices in real-time' },
      { title: 'Secure Payments', desc: 'Safe transactions with multiple payment options' },
      { title: 'Fair Prices', desc: 'Get market rates without commission cuts' },
    ],
  },
  stats: {
    farmers: 'Farmers registered',
    buyers: 'Buyers',
    transactions: 'Delivered orders',
    listings: 'Active listings',
    marketingCards: [
      { emoji: '👨‍🌾', title: 'Sell direct', sub: 'List produce and reach buyers yourself' },
      { emoji: '🛒', title: 'Meet buyers', sub: 'Connect with people who need your crop' },
      { emoji: '🤝', title: 'Fair negotiation', sub: 'Chat to agree on a price that works' },
      { emoji: '💰', title: 'Keep your margin', sub: 'More of each sale stays with you' },
    ],
  },
  statsLoadError: 'Live stats could not be loaded; showing theme cards instead.',
  howItWorks: {
    title: 'How It Works',
    subtitle: 'Get started in just three simple steps',
    steps: [
      { title: 'List Your Produce', desc: 'Add photos, set prices, and describe your crops' },
      { title: 'Connect & Negotiate', desc: 'Chat with interested buyers and agree on prices' },
      { title: 'Deliver & Get Paid', desc: 'Complete the sale and receive secure payment' },
    ],
  },
  featured: {
    title: 'Fresh From Farms',
    desc: 'Handpicked quality produce from verified farmers',
    cta: 'View All Products',
  },
  testimonials: {
    title: 'How direct trade helps',
    attribution: 'Farmer',
    role: 'Community voice',
    regionNorth: 'North India',
    regionWest: 'Western India',
    regionSouth: 'Southern India',
    quoteNorth:
      'Selling directly helped me keep more of what I earn. Chat made pricing clearer for both sides.',
    quoteWest:
      'Negotiating in the app was easier than repeated phone calls with multiple traders.',
    quoteSouth:
      'Having buyers and payment steps in one place reduced confusion at harvest time.',
  },
  cta: {
    title: 'Ready to Grow Your Business?',
    desc: 'List your produce or source directly—free to get started.',
    button: 'Get Started Free',
    browse: 'Browse Marketplace',
    zapLine: 'Fair prices, secure payments, real conversations',
    trustSecure: 'Secure Payments',
    trustVerified: 'Verified Farmers',
    trustSupport: '24/7 Support',
  },
  trustLive: (farmerCount: string, buyerCount: string) =>
    `${farmerCount} farmers · ${buyerCount} buyers on GaonBazaar`,
};

export const LANDING_HI: LandingContent = {
  hero: {
    trustBadgeSoft: 'किसान से खरीदार तक सीधा जाल बन रहा है',
    title: 'GaonBazaar',
    subtitle: 'बिना बिचौलिये, केवल उचित सौदे',
    description: 'खरीदारों से सीधे जुड़ें। बिचौलियों को हटाएं। अपनी मेहनत का उचित दाम पाएं।',
    cta1: 'किसान बनें',
    cta2: 'खरीदार बनें',
    quickFarmers: 'किसान',
    quickBuyers: 'खरीदार',
    quickTx: 'डिलीवर ऑर्डर',
    quickListings: 'सक्रिय सूचियाँ',
    marketingHeroStrip: ['सीधे खेत से', 'उचित बातचीत', 'सुरक्षित भुगतान'],
  },
  features: {
    title: 'हमें क्यों चुनें?',
    subtitle: 'अपने कृषि व्यवसाय को बढ़ाने के लिए आपको जो कुछ चाहिए',
    items: [
      { title: 'कोई बिचौलिया नहीं', desc: 'सीधे खरीदारों को बेचें और अधिक मुनाफा कमाएं' },
      { title: 'लाइव बातचीत', desc: 'रियल-टाइम में चैट करें और कीमत तय करें' },
      { title: 'सुरक्षित भुगतान', desc: 'कई भुगतान विकल्पों के साथ सुरक्षित लेनदेन' },
      { title: 'उचित मूल्य', desc: 'बिना कमीशन के बाजार दर प्राप्त करें' },
    ],
  },
  stats: {
    farmers: 'पंजीकृत किसान',
    buyers: 'खरीदार',
    transactions: 'डिलीवर ऑर्डर',
    listings: 'सक्रिय सूचियाँ',
    marketingCards: [
      { emoji: '👨‍🌾', title: 'सीधे बेचें', sub: 'उपज सूचीबद्ध करें और खरीदारों तक पहुँचें' },
      { emoji: '🛒', title: 'खरीदार', sub: 'जिन्हें आपकी फसल चाहिए उनसे जुड़ें' },
      { emoji: '🤝', title: 'उचित बातचीत', sub: 'चैट से मूल्य पर सहमति' },
      { emoji: '💰', title: 'मुनाफा आपका', sub: 'हर बिक्री का ज़्यादा हिस्सा आपके पास' },
    ],
  },
  statsLoadError: 'लाइव आँकड़े लोड नहीं हो सके; थीम कार्ड दिखाए जा रहे हैं।',
  howItWorks: {
    title: 'यह कैसे काम करता है',
    subtitle: 'बस तीन सरल चरणों में शुरू करें',
    steps: [
      { title: 'अपनी उपज सूचीबद्ध करें', desc: 'फोटो जोड़ें, कीमत तय करें, और अपनी फसल का वर्णन करें' },
      { title: 'जुड़ें और बातचीत करें', desc: 'इच्छुक खरीदारों से चैट करें और कीमत पर सहमत हों' },
      { title: 'डिलीवर करें और भुगतान पाएं', desc: 'बिक्री पूरी करें और सुरक्षित भुगतान प्राप्त करें' },
    ],
  },
  featured: {
    title: 'खेतों से ताज़ा',
    desc: 'सत्यापित किसानों से चुनी गई गुणवत्तापूर्ण उपज',
    cta: 'सभी उत्पाद देखें',
  },
  testimonials: {
    title: 'सीधी बिक्री कैसे मदद करती है',
    attribution: 'किसान',
    role: 'सामुदायिक आवाज़',
    regionNorth: 'उत्तर भारत',
    regionWest: 'पश्चिम भारत',
    regionSouth: 'दक्षिण भारत',
    quoteNorth:
      'सीधे बेचने से मेहनत का ज़्यादा हिस्सा मेरे पास रहा। चैट से कीमत दोनों के लिए साफ़ हुई।',
    quoteWest:
      'ऐप में बातचीत कई व्यापारियों को बार-बार फोन करने से आसान रही।',
    quoteSouth:
      'खरीदार और भुगतान एक जगह होने से फसल के समय भ्रम कम हुआ।',
  },
  cta: {
    title: 'अपना व्यापार बढ़ाने के लिए तैयार?',
    desc: 'उपज सूचीबद्ध करें या सीधे खरीदें—शुरुआत मुफ्त।',
    button: 'मुफ्त शुरू करें',
    browse: 'बाज़ार देखें',
    zapLine: 'उचित दाम, सुरक्षित भुगतान, सच्ची बातचीत',
    trustSecure: 'सुरक्षित भुगतान',
    trustVerified: 'सत्यापित किसान',
    trustSupport: '२४/७ सहायता',
  },
  trustLive: (farmerCount: string, buyerCount: string) =>
    `GaonBazaar पर ${farmerCount} किसान · ${buyerCount} खरीदार`,
};
