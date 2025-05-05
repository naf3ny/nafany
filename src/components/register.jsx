import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, setDoc, query, where, getDocs, doc } from "firebase/firestore";

const RegisterProvider = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    nationalId: "",
    governorate: "",
    category: "",
    profession: "",
    subscriptionFee: "",
    idFrontImage: null,
    idBackImage: null,
    profileImage: null,
    bio: "",
    allowContact: false,
    phone: "",
    address: "",
    ratings: {},
    chats: {},
    works: [],
    worksCount: 0,
    averageRating: 0,
    totalRatings: 0,
    role:"user"
  });

  const [previewFrontImage, setPreviewFrontImage] = useState(null);
  const [previewBackImage, setPreviewBackImage] = useState(null);
  const [previewProfileImage, setPreviewProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [emailExists, setEmailExists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const governorates = [
    "وسط البلد", "الزمالك", "المعادي", "مدينة نصر",
    "المرج", "حلوان", "السيدة زينب",
    "شبرا", "المطرية"
  ];

  const serviceCategories = {
    "خدمات فنية": [
      "سباك", "نجار", "كهربائي", "ميكانيكي", "حداد",
      "فني تكييفات", "نقاش", "ترزي",
    ],
    "خدمات صحية": [
      "طبيب عام", "صيدلي", "أخصائي تغذية",
      "ممرض", "أخصائي علاج طبيعي","طبيب أسنان"
    ],
    "خدمات عامة": [
      "سوبر ماركت", "مطعم", "كافيه", "مولات",
      
    ],
    "خدمات أخرى": [
      "عطار", "جزار", "فكهاني", "خضري",
      "محل ألبان",
    ]
  };

  const subscriptionFees = ["100 جنيه", "200 جنيه", "300 جنيه"];

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      governorate: governorates[0],
      category: Object.keys(serviceCategories)[0],
      profession: serviceCategories[Object.keys(serviceCategories)[0]][0],
      subscriptionFee: subscriptionFees[0],
    }));
  }, []);

  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim()) newErrors.name = "الاسم مطلوب";
    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "البريد الإلكتروني غير صالح";
    }
    if (!formData.password.trim()) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 6) {
      newErrors.password = "يجب أن تكون كلمة المرور 6 أحرف على الأقل";
    }
    if (!formData.nationalId.trim()) newErrors.nationalId = "الرقم القومي مطلوب";
    if (!formData.idFrontImage) newErrors.idFrontImage = "صورة البطاقة الأمامية مطلوبة";
    if (!formData.idBackImage) newErrors.idBackImage = "صورة البطاقة الخلفية مطلوبة";
    if (!formData.phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
    if (!formData.address.trim()) newErrors.address = "العنوان مطلوب";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkEmailExists = async (email) => {
    const q = query(collection(db, "serviceProviders"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleImageUpload = (file, field) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = reader.result;
      setFormData((prev) => ({
        ...prev,
        [field]: base64Image,
      }));

      if (field === "idFrontImage") {
        setPreviewFrontImage(base64Image);
        setErrors({...errors, idFrontImage: ""});
      } else if (field === "idBackImage") {
        setPreviewBackImage(base64Image);
        setErrors({...errors, idBackImage: ""});
      } else if (field === "profileImage") {
        setPreviewProfileImage(base64Image);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setFormData(prev => ({
      ...prev,
      category: selectedCategory,
      profession: serviceCategories[selectedCategory][0],
      allowContact: selectedCategory === "خدمات فنية" ? prev.allowContact : false
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      const emailAlreadyExists = await checkEmailExists(formData.email);
      
      if (emailAlreadyExists) {
        setEmailExists(true);
        setIsSubmitting(false);
        return;
      }
  
      if (!formData.idFrontImage || !formData.idBackImage) {
        setErrors({
          ...errors,
          idFrontImage: !formData.idFrontImage ? "صورة البطاقة الأمامية مطلوبة" : "",
          idBackImage: !formData.idBackImage ? "صورة البطاقة الخلفية مطلوبة" : ""
        });
        setIsSubmitting(false);
        return;
      }
  
      const providerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password, 
        nationalId: formData.nationalId,
        governorate: formData.governorate,
        category: formData.category,
        profession: formData.profession,
        subscriptionFee: formData.subscriptionFee,
        idFrontImage: formData.idFrontImage,
        idBackImage: formData.idBackImage,
        profileImage: formData.profileImage,
        bio: formData.bio,
        phone: formData.phone,
        address: formData.address,
        createdAt: new Date(),
        ratings: {},
        chats: {},
        works: [],
        worksCount: 0,
        averageRating: 0,
        totalRatings: 0
      };

      if (formData.category === "خدمات فنية") {
        providerData.allowContact = formData.allowContact;
      }
  
      await setDoc(doc(db, "serviceProviders", formData.email), providerData);
  
      alert("تم التسجيل بنجاح");
      navigate("/naf3ny/login");
    } catch (e) {
      console.error("حدث خطأ أثناء التسجيل: ", e);
      alert("حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    
    if (name === "email" && emailExists) {
      setEmailExists(false);
    }
  };

  const renderInputField = (key, index) => {
    const labels = {
      name: "الاسم",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      nationalId: "الرقم القومي",
      phone: "رقم الهاتف",
      address: "العنوان"
    };

    const types = {
      password: "password",
      email: "email",
      nationalId: "number",
      phone: "tel",
      default: "text"
    };

    return (
      <motion.div key={index} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.2 }}>
        <label className="block text-gray-700 font-medium text-sm mb-2">{labels[key]}</label>
        <input
          type={types[key] || types.default}
          name={key}
          placeholder={`أدخل ${labels[key]}`}
          className={`w-full border ${errors[key] ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-cyan-500`}
          required
          value={formData[key]}
          onChange={handleChange}
        />
        {errors[key] && <p className="text-red-500 text-sm mt-1">{errors[key]}</p>}
        {key === "email" && emailExists && <p className="text-red-500 text-sm mt-1">البريد الإلكتروني مستخدم بالفعل</p>}
      </motion.div>
    );
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="p-8 bg-white rounded-xl shadow-lg text-right w-full max-w-lg border border-cyan-100"
        dir="rtl"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className="text-2xl font-bold text-center mb-8 text-cyan-800"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          تسجيل مقدم الخدمة
        </motion.h2>

        <motion.form onSubmit={handleSubmit} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          {["name", "email", "password", "nationalId", "phone", "address"].map((key, index) => 
            renderInputField(key, index)
          )}

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <label className="block text-gray-700 font-medium text-sm mb-2">التصنيف</label>
            <select
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
              required
              value={formData.category}
              onChange={handleCategoryChange}
            >
              {Object.keys(serviceCategories).map((category, i) => (
                <option key={i} value={category}>{category}</option>
              ))}
            </select>
          </motion.div>

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <label className="block text-gray-700 font-medium text-sm mb-2">المهنة/الخدمة</label>
            <select
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
              required
              value={formData.profession}
              onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
            >
              {serviceCategories[formData.category]?.map((profession, i) => (
                <option key={i} value={profession}>{profession}</option>
              ))}
            </select>
          </motion.div>

          {formData.category === "خدمات فنية" && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.allowContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowContact: e.target.checked }))}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-gray-700">السماح بالتواصل المباشر بين الفني والعميل</span>
              </label>
            </motion.div>
          )}

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <label className="block text-gray-700 font-medium text-sm mb-2">المحافظة</label>
            <select
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
              required
              value={formData.governorate}
              onChange={(e) => setFormData(prev => ({ ...prev, governorate: e.target.value }))}
            >
              {governorates.map((gov, i) => (
                <option className={`${i < 3 && i != 0 ? "text-red-600" : ""}`} key={i} value={gov}>{gov}</option>
              ))}
            </select>
          </motion.div>

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
            <label className="block text-gray-700 font-medium text-sm mb-2">رسوم الاشتراك</label>
            <select
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
              required
              value={formData.subscriptionFee}
              onChange={(e) => setFormData(prev => ({ ...prev, subscriptionFee: e.target.value }))}
            >
              {subscriptionFees.map((fee, i) => (
                <option key={i} value={fee}>{fee}</option>
              ))}
            </select>
          </motion.div>

          <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            <label className="block text-gray-700 font-medium text-sm">صور البطاقة</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { field: "idFrontImage", label: "صورة البطاقة من الأمام", preview: previewFrontImage, error: errors.idFrontImage },
                { field: "idBackImage", label: "صورة البطاقة من الخلف", preview: previewBackImage, error: errors.idBackImage },
              ].map((item, index) => (
                <motion.div key={index} className="space-y-2" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.3 }}>
                  <div className={`bg-gray-50 border-2 border-dashed ${item.error ? 'border-red-500' : 'border-gray-300'} rounded-lg p-4 text-center hover:border-cyan-400 transition-colors`}>
                    <input
                      type="file"
                      className="hidden"
                      id={`id-image-${index}`}
                      required
                      onChange={(e) => handleImageUpload(e.target.files[0], item.field)}
                      accept="image/*"
                    />
                    <label htmlFor={`id-image-${index}`} className="cursor-pointer">
                      <div className="text-gray-500 flex flex-col items-center">
                        {item.preview ? (
                          <img src={item.preview} alt={item.label} className="h-20 w-20 object-cover rounded-lg mb-2" />
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-sm font-medium">{item.label}</span>
                            <span className="text-xs mt-1">اضغط للاختيار</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                  {item.error && <p className="text-red-500 text-sm">{item.error}</p>}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <label className="block text-gray-700 font-medium text-sm">الصورة الشخصية</label>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-cyan-400 transition-colors">
              <input
                type="file"
                className="hidden"
                id="profile-image"
                onChange={(e) => handleImageUpload(e.target.files[0], "profileImage")}
                accept="image/*"
              />
              <label htmlFor="profile-image" className="cursor-pointer">
                <div className="text-gray-500 flex flex-col items-center">
                  {previewProfileImage ? (
                    <img src={previewProfileImage} alt="الصورة الشخصية" className="h-20 w-20 object-cover rounded-full mb-2" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-sm font-medium">صورة شخصية</span>
                      <span className="text-xs mt-1">اضغط للاختيار</span>
                    </>
                  )}
                </div>
              </label>
            </div>
          </motion.div>

          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.9 }}>
            <label className="block text-gray-700 font-medium text-sm mb-2">تعريف شخصي</label>
            <textarea
              placeholder="أدخل تعريفاً شخصياً مختصراً عنك وخبراتك"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 h-24"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            />
          </motion.div>

          <motion.div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.button
              type="button"
              onClick={() => navigate(-1)}
              className="py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium shadow-md flex items-center justify-center"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              رجوع
            </motion.button>
            <motion.button
              type="submit"
              className={`py-3 ${isSubmitting ? 'bg-cyan-400' : 'bg-cyan-600 hover:bg-cyan-700'} text-white rounded-lg font-medium shadow-md flex items-center justify-center`}
              whileHover={{ scale: isSubmitting ? 1 : 1.03 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري التسجيل...' : 'تسجيل'}
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
};

export default RegisterProvider;