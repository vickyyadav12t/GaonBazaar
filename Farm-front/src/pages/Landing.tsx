import { Link } from 'react-router-dom';
import { ArrowRight, Users, Shield, MessageCircle, TrendingUp, Star, CheckCircle, Leaf, Truck, Sparkles, Award, Zap, Heart, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { useAppSelector } from '@/hooks/useRedux';
import { mockProducts, mockFarmers } from '@/data/mockData';
import ProductCard from '@/components/product/ProductCard';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';

const Landing = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);
  const featuredProducts = mockProducts.slice(0, 3);

  const content = {
    en: {
      hero: {
        title: 'Direct Access',
        subtitle: 'for Farmers',
        description: 'Connect directly with buyers. Eliminate middlemen. Get fair prices for your hard work.',
        cta1: 'Join as Farmer',
        cta2: 'Join as Buyer',
      },
      features: {
        title: 'Why Choose Us?',
        items: [
          { icon: Users, title: 'No Middlemen', desc: 'Sell directly to buyers and keep more profit' },
          { icon: MessageCircle, title: 'Live Negotiation', desc: 'Chat and negotiate prices in real-time' },
          { icon: Shield, title: 'Secure Payments', desc: 'Safe transactions with multiple payment options' },
          { icon: TrendingUp, title: 'Fair Prices', desc: 'Get market rates without commission cuts' },
        ],
      },
      stats: {
        farmers: 'Farmers Registered',
        buyers: 'Active Buyers',
        transactions: 'Successful Deals',
        savings: 'Savings for Farmers',
      },
      howItWorks: {
        title: 'How It Works',
        steps: [
          { icon: Leaf, title: 'List Your Produce', desc: 'Add photos, set prices, and describe your crops' },
          { icon: MessageCircle, title: 'Connect & Negotiate', desc: 'Chat with interested buyers and agree on prices' },
          { icon: Truck, title: 'Deliver & Get Paid', desc: 'Complete the sale and receive secure payment' },
        ],
      },
      testimonials: {
        title: 'What Farmers Say',
      },
      cta: {
        title: 'Ready to Grow Your Business?',
        desc: 'Join thousands of farmers who are already selling directly to buyers.',
        button: 'Get Started Free',
      },
    },
    hi: {
      hero: {
        title: 'किसानों के लिए',
        subtitle: 'सीधा संपर्क',
        description: 'खरीदारों से सीधे जुड़ें। बिचौलियों को हटाएं। अपनी मेहनत का उचित दाम पाएं।',
        cta1: 'किसान बनें',
        cta2: 'खरीदार बनें',
      },
      features: {
        title: 'हमें क्यों चुनें?',
        items: [
          { icon: Users, title: 'कोई बिचौलिया नहीं', desc: 'सीधे खरीदारों को बेचें और अधिक मुनाफा कमाएं' },
          { icon: MessageCircle, title: 'लाइव बातचीत', desc: 'रियल-टाइम में चैट करें और कीमत तय करें' },
          { icon: Shield, title: 'सुरक्षित भुगतान', desc: 'कई भुगतान विकल्पों के साथ सुरक्षित लेनदेन' },
          { icon: TrendingUp, title: 'उचित मूल्य', desc: 'बिना कमीशन के बाजार दर प्राप्त करें' },
        ],
      },
      stats: {
        farmers: 'पंजीकृत किसान',
        buyers: 'सक्रिय खरीदार',
        transactions: 'सफल सौदे',
        savings: 'किसानों की बचत',
      },
      howItWorks: {
        title: 'यह कैसे काम करता है',
        steps: [
          { icon: Leaf, title: 'अपनी उपज सूचीबद्ध करें', desc: 'फोटो जोड़ें, कीमत तय करें, और अपनी फसल का वर्णन करें' },
          { icon: MessageCircle, title: 'जुड़ें और बातचीत करें', desc: 'इच्छुक खरीदारों से चैट करें और कीमत पर सहमत हों' },
          { icon: Truck, title: 'डिलीवर करें और भुगतान पाएं', desc: 'बिक्री पूरी करें और सुरक्षित भुगतान प्राप्त करें' },
        ],
      },
      testimonials: {
        title: 'किसान क्या कहते हैं',
      },
      cta: {
        title: 'अपना व्यापार बढ़ाने के लिए तैयार?',
        desc: 'हजारों किसानों से जुड़ें जो पहले से ही सीधे खरीदारों को बेच रहे हैं।',
        button: 'मुफ्त शुरू करें',
      },
    },
  };

  const t = content[currentLanguage];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      location: 'Punjab',
      image: mockFarmers[0].avatar,
      quote: currentLanguage === 'en' 
        ? 'I increased my income by 40% after selling directly through this platform. No more middlemen taking my profits!'
        : 'इस प्लेटफॉर्म के माध्यम से सीधे बेचने के बाद मैंने अपनी आय 40% बढ़ा दी। अब कोई बिचौलिया मेरा मुनाफा नहीं लेता!',
      rating: 5,
    },
    {
      name: 'Sunita Devi',
      location: 'Maharashtra',
      image: mockFarmers[1].avatar,
      quote: currentLanguage === 'en'
        ? 'The negotiation feature helped me get 30% better prices for my onions. Very easy to use!'
        : 'बातचीत की सुविधा ने मुझे अपने प्याज के लिए 30% बेहतर कीमत दिलाने में मदद की। उपयोग करना बहुत आसान है!',
      rating: 5,
    },
    {
      name: 'Mohammed Ismail',
      location: 'Karnataka',
      image: mockFarmers[2].avatar,
      quote: currentLanguage === 'en'
        ? 'Fast payments and reliable buyers. This platform has changed how I sell my produce.'
        : 'तेज़ भुगतान और विश्वसनीय खरीदार। इस प्लेटफॉर्म ने मेरे उपज बेचने का तरीका बदल दिया है।',
      rating: 5,
    },
  ];

  return (
    <Layout showMobileNav={false}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary-dark text-primary-foreground min-h-[90vh] flex items-center">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-secondary/20 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-20 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-secondary-light/20 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust Badge */}
            <AnimateOnScroll animation="fade-in" delay={0}>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full mb-8 border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
                <Sparkles className="w-4 h-4 text-secondary-light" />
                <span className="text-sm font-semibold">Trusted by 3,200+ Farmers Nationwide</span>
                <Award className="w-4 h-4 text-secondary-light" />
              </div>
            </AnimateOnScroll>
            
            {/* Main Heading */}
            <AnimateOnScroll animation="slide-up" delay={0.1}>
              <h1 className={`text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                <span className="block">{t.hero.title}</span>
                <span className="block text-secondary-light drop-shadow-lg mt-2">{t.hero.subtitle}</span>
              </h1>
            </AnimateOnScroll>
            
            {/* Description */}
            <AnimateOnScroll animation="slide-up" delay={0.2}>
              <p className={`text-xl md:text-2xl opacity-95 mb-10 max-w-3xl mx-auto leading-relaxed font-medium ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.hero.description}
              </p>
            </AnimateOnScroll>
            
            {/* CTA Buttons */}
            <AnimateOnScroll animation="slide-up" delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link to="/register?role=farmer" className="group">
                  <Button className="btn-hero text-lg px-10 py-7 w-full sm:w-auto shadow-2xl hover:shadow-secondary/50 group-hover:scale-105 transition-all duration-300">
                    <span className="text-2xl mr-2">🧑‍🌾</span>
                    {t.hero.cta1}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/register?role=buyer" className="group">
                  <Button variant="outline" className="text-lg px-10 py-7 bg-white/10 backdrop-blur-md border-2 border-white/30 hover:bg-white/20 hover:border-white/50 w-full sm:w-auto shadow-xl group-hover:scale-105 transition-all duration-300">
                    <span className="text-2xl mr-2">🛒</span>
                    {t.hero.cta2}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </AnimateOnScroll>

            {/* Quick Stats */}
            <AnimateOnScroll animation="fade-in" delay={0.4}>
              <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary-light">3,200+</div>
                  <div className="text-sm opacity-80 mt-1">Farmers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary-light">15K+</div>
                  <div className="text-sm opacity-80 mt-1">Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary-light">₹4.5Cr+</div>
                  <div className="text-sm opacity-80 mt-1">Saved</div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>

        {/* Enhanced Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-b from-background to-muted/30 -mt-1">
        <div className="container mx-auto px-4">
          <StaggerContainer staggerDelay={0.1} animation="slide-up" className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { value: '3,200+', label: t.stats.farmers, emoji: '👨‍🌾', color: 'from-primary/10 to-primary/5', iconColor: 'text-primary' },
              { value: '2,200+', label: t.stats.buyers, emoji: '🛒', color: 'from-secondary/10 to-secondary/5', iconColor: 'text-secondary' },
              { value: '15,000+', label: t.stats.transactions, emoji: '🤝', color: 'from-accent/10 to-accent/5', iconColor: 'text-accent' },
              { value: '₹4.5Cr+', label: t.stats.savings, emoji: '💰', color: 'from-success/10 to-success/5', iconColor: 'text-success' },
            ].map((stat, index) => (
              <div key={index} className={`text-center p-8 rounded-3xl bg-gradient-to-br ${stat.color} border border-border/50 shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 group backdrop-blur-sm`}>
                <div className={`text-4xl mb-4 animate-float-slow group-hover:scale-110 transition-transform duration-300 ${stat.iconColor}`}>{stat.emoji}</div>
                <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">{stat.value}</div>
                <div className={`text-sm font-medium text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>{stat.label}</div>
              </div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features */}
      <AnimateOnScroll animation="fade-in">
        <section className="py-20 bg-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className={`text-4xl md:text-5xl font-extrabold mb-4 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.features.title}
              </h2>
              <p className={`text-lg text-muted-foreground max-w-2xl mx-auto ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en' 
                  ? 'Everything you need to grow your agricultural business'
                  : 'अपने कृषि व्यवसाय को बढ़ाने के लिए आपको जो कुछ चाहिए'}
              </p>
            </div>
            <StaggerContainer staggerDelay={0.1} animation="slide-up" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {t.features.items.map((feature, index) => {
                const colors = [
                  { bg: 'bg-primary/10', icon: 'text-primary', border: 'border-primary/20' },
                  { bg: 'bg-secondary/10', icon: 'text-secondary', border: 'border-secondary/20' },
                  { bg: 'bg-accent/10', icon: 'text-accent', border: 'border-accent/20' },
                  { bg: 'bg-success/10', icon: 'text-success', border: 'border-success/20' },
                ];
                const color = colors[index % colors.length];
                
                return (
                  <div key={index} className={`card-elevated p-8 text-center hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden ${color.border} border-2`}>
                    {/* Hover effect background */}
                    <div className={`absolute inset-0 ${color.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    
                    <div className={`w-20 h-20 ${color.bg} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10 ${color.border} border-2`}>
                      <feature.icon className={`w-10 h-10 ${color.icon}`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 relative z-10 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>{feature.title}</h3>
                    <p className={`text-muted-foreground text-sm leading-relaxed relative z-10 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>{feature.desc}</p>
                  </div>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      </AnimateOnScroll>

      {/* How It Works */}
      <AnimateOnScroll animation="fade-in">
        <section className="py-20 bg-gradient-to-b from-muted/30 to-background relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className={`text-4xl md:text-5xl font-extrabold mb-4 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.howItWorks.title}
              </h2>
              <p className={`text-lg text-muted-foreground max-w-2xl mx-auto ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en' 
                  ? 'Get started in just three simple steps'
                  : 'बस तीन सरल चरणों में शुरू करें'}
              </p>
            </div>
            <StaggerContainer staggerDelay={0.15} animation="scale-in" className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-20" />
              
              {t.howItWorks.steps.map((step, index) => (
                <div key={index} className="relative text-center group">
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Icon Circle */}
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-light rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10">
                    <step.icon className="w-12 h-12 text-primary-foreground" />
                  </div>
                  
                  {/* Content Card */}
                  <div className="card-elevated p-8 pt-12 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <h3 className={`text-xl font-bold mb-3 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>{step.title}</h3>
                    <p className={`text-muted-foreground leading-relaxed ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </AnimateOnScroll>

      {/* Featured Products */}
      <AnimateOnScroll animation="fade-in">
        <section className="py-20 bg-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-2">
                  {currentLanguage === 'en' ? 'Fresh From Farms' : 'खेतों से ताज़ा'}
                </h2>
                <p className="text-muted-foreground text-lg">
                  {currentLanguage === 'en' 
                    ? 'Handpicked quality produce from verified farmers'
                    : 'सत्यापित किसानों से चुनी गई गुणवत्तापूर्ण उपज'}
                </p>
              </div>
              <Link to="/marketplace" className="mt-4 md:mt-0 group">
                <Button variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group-hover:scale-105">
                  {currentLanguage === 'en' ? 'View All Products' : 'सभी उत्पाद देखें'}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <StaggerContainer staggerDelay={0.1} animation="slide-up" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </StaggerContainer>
          </div>
        </section>
      </AnimateOnScroll>

      {/* Testimonials */}
      <AnimateOnScroll animation="fade-in">
        <section className="py-20 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className={`text-4xl md:text-5xl font-extrabold mb-4 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.testimonials.title}
              </h2>
              <p className={`text-lg text-muted-foreground max-w-2xl mx-auto ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en' 
                  ? 'Real stories from farmers who transformed their business'
                  : 'किसानों की वास्तविक कहानियाँ जिन्होंने अपना व्यवसाय बदल दिया'}
              </p>
            </div>
            <StaggerContainer staggerDelay={0.1} animation="slide-up" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="card-elevated p-8 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
                  {/* Quote icon */}
                  <div className="absolute top-4 right-4 text-primary/10 group-hover:text-primary/20 transition-colors">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                    </svg>
                  </div>
                  
                  <div className="flex items-center gap-1 mb-6 relative z-10">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-secondary fill-secondary" />
                    ))}
                  </div>
                  <p className={`text-foreground mb-6 leading-relaxed text-lg relative z-10 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-4 pt-6 border-t border-border relative z-10">
                    <div className="relative">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                        <CheckCircle className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground text-lg">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <span className="w-1 h-1 bg-primary rounded-full" />
                        Verified Farmer • {testimonial.location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </AnimateOnScroll>

      {/* CTA Section */}
      <AnimateOnScroll animation="zoom-in">
        <section className="py-24 bg-gradient-to-br from-primary via-primary/95 to-primary-dark text-primary-foreground relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20">
                <Zap className="w-4 h-4 text-secondary-light" />
                <span className="text-sm font-semibold">Join thousands of successful farmers</span>
              </div>
              
              <h2 className={`text-4xl md:text-6xl font-extrabold mb-6 leading-tight ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.cta.title}
              </h2>
              <p className={`text-xl md:text-2xl opacity-95 mb-10 leading-relaxed ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.cta.desc}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/register" className="group">
                  <Button className="btn-hero text-xl px-12 py-8 shadow-2xl hover:shadow-secondary/50 group-hover:scale-110 transition-all duration-300">
                    {t.cta.button}
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
                <Link to="/marketplace" className="group">
                  <Button variant="outline" className="text-xl px-12 py-8 bg-white/10 backdrop-blur-md border-2 border-white/30 hover:bg-white/20 hover:border-white/50 group-hover:scale-110 transition-all duration-300">
                    Browse Marketplace
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm opacity-80">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-secondary-light" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary-light" />
                  <span>Verified Farmers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-secondary-light" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimateOnScroll>
    </Layout>
  );
};

export default Landing;
