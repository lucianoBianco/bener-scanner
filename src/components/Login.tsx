// pages/Login.jsx
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { fireAuth } from '../firebase'
import logo from '../assets/XIII-Encontro-Tecnologico-Bener.png'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  //@ts-expect-error
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(fireAuth, email, password)
      // window.location.href = '/qrreader'
      //@ts-expect-error
    } catch (err: { message: string }) {
      setError(err?.message)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '30px',
        }}
      >
        <img
          style={{
            maxWidth: '280px',
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            marginBottom: '20px',
          }}
          alt="login-logo"
          src={logo}
        />
        
        <form 
          onSubmit={handleLogin}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <input
            style={{
              width: '100%',
              height: '56px',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '0 16px',
              fontSize: '16px',
              backgroundColor: '#f8f9fa',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            style={{
              width: '100%',
              height: '56px',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '0 16px',
              fontSize: '16px',
              backgroundColor: '#f8f9fa',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button
            style={{
              width: '100%',
              height: '56px',
              backgroundColor: '#7ca066',
              color: '#fff',
              fontSize: '18px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              marginTop: '8px',
            }}
            type="submit"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6b8f5a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#7ca066'
            }}
          >
            Login
          </button>
          
          {error && (
            <p
              style={{
                color: '#d32f2f',
                fontSize: '14px',
                textAlign: 'center',
                margin: '8px 0 0 0',
                padding: '8px 12px',
                backgroundColor: '#ffebee',
                borderRadius: '8px',
                border: '1px solid #ffcdd2',
              }}
            >
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default Login
