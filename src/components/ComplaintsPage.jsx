import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const ComplaintsPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: "complaint", // مبدئيًا "شكوى"
    title: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "عنوان الشكوى/الاقتراح مطلوب";
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = "تفاصيل الشكوى/الاقتراح مطلوبة";
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "يجب أن تحتوي التفاصيل على 10 أحرف على الأقل";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // مسح رسالة الخطأ عند التعديل
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setSubmitError("");
      
      // الحصول على معلومات المستخدم الحالي من localStorage
      const storedUser = localStorage.getItem('currentUser');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      
      // إنشاء وثيقة جديدة في مجموعة الشكاوى والاقتراحات
      await addDoc(collection(db, "feedbacks"), {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        status: "new", // حالة مبدئية "جديد"
        timestamp: serverTimestamp(),
        userId: currentUser?.email || "anonymous",
        userName: currentUser?.name || "زائر",
        userRole: currentUser?.role || "guest"
      });
      
      setSubmitSuccess(true);
      // إعادة تعيين النموذج
      setFormData({
        type: "complaint",
        title: "",
        description: ""
      });
      
      // إغلاق رسالة النجاح بعد 3 ثوان
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error("خطأ في إرسال الشكوى/الاقتراح:", error);
      setSubmitError("حدث خطأ أثناء إرسال الشكوى/الاقتراح. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-4">
        <motion.button
          onClick={() => navigate('/naf3ny')}
          className="mb-8 flex items-center text-cyan-800 font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          العودة للرئيسية
        </motion.button>
        
        <motion.div
          className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto border border-cyan-100"
          dir="rtl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold text-cyan-800 mb-8 text-center">الشكاوى والاقتراحات</h1>
          
          {submitSuccess && (
            <motion.div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              تم إرسال {formData.type === "complaint" ? "الشكوى" : "الاقتراح"} بنجاح. شكراً لك!
            </motion.div>
          )}
          
          {submitError && (
            <motion.div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {submitError}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">نوع الرسالة</label>
              <div className="flex space-x-4 space-x-reverse">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="complaint"
                    checked={formData.type === "complaint"}
                    onChange={handleInputChange}
                    className="ml-2 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>شكوى</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="suggestion"
                    checked={formData.type === "suggestion"}
                    onChange={handleInputChange}
                    className="ml-2 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>اقتراح</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">
                العنوان
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="أدخل عنوان الشكوى/الاقتراح"
                className={`w-full border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-cyan-500`}
                value={formData.title}
                onChange={handleInputChange}
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">
                التفاصيل
                <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                placeholder="أدخل تفاصيل الشكوى/الاقتراح"
                className={`w-full border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 h-40`}
                value={formData.description}
                onChange={handleInputChange}
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>
            
            <motion.button
              type="submit"
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>جاري الإرسال...</span>
              ) : (
                <span>إرسال {formData.type === "complaint" ? "الشكوى" : "الاقتراح"}</span>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ComplaintsPage;