import { Link } from 'react-router-dom';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

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
  { label: 'Pricing Guide', to: '#' },
  { label: 'Quality Standards', to: '#' },
  { label: 'Terms & Conditions', to: '#' },
  { label: 'Privacy Policy', to: '#' },
];

const socialLinks = [
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
];

const Footer = () => {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-2xl">🌾</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Direct Access</h3>
                <p className="text-xs text-sidebar-foreground/70">
                  for Farmers
                </p>
              </div>
            </div>

            <p className="text-sm text-sidebar-foreground/80 mb-4">
              Empowering farmers by connecting them directly with buyers.
              No middlemen, fair prices, better lives.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
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
                    href="tel:+911800000000"
                    className="text-sm text-sidebar-foreground/80 hover:text-primary"
                  >
                    +91 1800-XXX-XXXX (Toll Free)
                  </a>
                </li>

                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <a
                    href="mailto:support@directaccess.in"
                    className="text-sm text-sidebar-foreground/80 hover:text-primary"
                  >
                    support@directaccess.in
                  </a>
                </li>
              </ul>
            </address>

            {/* Newsletter */}
            <div className="mt-5">
              <p className="text-sm font-medium mb-2">Get farming updates</p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 rounded-lg bg-sidebar-accent
                             text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg
                             text-sm hover:opacity-90 transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-sidebar-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-sidebar-foreground/60">
              © {new Date().getFullYear()} Direct Access for Farmers. All rights reserved.
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
