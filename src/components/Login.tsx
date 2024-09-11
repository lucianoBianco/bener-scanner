// pages/Login.jsx
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { fireAuth } from '../firebase'
import logo from '../assets/logo_encontro_xii.png'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  //@ts-expect-error deixa
  const handleLogin = async (e) => {
    e.preventDefault() // Evita o refresh da página
    try {
      await signInWithEmailAndPassword(fireAuth, email, password)
      // window.location.href = '/qrreader' // Redireciona após login
      //@ts-expect-error o caralha
    } catch (err: { message: string }) {
      setError(err?.message)
    }
  }

  return (
    <div
      style={{
        flex: 1,

        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      }}
    >
      {/* <h1
        style={{
          fontSize: 24,
          marginBottom: 20,
          fontFamily: 'Roboto',
        }}
      >
        Bener Scanner
      </h1> */}
      <img
        style={{
          maxWidth: '100%',
          objectFit: 'cover',
          width: '80%',
          margin: 'auto',
          backgroundColor: '#fff',
        }}
        alt="login-logo"
        src={logo}
      />
      <form onSubmit={handleLogin}>
        <input
          style={{
            width: '99%',
            height: 50,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 5,
            marginBottom: 15,
            paddingLeft: 10,
            paddingRight: 10,
            position: 'relative',
          }}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          style={{
            width: '99%',
            height: 50,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 5,
            marginBottom: 15,
            paddingLeft: 10,
            paddingRight: 10,
            position: 'relative',
          }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          onSubmit={handleLogin}
        />
        <button
          style={{
            width: '100%',
            height: 50,
            backgroundColor: '#7ca066',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            fontSize: 18,
            borderColor: 'transparent',
            borderRadius: 5,
          }}
          type="submit"
        >
          Login
        </button>
        {error && <p>{error}</p>}
      </form>
    </div>
  )
}

export default Login
