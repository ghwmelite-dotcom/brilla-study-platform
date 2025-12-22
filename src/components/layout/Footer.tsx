import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-ghana flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-display font-bold text-xl text-neutral-900">
                Brilla Prep
              </span>
            </div>
            <p className="text-xs text-primary font-medium mb-3">Prepare. Excel. Succeed.</p>
            <p className="text-sm text-neutral-600">
              NSMQ training platform for St John's Grammar School, Ghana.
              Excel in Math, Physics, Chemistry, and Biology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/topics" className="text-sm text-neutral-600 hover:text-primary">
                  Topic Library
                </Link>
              </li>
              <li>
                <Link to="/practice" className="text-sm text-neutral-600 hover:text-primary">
                  Practice Mode
                </Link>
              </li>
              <li>
                <Link to="/competition" className="text-sm text-neutral-600 hover:text-primary">
                  Competition Simulation
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-sm text-neutral-600 hover:text-primary">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Subjects */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">Subjects</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/topics/mathematics" className="text-sm text-neutral-600 hover:text-primary">
                  Mathematics
                </Link>
              </li>
              <li>
                <Link to="/topics/physics" className="text-sm text-neutral-600 hover:text-primary">
                  Physics
                </Link>
              </li>
              <li>
                <Link to="/topics/chemistry" className="text-sm text-neutral-600 hover:text-primary">
                  Chemistry
                </Link>
              </li>
              <li>
                <Link to="/topics/biology" className="text-sm text-neutral-600 hover:text-primary">
                  Biology
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-3">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-sm text-neutral-600 hover:text-primary">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-neutral-600 hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:support@stjohns.edu.gh" className="text-sm text-neutral-600 hover:text-primary">
                  Contact Us
                </a>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-neutral-600 hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500">
            © {currentYear} Brilla Prep. All rights reserved.
          </p>
          <p className="text-sm text-neutral-500 flex items-center gap-1">
            Empowering champions <Heart className="w-4 h-4 text-accent fill-accent" /> one question at a time
          </p>
        </div>
      </div>
    </footer>
  );
}
