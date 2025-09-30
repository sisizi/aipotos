'use client';

import {usePathname, useRouter} from '@/i18n/routing';
import {useLocale} from 'next-intl';
import {Globe} from 'lucide-react';
import {motion} from 'framer-motion';
import {useState, useEffect, useRef} from 'react';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (newLocale: 'en' | 'zh' | 'ko' | 'ja') => {
    router.replace(pathname, {locale: newLocale});
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'zh', label: '中文' },
    { code: 'ko', label: '한국어' },
    { code: 'ja', label: '日本語' }
  ];

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative"
      ref={dropdownRef}
    >
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-1 text-white hover:text-blue-300 transition-colors text-xl cursor-pointer"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLanguage?.label || 'EN'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-32 bg-black/90 backdrop-blur-md rounded-lg shadow-lg">
          <div className="py-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code as 'en' | 'zh' | 'ko' | 'ja')}
                className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}