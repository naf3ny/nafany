import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  arrayUnion,
  onSnapshot
} from 'firebase/firestore';
import { FaStar, FaRegStar, FaCalendarAlt, FaComments, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ModalImage from "react-modal-image";

const ProviderDetailsPage = () => {
  const { providerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [providerData, setProviderData] = useState(null);
  const [works, setWorks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [bookingNote, setBookingNote] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('works');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [bookingResult, setBookingResult] = useState(null); 
  const [showResultModal, setShowResultModal] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [allowChat,setAllowChat]=useState(false)
  const createChatId = (id1, id2) => {
    return [id1, id2].sort().join('_');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let provider;

        if (location.state && location.state.provider && location.state.bool) {
          provider = location.state.provider;
          console.log(location.state.bool)
          setAllowChat(location.state.bool)
        } else {
          const providerDoc = await getDoc(doc(db, 'serviceProviders', providerId));
          if (providerDoc.exists()) {
            provider = { id: providerDoc.id, ...providerDoc.data() };
          } else {
            throw new Error('مقدم الخدمة غير موجود');
          }
        }

        setProviderData(provider);

        // الاشتراك في التحديثات التلقائية للأعمال
        const worksQuery = query(
          collection(db, 'providerWorks'),
          where('providerEmail', '==', provider.email)
        );
        const worksUnsubscribe = onSnapshot(worksQuery, (snapshot) => {
          const worksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setWorks(worksData);
        });

        // الاشتراك في التحديثات التلقائية للتقييمات
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('providerEmail', '==', provider.email)
        );
        const reviewsUnsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
          const reviewsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setReviews(reviewsData);
        });

        const storedUser = localStorage.getItem('currentUser');
        if (storedUser && storedUser !== '""') {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
        }

        setLoading(false);

        // تنظيف الاشتراكات عند unmount
        return () => {
          worksUnsubscribe();
          reviewsUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching provider data:', error);
        setErrorMessage('حدث خطأ أثناء تحميل البيانات');
        setLoading(false);
      }
    };

    fetchData();
  }, [providerId, location]);

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  };

  const checkAppointmentAvailability = async (date, time) => {
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('providerEmail', '==', providerData.email),
        where('bookingDate', '==', date),
        where('bookingTime', '==', time),
        where('status', 'in', ['pending', 'confirmed'])
      );
      
      const querySnapshot = await getDocs(bookingsQuery);
      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking appointment availability:', error);
      return false;
    }
  };

  const handleBooking = async () => {
    if (!userData) {
      setErrorMessage('يرجى تسجيل الدخول أولاً للحجز');
      return;
    }
  
    if (!selectedDate || !selectedTime) {
      setErrorMessage('يرجى اختيار التاريخ والوقت للحجز');
      return;
    }
  
    try {
      // تحويل التاريخ إلى تنسيق مناسب مع المنطقة الزمنية
      const formattedDate = selectedDate.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
  
      // تنسيق التاريخ للتخزين في Firebase (بدون مشاكل المنطقة الزمنية)
      const dateForFirestore = selectedDate.toISOString().split('T')[0];
      
      setIsCheckingAvailability(true);
      const isAvailable = await checkAppointmentAvailability(dateForFirestore, selectedTime);
      setIsCheckingAvailability(false);
      
      if (!isAvailable) {
        setBookingResult({
          success: false,
          message: 'هذا الموعد محجوز بالفعل، يرجى اختيار وقت آخر'
        });
        setShowResultModal(true);
        return;
      }
  
      const bookingData = {
        providerEmail: providerData.email,
        providerName: providerData.name,
        clientEmail: userData.email,
        clientName: userData.name,
        bookingDate: dateForFirestore,
        bookingTime: selectedTime,
        note: bookingNote,
        status: 'pending',
        createdAt: serverTimestamp()
      };
  
      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
  
      await updateDoc(doc(db, 'serviceProviders', providerId), {
        bookings: arrayUnion(bookingRef.id)
      });
  
      await updateDoc(doc(db, 'users', userData.uid), {
        bookings: arrayUnion(bookingRef.id)
      });
  
      setBookingResult({
        success: true,
        message: `تم الحجز بنجاح مع ${providerData.name} في ${formattedDate} الساعة ${selectedTime}`
      });
      setShowResultModal(true);
      
      setShowBookingModal(false);
      setBookingNote('');
      setSelectedDate(null);
      setSelectedTime('');
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      setBookingResult({
        success: false,
        message: 'حدث خطأ أثناء إجراء الحجز، يرجى المحاولة مرة أخرى'
      });
      setShowResultModal(true);
      setIsCheckingAvailability(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!userData) {
      setErrorMessage('يرجى تسجيل الدخول أولاً لإضافة تقييم');
      return;
    }
  
    if (rating === 0) {
      setErrorMessage('يرجى تحديد التقييم النجمي');
      return;
    }
  
    try {
      setIsSubmittingReview(true);
      const reviewData = {
        providerEmail: providerData.email,
        providerName: providerData.name,
        providerCategory: providerData.category,
        clientEmail: userData.email,
        clientName: userData.name,
        rating: rating,
        review: reviewText,
        createdAt: serverTimestamp()
      };
  
      // إضافة التقييم
      const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);
  
      // تحديث بيانات مقدم الخدمة
      await updateDoc(doc(db, 'serviceProviders', providerId), {
        reviews: arrayUnion(reviewRef.id),
        ratingsCount: (providerData.ratingsCount || 0) + 1,
        ratingsTotal: (providerData.ratingsTotal || 0) + rating
      }, { merge: true });
  
      // تحديث الحالة مباشرة بدون الحاجة لإعادة جلب البيانات
      setReviews([...reviews, {
        id: reviewRef.id,
        ...reviewData
      }]);
      
      setRating(0);
      setReviewText('');
      setSuccessMessage('تم إضافة تقييمك بنجاح!');
  
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
  
    } catch (error) {
      console.error('Error submitting review:', error);
      setErrorMessage('حدث خطأ أثناء إرسال التقييم');
  
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleOpenBookingModal = () => {
    if (!userData) {
      setErrorMessage('يرجى تسجيل الدخول أولاً للحجز');
      return;
    }

    const defaultTimes = [
      '9:00 صباحاً',
      '10:00 صباحاً',
      '11:00 صباحاً',
      '12:00 ظهراً',
      '1:00 مساءً',
      '2:00 مساءً',
      '3:00 مساءً',
      '4:00 مساءً',
      '5:00 مساءً',
      '6:00 مساءً',
      '7:00 مساءً'
    ];
    
    setAvailableTimes(defaultTimes);
    setShowBookingModal(true);
  };

// تأكد من أنك تمرر البيانات بشكل صحيح
const handleStartChat = () => {
  if (!userData || !providerData) return;

  // توحيد المعرفات
  const userId = userData.uid || userData.id;
  const providerId = providerData.id || providerData.uid;

  navigate(`/naf3ny/chat/${providerId}`, {
    state: {
      provider: {
        id: providerId,
        email: providerData.email,
        name: providerData.name,
        profileImage: providerData.profileImage || '/default-profile.png'
      },
      user: {
        id: userId,
        email: userData.email,
        name: userData.name,
        profileImage: userData.profileImage || '/default-profile.png'
      }
    }
  });
};

  const renderRatingStars = (current, onClickFn = null, onHoverFn = null) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span 
        key={star} 
        onClick={onClickFn ? () => onClickFn(star) : undefined}
        onMouseEnter={onHoverFn ? () => onHoverFn(star) : undefined}
        onMouseLeave={onHoverFn ? () => onHoverFn(0) : undefined}
        className="cursor-pointer text-xl"
        style={{ color: star <= current ? '#FFD700' : '#C0C0C0' }}
      >
        {star <= current ? <FaStar /> : <FaRegStar />}
      </span>
    ));
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

  if (!providerData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-cyan-100 to-blue-200">
        <div className="text-center text-red-600 text-xl font-semibold">
          لم يتم العثور على مقدم الخدمة، يرجى التحقق من الرابط والمحاولة مرة أخرى.
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
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
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {errorMessage}
          </div>
        )}

        <motion.div
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-40 h-40 rounded-full overflow-hidden mb-4 md:mb-0 md:mr-6">
              <img 
                src={providerData.profileImage || '../../public/IMG-20250322-WA0070.jpg'} 
                alt={providerData.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = '../../public/IMG-20250322-WA0070.jpg'
                }}
              />
            </div>
            
            <div className="flex-1 text-center md:text-right">
              <h1 className="text-3xl font-bold text-cyan-800 mb-2">
                {providerData.name}
              </h1>
              <div className="flex items-center justify-center md:justify-end mb-2">
                <div className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm mr-2">
                  {providerData.profession || providerData.category}
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {providerData.governorate || 'غير محدد المنطقة'}
                </div>
              </div>
              
              <div className="flex items-center justify-center md:justify-end mb-4">
                <div className="flex items-center">
                  {renderRatingStars(Math.round(calculateAverageRating()))}
                  <span className="mx-2 text-yellow-500 font-bold">
                    {calculateAverageRating()}
                  </span>
                  <span className="text-gray-500">
                    ({reviews.length} تقييم)
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 max-w-2xl">
                {providerData.bio || 'لا يوجد وصف لمقدم الخدمة'}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start space-x-4 mt-4">
               {allowChat && ( <button 
                  onClick={handleOpenBookingModal}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg flex items-center"
                >
                  <FaCalendarAlt className="mr-2" />
                  احجز موعد
                </button>)}
                
                <button 
                  onClick={handleStartChat}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center"
                >
                  <FaComments className="mr-2" />
                  محادثة
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-6 flex border-b border-gray-200">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'works'
                ? 'text-cyan-600 border-b-2 border-cyan-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('works')}
          >
            الأعمال السابقة
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'reviews'
                ? 'text-cyan-600 border-b-2 border-cyan-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('reviews')}
          >
            التقييمات
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'about'
                ? 'text-cyan-600 border-b-2 border-cyan-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('about')}
          >
            عن مقدم الخدمة
          </button>
        </div>

        {activeTab === 'works' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-cyan-800 mb-4">الأعمال السابقة</h2>
            
            {works.length > 0 ? (
              <div className="space-y-8">
                {works.map((work, index) => (
                  <motion.div 
                    key={work.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden"
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-cyan-800 mb-4">{work.title}</h3>
                      
                      {work.images && work.images.length > 0 && (
                        <div className="mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {work.images.map((image, imgIndex) => (
                              <ModalImage
                                key={imgIndex}
                                small={image}
                                large={image}
                                alt={`${work.title} - صورة ${imgIndex + 1}`}
                                className="rounded-lg object-cover h-48 w-full cursor-pointer"
                                imageBackgroundColor="#fff"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">وصف العمل:</h4>
                        <p className="text-gray-600 whitespace-pre-line">{work.description}</p>
                      </div>
                      
                      <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-200">
                        <div className="flex items-center mb-2 md:mb-0">
                          <span className="text-sm text-gray-500 mr-2">تاريخ الإنجاز:</span>
                          <span className="text-sm font-medium">
                            {work.createdAt && work.createdAt.toDate ? 
                              work.createdAt.toDate().toLocaleDateString() : 
                              'غير محدد'}
                          </span>
                        </div>
                        
                        {work.ratings && work.ratings.length > 0 && (
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">التقييم:</span>
                            <div className="flex items-center">
                              <FaStar className="text-yellow-500 mr-1" />
                              <span className="font-medium">
                                {(work.ratings.reduce((sum, r) => sum + r, 0) / work.ratings.length).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8 bg-white rounded-xl shadow-lg">
                لا توجد أعمال سابقة لعرضها
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-cyan-800 mb-4">أضف تقييمك</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">تقييمك:</label>
                <div className="flex space-x-2 mb-4">
                  {renderRatingStars(
                    hoverRating || rating, 
                    (value) => setRating(value), 
                    (value) => setHoverRating(value)
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">تعليقك:</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="أخبرنا عن تجربتك مع مقدم الخدمة..."
                  className="w-full border border-gray-300 rounded-lg p-3 h-32"
                />
              </div>
              
              <button
                onClick={handleSubmitReview}
                disabled={!userData || rating === 0 || isSubmittingReview}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg disabled:bg-gray-400"
              >
                {isSubmittingReview ? 'جاري الإرسال...' : 'إرسال التقييم'}
              </button>
              
              {!userData && (
                <p className="text-red-500 mt-2">
                  يرجى تسجيل الدخول لإضافة تقييم
                </p>
              )}
            </div>

            <h2 className="text-2xl font-bold text-cyan-800 mb-4">التقييمات ({reviews.length})</h2>
            
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-cyan-800">{review.clientName}</h3>
                      <div className="flex">
                        {renderRatingStars(review.rating)}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-2">{review.review}</p>
                    
                    <div className="text-sm text-gray-500">
                      {review.createdAt && review.createdAt.toDate ? 
                        review.createdAt.toDate().toLocaleDateString() : 
                        'تاريخ غير محدد'}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8 bg-white rounded-xl shadow-lg">
                لا توجد تقييمات لمقدم الخدمة
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-cyan-800 mb-4">معلومات مقدم الخدمة</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-cyan-700 mb-1">المهنة:</h3>
                <p>{providerData.profession || providerData.category || 'غير محدد'}</p>
              </div>
              
              <div>
                <h3 className="font-bold text-cyan-700 mb-1">المنطقة:</h3>
                <p>{providerData.governorate || 'غير محدد'}</p>
              </div>
              
              <div>
                <h3 className="font-bold text-cyan-700 mb-1">عدد الأعمال المنجزة:</h3>
                <p>{providerData.worksCount || works.length || 0}</p>
              </div>
              
              <div>
                <h3 className="font-bold text-cyan-700 mb-1">نبذة:</h3>
                <p>{providerData.bio || 'لا توجد نبذة تعريفية'}</p>
              </div>
              
              {providerData.services && providerData.services.length > 0 && (
                <div>
                  <h3 className="font-bold text-cyan-700 mb-1">الخدمات المقدمة:</h3>
                  <ul className="list-disc list-inside">
                    {providerData.services.map((service, idx) => (
                      <li key={idx}>{service}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {providerData.experience && (
                <div>
                  <h3 className="font-bold text-cyan-700 mb-1">الخبرة:</h3>
                  <p>{providerData.experience}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-cyan-800 mb-4">حجز موعد مع {providerData.name}</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">اختر التاريخ:</label>
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date)}
                className="w-full border border-gray-300 rounded-lg p-3"
                dateFormat="dd/MM/yyyy"
                minDate={new Date()}
                placeholderText="اختر تاريخ الحجز"
              />
            </div>
            
            {selectedDate && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">اختر الوقت:</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3"
                >
                  <option value="">-- اختر الوقت --</option>
                  {availableTimes.map((time, index) => (
                    <option key={index} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">ملاحظات (اختياري):</label>
              <textarea
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                placeholder="أضف أي ملاحظات أو تفاصيل إضافية حول الحجز..."
                className="w-full border border-gray-300 rounded-lg p-3 h-24"
              />
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setShowBookingModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
              >
                إلغاء
              </button>
              
              <button
                onClick={handleBooking}
                disabled={!selectedDate || !selectedTime || isCheckingAvailability}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg disabled:bg-gray-400"
              >
                {isCheckingAvailability ? 'جاري التحقق...' : 'تأكيد الحجز'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <div className="text-center">
              {bookingResult.success ? (
                <>
                  <div className="flex justify-center mb-4">
                    <FaCheckCircle className="text-green-500 text-5xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-600 mb-4">تم الحجز بنجاح!</h2>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <FaTimesCircle className="text-red-500 text-5xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-600 mb-4">لم يتم الحجز</h2>
                </>
              )}
              
              <p className="mb-6 text-gray-700">{bookingResult.message}</p>
              
              <button
                onClick={() => setShowResultModal(false)}
                className={`px-6 py-2 rounded-lg ${
                  bookingResult.success 
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                حسناً
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ProviderDetailsPage;