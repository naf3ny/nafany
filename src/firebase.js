import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyDePZqpCrFdNsN1hUdw2_rwMfKP41SJgvU",
  authDomain: "nafa3ny-de185.firebaseapp.com",
  projectId: "nafa3ny-de185",
  storageBucket: "nafa3ny-de185.firebasestorage.app",
  messagingSenderId: "346694832541",
  appId: "1:346694832541:web:d2869f3ffb43e3c69a5f74"
};

const firebaseConfig2 = {
  apiKey: "AIzaSyAtavYnI9TNKfwxDm2cwFuLoxsgdTcNU8s",
  authDomain: "nafany2-589de.firebaseapp.com",
  projectId: "nafany2-589de",
  storageBucket: "nafany2-589de.firebasestorage.app",
  messagingSenderId: "440873274458",
  appId: "1:440873274458:web:2236ff7a246bdcd45a1c63"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const app2 = initializeApp(firebaseConfig2, "app2");
const db = getFirestore(app);
const db2 = getFirestore(app2);
const storage = getStorage(app);
const storage2 = getStorage(app2);
export { db, storage , db2, storage2 }; 
