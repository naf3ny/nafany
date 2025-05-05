import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  // حالات الصفحة
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [reviews, setReviews] = useState([]); // تم تغيير ratings إلى reviews لتتناسب مع كودك
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // جلب المستخدمين
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);

        // جلب مقدمي الخدمة
        const providersSnapshot = await getDocs(collection(db, "serviceProviders"));
        const providersData = providersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProviders(providersData);

        // جلب الشكاوى والاقتراحات
        const feedbacksSnapshot = await getDocs(collection(db, "feedbacks"));
        const feedbacksData = feedbacksSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFeedbacks(feedbacksData);

        // جلب التقييمات (المراجعات) من مجموعة 'reviews' بدلاً من 'ratings'
        const reviewsSnapshot = await getDocs(collection(db, "reviews"));
        const reviewsData = reviewsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() // تحويل الطابع الزمني إلى تاريخ
        }));
        setReviews(reviewsData);
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
        alert("حدث خطأ أثناء تحميل البيانات");
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  console.log(reviews);
  console.log(users);

  // حذف عنصر
  const handleDelete = async (itemId, collectionName) => {
    if (window.confirm("هل أنت متأكد من رغبتك في الحذف؟")) {
      try {
        await deleteDoc(doc(db, collectionName, itemId));
        
        // تحديث واجهة المستخدم بعد الحذف
        if (collectionName === "users") {
          setUsers(users.filter(user => user.id !== itemId));
        } else if (collectionName === "serviceProviders") {
          setProviders(providers.filter(provider => provider.id !== itemId));
        } else if (collectionName === "feedbacks") {
          setFeedbacks(feedbacks.filter(feedback => feedback.id !== itemId));
        } else if (collectionName === "reviews") {
          setReviews(reviews.filter(review => review.id !== itemId));
        }
        
        alert("تم الحذف بنجاح");
      } catch (error) {
        console.error("خطأ في الحذف:", error);
        alert("حدث خطأ أثناء الحذف");
      }
    }
  };

  // تحرير عنصر
  const handleEdit = (item, collectionName) => {
    setSelectedItem({ item, collectionName });
    setEditFormData(item);
    setIsEditModalOpen(true);
  };

  // حفظ التحرير
  const handleSaveEdit = async () => {
    try {
      const { item, collectionName } = selectedItem;
      await updateDoc(doc(db, collectionName, item.id), editFormData);
      
      // تحديث واجهة المستخدم بعد التحرير
      if (collectionName === "users") {
        setUsers(users.map(user => user.id === item.id ? { ...user, ...editFormData } : user));
      } else if (collectionName === "serviceProviders") {
        setProviders(providers.map(provider => provider.id === item.id ? { ...provider, ...editFormData } : provider));
      } else if (collectionName === "feedbacks") {
        setFeedbacks(feedbacks.map(feedback => feedback.id === item.id ? { ...feedback, ...editFormData } : feedback));
      } else if (collectionName === "reviews") {
        setReviews(reviews.map(review => review.id === item.id ? { ...review, ...editFormData } : review));
      }
      
      setIsEditModalOpen(false);
      alert("تم التحديث بنجاح");
    } catch (error) {
      console.error("خطأ في التحديث:", error);
      alert("حدث خطأ أثناء التحديث");
    }
  };

  // عرض التفاصيل
  const handleViewDetails = async (itemId, collectionName) => {
    try {
      const docRef = doc(db, collectionName, itemId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        
        // إذا كان مقدم خدمة، قم بجلب تقييماته
        if (collectionName === "serviceProviders") {
          const providerReviews = reviews.filter(review => review.providerEmail === data.email);
          data.reviewsDetails = providerReviews;
        }
        
        setDetailData(data);
        setIsDetailModalOpen(true);
      } else {
        alert("لم يتم العثور على البيانات");
      }
    } catch (error) {
      console.error("خطأ في جلب التفاصيل:", error);
      alert("حدث خطأ أثناء جلب التفاصيل");
    }
  };

  // تنسيق التاريخ
  const formatDate = (date) => {
    if (!date) return "غير محدد";
    if (date instanceof Date) {
      return date.toLocaleDateString('ar-EG');
    } else if (date.toDate) {
      return date.toDate().toLocaleDateString('ar-EG');
    } else {
      return "غير محدد";
    }
  };

  // عرض التقييمات (المراجعات)
  const renderReviews = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200" dir="rtl">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مقدم الخدمة</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التقييم</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التعليق</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reviews.map((review) => (
            <tr key={review.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{review.clientName}</div>
                <div className="text-sm text-gray-500">{review.clientEmail}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{review.providerName}</div>
                <div className="text-sm text-gray-500">{review.providerCategory}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-sm text-gray-600 mr-1">{review.rating}/5</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 truncate max-w-xs">{review.review}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-left">
                <button
                  className="text-cyan-600 hover:text-cyan-900 ml-2"
                  onClick={() => handleViewDetails(review.id, "reviews")}
                >
                  عرض
                </button>
                <button
                  className="text-indigo-600 hover:text-indigo-900 ml-2"
                  onClick={() => handleEdit(review, "reviews")}
                >
                  تعديل
                </button>
                <button
                  className="text-red-600 hover:text-red-900"
                  onClick={() => handleDelete(review.id, "reviews")}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );


  // المكونات الرئيسية للصفحة
  const renderTabs = () => (
    <div className="flex flex-wrap border-b text-sm font-medium text-center text-gray-500 mb-4">
      {[
        { id: "users", label: "المستخدمين" },
        { id: "providers", label: "مقدمي الخدمة" },
        { id: "complaints", label: "الشكاوى والاقتراحات" },
        { id: "reviews", label: "التقييمات" } // تغيير من ratings إلى reviews
      ].map(tab => (
        <button
          key={tab.id}
          className={`inline-block p-4 rounded-t-lg ${activeTab === tab.id ? 'text-cyan-600 border-b-2 border-cyan-600' : 'hover:text-gray-600 hover:border-gray-300'}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  // عرض المستخدمين
  const renderUsers = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200" dir="rtl">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البريد الإلكتروني</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المحافظة</th>
          
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.governorate}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-left">
                <button
                  className="text-cyan-600 hover:text-cyan-900 ml-2"
                  onClick={() => handleViewDetails(user.id, "users")}
                >
                  عرض
                </button>
                <button
                  className="text-indigo-600 hover:text-indigo-900 ml-2"
                  onClick={() => handleEdit(user, "users")}
                >
                  تعديل
                </button>
                <button
                  className="text-red-600 hover:text-red-900"
                  onClick={() => handleDelete(user.id, "users")}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // عرض مقدمي الخدمة
  const renderProviders = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200" dir="rtl">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المهنة</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التصنيف</th>
       
          
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {providers.map((provider) => (
            <tr key={provider.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {provider.profileImage && (
                    <div className="flex-shrink-0 h-10 w-10 ml-2">
                      <img className="h-10 w-10 rounded-full" src={provider.profileImage} alt="" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                    <div className="text-sm text-gray-500">{provider.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{provider.profession}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {provider.category}
                </span>
              </td>
             
              <td className="px-6 py-4 whitespace-nowrap text-left">
                <button
                  className="text-cyan-600 hover:text-cyan-900 ml-2"
                  onClick={() => handleViewDetails(provider.id, "serviceProviders")}
                >
                  عرض
                </button>
                <button
                  className="text-indigo-600 hover:text-indigo-900 ml-2"
                  onClick={() => handleEdit(provider, "serviceProviders")}
                >
                  تعديل
                </button>
                <button
                  className="text-red-600 hover:text-red-900"
                  onClick={() => handleDelete(provider.id, "serviceProviders")}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // عرض الشكاوى والاقتراحات
  const renderFeedbacks = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200" dir="rtl">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنوان</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {feedbacks.map((feedback) => (
            <tr key={feedback.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  feedback.type === "complaint" 
                    ? "bg-red-100 text-red-800" 
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {feedback.type === "complaint" ? "شكوى" : "اقتراح"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{feedback.userName}</div>
                <div className="text-sm text-gray-500">{feedback.userId}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDate(feedback.timestamp)}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{feedback.title}</div>
                <div className="text-sm text-gray-500 truncate max-w-xs">{feedback.description}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  feedback.status === "new" 
                    ? "bg-gray-100 text-gray-800" 
                    : feedback.status === "in_progress" 
                      ? "bg-yellow-100 text-yellow-800" 
                      : feedback.status === "resolved" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                }`}>
                  {feedback.status === "new" 
                    ? "جديد" 
                    : feedback.status === "in_progress" 
                      ? "قيد المعالجة" 
                      : feedback.status === "resolved" 
                        ? "تم الحل" 
                        : "مرفوض"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-left">
                <button
                  className="text-cyan-600 hover:text-cyan-900 ml-2"
                  onClick={() => handleViewDetails(feedback.id, "feedbacks")}
                >
                  عرض
                </button>
                <button
                  className="text-indigo-600 hover:text-indigo-900 ml-2"
                  onClick={() => handleEdit(feedback, "feedbacks")}
                >
                  تعديل
                </button>
                <button
                  className="text-red-600 hover:text-red-900"
                  onClick={() => handleDelete(feedback.id, "feedbacks")}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );


  // نافذة التعديل
  // نافذة التعديل
const renderEditModal = () => (
  isEditModalOpen && selectedItem && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <h2 className="text-xl font-bold mb-4">تعديل البيانات</h2>
        <div className="space-y-4">
          {selectedItem.collectionName === "feedbacks" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={editFormData.type || 'complaint'}
                  onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                >
                  <option value="complaint">شكوى</option>
                  <option value="suggestion">اقتراح</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={editFormData.status || 'new'}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                >
                  <option value="new">جديد</option>
                  <option value="in_progress">قيد المعالجة</option>
                  <option value="resolved">تم الحل</option>
                  <option value="rejected">مرفوض</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرد</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={editFormData.response || ''}
                  onChange={(e) => setEditFormData({...editFormData, response: e.target.value})}
                  placeholder="أدخل ردك هنا..."
                />
              </div>
            </>
          )}
          
          {selectedItem.collectionName !== "feedbacks" && (
            Object.keys(editFormData).filter(key => 
              typeof editFormData[key] !== 'object' && 
              typeof editFormData[key] !== 'function' &&
              !key.includes('Image') &&
              key !== 'id' 
            ).map(key => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                {key === 'bio' || key === 'message' || key === 'comment' ? (
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={editFormData[key] || ''}
                    onChange={(e) => setEditFormData({...editFormData, [key]: e.target.value})}
                  />
                ) : (
                  <input
                    type={key === 'email' ? 'email' : 'text'}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={editFormData[key] || ''}
                    onChange={(e) => setEditFormData({...editFormData, [key]: e.target.value})}
                  />
                )}
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
            onClick={() => setIsEditModalOpen(false)}
          >
            إلغاء
          </button>
          <button
            className="px-4 py-2 bg-cyan-600 text-white rounded-md"
            onClick={handleSaveEdit}
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  )
);
  // نافذة عرض التفاصيل
  const renderDetailModal = () => (
    isDetailModalOpen && detailData && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto" dir="rtl">
          <h2 className="text-2xl font-bold mb-4">التفاصيل</h2>
          
          {/* عرض تفاصيل مقدم الخدمة */}
          {detailData.category && (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                {detailData.profileImage && (
                  <img src={detailData.profileImage} alt="" className="h-16 w-16 rounded-full object-cover ml-4" />
                )}
                <div>
                  <h3 className="text-xl font-semibold">{detailData.name}</h3>
                  <p className="text-gray-600">{detailData.profession} - {detailData.category}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600">البريد الإلكتروني: {detailData.email}</p>
                  <p className="text-gray-600"> الباسورد: {detailData.password}</p>
                  <p className="text-gray-600">رقم الهاتف: {detailData.phone}</p>
                  <p className="text-gray-600">العنوان: {detailData.address}</p>
                  <p className="text-gray-600">المحافظة: {detailData.governorate}</p>
                </div>
                <div>
                  <p className="text-gray-600">رسوم الاشتراك: {detailData.subscriptionFee}</p>
                  <p className="text-gray-600">متوسط التقييم: {detailData.averageRating ? detailData.averageRating.toFixed(1) : "لا يوجد"} ({detailData.totalRatings || 0} تقييم)</p>
                  <p className="text-gray-600">عدد الأعمال: {detailData.worksCount || 0}</p>
                </div>
              </div>
              
              {detailData.bio && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1">نبذة:</h4>
                  <p className="text-gray-600">{detailData.bio}</p>
                </div>
              )}
              
              {/* عرض التقييمات */}
              {detailData.ratingsDetails && detailData.ratingsDetails.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">التقييمات ({detailData.ratingsDetails.length})</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {detailData.ratingsDetails.map((rating, idx) => (
                      <div key={idx} className="border-b border-gray-200 pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
                        <div className="flex justify-between mb-1">
                          <div className="font-medium">{rating.userName}</div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-4 w-4 ${i < rating.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="text-xs text-gray-600 mr-1">{rating.rating}/5</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{rating.comment}</p>
                        <div className="text-xs text-gray-500 mt-1">{formatDate(rating.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* عرض تفاصيل المستخدم */}
          {!detailData.category && !detailData.providerId && !detailData.title && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(detailData).filter(([key]) => 
                key !== 'id' && 
                typeof detailData[key] !== 'object' && 
                typeof detailData[key] !== 'function'
              ).map(([key, value]) => (
                <div key={key} className="mb-3">
                  <h4 className="font-semibold">{key}:</h4>
                  <p className="text-gray-600">{value?.toString() || "غير محدد"}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* عرض تفاصيل الشكوى/الاقتراح */}
          {detailData.title && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">معلومات المستخدم</h3>
                <p className="text-gray-600">الاسم: {detailData.userName}</p>
                <p className="text-gray-600">البريد الإلكتروني: {detailData.userId}</p>
                <p className="text-gray-600">الدور: {detailData.userRole}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">تفاصيل {detailData.type === "complaint" ? "الشكوى" : "الاقتراح"}</h3>
                <p className="text-gray-600">النوع: 
                  <span className={`mr-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    detailData.type === "complaint" 
                      ? "bg-red-100 text-red-800" 
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {detailData.type === "complaint" ? "شكوى" : "اقتراح"}
                  </span>
                </p>
                <p className="text-gray-600">العنوان: {detailData.title}</p>
                <p className="text-gray-600">تاريخ الإنشاء: {formatDate(detailData.timestamp)}</p>
                <p className="text-gray-600">الحالة: 
                  <span className={`mr-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    detailData.status === "new" 
                      ? "bg-gray-100 text-gray-800" 
                      : detailData.status === "in_progress" 
                        ? "bg-yellow-100 text-yellow-800" 
                        : detailData.status === "resolved" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                  }`}>
                    {detailData.status === "new" 
                      ? "جديد" 
                      : detailData.status === "in_progress" 
                        ? "قيد المعالجة" 
                        : detailData.status === "resolved" 
                          ? "تم الحل" 
                          : "مرفوض"}
                  </span>
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded">
                  <h4 className="font-semibold mb-1">التفاصيل:</h4>
                  <p className="text-gray-800 whitespace-pre-line">{detailData.description}</p>
                </div>
              </div>
              
              {detailData.response && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">الرد</h3>
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-gray-800 whitespace-pre-line">{detailData.response}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">تاريخ الرد: {formatDate(detailData.respondedAt)}</p>
                </div>
              )}
            </div>
          )}
          
          {/* عرض تفاصيل التقييم */}
          {detailData.providerId && !detailData.title && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">معلومات التقييم</h3>
                <p className="text-gray-600">المستخدم: {detailData.userName}</p>
                <p className="text-gray-600">مقدم الخدمة: {detailData.providerName}</p>
                <p className="text-gray-600">تاريخ التقييم: {formatDate(detailData.createdAt)}</p>
                
                <div className="flex items-center my-2">
                  <span className="ml-2">التقييم:</span>
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${i < detailData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-sm text-gray-600 mr-1">{detailData.rating}/5</span>
                </div>
                
                <div className="mt-2">
                  <h4 className="font-semibold mb-1">التعليق:</h4>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-800">{detailData.comment}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
              onClick={() => setIsDetailModalOpen(false)}
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    )
  );

  // رسالة التحميل
  const renderLoading = () => (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
    </div>
  );

  // الصفحة الرئيسية
  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-right">لوحة تحكم المشرف</h1>
      <motion.button 
                  onClick={() => {
                    
                    navigate('/nafany/login');
                  }}
                  className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {true ? 'تسجيل الخروج' : 'تسجيل الدخول'}
                </motion.button>
      
      {renderTabs()}
      
      {isLoading ? (
        renderLoading()
      ) : (
        <>
       
        <div className="bg-white shadow-md rounded-lg p-4">
           
        {activeTab === "users" && renderUsers()}
        {activeTab === "providers" && renderProviders()}
        {activeTab === "complaints" && renderFeedbacks()}
        {activeTab === "reviews" && renderReviews()}
      </div></>
        
      )}
      
      {renderEditModal()}
      {renderDetailModal()}
    </motion.div>
  );
};

export default AdminDashboard;