import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const SettingsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromProvider = location.state?.fromProvider || false;

  // الحقول الأساسية لجميع المستخدمين
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    governorate: "",
    phoneNumber: "",
    role: "" // 'user' أو 'provider'
  });

  // الحقول الخاصة بمقدمي الخدمة فقط
  const [providerData, setProviderData] = useState({
    nationalId: "",
    category: "",
    profession: "",
    subscriptionFee: "",
    idFrontImage: "",
    idBackImage: "",
    profileImage: "",
    bio: "",
    allowContact: false,
    address: "",
    workingAreas: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [idFrontImagePreview, setIdFrontImagePreview] = useState("");
  const [idBackImagePreview, setIdBackImagePreview] = useState("");
  const [profileImagePreview, setProfileImagePreview] = useState("");

  // قوائم الاختيارات
  const governorates = [
    "وسط البلد", "الزمالك", "المعادي", "مدينة نصر",
    "المرج", "حلوان", "السيدة زينب",
    "شبرا", "المطرية"
  ];

  const serviceCategories = {
    "خدمات فنية": ["سباك", "نجار", "كهربائي", "ميكانيكي", "حداد"],
    "خدمات صحية": ["طبيب", "ممرض", "صيدلي", "فني مختبر"],
    "خدمات عامة": ["توصيل طلبات", "نقل", "تنظيف"]
  };

  const subscriptionFees = ["100 جنيه", "200 جنيه", "300 جنيه"];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
          navigate('/naf3ny/login');
          return;
        }
  
        const currentUser = JSON.parse(storedUser);
        let docId;
        
        // تحديد اسم المجموعة بناءً على الدور
        const collectionName = currentUser.role === 'provider' ? 'serviceProviders' : 'users';
      
        if(collectionName==='serviceProviders'){
           docId = currentUser.email
          
        }
        else{
           docId = currentUser.email.split('@')[0]; // أو استخدام currentUser.uid إذا كان محفوظاً
        }
       
        
        const userDocRef = doc(db, collectionName, docId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          
          // تعيين البيانات الأساسية المشتركة
          setUserData({
            name: data.name || "",
            email: data.email || "",
            password: "",
            governorate: data.governorate || "",
            phone: data.phone || data.phoneNumber ||"",
            role: currentUser.role // استخدام الدور من currentUser
          });
  
          // إذا كان مقدم خدمة، تعيين البيانات الإضافية
          if (currentUser.role === 'provider') {
            setProviderData({
              nationalId: data.nationalId || "",
              category: data.category || "",
              profession: data.profession || "",
              subscriptionFee: data.subscriptionFee || "",
              idFrontImage: data.idFrontImage || "",
              idBackImage: data.idBackImage || "",
              profileImage: data.profileImage || "",
              bio: data.bio || "",
              allowContact: data.allowContact || false,
              address: data.address || "",
              workingAreas: data.workingAreas || []
            });
  
            // تعيين معاينات الصور
            if (data.idFrontImage) setIdFrontImagePreview(data.idFrontImage);
            if (data.idBackImage) setIdBackImagePreview(data.idBackImage);
            if (data.profileImage) setProfileImagePreview(data.profileImage);
          }
        } else {
          alert("لم يتم العثور على بيانات المستخدم");
          navigate('/naf3ny');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchUserData();
  }, [navigate]);
  const validateForm = () => {
    let newErrors = {};

    // التحقق من الحقول الأساسية
    if (!userData.name.trim()) newErrors.name = "الاسم مطلوب";
    if (!userData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = "البريد الإلكتروني غير صالح";
    }
    if (userData.password && userData.password.length < 6) {
      newErrors.password = "يجب أن تكون كلمة المرور 6 أحرف على الأقل";
    }
    if (!userData.governorate) newErrors.governorate = "يجب اختيار المحافظة";
    if (!userData.phone) newErrors.phone = "رقم الهاتف مطلوب";

    // التحقق من حقول مقدم الخدمة إذا كان المستخدم مقدم خدمة
    if (userData.role === 'provider') {
      if (!providerData.nationalId) newErrors.nationalId = "الرقم القومي مطلوب";
      if (!providerData.profession) newErrors.profession = "المهنة مطلوبة";
      if (!providerData.address) newErrors.address = "العنوان مطلوب";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUserDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors({ ...errors, [name]: "" });
  };

  const handleProviderDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProviderData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors({ ...errors, [name]: "" });
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setProviderData(prev => ({
      ...prev,
      category: selectedCategory,
      profession: serviceCategories[selectedCategory]?.[0] || ""
    }));
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = reader.result;
      setProviderData(prev => ({ ...prev, [field]: base64Image }));
      
      if (field === 'idFrontImage') setIdFrontImagePreview(base64Image);
      else if (field === 'idBackImage') setIdBackImagePreview(base64Image);
      else if (field === 'profileImage') setProfileImagePreview(base64Image);
    };
    reader.readAsDataURL(file);
  };

  const handleWorkingAreaChange = (e) => {
    const { value, checked } = e.target;
    setProviderData(prev => {
      if (checked) {
        return { ...prev, workingAreas: [...prev.workingAreas, value] };
      } else {
        return { ...prev, workingAreas: prev.workingAreas.filter(area => area !== value) };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      let username;
      
      if (userData.role === 'provider') {
       username = userData.email;
      }
      else {
        username = userData.email.split('@')[0];
       }
      const collectionName = userData.role === 'provider' ? 'serviceProviders' : 'users';
      
      const userDocRef = doc(db, collectionName, username);
      console.log("Document Reference:", userDocRef.path); // طباعة مسار الوثيقة في وحدة التحكم
      
      // تحضير بيانات التحديث
      const updateData = { 
        ...userData,
        ...(userData.role === 'provider' ? providerData : {})
      };

      // عدم تحديث كلمة المرور إذا كانت فارغة
      if (!updateData.password) {
        delete updateData.password;
      } else {
          // هنا يمكنك تشفير كلمة المرور قبل حفظها
      }
   
      await updateDoc(userDocRef, updateData);
      console.log("Collection Name:", 1); 
      // تحديث localStorage
      const updatedUser = {
        ...userData,
        ...(userData.role === 'provider' ? providerData : {})
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      setUpdateSuccess(true);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user data:", error);
      alert("حدث خطأ أثناء تحديث البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-blue-200">
        <div className="text-2xl text-cyan-800">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-4">
        <motion.button
          onClick={() => navigate(fromProvider ? '/naf3ny/servicer_page' : '/naf3ny')}
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
          className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto border border-cyan-100"
          dir="rtl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-cyan-800">
              {userData.role === 'provider' ? 'إعدادات مقدم الخدمة' : 'إعدادات الحساب'}
            </h1>
            {!isEditing && (
              <motion.button
                onClick={() => setIsEditing(true)}
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-cyan-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                تعديل البيانات
              </motion.button>
            )}
          </div>

          {updateSuccess && (
            <motion.div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              تم تحديث البيانات بنجاح
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* الحقول الأساسية لجميع المستخدمين */}
            <div className="space-y-1">
              <label className="block text-gray-700 font-medium text-sm">الاسم</label>
              <input
                type="text"
                name="name"
                placeholder="أدخل الاسم"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
                value={userData.name}
                onChange={handleUserDataChange}
                disabled={!isEditing}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-gray-700 font-medium text-sm">البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                placeholder="أدخل البريد الإلكتروني"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
                value={userData.email}
                onChange={handleUserDataChange}
                disabled={true} // لا يمكن تعديل البريد الإلكتروني
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-gray-700 font-medium text-sm">
                كلمة المرور (اتركها فارغة إذا لم ترغب في تغييرها)
              </label>
              <input
                type="password"
                name="password"
                placeholder="أدخل كلمة المرور الجديدة"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
                value={userData.password}
                onChange={handleUserDataChange}
                disabled={!isEditing}
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-gray-700 font-medium text-sm">رقم الهاتف</label>
              <input
                type="tel"
                name="phone"
                placeholder="أدخل رقم الهاتف"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
                value={userData.phone}
                onChange={handleUserDataChange}
                disabled={!isEditing}
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-gray-700 font-medium text-sm">المحافظة</label>
              <select
                name="governorate"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
                value={userData.governorate}
                onChange={handleUserDataChange}
                disabled={!isEditing}
              >
                <option value="" disabled>اختر المحافظة</option>
                {governorates.map((gov, i) => (
                  <option key={i} value={gov}>{gov}</option>
                ))}
              </select>
              {errors.governorate && <p className="text-red-500 text-sm">{errors.governorate}</p>}
            </div>

            {/* حقول مقدم الخدمة فقط */}
            {userData.role === 'provider' && (
              <>
                <div className="space-y-1">
                  <label className="block text-gray-700 font-medium text-sm">الرقم القومي</label>
                  <input
                    type="text"
                    name="nationalId"
                    placeholder="أدخل الرقم القومي"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
                    value={providerData.nationalId}
                    onChange={handleProviderDataChange}
                    disabled={!isEditing}
                  />
                  {errors.nationalId && <p className="text-red-500 text-sm">{errors.nationalId}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-700 font-medium text-sm">التصنيف</label>
                  <select
                    name="category"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
                    value={providerData.category}
                    onChange={handleCategoryChange}
                    disabled={!isEditing}
                  >
                    <option value="" disabled>اختر التصنيف</option>
                    {Object.keys(serviceCategories).map((category, i) => (
                      <option key={i} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-700 font-medium text-sm">المهنة</label>
                  <select
                    name="profession"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
                    value={providerData.profession}
                    onChange={handleProviderDataChange}
                    disabled={!isEditing}
                  >
                    <option value="" disabled>اختر المهنة</option>
                    {providerData.category && serviceCategories[providerData.category]?.map((profession, i) => (
                      <option key={i} value={profession}>{profession}</option>
                    ))}
                  </select>
                  {errors.profession && <p className="text-red-500 text-sm">{errors.profession}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-700 font-medium text-sm">رسوم الاشتراك</label>
                  <select
                    name="subscriptionFee"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
                    value={providerData.subscriptionFee}
                    onChange={handleProviderDataChange}
                    disabled={!isEditing}
                  >
                    {subscriptionFees.map((fee, i) => (
                      <option key={i} value={fee}>{fee}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-700 font-medium text-sm">العنوان</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="أدخل العنوان بالتفصيل"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
                    value={providerData.address}
                    onChange={handleProviderDataChange}
                    disabled={!isEditing}
                  />
                  {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                </div>

                <div className="space-y-1">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="allowContact"
                      checked={providerData.allowContact}
                      onChange={handleProviderDataChange}
                      disabled={!isEditing}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-gray-700">السماح بالتواصل المباشر مع العملاء</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="block text-gray-700 font-medium text-sm">صور البطاقة</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block">صورة البطاقة من الأمام</label>
                      {idFrontImagePreview ? (
                        <img src={idFrontImagePreview} alt="Front ID" className="h-40 w-full object-contain border rounded-lg" />
                      ) : (
                        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <span className="text-gray-500">لا توجد صورة</span>
                        </div>
                      )}
                      {isEditing && (
                        <input
                          type="file"
                          onChange={(e) => handleImageUpload(e, 'idFrontImage')}
                          className="w-full"
                          accept="image/*"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block">صورة البطاقة من الخلف</label>
                      {idBackImagePreview ? (
                        <img src={idBackImagePreview} alt="Back ID" className="h-40 w-full object-contain border rounded-lg" />
                      ) : (
                        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <span className="text-gray-500">لا توجد صورة</span>
                        </div>
                      )}
                      {isEditing && (
                        <input
                          type="file"
                          onChange={(e) => handleImageUpload(e, 'idBackImage')}
                          className="w-full"
                          accept="image/*"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-gray-700 font-medium text-sm">الصورة الشخصية</label>
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile" className="h-40 w-40 object-cover rounded-full mx-auto border" />
                  ) : (
                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-full h-40 w-40 mx-auto flex items-center justify-center">
                      <span className="text-gray-500">لا توجد صورة</span>
                    </div>
                  )}
                  {isEditing && (
                    <input
                      type="file"
                      onChange={(e) => handleImageUpload(e, 'profileImage')}
                      className="w-full"
                      accept="image/*"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-700 font-medium text-sm">نبذة عنك</label>
                  <textarea
                    name="bio"
                    placeholder="أدخل نبذة عنك وخبراتك"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 h-24"
                    value={providerData.bio}
                    onChange={handleProviderDataChange}
                    disabled={!isEditing}
                  />
                </div>

              
              </>
            )}

            {isEditing && (
              <motion.div 
                className="pt-4 grid grid-cols-2 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium shadow-md"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  إلغاء
                </motion.button>
                <motion.button
                  type="submit"
                  className="py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium shadow-md"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  حفظ التغييرات
                </motion.button>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;