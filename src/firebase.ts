import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBhMELoCxPahGyyEubWi0F_iQFqQVGhfHA',
  authDomain: 'bener-dashboard.firebaseapp.com',
  projectId: 'bener-dashboard',
  storageBucket: 'bener-dashboard.appspot.com',
  messagingSenderId: '181737496728',
  appId: '1:181737496728:web:288536334654e9a04bf0ed',
}

let firebaseApp
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig)
} else {
  firebaseApp = getApps()[0]
}

export const fireAuth = getAuth(firebaseApp)
export const fireStore = getFirestore(firebaseApp)

export default firebaseApp
