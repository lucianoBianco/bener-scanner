import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { fireAuth } from './firebase' // Certifique-se de que o caminho está correto

import Login from './components/Login.tsx'
import QrReader from './components/QrReader'

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fireAuth, (user) => {
      setIsAuthenticated(!!user)
      console.log(user)

      // if (user) window.location.href = '/qrreader' // Redireciona após login
    })

    return () => unsubscribe()
  }, [])

  return (
    <Router>
      <Routes>
        {isAuthenticated ? (
          <Route path="/" element={<QrReader />} />
        ) : (
          <Route path="/" element={<Login />} />
        )}
      </Routes>
    </Router>
  )
}

export default App
