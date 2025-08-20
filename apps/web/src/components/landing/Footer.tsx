import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0E1420] border-t border-white/5 py-12">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo */}
          <div className="text-xl font-bold bg-gradient-to-r from-[#1E5EFF] via-[#16C4D9] to-[#3AF6C3] bg-clip-text text-transparent">
            Rivor
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center md:justify-end gap-6 text-sm text-[#9CB3D9]">
            <Link 
              href="#features" 
              className="hover:text-[#EAF2FF] transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Product
            </Link>
            <Link 
              href="/security" 
              className="hover:text-[#EAF2FF] transition-colors"
            >
              Security
            </Link>
            <Link 
              href="/terms" 
              className="hover:text-[#EAF2FF] transition-colors"
            >
              Terms
            </Link>
            <Link 
              href="/privacy" 
              className="hover:text-[#EAF2FF] transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/contact" 
              className="hover:text-[#EAF2FF] transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-[#6E85AC]">
          © {currentYear} Rivor. All rights reserved.
        </div>
      </div>
    </footer>
  );
}