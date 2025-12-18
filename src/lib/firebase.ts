import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAPuV5P65P76t1XdFqyjbTgdxEUqG5aviY",
  authDomain: "gtwy-bf375.firebaseapp.com",
  projectId: "gtwy-bf375",
  storageBucket: "gtwy-bf375.firebasestorage.app",
  messagingSenderId: "646797548124",
  appId: "1:646797548124:web:5d322042d3f85bac5fe499"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
