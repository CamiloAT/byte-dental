import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/Input';
import InputPassword from '../components/InputPassword';
import Button from '../components/Button';
import GoogleSignIn from '../components/GoogleSignIn';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { loginWithGoogle, loginWithEmailAndPassword, logout } from '../Firebase/client';
import { 
  registerLoginEvent, 
  checkUserActiveStatus,
  checkLockStatus 
} from '../services/authAuditService';


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, userRole, mustChangePassword, token } = useAuth();

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (isAuthenticated && userRole && !mustChangePassword) {
      // Redirigir según el rol (solo si no debe cambiar contraseña)
      if (userRole === "Administrador") {
        navigate('/users/register');
      } else if (userRole === "Doctor") {
        navigate('/patients');
      } else if (userRole === "Asistente") {
        navigate('/patients/register');
      } else if (userRole === "Auditor") {
        navigate('/audit-logs');
      } else {
        navigate('/login');
      }
    }
    // Si mustChangePassword es true, el App.jsx manejará la redirección automáticamente
  }, [isAuthenticated, userRole, mustChangePassword, navigate]);

  // --- Lógica de Manejo de Entradas y Validación  ---
  const handleUsernameChange = (event) => {
    const value = event.target.value;
    setUsername(value);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setUsernameError('Ingrese un correo electrónico válido');
    } else {
      setUsernameError('');
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isFormValid) {
        handleLogin();
      }
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      handleLogin();
    }
  };

  // --- Funciones de Autenticación con Firebase ---
  const handleLogin = async () => {
    if (usernameError || !username || !password) {
      setLoginError('Por favor, completa todos los campos correctamente.');
      return;
    }

    setLoading(true);
    setLoginError('');

    let user = null;
    let loginSuccessful = false;

    try {
      // PRIMERO: Verificar si la cuenta está bloqueada
      const lockStatus = await checkLockStatus(username);
      
      if (lockStatus.is_locked) {
        setLoginError(lockStatus.message);
        setLoading(false);
        return;
      }
      
      // Intentar login con Firebase
      const userCredential = await loginWithEmailAndPassword(username, password);
      
      // Verificar si userCredential es directamente el usuario o contiene una propiedad user
      user = userCredential.user || userCredential;
      
      // Verificar que el usuario se haya obtenido correctamente
      if (!user || !user.uid) {
        throw new Error('No se pudo obtener la información del usuario de Firebase');
      }
      
      loginSuccessful = true;
      
      // Verificar si el usuario está activo en el backend
      try {
        const isActive = await checkUserActiveStatus(user.uid);
        if (isActive === false) {
          // Usuario existe pero está desactivado
          await registerLoginEvent(username, false, "Usuario desactivado", user.uid);
          await logout();
          setLoginError('Tu cuenta ha sido desactivada. Contacta al administrador.');
          return;
        } else if (isActive === null) {
          // Error al verificar estado - continuar con el login pero registrar warning
        }
      } catch (statusError) {
        // Continuar con el login aunque no se pueda verificar el estado
      }
      
      // Registrar login exitoso en auditoría
      try {
        await registerLoginEvent(username, true, null, user.uid);
      } catch (auditError) {
        // No bloquear el login por errores de auditoría
      }
      
      // Verificar si el usuario necesita cambiar contraseña
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          
          // Si debe cambiar contraseña, redirigir a ForcePasswordChange
          if (userData.must_change_password) {
            navigate('/force-password-change');
            return;
          }
        }
      } catch (userInfoError) {
        console.error('Error obteniendo información del usuario:', userInfoError);
        // Continuar con redirección automática - App.jsx manejará la redirección
      }
      
      // App.jsx se encarga de la redirección automática basada en el estado de autenticación
      
    } catch (error) {
      // Solo registrar como LOGIN_FAILED si realmente falló el login de Firebase
      let errorHandled = false;
      if (!loginSuccessful) {
        try {
          await registerLoginEvent(username, false, error.message);
        } catch (auditError) {
          // Verificar si el error de auditoría es por cuenta bloqueada o intentos restantes
          if (auditError.response) {
            const errorData = auditError.response.data?.detail;
            
            // Error 403: Cuenta bloqueada
            if (auditError.response.status === 403) {
              if (typeof errorData === 'object' && errorData.message) {
                setLoginError(errorData.message);
                errorHandled = true;
              } else if (typeof errorData === 'string') {
                setLoginError(errorData);
                errorHandled = true;
              }
            }
            
            // Error 401: Credenciales incorrectas con intentos restantes
            if (auditError.response.status === 401) {
              if (typeof errorData === 'object' && errorData.message) {
                setLoginError(errorData.message);
                toast.error(errorData.message);
                errorHandled = true;
              } else if (typeof errorData === 'string') {
                setLoginError(errorData);
                errorHandled = true;
              }
            }
          }
          // Error registrando en auditoría - continuar con el error original
        }
      }
      
      // Mostrar error al usuario solo si no se manejó desde el backend
      if (!errorHandled) {
        setLoginError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejar inicio de sesión con Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoginError('');

    let user = null;
    let loginSuccessful = false;

    try {
      // Intentar login con Google
      const googleUser = await loginWithGoogle();
      
      // Verificar si googleUser es directamente el usuario o contiene una propiedad user
      user = googleUser.user || googleUser;
      
      // Verificar que el usuario se haya obtenido correctamente
      if (!user || !user.uid || !user.email) {
        throw new Error('No se pudo obtener la información del usuario de Google');
      }
      
      loginSuccessful = true;
      
      // Verificar si el usuario está activo en el backend
      try {
        const isActive = await checkUserActiveStatus(user.uid);
        if (isActive === false) {
          // Usuario existe pero está desactivado
          await registerLoginEvent(user.email, false, "Usuario desactivado", user.uid);
          await logout();
          setLoginError('Tu cuenta ha sido desactivada. Contacta al administrador.');
          toast.error('Tu cuenta ha sido desactivada. Contacta al administrador.');
          return;
        } else if (isActive === null) {
          // Error al verificar estado - continuar con el login pero registrar warning
        }
      } catch (statusError) {
        // Continuar con el login aunque no se pueda verificar el estado
      }
      
      // Registrar login exitoso en auditoría
      try {
        await registerLoginEvent(user.email, true, null, user.uid);
      } catch (auditError) {
        // No bloquear el login por errores de auditoría
      }
      
      // Verificar si el usuario necesita cambiar contraseña
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          
          // Si debe cambiar contraseña, redirigir a ForcePasswordChange
          if (userData.must_change_password) {
            navigate('/force-password-change');
            return;
          }
        }
      } catch (userInfoError) {
        console.error('Error obteniendo información del usuario:', userInfoError);
        // Continuar con redirección automática - App.jsx manejará la redirección
      }
      
      // App.jsx se encarga de la redirección automática basada en el estado de autenticación
      
    } catch (error) {
      // Solo registrar como LOGIN_FAILED si realmente falló el login de Google
      let errorHandled = false;
      if (!loginSuccessful) {
        try {
          await registerLoginEvent('google-signin-attempt', false, error.message);
        } catch (auditError) {
          // Verificar si el error de auditoría es por cuenta bloqueada o intentos restantes
          if (auditError.response) {
            const errorData = auditError.response.data?.detail;
            
            // Error 403: Cuenta bloqueada
            if (auditError.response.status === 403) {
              if (typeof errorData === 'object' && errorData.message) {
                setLoginError(errorData.message);
                errorHandled = true;
              } else if (typeof errorData === 'string') {
                setLoginError(errorData);
                errorHandled = true;
              }
            }
            
            // Error 401: Credenciales incorrectas con intentos restantes
            if (auditError.response.status === 401) {
              if (typeof errorData === 'object' && errorData.message) {
                setLoginError(errorData.message);
                errorHandled = true;
              } else if (typeof errorData === 'string') {
                setLoginError(errorData);
                errorHandled = true;
              }
            }
          }
          // Error registrando en auditoría - continuar con el error original
        }
      }
      
      // Mostrar error al usuario solo si no se manejó desde el backend
      if (!errorHandled) {
        let errorMessage;
        
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Inicio de sesión cancelado';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Popup bloqueado por el navegador';
            break;
          default:
            errorMessage = error.message;
        }
        
        setLoginError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };


  // Manejar clic en "¿Olvidó su contraseña?"
  const handleForgotPasswordClick = () => {
    setLoading(true); // Mostrar pantalla de carga
    setTimeout(() => {
      setLoading(false); 
      navigate('/PasswordReset'); // Redirigir
    }, 2000);
  };

  // Deshabilita el botón si hay errores o campos vacíos
  const isFormValid = !usernameError && username.length > 0 && password.length > 0;

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2842 0%, #0d3259 50%, #0f3a66 100%)' }}>
      
      {/* Loading overlay - blurs the page behind */}
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

        {/* Network lines */}
        <g stroke="#48A4D6" strokeWidth="0.8" strokeOpacity="0.1" fill="none">
          <line x1="80" y1="120" x2="200" y2="80" />
          <line x1="200" y1="80" x2="350" y2="140" />
          <line x1="350" y1="140" x2="500" y2="60" />
          <line x1="500" y1="60" x2="680" y2="120" />
          <line x1="200" y1="80" x2="280" y2="220" />
          <line x1="280" y1="220" x2="450" y2="280" />
          <line x1="450" y1="280" x2="620" y2="200" />
          <line x1="620" y1="200" x2="800" y2="150" />
          <line x1="350" y1="140" x2="280" y2="220" />
          <line x1="280" y1="220" x2="150" y2="320" />
          <line x1="150" y1="320" x2="60" y2="450" />
          <line x1="60" y1="450" x2="180" y2="560" />
          <line x1="280" y1="220" x2="400" y2="380" />
          <line x1="400" y1="380" x2="550" y2="450" />
          <line x1="550" y1="450" x2="700" y2="380" />
          <line x1="700" y1="380" x2="850" y2="300" />
          <line x1="450" y1="280" x2="550" y2="450" />
          <line x1="800" y1="150" x2="950" y2="200" />
          <line x1="950" y1="200" x2="1050" y2="320" />
          <line x1="850" y1="300" x2="1000" y2="380" />
          <line x1="1000" y1="380" x2="1100" y2="500" />
          <line x1="550" y1="450" x2="480" y2="580" />
          <line x1="480" y1="580" x2="350" y2="650" />
          <line x1="700" y1="380" x2="820" y2="500" />
          <line x1="820" y1="500" x2="950" y2="600" />
          <line x1="180" y1="560" x2="350" y2="650" />
          <line x1="350" y1="650" x2="520" y2="700" />
          <line x1="680" y1="120" x2="800" y2="150" />
          <line x1="150" y1="320" x2="280" y2="420" />
          <line x1="280" y1="420" x2="400" y2="380" />
          <line x1="950" y1="200" x2="1100" y2="150" />
          <line x1="1050" y1="320" x2="1150" y2="450" />
          <line x1="820" y1="500" x2="700" y2="620" />
          <line x1="700" y1="620" x2="520" y2="700" />
          <line x1="60" y1="450" x2="180" y2="560" />
          <line x1="950" y1="600" x2="1100" y2="650" />
        </g>

        {/* Network nodes */}
        <g filter="url(#bgSoftGlow)">
          <circle cx="80" cy="120" r="3" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="200" cy="80" r="3.5" fill="#48A4D6" fillOpacity="0.3" />
          <circle cx="350" cy="140" r="4" fill="#48A4D6" fillOpacity="0.3" />
          <circle cx="500" cy="60" r="3" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="680" cy="120" r="3.5" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="280" cy="220" r="4.5" fill="#48A4D6" fillOpacity="0.35" />
          <circle cx="450" cy="280" r="4" fill="#48A4D6" fillOpacity="0.3" />
          <circle cx="620" cy="200" r="3.5" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="800" cy="150" r="3" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="150" cy="320" r="3.5" fill="#48A4D6" fillOpacity="0.28" />
          <circle cx="60" cy="450" r="3" fill="#48A4D6" fillOpacity="0.22" />
          <circle cx="180" cy="560" r="3.5" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="400" cy="380" r="4" fill="#48A4D6" fillOpacity="0.3" />
          <circle cx="550" cy="450" r="4.5" fill="#48A4D6" fillOpacity="0.35" />
          <circle cx="700" cy="380" r="3.5" fill="#48A4D6" fillOpacity="0.28" />
          <circle cx="850" cy="300" r="3" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="950" cy="200" r="3" fill="#48A4D6" fillOpacity="0.22" />
          <circle cx="1050" cy="320" r="3.5" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="1000" cy="380" r="3" fill="#48A4D6" fillOpacity="0.22" />
          <circle cx="1100" cy="500" r="3" fill="#48A4D6" fillOpacity="0.2" />
          <circle cx="480" cy="580" r="3" fill="#48A4D6" fillOpacity="0.22" />
          <circle cx="350" cy="650" r="3.5" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="820" cy="500" r="3.5" fill="#48A4D6" fillOpacity="0.25" />
          <circle cx="950" cy="600" r="3" fill="#48A4D6" fillOpacity="0.22" />
          <circle cx="520" cy="700" r="3" fill="#48A4D6" fillOpacity="0.2" />
          <circle cx="700" cy="620" r="3" fill="#48A4D6" fillOpacity="0.2" />
          <circle cx="280" cy="420" r="3" fill="#48A4D6" fillOpacity="0.22" />
          <circle cx="1150" cy="450" r="2.5" fill="#48A4D6" fillOpacity="0.18" />
          <circle cx="1100" cy="150" r="2.5" fill="#48A4D6" fillOpacity="0.18" />
          <circle cx="1100" cy="650" r="2.5" fill="#48A4D6" fillOpacity="0.18" />
        </g>

        {/* Floating particles */}
        <circle cx="120" cy="200" r="1.5" fill="#48A4D6" fillOpacity="0.2">
          <animate attributeName="cy" values="200;192;200" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="900" cy="450" r="1.5" fill="#48A4D6" fillOpacity="0.18">
          <animate attributeName="cy" values="450;442;450" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="600" cy="300" r="1.2" fill="#3bbba1" fillOpacity="0.15">
          <animate attributeName="cy" values="300;294;300" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="500" r="1.2" fill="#3bbba1" fillOpacity="0.12">
          <animate attributeName="cy" values="500;494;500" dur="5.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="1000" cy="250" r="1.3" fill="#48A4D6" fillOpacity="0.15">
          <animate attributeName="cy" values="250;244;250" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="750" cy="550" r="1.2" fill="#48A4D6" fillOpacity="0.12">
          <animate attributeName="cy" values="550;544;550" dur="6.5s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[380px] mx-4">
        <div className="bg-[#FBFCFB] rounded-3xl shadow-2xl px-10 py-9">
          
          {/* Logo and Title */}
          <div className="flex flex-col items-center mb-6">
            <img src="./images/bytedental-logoAzul.png" alt="ByteDental" className="w-16 mb-3" />
            <h1 className="text-header-blue text-[24px] font-bold font-poppins text-center leading-tight">
              Inicio de Sesión
            </h1>
          </div>

          {/* Error */}
          {loginError && (
            <div className="mb-5 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-poppins text-center">
              {loginError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
            {/* Email field */}
            <div className="w-full max-w-[340px]">
              <label htmlFor="username" className="block text-header-blue text-[13px] font-poppins mb-1.5 font-semibold">
                Correo Electrónico
              </label>
              <Input
                id="username"
                placeholder="Ingrese su correo electrónico"
                value={username}
                onChange={handleUsernameChange}
                onKeyDown={handleKeyPress}
                error={!!usernameError}
              />
              {usernameError && (
                <p className="text-red-500 text-[11px] font-poppins mt-1">{usernameError}</p>
              )}
            </div>

            {/* Password field */}
            <div className="w-full max-w-[340px]">
              <label htmlFor="password" className="block text-header-blue text-[13px] font-poppins mb-1.5 font-semibold">
                Contraseña
              </label>
              <InputPassword 
                id="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={handleKeyPress}
                error={!!passwordError}
              />
              {passwordError && (
                <p className="text-red-500 text-[11px] font-poppins mt-1">{passwordError}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="w-full max-w-[340px]">
              <a
                onClick={handleForgotPasswordClick}
                className="text-header-blue hover:underline text-[12px] font-poppins font-semibold cursor-pointer" 
              >
                ¿Olvidó su contraseña?
              </a>
            </div>

            {/* Login button */}
            <Button type="submit" className="!w-full max-w-[280px] !h-[42px] !rounded-[30px] !text-[14px] !bg-[#48A4D6] !text-white hover:!bg-[#3a8bb8] shadow-lg" disabled={!isFormValid}>
              Ingresar
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center w-full max-w-[280px] mx-auto my-5">
            <hr className="flex-grow border-t border-gray-line" />
            <span className="px-3 text-gray-400 text-[13px] font-poppins">o</span>
            <hr className="flex-grow border-t border-gray-line" />
          </div>

          {/* Google button */}
          <div className="flex justify-center">
            <GoogleSignIn onClick={handleGoogleLogin} className="shadow-md !w-full max-w-[280px] !h-[42px] !rounded-[30px] !text-[14px]" />
          </div>

        </div>

        {/* Bottom accent line */}
        <div className="h-[3px] w-20 mx-auto mt-5 rounded-full" style={{ background: 'linear-gradient(90deg, #48A4D6, #3bbba1)' }} />
      </div>
    </div>
  );
};

export default Login;