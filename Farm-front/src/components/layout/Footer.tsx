import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const quickLinks = [
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Join as Farmer', to: '/register?role=farmer' },
  { label: 'Join as Buyer', to: '/register?role=buyer' },
  { label: 'Help Center', to: '/support' },
  { label: 'Crop Calendar', to: '/calendar' },
];

const resources = [
  { label: 'FAQs', to: '/support' },
  { label: 'Seasonal Guide', to: '/calendar' },
  { label: 'Pricing Guide', to: '/guides/pricing' },
  { label: 'Quality Standards', to: '/guides/quality' },
  { label: 'Terms & Conditions', to: '/legal/terms' },
  { label: 'Privacy Policy', to: '/legal/privacy' },
];

const socialLinks = [
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/prince.___yadav__?igsh=cTFsdGR3ZXhpcXo1' },
  { icon: Youtube, label: 'YouTube', href: '#' },
];

const Footer = () => {
  const { toast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsSubscribing(true);
      await apiService.support.subscribeNewsletter({ email });
      toast({
        title: 'Subscribed',
        description: 'You will receive updates soon.',
      });
      setNewsletterEmail('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not subscribe right now.';
      toast({
        title: 'Subscribe failed',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="mb-4 inline-flex max-w-[min(280px,85vw)] sm:max-w-[min(300px,80vw)] bg-transparent shadow-none [-webkit-tap-highlight-color:transparent] group"
              aria-label="GaonBazaar home"
            >
              <img
                src={`${import.meta.env.BASE_URL}assets/logo.png`}
                alt="GaonBazaar"
                className="h-[40px] w-auto max-w-none shrink-0 object-contain block m-0 p-0 align-middle border-0 bg-transparent group-hover:opacity-95 transition-opacity"
                style={{ filter: 'brightness(0) invert(1)', backgroundColor: 'transparent' }}
              />
            </Link>

            <p className="text-xs text-sidebar-foreground/80 mb-4 leading-relaxed">
              Empowering farmers by connecting them directly with buyers.
              No middlemen, only fair deals.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center
                             hover:bg-primary hover:scale-110 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <nav aria-label="Footer Quick Links">
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-sidebar-foreground/80 hover:text-primary
                               transition-all hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Footer Resources">
            <h4 className="font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-2">
              {resources.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-sidebar-foreground/80 hover:text-primary
                               transition-all hover:translate-x-1 inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <address className="not-italic">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <span className="text-sm text-sidebar-foreground/80">
                    Agricultural Innovation Hub <br />
                    New Delhi, India – 110001
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <a
                    href="tel:+916203135782"
                    className="text-sm text-sidebar-foreground/80 hover:text-primary"
                  >
                    +91 6203135782
                  </a>
                </li>

                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <a
                    href="mailto:praj01012003@gmail.com"
                    className="text-sm text-sidebar-foreground/80 hover:text-primary"
                  >
                    praj01012003@gmail.com
                  </a>
                </li>
              </ul>
            </address>

            {/* Newsletter */}
            <div className="mt-5">
              <p className="text-sm font-medium mb-2">Get farming updates</p>
              <form className="flex gap-2" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="Your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-sidebar-accent
                             text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="px-4 py-2 bg-primary text-white rounded-lg
                             text-sm hover:opacity-90 transition"
                >
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-sidebar-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-sidebar-foreground/60">
              © {new Date().getFullYear()} GaonBazaar. All rights reserved.
            </p>
            <p className="text-sm text-sidebar-foreground/60">
              Made with ❤️ for Indian Farmers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
