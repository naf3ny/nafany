import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc,
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { FaPaperPlane, FaArrowLeft, FaUserCircle } from 'react-icons/fa';
import { IoMdSend } from 'react-icons/io';

const ChatPage = () => {
  const { providerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [providerData, setProviderData] = useState(null);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState('');
  const createChatId = (id1, id2) => {
    return [id1, id2].sort().join('_');
  };

  const getUserData = () => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) return null;
      
      const user = JSON.parse(storedUser);
      
      // تحقق من وجود معرف المستخدم بأي صيغة (uid أو id)
      if (!user) return null;
      
      // توحيد المعرفات
      if (user.uid && !user.id) {
        user.id = user.uid;
      } else if (user.id && !user.uid) {
        user.uid = user.id;
      } else if (!user.uid && !user.id) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };
  // جلب بيانات المستخدم والرسائل
 useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const user = getUserData();
      if (!user) {
        navigate('/nafany/login');
        return;
      }

      setUserData(user);

      // تعديل في كيفية تحديد مقدم الخدمة والعميل
      let provider, client;

      // التأكد من وجود بيانات مقدم الخدمة في location.state
      if (location.state?.provider) {
        // تحديد من هو مقدم الخدمة ومن هو العميل
        provider = location.state.provider;
        
        // التأكد من وجود بيانات العميل
        if (location.state.user) {
          client = location.state.user;
        } else {
          client = { id: user.uid || user.id, name: user.name, email: user.email };
        }
      } else {
        // إذا كان المستخدم الحالي هو مقدم الخدمة
        provider = { id: user.uid || user.id, name: user.name, email: user.email };
        
        // جلب بيانات العميل
        try {
          const clientDoc = await getDoc(doc(db, 'users', providerId));
          if (clientDoc.exists()) {
            client = { id: clientDoc.id, ...clientDoc.data() };
          } else {
            // محاولة البحث في جدول مقدمي الخدمة
            const providerDoc = await getDoc(doc(db, 'serviceProviders', providerId));
            if (!providerDoc.exists()) throw new Error('User not found');
            client = { id: providerDoc.id, ...providerDoc.data() };
          }
        } catch (error) {
          console.error('Error fetching client data:', error);
          throw error;
        }
      }

      // توحيد المعرفات - ضمان وجود حقل id دائماً
      provider.id = provider.id || provider.uid;
      client.id = client.id || client.uid;

      setProviderData(provider);

      // إنشاء معرف المحادثة بشكل صحيح دائماً باستخدام الدالة المساعدة
      const chatId = createChatId(provider.id, client.id);

      console.log('Chat participants:', { provider, client });
      console.log('Generated chatId:', chatId);

      // حفظ معرف المحادثة في متغير حالة (state) لاستخدامه لاحقاً
      setChatId(chatId);

      // الاشتراك في الرسائل مع تحسينات
      const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        
        console.log('Real-time messages update:', messagesData);
        setMessages(messagesData);
      });

      setLoading(false);
      return unsubscribe;
    } catch (error) {
      console.error('Chat init error:', error);
      setLoading(false);
    }
  };

  fetchData();
}, [providerId, location.state, navigate]);
  // التمرير إلى أحدث رسالة
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // إرسال رسالة جديدة
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !userData || !providerData || !chatId) return;
  
    try {
      console.log('Sending message with chatId:', chatId);
      console.log('From:', userData.id || userData.uid, 'To:', providerData.id || providerData.uid);
  
      // إضافة الرسالة الجديدة
      const messageRef = await addDoc(
        collection(db, 'chats', chatId, 'messages'), 
        {
          text: newMessage,
          senderId: userData.id || userData.uid,
          senderName: userData.name,
          receiverId: providerData.id || providerData.uid,
          timestamp: serverTimestamp(),
          isRead: false
        }
      );
  
      // تحديث بيانات المحادثة الرئيسية
      await setDoc(doc(db, 'chats', chatId), {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
        providerData: {
          id: providerData.id || providerData.uid,
          name: providerData.name,
          email: providerData.email
        },
        userData: {
          id: userData.id || userData.uid,
          name: userData.name,
          email: userData.email
        },
        participants: [userData.id || userData.uid, providerData.id || providerData.uid],
        participantsNames: [userData.name, providerData.name]
      }, { merge: true });
  
      setNewMessage('');
      console.log('Message sent successfully:', messageRef.id);
    } catch (error) {
      console.error('Message send error:', error);
    }
  };

  // محاكاة حالة الكتابة من مقدم الخدمة
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].senderId === userData?.uid) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        
        const replyTimer = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
        
        return () => clearTimeout(replyTimer);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [messages, userData]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-cyan-100 to-blue-200">
        <div className="text-center text-cyan-800 text-xl font-semibold">
          جاري تحميل المحادثة...
        </div>
      </div>
    );
  }

  if (!providerData || !userData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-cyan-100 to-blue-200">
        <div className="text-center text-red-600 text-xl font-semibold">
          حدث خطأ في تحميل بيانات المحادثة
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* شريط العنوان */}
      <div className="bg-white shadow-md p-4 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <FaArrowLeft className="text-gray-600 text-xl" />
        </button>
        
        <div className="flex items-center mx-4">
          {providerData.profileImage ? (
            <img 
              src={providerData.profileImage} 
              alt={providerData.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <FaUserCircle className="text-gray-400 text-3xl" />
          )}
          <div className="mr-3">
            <h2 className="font-semibold text-gray-800">{providerData.name}</h2>
            <p className="text-xs text-gray-500">{providerData.profession || providerData.category}</p>
          </div>
        </div>
      </div>

      {/* منطقة الرسائل */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              لا توجد رسائل بعد. ابدأ المحادثة مع {providerData.name}
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.senderId === userData.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md rounded-lg p-3 ${message.senderId === userData.uid 
                    ? 'bg-cyan-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 rounded-bl-none shadow'}`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.senderId === userData.uid ? 'text-cyan-100' : 'text-gray-500'}`}>
                    {message.timestamp?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'الآن'}
                  </p>
                </div>
              </motion.div>
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 rounded-lg rounded-bl-none shadow p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* منطقة إدخال الرسالة */}
      <div className="bg-white p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center max-w-3xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="ml-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-2 disabled:bg-gray-400"
          >
            <IoMdSend className="text-xl" />
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ChatPage;