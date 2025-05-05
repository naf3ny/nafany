import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';

const ServiceCategoriesPage = () => {
  const { serviceType } = useParams();
  const navigate = useNavigate();

  // تعريف قائمة الخدمات حسب النوع الرئيسي
  const serviceCategories = {
    "خدمات فنية": [
      { name: "سباك", icon: "🔧", color: "bg-blue-500" },
      { name: "نجار", icon: "🪓", color: "bg-yellow-700" },
      { name: "كهربائي", icon: "⚡", color: "bg-yellow-500" },
      { name: "ميكانيكي", icon: "🔩", color: "bg-gray-700" },
      { name: "حداد", icon: "⚒️", color: "bg-red-700" },
      { name: "فني تكييفات", icon: "❄️", color: "bg-blue-300" },
      { name: "نقاش", icon: "🖌️", color: "bg-purple-500" },
      { name: "ترزي", icon: "🧵", color: "bg-pink-500" }
    ],
    "خدمات صحية": [
      { name: "طبيب عام", icon: "👨‍⚕️", color: "bg-green-500" },
      { name: "صيدلي", icon: "💊", color: "bg-red-500" },
      { name: "ممرض", icon: "🩺", color: "bg-blue-400" },
      { name: "أخصائي تغذية", icon: "🥗", color: "bg-green-300" },
      { name: "أخصائي علاج طبيعي", icon: "🤸", color: "bg-indigo-500" },
      { name: "طبيب أسنان", icon: "🦷", color: "bg-cyan-500" }
    ],
    "خدمات عامة": [
      { name: "سوبر ماركت", icon: "🛒", color: "bg-orange-500" },
      { name: "مطعم", icon: "🍽️", color: "bg-red-600" },
      { name: "كافيه", icon: "☕", color: "bg-yellow-900" },
      { name: "مولات", icon: "🏬", color: "bg-purple-700" }
 
    ],
   "خدمات أخرى": [
  { name: "عطار", icon: "🌿", color: "bg-green-700" },
  { name: "جزار", icon: "🥩", color: "bg-red-800" },
  { name: "فكهاني", icon: "🍎", color: "bg-red-500" },
  { name: "خضري", icon: "🥬", color: "bg-green-500" },
  { name: "محل ألبان", icon: "🥛", color: "bg-white text-gray-800" },
 
]
  };

  // الحصول على قائمة الخدمات المناسبة للنوع المحدد
  const categories = serviceCategories[serviceType] || [];

  // عناوين مخصصة لكل نوع خدمة
  const serviceTitles = {
    "خدمات فنية": "الخدمات الفنية والحرفية",
    "خدمات صحية": "الخدمات الصحية والطبية",
    "خدمات عامة": "الخدمات العامة والتجارية",
    "خدمات أخرى": "خدمات متنوعة أخرى"
  };

  const handleCategoryClick = (category) => {
    // الانتقال إلى صفحة مقدمي الخدمة
    navigate(`/nafany/services_jobs/${serviceType}/${category.name}`);
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-4">
        {/* زر الرجوع */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="flex items-center mb-6 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 ml-1" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          رجوع
        </motion.button>

        <motion.h1 
          className="text-3xl font-bold text-center text-cyan-800 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {serviceTitles[serviceType] || serviceType}
        </motion.h1>

        <motion.p
          className="text-lg text-center text-gray-600 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          اختر الخدمة التي تحتاجها من القائمة أدناه
        </motion.p>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                delayChildren: 0.3,
                staggerChildren: 0.1
              }
            }
          }}
        >
          {categories.map((category, index) => (
            <motion.div
              key={index}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              className={`${category.color} rounded-xl shadow-lg p-6 cursor-pointer text-center transition-all`}
              onClick={() => handleCategoryClick(category)}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-4xl mb-3">{category.icon}</span>
                <h3 className="text-xl font-bold text-white">{category.name}</h3>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {categories.length === 0 && (
          <div className="text-center text-gray-600 text-xl mt-10">
            لا توجد خدمات متاحة في هذه الفئة حالياً
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ServiceCategoriesPage;