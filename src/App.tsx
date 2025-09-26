import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { fireAuth, fireStore } from './firebase' // Certifique-se de que o caminho está correto

import Login from './components/Login.tsx'
import QrReader from './components/QrReader'
import ExhibitorReader from './components/ExhibitorReader'
import WelcomeScreen from './components/WelcomeScreen'
import { doc, getDoc } from 'firebase/firestore'

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [benerHeadquartersAccess, setBenerHeadquartersAccess] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, async (user) => {
      if (user) {
        //get user data in firestore 'users' collection
        const userDoc = doc(fireStore, 'users', user.uid)
        const userDocSnap = await getDoc(userDoc)
        if (userDocSnap.exists()) {
          if (userDocSnap.data()?.role === 'admin') {
            setIsAdmin(true)
            setIsAuthenticated(true)
          } else if (userDocSnap.data()?.role === 'exhibitor') {
            setIsAuthenticated(true)
            setIsAdmin(false)
          } else {
            setIsAuthenticated(false)
            setIsAdmin(false)
          }
        } else {
          setIsAuthenticated(false)
          setIsAdmin(false)
        }
      } else {
        setIsAuthenticated(false)
        setIsAdmin(false)
      }

      // setIsAuthenticated(false)
      // setIsAdmin(false)
    })

    return () => unsubscribe()
  }, [])

  const handleStartScanning = (benerHeadquartersAccess: boolean) => {
    setBenerHeadquartersAccess(benerHeadquartersAccess)
    setShowScanner(true)
  }

  const handleBackToWelcome = () => {
    setShowScanner(false)
  }

  return (
    <Router>
      <Routes>
        {isAuthenticated ? (
          <Route 
            path="/" 
            element={
              showScanner ? (
                isAdmin ? (
                  <QrReader onBackToWelcome={handleBackToWelcome} defaultSuperiorFloorAccess={benerHeadquartersAccess} />
                ) : (
                  <ExhibitorReader onBackToWelcome={handleBackToWelcome} />
                )
              ) : (
                <WelcomeScreen onStartScanning={handleStartScanning} isAdmin={isAdmin} />
              )
            } 
          />
        ) : (
          <Route path="/" element={<Login />} />
        )}
      </Routes>
    </Router>
  )
}

export default App
