import React from 'react';
import { motion } from 'framer-motion';
import { FaFacebookF, FaInstagram, FaWhatsapp,FaLinkedin,FaEnvelope  } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Contact = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-cyan-700 py-6 px-8 text-center">
          <h1 className="text-3xl font-bold text-white">تواصل معنا</h1>
        </div>

        {/* About Project Section */}
        <div className="p-8 border-b" dir="rtl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">نبذة عن المشروع</h2>
          <p className="text-gray-600 text-lg mb-6">
            موقعنا هو منصة متكاملة تتيح للمستخدمين العثور على مختلف الخدمات المتوفرة في منطقتهم بسهولة وسرعة. 
            سواء كنت تبحث عن خدمات صيانة منزلية، أو خدمات طبية، أو أي نوع آخر من الخدمات،
            فإن منصتنا تساعدك في العثور على أفضل مقدمي الخدمات القريبين من موقعك.
          </p>
          <p className="text-gray-600 text-lg mb-6">
            نهدف إلى ربط المستخدمين بمقدمي الخدمات المؤهلين والموثوقين، مما يوفر الوقت والجهد ويضمن الحصول على خدمة ذات جودة عالية.
            نحن نعمل باستمرار على توسيع قاعدة بياناتنا وتحسين تجربة المستخدم لجعل عملية البحث عن الخدمات أكثر سهولة ومتعة.
          </p>
        </div>

        {/* Contact Links Section */}
        <div className="p-8" dir="rtl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">وسائل التواصل</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Social Media Links */}
            <motion.div 
              className="bg-gray-50 p-6 rounded-lg shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-xl font-semibold text-gray-700 mb-4">تابعنا على مواقع التواصل الاجتماعي</h3>
              
              <div className="flex flex-wrap gap-4">
                <a 
                  href="https://facebook.com/projectname" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaFacebookF /> فيسبوك
                </a>
                
                <a 
                  href="https://instagram.com/projectname" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <FaInstagram /> انستجرام
                </a>
                
                <a 
                  href="https://wa.me/+201234567890" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FaWhatsapp /> واتساب
                </a>
                
                <a 
                  href="https://linkedin.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <FaLinkedin /> لينكدين
                </a>
                <a 
                  href="https://mail.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <FaEnvelope /> البريد الإلكتروني
                </a>
              
              </div>
            </motion.div>
            
            {/* Other Contact Info */}
            <motion.div 
              className="bg-gray-50 p-6 rounded-lg shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-xl font-semibold text-gray-700 mb-4">معلومات الاتصال</h3>
              
              <div className="space-y-3">
                <p className="text-gray-600">
                  <span className="font-medium">البريد الإلكتروني:</span> info@projectname.com
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">رقم الهاتف:</span> +20 123 456 7890
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">العنوان:</span> المنطقة الرئيسية، المدينة، البلد
                </p>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Back Button */}
        <div className="p-8 text-center">
          <motion.button
            onClick={() => navigate('/naf3ny')}
            className="bg-cyan-700 text-white px-6 py-2 rounded-lg hover:bg-cyan-800 inline-flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            العودة للصفحة الرئيسية
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Contact;