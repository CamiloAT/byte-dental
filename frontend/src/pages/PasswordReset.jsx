import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import ProgressIndicator from '../components/ProgressIndicator';
import { otpService } from '../services/otpService';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (event) => {
    const value = event.target.value;
    setEmail(value);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Ingrese un correo electrónico válido');
    } else {
      setEmailError('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleButtonClick();
    }
  };

  const handleButtonClick = async () => {
    if (emailError || !email) {
      setResetError('Por favor, ingrese un correo electrónico válido antes de continuar.');
      return;
    }

    setLoading(true);
    setResetError('');
    setResetSuccess(false);

    try {
      // Usar el nuevo servicio OTP
      const result = await otpService.sendOTP(email);
      
      if (result.success) {
        setResetSuccess(true);
        
        // Guardar el email en localStorage para usarlo en la siguiente página
        localStorage.setItem('resetEmail', email);
        setTimeout(() => {
          setLoading(false);
          navigate('/PasswordReset2');
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error al enviar código OTP:', error);
      
      let errorMessage = 'Error al enviar el código de verificación';
      
      if (error.message.includes('correo')) {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (error.message.includes('inválido')) {
        errorMessage = 'Correo electrónico inválido';
      } else if (error.message.includes('intentos')) {
        errorMessage = 'Demasiados intentos. Intenta más tarde';
      } else {
        errorMessage = error.message || 'Error al enviar el código';
      }
      
      setResetError(errorMessage);
      setLoading(false);
    }
  };

  const isEmailValid =!emailError && email.length > 0;

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2842 0%, #0d3259 50%, #0f3a66 100%)' }}>
      
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-[#0b2842]/40">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-white/20 border-t-[#48A4D6]" />
            <p className="text-white/50 text-[12px] font-poppins">Cargando...</p>
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
          <line x1="350" y1="140" x2="280" y2="220" /><line x1="280" y1="220" x2="150" y2="320" />
          <line x1="150" y1="320" x2="60" y2="450" /><line x1="60" y1="450" x2="180" y2="560" />
          <line x1="280" y1="220" x2="400" y2="380" /><line x1="400" y1="380" x2="550" y2="450" />
          <line x1="550" y1="450" x2="700" y2="380" /><line x1="700" y1="380" x2="850" y2="300" />
          <line x1="800" y1="150" x2="950" y2="200" /><line x1="950" y1="200" x2="1050" y2="320" />
          <line x1="850" y1="300" x2="1000" y2="380" /><line x1="1000" y1="380" x2="1100" y2="500" />
          <line x1="550" y1="450" x2="480" y2="580" /><line x1="480" y1="580" x2="350" y2="650" />
          <line x1="180" y1="560" x2="350" y2="650" /><line x1="350" y1="650" x2="520" y2="700" />
          <line x1="700" y1="380" x2="820" y2="500" /><line x1="820" y1="500" x2="950" y2="600" />
          <line x1="950" y1="600" x2="1100" y2="650" /><line x1="820" y1="500" x2="700" y2="620" />
          <line x1="700" y1="620" x2="520" y2="700" />
        </g>
        <g filter="url(#bgSoftGlow)">
          <circle cx="200" cy="80" r="3.5" fill="#48A4D6" fillOpacity="0.3" />
          <circle cx="350" cy="140" r="4" fill="#48A4D6" fillOpacity="0.3" />
          <circle cx="500" cy="60" r="3" fill="#48A4D6" fillOpacity="0.25" />
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
            <ProgressIndicator step={1} />
            <h1 className="text-header-blue text-[22px] font-bold font-poppins text-center leading-tight">
              Restablecer contraseña
            </h1>
            <p className="text-gray-500 text-[12px] font-poppins text-center mt-2 leading-relaxed">
              Ingresa tu correo electrónico y te enviaremos<br/>un código de verificación
            </p>
          </div>

          {resetSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-xl text-[12px] font-poppins text-center">
              ¡Código enviado exitosamente! Revisa tu bandeja de entrada.
            </div>
          )}

          {resetError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-[12px] font-poppins text-center">
              {resetError}
            </div>
          )}

          <div className="flex flex-col items-center gap-5 mt-2">
            <div className="w-full max-w-[300px]">
              <label className="block text-header-blue text-[13px] font-poppins mb-1.5 font-semibold">
                Correo Electrónico
              </label>
              <Input 
                placeholder="Ingrese su correo electrónico"
                value={email}
                onChange={handleEmailChange}
                onKeyPress={handleKeyPress}
                error={!!emailError}
                disabled={resetSuccess}
              />
              {emailError && (
                <p className="text-red-500 text-[11px] font-poppins mt-1">{emailError}</p>
              )}
            </div>

            <Button 
              onClick={handleButtonClick} 
              className="!w-full max-w-[260px] !h-[40px] !rounded-[30px] !text-[13px] !bg-[#48A4D6] !text-white hover:!bg-[#3a8bb8] shadow-lg" 
              disabled={!isEmailValid || resetSuccess || loading}
            >
              {resetSuccess ? 'Código enviado' : 'Enviar código'}
            </Button>

            <a onClick={() => { setLoading(true); setTimeout(() => navigate('/'), 400); }} className="text-header-blue hover:underline text-[12px] font-poppins font-semibold cursor-pointer mt-1">
              Volver a Inicio de sesión
            </a>
          </div>
        </div>

        <div className="h-[3px] w-20 mx-auto mt-5 rounded-full" style={{ background: 'linear-gradient(90deg, #48A4D6, #3bbba1)' }} />
      </div>
    </div>
  );
};

export default PasswordReset;