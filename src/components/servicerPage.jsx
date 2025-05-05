import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { FaStar, FaRegStar, FaEdit, FaTrash,FaUserCircle ,FaArrowRight  } from 'react-icons/fa';
import Header from './Header';

const ProviderPortfolio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [works, setWorks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bookings, setBookings] = useState([]);

  const [newWork, setNewWork] = useState({
    title: '',
    description: '',
    images: [],
    previewImages: []
  });

  const [editingWorkId, setEditingWorkId] = useState(null);
  const [editWorkData, setEditWorkData] = useState({
    title: '',
    description: '',
    images: [],
    previewImages: []
  });

  const [providersData, setProvidersData] = useState({
    allProviders: [],
    currentProvider: null,
    totalProviders: 0
  });

  useEffect(() => {
    
    const checkUser = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser && storedUser !== '""') {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        setIsLoggedIn(true);
        
        const [worksData, providersData, chatsData, bookingsData] = await Promise.all([
          fetchProviderWorks(parsedUser.email),
          fetchAllProviders(parsedUser.email),
          fetchProviderChats(parsedUser.id || parsedUser.uid),
          fetchProviderBookings(parsedUser.email)
        ]);
        
        if (providersData) {
         
          setProvidersData(providersData);
        }
        
        if (chatsData) {
        
          setChats(chatsData);
        }
  
        if (bookingsData) {
          setBookings(bookingsData);
        }
      } else {
        navigate('/nafany/login');
      }
      setLoading(false);
    };
  
    checkUser();
  }, [navigate, location]);

 

  const fetchAllProviders = async (currentProviderEmail) => {
    try {
      const providersQuery = query(collection(db, 'serviceProviders'));
      const providersSnapshot = await getDocs(providersQuery);
      
      const reviewsQuery = query(collection(db, 'reviews'));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const allReviews = reviewsSnapshot.docs.map(doc => doc.data());

      const providersData = providersSnapshot.docs.map(doc => {
        const provider = doc.data();
        const providerReviews = allReviews.filter(review => review.providerEmail === provider.email);
        
        const ratingsCount = providerReviews.length;
        const ratingsTotal = providerReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = ratingsCount > 0 ? (ratingsTotal / ratingsCount).toFixed(1) : 0;

        return {
          id: doc.id,
          ...provider,
          ratingsCount,
          ratingsTotal,
          averageRating
        };
      });

      providersData.sort((a, b) => b.averageRating - a.averageRating);
      providersData.forEach((provider, index) => {
        provider.rank = index + 1;
      });

      const currentProvider = providersData.find(p => p.email === currentProviderEmail);
      
      return {
        allProviders: providersData,
        currentProvider,
        totalProviders: providersData.length
      };
    } catch (error) {
      console.error('Error fetching providers:', error);
      return null;
    }
  };

  const fetchProviderWorks = async (email) => {
    try {
      const q = query(collection(db, 'providerWorks'), where('providerEmail', '==', email));
      const querySnapshot = await getDocs(q);
      const fetchedWorks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorks(fetchedWorks);
      
      const reviewsQuery = query(collection(db, 'reviews'), where('providerEmail', '==', email));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(reviewsData);
      
      return fetchedWorks;
    } catch (error) {
      console.error('Error fetching works:', error);
      return [];
    }
  };

  const fetchProviderBookings = async (providerEmail) => {
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('providerEmail', '==', providerEmail),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(bookingsQuery);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // تحويل التواريخ هنا
          createdAt: formatTimestamp(data.createdAt),
          bookingDate: data.bookingDate || 'غير محدد',
          bookingTime: data.bookingTime || 'غير محدد'
        };
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'غير محدد';
    
    // إذا كان Timestamp من Firebase (به seconds و nanoseconds)
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString('ar-EG');
    }
    
    // إذا كان كائن Date عادي
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString('ar-EG');
    }
    
    // إذا كان نصًا
    return timestamp;
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // تحديث حالة الحجز في الواجهة مباشرة
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const handleImageUpload = (files, isEditing = false) => {
    const imageFiles = Array.from(files);
    const base64Images = [];
    const previewImages = [];

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        base64Images.push(e.target.result);
        previewImages.push(e.target.result);

        if (base64Images.length === imageFiles.length) {
          if (isEditing) {
            setEditWorkData(prev => ({
              ...prev,
              images: [...prev.images, ...base64Images],
              previewImages: [...prev.previewImages, ...previewImages]
            }));
          } else {
            setNewWork(prev => ({
              ...prev,
              images: base64Images,
              previewImages: previewImages
            }));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddWork = async (e) => {
    e.preventDefault();
    if (!userData) return;
  
    try {
      const workData = {
        ...newWork,
        providerEmail: userData.email,
        providerName: userData.name,
        createdAt: serverTimestamp(),
        comments: [],
        ratings: []
      };
  
      await addDoc(collection(db, 'providerWorks'), workData);
      await fetchProviderWorks(userData.email);
      setNewWork({ title: '', description: '', images: [], previewImages: [] });
    } catch (error) {
      console.error('Error adding work:', error);
    }
  };

  const handleEditWork = (work) => {
    setEditingWorkId(work.id);
    setEditWorkData({
      title: work.title,
      description: work.description,
      images: work.images,
      previewImages: work.images
    });
  };

  const handleUpdateWork = async (e) => {
    e.preventDefault();
    try {
      const workRef = doc(db, 'providerWorks', editingWorkId);
      await updateDoc(workRef, {
        title: editWorkData.title,
        description: editWorkData.description,
        images: editWorkData.images
      });
      await fetchProviderWorks(userData.email);
      setEditingWorkId(null);
      setEditWorkData({ title: '', description: '', images: [], previewImages: [] });
    } catch (error) {
      console.error('Error updating work:', error);
    }
  };

  const handleDeleteWork = async (workId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العمل؟')) {
      try {
        await deleteDoc(doc(db, 'providerWorks', workId));
        await fetchProviderWorks(userData.email);
      } catch (error) {
        console.error('Error deleting work:', error);
      }
    }
  };

  const handleStartChat = (clientId, clientName, clientEmail) => {
    // نحصل على معرف مقدم الخدمة بطريقة آمنة
    const providerId = userData.id || userData.uid;
    
    navigate(`/nafany/chat/${clientId}`, {
      state: {
        provider: {
          id: providerId,
          name: userData.name,
          email: userData.email,
          profileImage: userData.profileImage
        },
        user: {
          id: clientId,
          name: clientName,
          email: clientEmail || 'client@example.com'
        }
      }
    });
  };
  
  // تعديل الدالة المسؤولة عن جلب المحادثات
  const fetchProviderChats = async (providerId) => {
    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', providerId),
        orderBy('lastMessageTime', 'desc')
      );
      
      const querySnapshot = await getDocs(chatsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastMessageTime: doc.data().lastMessageTime?.toDate?.() || new Date()
      }));
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  };

  const renderRatingStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-300'}>
        {i < rating ? <FaStar /> : <FaRegStar />}
      </span>
    ));
  };

  const renderRatingStats = () => {
    if (!providersData.currentProvider) return null;
  
    const { currentProvider, allProviders, totalProviders } = providersData;
    const avgRating = currentProvider.averageRating || 0;
    const ratingsCount = currentProvider.ratingsCount || 0;
    const rank = allProviders.find(p => p.email === currentProvider.email)?.rank || totalProviders;

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-cyan-800 mb-4">تصنيفك وتقييمك</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-cyan-50 p-4 rounded-lg text-center">
            <div className="text-4xl font-bold text-cyan-600 mb-2">{avgRating}</div>
            <div className="flex justify-center mb-2">
              {renderRatingStars(Math.floor(avgRating))}
            </div>
            <p className="text-gray-600">متوسط التقييم</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{ratingsCount}</div>
            <p className="text-gray-600">عدد التقييمات</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">{rank}</div>
            <p className="text-gray-600">من أصل {totalProviders} مقدم خدمة</p>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-cyan-700 mb-3">أحدث التعليقات</h3>
          {reviews.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {reviews.map((review, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-cyan-800">{review.clientName}</span>
                    <div className="flex">
                      {renderRatingStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-gray-700">{review.review}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {review.createdAt?.toDate?.().toLocaleDateString() || 'تاريخ غير معروف'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">لا توجد تعليقات بعد</p>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-cyan-700 mb-3">المحادثات الحديثة</h3>
          {chats.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {chats.map((chat) => {
                const clientId = chat.participants[0] === userData.id ? chat.participants[1] : chat.participants[0];
                const clientName = chat.participantsNames[0] === userData.name ? chat.participantsNames[1] : chat.participantsNames[0];
                console.log(clientId)
                return (
                  <div 
                    key={chat.id}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                    onClick={() => handleStartChat(clientId, clientName, chat.participantsEmails?.find(e => e !== userData.email))}
                  >
                    <div className="flex items-center">
                      <FaUserCircle className="text-gray-400 text-2xl mr-3" />
                      <div>
                        <p className="font-medium text-cyan-800">{clientName}</p>
                        <p className="text-sm text-gray-600 truncate max-w-xs">{chat.lastMessage}</p>
                      </div>
                    </div>
                    <FaArrowRight className="text-cyan-600" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500">لا توجد محادثات بعد</p>
          )}
        </div>
      </div>
    );
  };

  const renderWorkCards = () => {
    return works.map(work => (
      <motion.div 
        key={work.id} 
        className="bg-white rounded-xl shadow-lg p-6 space-y-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {editingWorkId === work.id ? (
          <form onSubmit={handleUpdateWork} className="space-y-4">
            <input 
              type="text"
              placeholder="عنوان العمل"
              value={editWorkData.title}
              onChange={(e) => setEditWorkData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg p-3"
              required
            />
            <textarea 
              placeholder="وصف العمل"
              value={editWorkData.description}
              onChange={(e) => setEditWorkData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg p-3 h-24"
              required
            />
            <input 
              type="file" 
              multiple
              onChange={(e) => handleImageUpload(e.target.files, true)}
              className="w-full border border-gray-300 rounded-lg p-3"
              accept="image/*"
            />
            {editWorkData.previewImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {editWorkData.previewImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={img} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updatedImages = [...editWorkData.images];
                        const updatedPreviews = [...editWorkData.previewImages];
                        updatedImages.splice(index, 1);
                        updatedPreviews.splice(index, 1);
                        setEditWorkData(prev => ({
                          ...prev,
                          images: updatedImages,
                          previewImages: updatedPreviews
                        }));
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex space-x-2">
              <button 
                type="submit"
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex-1"
              >
                حفظ التعديلات
              </button>
              <button 
                type="button"
                onClick={() => {
                  setEditingWorkId(null);
                  setEditWorkData({ title: '', description: '', images: [], previewImages: [] });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg flex-1"
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-cyan-800">{work.title}</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEditWork(work)}
                  className="text-blue-600 hover:text-blue-800 p-2"
                  title="تعديل"
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={() => handleDeleteWork(work.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                  title="حذف"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            <p className="text-gray-600">{work.description}</p>
            <div className="grid grid-cols-3 gap-4">
              {work.images.map((img, index) => (
                <img 
                  key={index} 
                  src={img} 
                  alt={`Work ${index + 1}`} 
                  className="w-full h-40 object-cover rounded-lg"
                />
              ))}
            </div>
          </>
        )}
      </motion.div>
    ));
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setUserData(null);
    navigate('/nafany');
  };

  const renderBookingsSection = () => {
    // دالة مساعدة لتحويل التواريخ
    const formatDate = (dateObj) => {
      if (!dateObj) return 'غير محدد';
      
      // إذا كان Timestamp من Firebase
      if (dateObj.seconds) {
        const date = new Date(dateObj.seconds * 1000);
        return date.toLocaleDateString('ar-EG');
      }
      
      // إذا كان كائن Date
      if (dateObj.toDate) {
        return dateObj.toDate().toLocaleDateString('ar-EG');
      }
      
      // إذا كان نصًا
      return dateObj;
    };
  
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h2 className="text-2xl font-bold text-cyan-800 mb-4">حجوزات العملاء</h2>
        
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking, index) => {
              // تحويل التواريخ هنا لتجنب التكرار
              const formattedCreatedAt = formatDate(booking.createdAt);
              const formattedBookingDate = formatDate(booking.bookingDate);
              
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-cyan-800">
                        {booking.clientName || 'عميل غير معروف'}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {booking.clientEmail || 'لا يوجد بريد إلكتروني'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.status === 'confirmed' 
                        ? 'مؤكد' 
                        : booking.status === 'pending'
                        ? 'قيد الانتظار'
                        : 'ملغى'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-gray-500 text-sm">تاريخ الإنشاء:</p>
                      <p className="text-gray-700">{formattedCreatedAt}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">تاريخ الحجز:</p>
                      <p className="text-gray-700">{formattedBookingDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">الوقت:</p>
                      <p className="text-gray-700">{booking.bookingTime || 'غير محدد'}</p>
                    </div>
                  </div>
                  
                  {booking.note && (
                    <div className="mt-3">
                      <p className="text-gray-500 text-sm">ملاحظات العميل:</p>
                      <p className="text-gray-700 whitespace-pre-line">
                        {booking.note}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 mt-3">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          تأكيد
                        </button>
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          إلغاء
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleStartChat(
                        booking.clientId || 'unknown', 
                        booking.clientName, 
                        booking.clientEmail
                      )}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      محادثة
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            لا توجد حجوزات حتى الآن
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-cyan-100 to-blue-200">
        <div className="text-center text-cyan-800 text-xl font-semibold">
          جاري تحميل البيانات...
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} userData={userData} />
      
      <div className="container mx-auto p-4 md:p-8">
        <motion.h1 
          className="text-3xl font-bold text-center text-cyan-800 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          لوحة تحكم مقدم الخدمة
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-6"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h2 className="text-2xl font-bold text-cyan-800 mb-4">
              {editingWorkId ? 'تعديل العمل' : 'إضافة عمل جديد'}
            </h2>
            <form onSubmit={editingWorkId ? handleUpdateWork : handleAddWork} className="space-y-4">
              <input 
                type="text"
                placeholder="عنوان العمل"
                value={editingWorkId ? editWorkData.title : newWork.title}
                onChange={(e) => 
                  editingWorkId 
                    ? setEditWorkData(prev => ({ ...prev, title: e.target.value }))
                    : setNewWork(prev => ({ ...prev, title: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg p-3"
                required
              />
              <textarea 
                placeholder="وصف العمل"
                value={editingWorkId ? editWorkData.description : newWork.description}
                onChange={(e) => 
                  editingWorkId 
                    ? setEditWorkData(prev => ({ ...prev, description: e.target.value }))
                    : setNewWork(prev => ({ ...prev, description: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg p-3 h-24"
                required
              />
              <input 
                type="file" 
                multiple
                onChange={(e) => handleImageUpload(e.target.files, editingWorkId)}
                className="w-full border border-gray-300 rounded-lg p-3"
                accept="image/*"
              />
              {(editingWorkId ? editWorkData.previewImages : newWork.previewImages).length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {(editingWorkId ? editWorkData.previewImages : newWork.previewImages).map((img, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={img} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      {editingWorkId && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedImages = [...editWorkData.images];
                            const updatedPreviews = [...editWorkData.previewImages];
                            updatedImages.splice(index, 1);
                            updatedPreviews.splice(index, 1);
                            setEditWorkData(prev => ({
                              ...prev,
                              images: updatedImages,
                              previewImages: updatedPreviews
                            }));
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button 
                type="submit"
                className="w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700"
              >
                {editingWorkId ? 'حفظ التعديلات' : 'إضافة العمل'}
              </button>
              {editingWorkId && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingWorkId(null);
                    setEditWorkData({ title: '', description: '', images: [], previewImages: [] });
                  }}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 mt-2"
                >
                  إلغاء التعديل
                </button>
              )}
            </form>
          </motion.div>

          <motion.div 
            className="space-y-6"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            {renderRatingStats()}
              {renderBookingsSection()}
            
            <h2 className="text-2xl font-bold text-cyan-800">أعمالك السابقة</h2>
            {works.length > 0 ? (
              <div className="space-y-6">
                {renderWorkCards()}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8 bg-white rounded-xl shadow-lg">
                لم تقم بإضافة أي أعمال بعد
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProviderPortfolio;