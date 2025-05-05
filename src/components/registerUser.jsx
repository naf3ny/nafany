import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, setDoc, doc, query, where, getDocs ,getDoc } from "firebase/firestore";

const RegisterUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    governorate: "",
    phoneNumber: "",
    chats: {},
  });

  const [errors, setErrors] = useState({});
  const [emailExists, setEmailExists] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);

  const governorates = [
    "وسط البلد", "الزمالك", "المعادي", "مدينة نصر",
    "المرج", "حلوان", "السيدة زينب",
    "شبرا", "المطرية"
  ];

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
    if (!formData.governorate) newErrors.governorate = "يجب اختيار المحافظة";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkEmailExists = async (email) => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const checkUsernameExists = async (username) => {
    const userDoc = await getDoc(doc(db, "users", username)); // Use getDoc instead of getDocs
    return userDoc.exists();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    const username = formData.email.split('@')[0];
    const emailAlreadyExists = await checkEmailExists(formData.email);
    const usernameAlreadyExists = await checkUsernameExists(username);
    
    if (emailAlreadyExists) {
      setEmailExists(true);
      return;
    }
    
    if (usernameAlreadyExists) {
      setUsernameExists(true);
      return;
    }

    try {
      await setDoc(doc(db, "users", username), {
        ...formData,
      });
      alert("User registered successfully");
      navigate("/naf3ny/login");
    } catch (error) {
      console.error("Error adding user: ", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    if (e.target.name === "email") {
      setEmailExists(false);
      setUsernameExists(false);
    }
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
          تسجيل المستخدم
        </motion.h2>

        <motion.form onSubmit={handleSubmit} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          {[
            { label: "الاسم", name: "name" },
            { label: "عنوان البريد", name: "email" },
            { label: "كلمة المرور", name: "password", type: "password" },
            { label: "رقم الهاتف", name: "phoneNumber" },
          ].map(({ label, name, type = "text" }, index) => (
            <motion.div key={index} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.2 }}>
              <label className="block text-gray-700 font-medium text-sm mb-2">{label}</label>
              <input
                type={type}
                name={name}
                placeholder={`أدخل ${label}`}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
                required
                value={formData[name]}
                onChange={handleChange}
              />
              {errors[name] && <p className="text-red-500 text-sm">{errors[name]}</p>}
              {name === "email" && emailExists && <p className="text-red-500 text-sm">البريد الإلكتروني مستخدم بالفعل</p>}
              {name === "email" && usernameExists && <p className="text-red-500 text-sm">اسم المستخدم مستخدم بالفعل</p>}
            </motion.div>
          ))}

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <label className="block text-gray-700 font-medium text-sm mb-2">المنطقة</label>
            <select
              name="governorate"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500"
              required
              value={formData.governorate}
              onChange={handleChange}
            >
              <option value="" disabled>اختر المحافظة</option>
              {governorates.map((option, i) => (
                <option className={`${i < 3 && i != 0 ? "text-red-600" : ""}`} key={i} value={option}>{option}</option>
              ))}
            </select>
            {errors.governorate && <p className="text-red-500 text-sm">{errors.governorate}</p>}
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
              className="py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium shadow-md flex items-center justify-center"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              تسجيل
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
};

export default RegisterUser;