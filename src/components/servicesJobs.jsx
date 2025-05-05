import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


const JobsPage = () => {
  const { serviceType, professionType } = useParams(); // استخراج نوع المهنة المحددة
  const navigate = useNavigate();
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfession, setSelectedProfession] = useState('الكل');
  const [selectedGovernorate, setSelectedGovernorate] = useState('الكل');
  const [professionsList, setProfessionsList] = useState([]);
  const [governoratesList, setGovernoratesList] = useState([]);

  // قائمة المحافظات المصرية
  const allGovernorates = [
    "وسط البلد", "الزمالك", "المعادي", "مدينة نصر",
    "المرج", "حلوان", "السيدة زينب",
    "شبرا", "المطرية"
];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        
        // جلب جميع مقدمي الخدمة في هذا التصنيف
        const q = query(
          collection(db, 'serviceProviders'),
          where('category', '==', serviceType),
          where('profession', '==', professionType) // إضافة فلتر للمهنة
        );

        const querySnapshot = await getDocs(q);
        const jobsData = [];
        const professions = new Set(['الكل']);
        const governorates = new Set(['الكل']);
        
        querySnapshot.forEach((doc) => {
          const provider = doc.data();
          const profession = provider.profession || 'بدون تخصص';
          const governorate = provider.governorate || 'غير محدد';
          
          jobsData.push({
            id: doc.id,
            title: profession,
            description: provider.bio || 'لا يوجد وصف',
            imageUrl: provider.profileImage || provider.idFrontImage || '../../public/IMG-20250322-WA0070.jpg',
            governorate: governorate,
            providerData: { ...provider, id: doc.id } // تأكد من أن id مخزن هنا
          });
          
          professions.add(profession);
          governorates.add(governorate);
        });

        setAllJobs(jobsData);
        setFilteredJobs(jobsData);
        console.log('Jobs data:', jobsData);
        setProfessionsList(Array.from(professions));
        setGovernoratesList(['الكل', ...allGovernorates]);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setLoading(false);
      }
    };

    fetchJobs();
  },  [serviceType, professionType]);

  useEffect(() => {
    // تطبيق الفلتر عند تغيير المهنة أو المحافظة
    let filtered = [...allJobs];
    
    if (selectedProfession !== 'الكل') {
      filtered = filtered.filter(job => job.title === selectedProfession);
    }
    
    if (selectedGovernorate !== 'الكل') {
      filtered = filtered.filter(job => job.governorate === selectedGovernorate);
    }
    
    setFilteredJobs(filtered);
  }, [selectedProfession, selectedGovernorate, allJobs]);

  const handleDetailsClick = (provider , bool) => {
    navigate(`/naf3ny/book_page/${provider.id}`, { state: { provider , bool } });
  };

  // دالة لإنشاء عنوان الصفحة بناءً على حالة الفلتر
  const getPageTitle = () => {
    let title = `${professionType} - ${serviceType}`;
    
    if (selectedGovernorate !== 'الكل') {
      title += ` في ${selectedGovernorate}`;
    } else {
      title += ' في جميع المناطق السكنية';
    }
    
    return title;
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
        <motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={() => navigate(-1)}
  className="flex items-center ml-10 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-5 w-5 mr-1" 
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
      <div className="container mx-auto px-4">
        <motion.h1 
          className="text-3xl font-bold text-center text-cyan-800 mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {getPageTitle()}
        </motion.h1>

        {/* فلتر الوظائف */}
        <motion.div 
          className="bg-white p-4 rounded-lg shadow-md mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                تصفية حسب المنطقة ابسكنية:
              </label>
              <select
                value={selectedGovernorate}
                onChange={(e) => setSelectedGovernorate(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-cyan-500"
              >
                {governoratesList.map((gov, index) => (
                  <option className={`${index < 3 && index != 0 ? "text-red-600" : ""}`} key={`gov-${index}`} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button 
              onClick={() => {
                setSelectedProfession('الكل');
                setSelectedGovernorate('الكل');
              }}
              className="text-cyan-600 hover:text-cyan-800 text-sm"
            >
              إعادة تعيين الفلتر
            </button>
            
            <span className="text-sm text-gray-500">
              {filteredJobs.length} نتيجة متاحة
            </span>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-600 text-xl">
            جاري تحميل البيانات...
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <img 
                    src={job.imageUrl} 
                    alt={job.title} 
                    className="w-20 h-20 object-cover rounded-full mr-4 border-2 border-cyan-100"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = '../../public/IMG-20250322-WA0070.jpg'
                    }}
                  />
                  <div>
                    <h3 className="text-xl font-bold text-cyan-800">{job.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{job.description}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500">
                    {job.governorate}
                  </span>
                  <button 
                    onClick={() => handleDetailsClick(job.providerData , job.providerData.category =="خدمات صحية" || job.providerData.category =="خدمات فنية" ? true : false)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    عرض الملف الشخصي
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 text-xl">
            لا توجد نتائج مطابقة للبحث
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default JobsPage;