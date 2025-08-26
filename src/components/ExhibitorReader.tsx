import { useEffect, useRef, useState } from 'react'

// Styles
import './QrStyles.css'

// Qr Scanner
import QrScanner from 'qr-scanner'
import QrFrame from '../assets/qr-frame.svg'
import { doc, getDoc, collection, addDoc, where, query, getDocs } from 'firebase/firestore'
import { fireStore, fireAuth } from '../firebase'

interface ExhibitorReaderProps {
  onBackToWelcome?: () => void
}

const ExhibitorReader = ({ onBackToWelcome }: ExhibitorReaderProps) => {
  // QR States
  const scanner = useRef<QrScanner>()
  const videoEl = useRef<HTMLVideoElement>(null)
  const qrBoxEl = useRef<HTMLDivElement>(null)
  const [qrOn, setQrOn] = useState<boolean>(true)
  const [readUserData, setReadUserData] = useState<any>(null)

  // Result
  const [scannedResult, setScannedResult] = useState<string | undefined>('')
  const [isInspected, setIsInspected] = useState<boolean>(false)

  // Rating and Notes
  const [rating, setRating] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Success
  const onScanSuccess = (result: QrScanner.ScanResult) => {
    console.log(result)
    setScannedResult(result?.data)
  }

  // Fail
  const onScanFail = (err: string | Error) => {
    console.log(err)
  }

  useEffect(() => {
    const initializeScanner = () => {
      if (videoEl?.current && !scanner.current) {
        scanner.current = new QrScanner(videoEl?.current, onScanSuccess, {
          onDecodeError: onScanFail,
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          overlay: qrBoxEl?.current || undefined,
        })

        scanner.current
          .start()
          .then(() => setQrOn(true))
          .catch((err) => {
            if (err) setQrOn(false)
          })
      }
    }

    if (!scannedResult) {
      if (scanner.current) {
        scanner.current.stop()
        scanner.current = undefined
        initializeScanner()
      } else {
        initializeScanner()
      }
    }

    return () => {
      if (scanner.current) {
        scanner.current.stop()
      }
    }
  }, [scannedResult])

  // ❌ If "camera" is not allowed in browser permissions, show an alert.
  useEffect(() => {
    if (!qrOn)
      alert(
        'Camera is blocked or not accessible. Please allow camera in your browser permissions and Reload.',
      )
  }, [qrOn])

  useEffect(() => {
    const getUser = async () => {
      const currentUser = fireAuth.currentUser
      if (!currentUser) {
        alert('Usuário não autenticado')
        return
      }
      if (scannedResult?.includes('readqrcode-x7ty67bfhq-uc')) {
        const split = scannedResult.split('?id=')
        const docExpRef = doc(fireStore, 'exhibitors', split[1])
        const docExpSnap = await getDoc(docExpRef)
        let docC
        if (!docExpSnap.exists()) {
          const docVisRef = doc(fireStore, 'visitors', split[1])
          const docVisSnap = await getDoc(docVisRef)
          if (!docVisSnap.exists()) alert('usuário não encontrado')
          else {
            docC = docVisSnap
          }
        } else {
          docC = docExpSnap
        }
        // Check if docC exists before using its id
        const interactionsRef = docC?.id ? collection(fireStore, 'exhibitors', currentUser?.uid, 'interactions') : null;
        const interactionsQuery = interactionsRef ? query(interactionsRef, where('visitorId', '==', split[1])) : null;
        const querySnapshot = interactionsQuery ? await getDocs(interactionsQuery) : null;
        const isInspected = !querySnapshot?.empty;
        
        // if isInspected is true, show a text somewhere in the page saying "Interação já avaliada"
        if (isInspected) {
          setIsInspected(true)
        }
        setReadUserData({ id: docC?.id, ...docC?.data() })
      }
    }
    getUser()
  }, [scannedResult])

  const handleSaveInteraction = async () => {
    setIsSubmitting(true)
    try {
      const currentUser = fireAuth.currentUser
      if (!currentUser) {
        alert('Usuário não autenticado')
        return
      }

      // Save interaction to exhibitor's personal list
      const interactionData = {
        visitorId: readUserData.id,
        visitorName: readUserData?.name || '',
        visitorCompany: readUserData?.company || '',
        visitorEmail: readUserData?.email || '',
        visitorCity: readUserData?.city || '',
        visitorState: readUserData?.uf || '',
        visitorPhone: readUserData?.phone  || '',
        rating: rating,
        notes: notes,
        interactionDate: new Date(),
        2025: true
      }

      console.log(interactionData)
      await addDoc(collection(fireStore, 'exhibitors', currentUser.uid, 'interactions'), interactionData)

      // Reset form
      setScannedResult(undefined)
      setReadUserData(null)
      setRating(0)
      setNotes('')
    } catch (error: any) {
      alert(error?.message || 'Erro ao salvar interação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = () => {
    return (
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              color: star <= rating ? '#ffd700' : '#ddd',
              transition: 'color 0.2s ease',
            }}
          >
            ★
          </button>
        ))}
        <span style={{ fontSize: '14px', color: '#666', marginLeft: '8px' }}>
          {rating > 0 ? `${rating}/5` : 'Avaliar interação'}
        </span>
      </div>
    )
  }

  return (
    <div 
      className="qr-reader"
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000',
        position: 'relative',
      }}
    >
      {/* Back Button - Only show when scanner is active */}
      {onBackToWelcome && !scannedResult && (
        <button
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 1000,
            width: '48px',
            height: '48px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onClick={onBackToWelcome}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.9)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Show Data Result if scan is success */}
      {scannedResult ? (
        <div 
          style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            boxSizing: 'border-box',
            backgroundColor: '#fff',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <button
              style={{
                width: '100%',
                height: '56px',
                border: '2px solid #7ca066',
                backgroundColor: 'transparent',
                color: '#7ca066',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              disabled={isSubmitting}
              onClick={() => {
                setScannedResult(undefined)
                setReadUserData(null)
                setRating(0)
                setNotes('')
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7ca066'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#7ca066'
              }}
            >
              ← Ler Novo QRCode
            </button>
            
            <div
              style={{
                border: '2px solid #7ca066',
                borderRadius: '16px',
                padding: '24px',
                backgroundColor: '#f8f9fa',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ marginBottom: '20px' }}>
                <h3 
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 8px 0',
                    color: '#2c3e50',
                  }}
                >
                  {readUserData?.name}
                </h3>
                <p 
                  style={{
                    fontSize: '16px',
                    margin: '4px 0',
                    color: '#7f8c8d',
                  }}
                >
                  {readUserData?.company}
                </p>
                <p 
                  style={{
                    fontSize: '16px',
                    margin: '4px 0',
                    color: '#7f8c8d',
                  }}
                >
                  {readUserData?.city} - {readUserData?.uf}
                  
                </p>
              </div>
              {isInspected && (
                <div 
                  style={{
                    marginBottom: '20px',
                    padding: '12px 16px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: '#856404', flexShrink: 0 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#856404',
                    margin: '0'
                  }}>
                    Interação já avaliada
                  </span>
                </div>
              )}

              {/* Rating Section */}
              <div style={{ marginBottom: '20px' }}>
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    margin: '0 0 8px 0',
                  }}
                >
                  Avaliar Interação (Opcional)
                </h4>
                {renderStars()}
              </div>

              {/* Notes Section */}
              <div style={{ marginBottom: '20px' }}>
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    margin: '0 0 8px 0',
                  }}
                >
                  Detalhes da Interação (Opcional)
                </h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Interessado no produto X, demonstrou interesse em fechar negócio..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                style={{
                  width: '100%',
                  height: '56px',
                  backgroundColor: '#7ca066',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onClick={handleSaveInteraction}
                disabled={isSubmitting}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b8f5a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#7ca066'
                }}
              >
                {isSubmitting ? 'Salvando...' : 'OK - Salvar Contato'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: '#000',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              height: '90%',
              border: '3px solid #7ca066',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 0 20px rgba(124, 160, 102, 0.3)',
            }}
          >
            <video 
              ref={videoEl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
          <div ref={qrBoxEl} className="qr-box">
            <img
              src={QrFrame}
              alt="Qr Frame"
              width={256}
              height={256}
              className="qr-frame"
            />
          </div>
          
          {/* Scanner Instructions */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              color: '#fff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              padding: '12px 24px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              backdropFilter: 'blur(10px)',
            }}
          >
            Escaneie o QR Code do visitante
          </div>
        </div>
      )}
    </div>
  )
}

export default ExhibitorReader 