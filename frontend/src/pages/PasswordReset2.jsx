import React, { useState, useEffect } from 'react';
import ProgressIndicator from '../components/ProgressIndicator';
import Button from '../components/Button';
import OtpInput from '../components/Otpinput';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import { otpService } from '../services/otpService';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

function cn(...args) {
  return twMerge(clsx(args));
}

const PasswordReset2 = () => {
  const navigate = useNavigate();
  const [otpCode, setOtpCode] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otpValidated, setOtpValidated] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  useEffect(() => {
    // Obtener el email del localStorage
    const storedEmail = localStorage.getItem('resetEmail');
    if (!storedEmail) {
      navigate('/PasswordReset');
      return;
    }
    setEmail(storedEmail);
  }, [navigate]);

  const handleOtpComplete = async (code) => {
    setOtpCode(code);
    setLoading(true);
    setShowError(false);
    setErrorMessage('');

    try {
      const result = await otpService.verifyOTP(email, code);
      
      if (result.success) {
        const auth = getAuth();
        
        try {
          // Firebase manejará la URL automáticamente basándose en la configuración del console
          await sendPasswordResetEmail(auth, email);
          
          setOtpValidated(true);
          
          // Mostrar mensaje de éxito
          setErrorMessage('Código validado. Se ha enviado un enlace de restablecimiento a tu correo.');
          setShowError(false);
          
          // Guardar que el OTP fue verificado y que se envió el email
          localStorage.setItem('otpVerified', 'true');
          localStorage.setItem('firebaseEmailSent', 'true');
          
          // Esperar un poco para que el usuario lea el mensaje y luego informar sobre el enlace
          setTimeout(() => {
            setErrorMessage('Revisa tu correo y haz clic en el enlace para crear tu nueva contraseña.');
            
            // Iniciar contador de redirección a login
            setRedirectCountdown(10);
            const countdownInterval = setInterval(() => {
              setRedirectCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(countdownInterval);
                  navigate('/'); // Redirigir al login
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }, 2000);
          
        } catch (firebaseError) {
          console.error('Error enviando email de Firebase:', firebaseError);
          setShowError(true);
          if (firebaseError.code === 'auth/user-not-found') {
            setErrorMessage('No existe una cuenta con este correo electrónico.');
          } else if (firebaseError.code === 'auth/invalid-email') {
            setErrorMessage('El correo electrónico no es válido.');
          } else {
            setErrorMessage('Error enviando el enlace de restablecimiento. Intenta nuevamente.');
          }
        }
        
      } else {
        setShowError(true);
        // Personalizar el mensaje según el tipo de error
        if (result.message.includes('incorrecto') || result.message.includes('inválido') || result.message.includes('invalid')) {
          setErrorMessage('El código no coincide. Verifica e intenta nuevamente.');
        } else if (result.message.includes('expirado') || result.message.includes('expired')) {
          setErrorMessage('El código ha expirado. Solicita un nuevo código.');
        } else {
          setErrorMessage('El código no coincide. Verifica e intenta nuevamente.');
        }
      }
    } catch (error) {
      console.error('Error verificando OTP:', error);
      setShowError(true);
      setErrorMessage('Error de conexión. Verifica tu internet e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otpCode.length === 4) {
      await handleOtpComplete(otpCode);
    } else {
      setShowError(true);
      setErrorMessage('Por favor, ingresa los 4 dígitos del código.');
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setShowError(false);
    setErrorMessage('');

    try {
      const result = await otpService.sendOTP(email);
      
      if (result.success) {
        // Mostrar mensaje de éxito temporal
        setErrorMessage('Código reenviado exitosamente');
        setShowError(false);
        
        // Limpiar el mensaje después de 3 segundos
        setTimeout(() => {
          setErrorMessage('');
        }, 3000);
      } else {
        setShowError(true);
        setErrorMessage(result.message || 'Error reenviando el código');
      }
    } catch (error) {
      console.error('Error reenviando código:', error);
      setShowError(true);
      setErrorMessage('Error reenviando el código. Intenta nuevamente.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2842 0%, #0d3259 50%, #0f3a66 100%)' }}>
      
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-[#0b2842]/40">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-white/20 border-t-[#48A4D6]" />
            <p className="text-white/50 text-[12px] font-poppins">Verificando...</p>
          </div>
        </div>
      )}
      
      {/* Background network illustration */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="bgGlow1" cx="25%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#48A4D6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0b2842" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bgGlow2" cx="75%" cy="70%" r="40%">
            <stop offset="0%" stopColor="#48A4D6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0b2842" stopOpacity="0" />
          </radialGradient>
          <filter id="bgSoftGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="1200" height="800" fill="url(#bgGlow1)" />
        <rect width="1200" height="800" fill="url(#bgGlow2)" />
        <g stroke="#48A4D6" strokeWidth="0.8" strokeOpacity="0.1" fill="none">
          <line x1="80" y1="120" x2="200" y2="80" /><line x1="200" y1="80" x2="350" y2="140" />
          <line x1="350" y1="140" x2="500" y2="60" /><line x1="500" y1="60" x2="680" y2="120" />
          <line x1="200" y1="80" x2="280" y2="220" /><line x1="280" y1="220" x2="450" y2="280" />
          <line x1="450" y1="280" x2="620" y2="200" /><line x1="620" y1="200" x2="800" y2="150" />
          <line x1="280" y1="220" x2="150" y2="320" /><line x1="150" y1="320" x2="60" y2="450" />
          <line x1="60" y1="450" x2="180" y2="560" /><line x1="280" y1="220" x2="400" y2="380" />
          <line x1="400" y1="380" x2="550" y2="450" /><line x1="550" y1="450" x2="700" y2="380" />
          <line x1="700" y1="380" x2="850" y2="300" /><line x1="800" y1="150" x2="950" y2="200" />
          <line x1="950" y1="200" x2="1050" y2="320" /><line x1="850" y1="300" x2="1000" y2="380" />
          <line x1="1000" y1="380" x2="1100" y2="500" /><line x1="550" y1="450" x2="480" y2="580" />
          <line x1="480" y1="580" x2="350" y2="650" /><line x1="180" y1="560" x2="350" y2="650" />
          <line x1="350" y1="650" x2="520" y2="700" /><line x1="700" y1="380" x2="820" y2="500" />
          <line x1="820" y1="500" x2="950" y2="600" /><line x1="820" y1="500" x2="700" y2="620" />
          <line x1="700" y1="620" x2="520" y2="700" />
        </g>
        <g filter="url(#bgSoftGlow)">
          <circle cx="200" cy="80" r="3.5" fill="#48A4D6" fillOpacity="0.3" />
          <circle cx="350" cy="140" r="4" fill="#48A4D6" fillOpacity="0.3" />
          <circle cx="280" cy="220" r="4.5" fill="#48A4D6" fillOpacity="0.35" />
          <circle cx="450" cy="280" r="4" fill="#48A4D6" fillOpacity="0.3" />
          <circle cx="150" cy="320" r="3.5" fill="#48A4D6" fillOpacity="0.28" />
          <circle cx="400" cy="380" r="4" fill="#48A4D6" fillOpacity="0.3" />
          <circle cx="550" cy="450" r="4.5" fill="#48A4D6" fillOpacity="0.35" />
          <circle cx="700" cy="380" r="3.5" fill="#48A4D6" fillOpacity="0.28" />
          <circle cx="850" cy="300" r="3" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="950" cy="200" r="3" fill="#48A4D6" fillOpacity="0.22" />
          <circle cx="350" cy="650" r="3.5" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="1050" cy="320" r="3.5" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="820" cy="500" r="3.5" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="520" cy="700" r="3" fill="#48A4D6" fillOpacity="0.2" />
        </g>
        <circle cx="120" cy="200" r="1.5" fill="#48A4D6" fillOpacity="0.2">
          <animate attributeName="cy" values="200;192;200" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="900" cy="450" r="1.5" fill="#48A4D6" fillOpacity="0.18">
          <animate attributeName="cy" values="450;442;450" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="600" cy="300" r="1.2" fill="#3bbba1" fillOpacity="0.15">
          <animate attributeName="cy" values="300;294;300" dur="7s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[380px] mx-4">
        <div className="bg-[#FBFCFB] rounded-3xl shadow-2xl px-10 py-10">

          <div className="flex flex-col items-center mb-6">
            <img src="./images/bytedental-logoAzul.png" alt="ByteDental" className="w-16 mb-3" />
            <ProgressIndicator step={otpValidated ? 3 : 2} />
            <h1 className="text-header-blue text-[22px] font-bold font-poppins text-center leading-tight">
              Restablecer contraseña
            </h1>
          </div>

          {!otpValidated ? (
            <>
              <p className="text-center text-gray-500 text-[13px] font-poppins mb-6">
                Se envió un código de verificación a <strong className="text-header-blue">{email}</strong>. Ingrésalo a continuación.
              </p>

              {showError && errorMessage && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-poppins text-center">
                  {errorMessage}
                </div>
              )}

              {!showError && errorMessage && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-xl text-sm font-poppins text-center">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-[340px]">
                  <OtpInput onComplete={setOtpCode} />
                </div>

                <Button 
                  className="!w-full max-w-[280px] !h-[42px] !rounded-[30px] !text-[14px] !bg-[#48A4D6] !text-white hover:!bg-[#3a8bb8] shadow-lg"
                  onClick={handleVerify} 
                  disabled={otpCode.length !== 4 || loading}
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </Button>
                
                <button 
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  className="text-header-blue hover:underline text-[13px] font-poppins font-semibold disabled:opacity-50"
                >
                  {resendLoading ? 'Reenviando...' : 'Reenviar código'}
                </button>

                <a onClick={() => { setLoading(true); setTimeout(() => navigate('/'), 400); }} className="text-header-blue hover:underline text-[13px] font-poppins font-semibold cursor-pointer">
                  Volver a Inicio de sesión
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 w-full max-w-[340px]">
                  <h2 className="text-green-800 text-[16px] font-semibold font-poppins mb-2 text-center">
                    ¡Código validado!
                  </h2>
                  <p className="text-green-700 text-[13px] font-poppins text-center mb-1">
                    Se ha enviado un enlace de restablecimiento a <strong>{email}</strong>.
                  </p>
                  <p className="text-gray-600 text-[12px] font-poppins text-center">
                    Revisa tu bandeja de entrada y carpeta de spam.
                  </p>
                </div>

                {redirectCountdown !== null && (
                  <p className="text-gray-400 text-[12px] font-poppins">
                    Redirigiendo al login en {redirectCountdown}s...
                  </p>
                )}

                <a onClick={() => { setLoading(true); setTimeout(() => navigate('/'), 400); }} className="text-header-blue hover:underline text-[13px] font-poppins font-semibold cursor-pointer">
                  Volver a Inicio de sesión
                </a>
              </div>
            </>
          )}
        </div>

        <div className="h-[3px] w-20 mx-auto mt-5 rounded-full" style={{ background: 'linear-gradient(90deg, #48A4D6, #3bbba1)' }} />
      </div>
    </div>
  );
};

export default PasswordReset2;