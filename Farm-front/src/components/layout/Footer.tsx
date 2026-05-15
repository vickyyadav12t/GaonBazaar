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
    <footer className="border-t border-[#d7c7a8] bg-[#26472f] text-[#fff3d7]">
      <div className="container mx-auto min-w-0 px-3 py-10 sm:px-4 sm:py-12">
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

            <p className="mb-4 text-xs leading-relaxed text-[#efe5c8]">
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#56745d] bg-[#31553a] transition-all hover:border-[#d7c7a8] hover:bg-[#d89b2b] hover:text-[#2f2513]"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <nav aria-label="Footer Quick Links">
            <h4 className="mb-4 text-lg font-semibold text-[#fff8e8]">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="inline-block text-sm text-[#efe5c8] transition-all hover:translate-x-1 hover:text-[#f4d27d]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Footer Resources">
            <h4 className="mb-4 text-lg font-semibold text-[#fff8e8]">Resources</h4>
            <ul className="space-y-2">
              {resources.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="inline-block text-sm text-[#efe5c8] transition-all hover:translate-x-1 hover:text-[#f4d27d]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-lg font-semibold text-[#fff8e8]">Contact Us</h4>
            <address className="not-italic">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-[#d89b2b]" />
                  <span className="text-sm text-[#efe5c8]">
                    Agricultural Innovation Hub <br />
                    New Delhi, India – 110001
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#d89b2b]" />
                  <a
                    href="tel:+916203135782"
                    className="text-sm text-[#efe5c8] hover:text-[#f4d27d]"
                  >
                    +91 6203135782
                  </a>
                </li>

                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#d89b2b]" />
                  <a
                    href="mailto:praj01012003@gmail.com"
                    className="text-sm text-[#efe5c8] hover:text-[#f4d27d]"
                  >
                    praj01012003@gmail.com
                  </a>
                </li>
              </ul>
            </address>

            {/* Newsletter */}
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-[#fff8e8]">Get farming updates</p>
              <form className="flex gap-2" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="Your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-[#56745d] bg-[#31553a] px-3 py-2 text-sm text-[#fff3d7] outline-none placeholder:text-[#cdbf9f] focus:ring-2 focus:ring-[#d89b2b]"
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="rounded-lg border border-[#c89b3a] bg-[#d89b2b] px-4 py-2 text-sm text-[#2f2513] transition hover:bg-[#c98c1d] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-[#46624e] pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#d9ccb0]">
              © {new Date().getFullYear()} GaonBazaar. All rights reserved.
            </p>
            <p className="text-sm text-[#d9ccb0]">
              Made with ❤️ for Indian Farmers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
