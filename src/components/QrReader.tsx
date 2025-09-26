import { useEffect, useRef, useState } from 'react'

// Styles
import './QrStyles.css'

// Qr Scanner
import QrScanner from 'qr-scanner'
import QrFrame from '../assets/qr-frame.svg'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { fireStore } from '../firebase'

interface QrReaderProps {
  onBackToWelcome?: () => void
  defaultSuperiorFloorAccess?: boolean
}

const QrReader = ({ onBackToWelcome, defaultSuperiorFloorAccess = false }: QrReaderProps) => {
  // QR States
  const scanner = useRef<QrScanner>()
  const videoEl = useRef<HTMLVideoElement>(null)
  const qrBoxEl = useRef<HTMLDivElement>(null)
  const [qrOn, setQrOn] = useState<boolean>(true)
  const [readUserData, setReadUserData] = useState<{
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    entrance_2025?: boolean;
    [key: string]: unknown;
  } | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [benerHeadquartersAccess, setBenerHeadquartersAccess] = useState<boolean>(defaultSuperiorFloorAccess)
  const [machines, setMachines] = useState<boolean>(false)
  const [isEligibleForRaffle, setIsEligibleForRaffle] = useState<boolean>(false)
  const [alexa1, setAlexa1] = useState<boolean>(false)
  const [alexa2, setAlexa2] = useState<boolean>(false)
  const [alexa3, setAlexa3] = useState<boolean>(false)
  // const [log, setLog] = useState('');

  // Result
  const [scannedResult, setScannedResult] = useState<string | undefined>('')

  // useEffect(() => {
  //   setScannedResult(`https://readqrcode-x7ty67bfhq-uc.a.run.app/?id=hEh72zQs5Zkv4o60lrOE`)
  // }, [])
  // Success
  const onScanSuccess = (result: QrScanner.ScanResult) => {
    // 🖨 Print the "result" to browser console.
    console.log(result)
    // ✅ Handle success.
    // 😎 You can do whatever you want with the scanned result.
    setScannedResult(result?.data)
  }

  // Fail
  const onScanFail = (err: string | Error) => {
    // 🖨 Print the "err" to browser console.
    console.log(err)
  }
  useEffect(() => {
    const initializeScanner = () => {
      if (videoEl?.current && !scanner.current) {
        // 👉 Instantiate the QR Scanner
        scanner.current = new QrScanner(videoEl?.current, onScanSuccess, {
          onDecodeError: onScanFail,
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          overlay: qrBoxEl?.current || undefined,
        })

        // 🚀 Start QR Scanner
        scanner.current
          .start()
          .then(() => setQrOn(true))
          .catch((err) => {
            if (err) setQrOn(false)
          })
      }
    }

    // Re-initialize the scanner when `scannedResult` is reset
    if (!scannedResult) {
      if (scanner.current) {
        // Stop the current scanner before restarting
        scanner.current.stop()
        scanner.current = undefined
        initializeScanner() // Re-initialize scanner
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

        if (docC?.id) {
          setReadUserData({ id: docC.id, ...docC.data() })
        }
        // Reset Bener headquarters access to default when new QR code is read
        setBenerHeadquartersAccess(defaultSuperiorFloorAccess)
        
        // Check if user is eligible for raffle (registered in entrance_2025)
        if (docC?.id) {
          const isEligible = docC.data()?.entrance_2025
          setIsEligibleForRaffle(isEligible)
        } else return;
        
        // Get existing entrance data if available
        const entranceRef = doc(fireStore, 'entrances_2025', docC.id)
        const entranceSnap = await getDoc(entranceRef)
        if (entranceSnap.exists()) {
          const entranceData = entranceSnap.data()
          // setLog(entranceData.alexa2)
          setBenerHeadquartersAccess(entranceData.benerHeadquartersAccess ?? defaultSuperiorFloorAccess)
          setMachines(entranceData.machines ?? false)
          setAlexa1(entranceData.alexa1 ?? false) 
          setAlexa2(entranceData.alexa2 ?? false)
          setAlexa3(entranceData.alexa3 ?? false)
        } else {
          // Reset raffle participation to default when new QR code is read
          setMachines(false)
          setAlexa1(false)
          setAlexa2(false)
          setAlexa3(false)
        }
      }
    }
    getUser()
  }, [scannedResult, defaultSuperiorFloorAccess])

  const handleRegisterAccess = async () => {
    if (!readUserData?.id) return
    
    setLoading(true)
    try {
      const docExpRef = doc(fireStore, 'exhibitors', readUserData.id)
      const docExpSnap = await getDoc(docExpRef)
      let ref
      if (!docExpSnap.exists()) {
        const docVisRef = doc(fireStore, 'visitors', readUserData.id)
        ref = docVisRef
      } else {
        ref = docExpRef
      }
      await updateDoc(ref, { entrance_2025: true })
      const newRef = doc(fireStore, 'entrances_2025', readUserData.id)
      if (!readUserData?.entrance_2025) {
        await setDoc(newRef, {
          name: readUserData?.name ?? '',
          email: readUserData?.email ?? '',
          phone: readUserData?.phone ?? '',
          company: readUserData?.company ?? '',
          accessAt2025: new Date(),
          benerHeadquartersAccess: benerHeadquartersAccess,
          machines: machines,
          alexa1: alexa1,
          alexa2: alexa2,
          alexa3: alexa3,
        })
      } else {
        try {
          await updateDoc(newRef, {
            lastAccessAt2025: new Date(),
            benerHeadquartersAccess: benerHeadquartersAccess,
            machines: machines,
            alexa1: alexa1,
            alexa2: alexa2,
            alexa3: alexa3,
          })
        } catch (e: unknown) {
          await setDoc(newRef, {
            name: readUserData?.name ?? '',
            email: readUserData?.email ?? '',
            phone: readUserData?.phone ?? '',
            company: readUserData?.company ?? '',
            accessAt2025: new Date(),
            benerHeadquartersAccess: benerHeadquartersAccess,
            machines: machines,
            alexa1: alexa1,
            alexa2: alexa2,
            alexa3: alexa3,
          })
        }
      }
      setScannedResult(undefined)
      setReadUserData(null)
      // // Reinicia o scanner
      // // if (scanner.current) {
      // //   await scanner.current.start()
      // // }
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
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
      {/* Back Button - Only show when scanner is active (not when showing results) */}
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
            paddingBottom: '40px',
            boxSizing: 'border-box',
            backgroundColor: '#fff',
            overflowY: 'auto',
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
            disabled={loading}
            onClick={() => {
              setScannedResult(undefined)
              setReadUserData(null)
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
          {/* <p>{JSON.stringify(log)}</p> */}
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
                  {readUserData?.email}
                </p>
                <p 
                  style={{
                    fontSize: '16px',
                    margin: '4px 0',
                    color: '#7f8c8d',
                  }}
                >
                  {readUserData?.phone}
                </p>
                <p 
                  style={{
                    fontSize: '16px',
                    margin: '4px 0',
                    color: '#7f8c8d',
                  }}
                >
                  {readUserData?.company}
                </p>
                
                <div 
                  style={{
                    marginTop: '16px',
                    padding: '8px 16px',
                    backgroundColor: '#7ca066',
                    color: '#fff',
                    borderRadius: '20px',
                    display: 'inline-block',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  {readUserData?.role === 'visitor' && 'Visitante'}
                  {readUserData?.role === 'exhibitor' && 'Expositor'}
                  {readUserData?.role === 'admin' && 'Parceiro'}
                </div>
              </div>

              {/* Superior Floor Access Checkbox */}
              <div
                style={{
                  marginBottom: '20px',
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setBenerHeadquartersAccess(!benerHeadquartersAccess)}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #7ca066',
                      borderRadius: '4px',
                      backgroundColor: benerHeadquartersAccess ? '#7ca066' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {benerHeadquartersAccess && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#2c3e50',
                    }}
                  >
                    Acesso Sede da Bener
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#7f8c8d',
                    margin: '4px 0 0 32px',
                    lineHeight: '1.3',
                  }}
                >
                  {benerHeadquartersAccess ? 'Visitante terá acesso à Sede da Bener' : 'Visitante não terá acesso à Sede da Bener'}
                </p>
              </div>

              {/* Raffle Section - Only show if user is eligible */}
              {isEligibleForRaffle && (
                <div style={{ marginTop: '24px' }}>
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      margin: '0 0 16px 0',
                      paddingBottom: '8px',
                      borderBottom: '2px solid #e9ecef',
                    }}
                  >
                    Sorteios
                  </h4>
                  
                  {/* Raffle Participation Checkbox */}
                <div
                  style={{
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    border: '1px solid #e9ecef',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setMachines(!machines)}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #7ca066',
                        borderRadius: '4px',
                        backgroundColor: machines ? '#7ca066' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {machines && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#2c3e50',
                      }}
                    >
                      Máquinas
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#7f8c8d',
                      margin: '4px 0 0 32px',
                      lineHeight: '1.3',
                    }}
                  >
                    {machines ? 'Visitante participará do sorteio de máquinas' : 'Visitante não participará do sorteio'}
                  </p>
                </div>
<h4 style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '2px solid #e9ecef' }}>Sorteio de Alexa</h4>
                  {/* Alexa Raffle Checkboxes - Compact and Horizontal */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    {[
                      { state: alexa1, setState: setAlexa1, label: 'Dia 1 (07/10)' },
                      { state: alexa2, setState: setAlexa2, label: 'Dia 2 (08/10)' },
                      { state: alexa3, setState: setAlexa3, label: 'Dia 3 (09/10)' }
                    ].map(({ state, setState, label }, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                        onClick={() => setState(!state)}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #7ca066',
                            borderRadius: '3px',
                            backgroundColor: state ? '#7ca066' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {state && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20,6 9,17 4,12" />
                            </svg>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#2c3e50',
                          }}
                        >
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {readUserData?.entrance_2025 ? (
              <>
                  <div 
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    <p 
                      style={{
                        color: '#856404',
                        fontSize: '14px',
                        margin: '0',
                        textAlign: 'center',
                      }}
                    >
                  Visitante já teve seu acesso registrado
                </p>
                  </div>
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
                  }}
                  disabled={loading}
                  onClick={handleRegisterAccess}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#7ca066'
                      e.currentTarget.style.color = '#fff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#7ca066'
                    }}
                  >
                    {loading ? 'Registrando...' : 'Atualizar registro'}
                </button>
              </>
            ) : (
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
                onClick={handleRegisterAccess}
                disabled={loading}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#6b8f5a'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#7ca066'
                  }}
                >
                  {loading ? 'Registrando...' : 'Registrar entrada'}
              </button>
            )}
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
            Posicione o QR Code dentro da área
          </div>
        </div>
      )}
    </div>
  )
}

export default QrReader
