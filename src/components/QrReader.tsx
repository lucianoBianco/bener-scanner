import { useEffect, useRef, useState } from 'react'

// Styles
import './QrStyles.css'

// Qr Scanner
import QrScanner from 'qr-scanner'
import QrFrame from '../assets/qr-frame.svg'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { fireStore } from '../firebase'

const QrReader = () => {
  // QR States
  const scanner = useRef<QrScanner>()
  const videoEl = useRef<HTMLVideoElement>(null)
  const qrBoxEl = useRef<HTMLDivElement>(null)
  const [qrOn, setQrOn] = useState<boolean>(true)
  const [readUserData, setReadUserData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Result
  const [scannedResult, setScannedResult] = useState<string | undefined>('')

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

        setReadUserData({ id: docC?.id, ...docC?.data() })
      }
    }
    getUser()
  }, [scannedResult])

  const handleRegisterAccess = async () => {
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
      await updateDoc(ref, { entrance_2024: true })
      const newRef = doc(fireStore, 'entrances_2024', readUserData.id)
      if (!readUserData?.entrance_2024) {
        await setDoc(newRef, {
          name: readUserData?.name ?? '',
          email: readUserData?.email ?? '',
          phone: readUserData?.phone ?? '',
          company: readUserData?.company ?? '',
          accessAt: new Date(),
        })
      } else {
        try {
          await updateDoc(newRef, {
            name: readUserData?.name ?? '',
            email: readUserData?.email ?? '',
            phone: readUserData?.phone ?? '',
            company: readUserData?.company ?? '',
            lastAccessAt: new Date(),
          })
        } catch (e: any) {
          await setDoc(newRef, {
            name: readUserData?.name ?? '',
            email: readUserData?.email ?? '',
            phone: readUserData?.phone ?? '',
            company: readUserData?.company ?? '',
            accessAt: new Date(),
          })
        }
      }
      setScannedResult(undefined)
      setReadUserData(null)
      // // Reinicia o scanner
      // // if (scanner.current) {
      // //   await scanner.current.start()
      // // }
    } catch (error: any) {
      alert(error?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="qr-reader">
      {/* QR */}

      {/* Show Data Result if scan is success */}
      {scannedResult ? (
        <div style={{ padding: 10 }}>
          <button
            style={{
              width: '60%',
              height: 50,
              borderColor: '#7ca066',
              justifyContent: 'center',
              borderWidth: 5,
              alignItems: 'center',
              backgroundColor: 'transparent',
              color: '#7ca066',
              fontSize: 18,
              borderRadius: 10,
            }}
            disabled={loading}
            onClick={() => {
              setScannedResult(undefined)
              setReadUserData(null)
            }}
          >
            {'<'} Ler Novo QRCode
          </button>
          <div
            style={{
              borderWidth: 2,
              borderRadius: 10,
              borderColor: '#7ca066',
              padding: 20,
              margin: 10,
              fontFamily: 'Roboto',
            }}
          >
            <h3>{readUserData?.name}</h3>
            <h4>{readUserData?.email}</h4>
            <h4>{readUserData?.phone}</h4>
            <h4>{readUserData?.company}</h4>
            {readUserData?.role === 'visitor' && <h3>Visitante</h3>}
            {readUserData?.role === 'exhibitor' && <h3>Expositor</h3>}
            {readUserData?.role === 'admin' && <h3>Parceiro</h3>}

            {readUserData?.entrance_2024 ? (
              <>
                <p style={{ color: '#0cc' }}>
                  Visitante já teve seu acesso registrado
                </p>
                <button
                  style={{
                    width: '100%',
                    height: 50,
                    borderColor: '#7ca066',
                    justifyContent: 'center',
                    borderWidth: 5,
                    backgroundColor: 'transparent',
                    alignItems: 'center',
                    color: '#7ca066',
                    fontSize: 18,
                    borderRadius: 10,
                  }}
                  disabled={loading}
                  onClick={handleRegisterAccess}
                >
                  Registrar nova entrada
                </button>
              </>
            ) : (
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
                onClick={handleRegisterAccess}
                disabled={loading}
              >
                Registrar entrada
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <video ref={videoEl}></video>
          <div ref={qrBoxEl} className="qr-box">
            <img
              src={QrFrame}
              alt="Qr Frame"
              width={256}
              height={256}
              className="qr-frame"
            />
          </div>
        </>
      )}
    </div>
  )
}

export default QrReader
