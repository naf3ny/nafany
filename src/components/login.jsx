import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom"; // تم استيراد Link
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Login = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(""); // "user" أو "provider"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if(emailOrPhone === "admin" && password === "admin1") {
        navigate("/naf3ny/admin");
      }
      // تحديد المجموعة بناءً على الدور
      const collectionName = role === "user" ? "users" : "serviceProviders";
      const usersRef = collection(db, collectionName);

      // البحث عن المستخدم باستخدام البريد الإلكتروني أو رقم الهاتف
      const q = query(
        usersRef,
        where("email", "==", emailOrPhone)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("الحساب غير موجود");
        return;
      }

      // الحصول على بيانات المستخدم
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // التحقق من كلمة المرور
      if (userData.password !== password) {
        setError("كلمة المرور غير صحيحة");
        return;
      }

      // حفظ بيانات المستخدم في localStorage
      const userToStore = {
        uid: userDoc.id,
        email: userData.email,
        name: userData.name || '',
        phone: userData.phone || '',
        role: role,
        // إضافة المزيد من البيانات المشتركة
        governorate: userData.governorate || '',
        // إذا كان مقدم خدمة، أضف بيانات إضافية
        ...(role === 'provider' && {
          profession: userData.profession || '',
          category: userData.category || '',
          profileImage: userData.profileImage || ''
        })
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userToStore));
      
      
       if (role === "user") {
        navigate("/naf3ny");
      } else if (role === "provider") {
        navigate("/naf3ny/servicer_page");
      }
    
    } catch (error) {
      console.error("خطأ أثناء تسجيل الدخول:", error);
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-cyan-50 to-cyan-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-8 bg-white rounded-xl shadow-lg text-right w-full max-w-md border border-cyan-100"
        dir="rtl"
      >
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl font-bold text-cyan-800 mb-6 text-center"
        >
          تسجيل الدخول
        </motion.h2>
        
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="max-w-md mx-auto">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">البريد الإلكتروني أو رقم الهاتف*</label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">كلمة المرور*</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500"
              required
            />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="user"
                  name="role"
                  value="user"
                  checked={role === "user"}
                  onChange={() => setRole("user")}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="user" className="mr-2 block text-sm text-gray-700">
                  مستخدم
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="provider"
                  name="role"
                  value="provider"
                  checked={role === "provider"}
                  onChange={() => setRole("provider")}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="provider" className="mr-2 block text-sm text-gray-700">
                  مقدم خدمة
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <motion.button 
              type="submit"
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="block w-full py-3 bg-cyan-600 hover:bg-cyan-700 focus:bg-cyan-700 text-white rounded-md text-center font-medium shadow-md"
              disabled={loading}
            >
              {loading ? "جاري التحميل..." : "تسجيل الدخول"}
            </motion.button>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button onClick={() => navigate(-1)} className="block w-full py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-center font-medium shadow-md">
                رجوع
              </button>
            </motion.div>
          </div>
        </form>

        {/* قسم الروابط الجديدة */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-3">ليس لديك حساب؟</p>
          
          <div className="flex flex-col gap-2">
            <Link 
              to="/naf3ny/register_user" 
              className="text-cyan-600 hover:text-cyan-800 font-medium text-sm"
            >
              إنشاء حساب مستخدم جديد
            </Link>
            
            <Link 
              to="/naf3ny/register" 
              className="text-cyan-600 hover:text-cyan-800 font-medium text-sm"
            >
              التسجيل كمقدم خدمة
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;