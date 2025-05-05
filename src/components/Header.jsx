import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

const Header = ({ isLoggedIn, onLogout, userData }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <motion.header 
      className="bg-white shadow-md px-4 md:px-8 py-3 md:py-4 flex justify-between items-center relative"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      dir="rtl" // تعيين اتجاه RTL للعنصر بالكامل
    >
      {/* الجزء الأيمن (الشعار والروابط) */}
      <div className="flex items-center justify-between w-full md:w-auto">
        {/* الشعار */}
        <img 
          src="/nafany/IMG-20250322-WA0070.jpg" 
          alt="Logo" 
          className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 object-contain ml-2 md:ml-4" 
        />

        {/* روابط سطح المكتب - مخفية في الجوال */}
        <nav className="hidden md:flex items-center mr-4 space-x-reverse space-x-4 lg:space-x-6 font-bold text-base lg:text-xl">
          <button 
            onClick={() => navigate('/nafany/complaints')} 
            className="text-gray-700 hover:text-cyan-800 transition-colors"
          >
            الشكاوى والاقتراحات
          </button>
          <button 
            onClick={() => navigate('/nafany/contact')} 
            className="text-gray-700 hover:text-cyan-800 transition-colors"
          >
            تواصل معنا
          </button>
          <button 
            onClick={() => navigate('/nafany/settings')} 
            className="text-gray-700 hover:text-cyan-800 transition-colors"
          >
            الإعدادات
          </button>
        </nav>

        {/* زر القائمة للجوال */}
        <button 
          className="md:hidden text-gray-700 mr-2 z-50"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="القائمة"
        >
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* الجزء الأيسر (تحية المستخدم وزر تسجيل الدخول - يظهر فقط في وضع سطح المكتب) */}
      <div className="hidden md:flex flex-col items-end">
        {isLoggedIn && (
          <span className="text-gray-700 font-medium text-base mb-2">
            مرحبًا، {userData?.name || 'عزيزي المستخدم'}
          </span>
        )}
        <motion.button 
          onClick={() => {
            onLogout();
            navigate('/nafany/login');
          }}
          className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 text-base"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoggedIn ? 'تسجيل الخروج' : 'تسجيل الدخول'}
        </motion.button>
      </div>

      {/* قائمة الجوال المنسدلة */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div 
              className="absolute top-16 right-0 w-3/4 max-w-sm h-full bg-white shadow-lg z-50 overflow-y-auto overflow-x-hidden"
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* تحية المستخدم في القائمة المنسدلة */}
              {isLoggedIn && (
                <div className="px-6 pt-6 pb-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium text-base block text-right">
                    مرحبًا، {userData?.name || 'عزيزي المستخدم'}
                  </span>
                </div>
              )}
              
              {/* روابط القائمة المنسدلة */}
              <nav className="flex flex-col items-end p-6 space-y-6 font-bold text-lg">
                <button 
                  onClick={() => {
                    navigate('/nafany/settings');
                    setIsMobileMenuOpen(false);
                  }} 
                  className="text-gray-700 hover:text-cyan-800 transition-colors w-full text-right"
                >
                  الإعدادات
                </button>
                <button 
                  onClick={() => {
                    navigate('/nafany/contact');
                    setIsMobileMenuOpen(false);
                  }} 
                  className="text-gray-700 hover:text-cyan-800 transition-colors w-full text-right"
                >
                  تواصل معنا
                </button>
                <button 
                  onClick={() => {
                    navigate('/nafany/complaints');
                    setIsMobileMenuOpen(false);
                  }} 
                  className="text-gray-700 hover:text-cyan-800 transition-colors w-full text-right"
                >
                  الشكاوى والاقتراحات
                </button>
                
                {/* زر تسجيل الدخول/الخروج داخل القائمة */}
                <div className="w-full pt-4 border-t border-gray-200">
                  <motion.button 
                    onClick={() => {
                      onLogout();
                      navigate('/nafany/login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 text-base w-full text-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoggedIn ? 'تسجيل الخروج' : 'تسجيل الدخول'}
                  </motion.button>
                </div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;