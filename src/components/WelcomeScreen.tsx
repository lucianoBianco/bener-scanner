import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { fireAuth, fireStore } from '../firebase'
import logo from '../assets/XIII-Encontro-Tecnologico-Bener.png'
import { collection, getDocs } from 'firebase/firestore'

interface WelcomeScreenProps {
  onStartScanning: () => void
  isAdmin?: boolean
}

const WelcomeScreen = ({ onStartScanning, isAdmin = false }: WelcomeScreenProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [interactions, setInteractions] = useState<any>(false)

  const handleStartScanning = () => {
    setIsLoading(true)
    // Small delay for better UX
    setTimeout(() => {
      onStartScanning()
    }, 300)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut(fireAuth)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }
  const getInteractions = async () => {
    const currentUser = fireAuth.currentUser
    if(!currentUser) {
      alert('Usuario Não autentificado')
      return
    }
    const interactionsReference = await getDocs(collection(fireStore, 'exhibitors',currentUser.uid, 'interactions'))
    const interactionsDocuments = interactionsReference.docs
    setInteractions(interactionsDocuments.map(doc => ({...doc.data(), id: doc.id})))
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
        position: 'relative',
      }}
    >
      {/* Logout Button */}
      <button
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          backgroundColor: 'transparent',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          zIndex: 1000,
        }}
        onClick={handleLogout}
        disabled={isLoggingOut}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa'
          e.currentTarget.style.borderColor = '#7ca066'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.borderColor = '#e0e0e0'
        }}
      >
        {isLoggingOut ? (
          <div
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid #7ca066',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: '#666' }}
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        )}
      </button>

      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <img
          style={{
            maxWidth: '300px',
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
          }}
          alt="Bener Scanner Logo"
          src={logo}
        />

        {/* Welcome Text */}
        <div style={{ marginBottom: '20px' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#2c3e50',
              margin: '0 0 16px 0',
            }}
          >
            Bem-vindo ao Bener Scanner
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#7f8c8d',
              lineHeight: '1.6',
              margin: '0',
            }}
          >
            {isAdmin 
              ? 'Escaneie os QR Codes dos participantes para registrar suas entradas no XIII Encontro Tecnológico Bener.'
              : 'Escaneie os QR Codes dos visitantes para registrar contatos e avaliar interações no XIII Encontro Tecnológico Bener.'
            }
          </p>
        </div>

        {/* Instructions */}
        <div
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            border: '1px solid #e9ecef',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0 0 16px 0',
            }}
          >
            Como usar:
          </h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#7ca066',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                1
              </div>
              <span style={{ fontSize: '14px', color: '#495057' }}>
                Posicione o QRCode na área de escaneamento
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#7ca066',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                2
              </div>
              <span style={{ fontSize: '14px', color: '#495057' }}>
                Aguarde a leitura automática do código
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#7ca066',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                3
              </div>
              <span style={{ fontSize: '14px', color: '#495057' }}>
                {isAdmin 
                  ? 'Confirme o registro da entrada'
                  : 'Avalie a interação e adicione notas sobre o contato'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          style={{
            width: '100%',
            height: '60px',
            backgroundColor: '#7ca066',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onClick={handleStartScanning}
          disabled={isLoading}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#6b8f5a'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#7ca066'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {isLoading ? (
            <>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #fff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Iniciando Scanner...
            </>
          ) : (
            <>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9h6v11H3z" />
                <path d="M15 9h6v11h-6z" />
                <path d="M9 3v6" />
                <path d="M15 3v6" />
              </svg>
              Iniciar Scanner
            </>
          )}
        </button>
        <div
        style={{
          flexGrow: 1,
          alignItems: 'left'

        }}
        >

          <div
          style={{
            outline: 'solid'
          }}
          >
            <h3>Nome do cara</h3>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            fontSize: '12px',
            color: '#adb5bd',
            margin: '20px 0 0 0',
            textAlign: 'center',
          }}
        >
          XIII Encontro Tecnológico Bener
        </p>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default WelcomeScreen 