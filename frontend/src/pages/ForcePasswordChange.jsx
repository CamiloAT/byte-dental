import React, { useState, useEffect } from "react";
import InputPassword from "../components/InputPassword";
import Button from "../components/Button";
import SafetyMeter from "../components/SafetyMeter";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../Firebase/client";

const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("none");
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

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
          setUserInfo(userData);
          if (!userData.must_change_password) {
            navigate("/dashboard");
            return;
          }
        } else {
          throw new Error('Error al obtener información del usuario');
        }
      } catch (error) {
        console.error("Error verificando estado del usuario:", error);
        setGeneralError("Error al verificar tu estado. Por favor, inicia sesión nuevamente.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    checkUserStatus();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let hasErrors = false;

    if (newPassword.length < 8) {
      setNewPasswordError("La contraseña debe tener al menos 8 caracteres.");
      hasErrors = true;
    } else {
      setNewPasswordError("");
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden.");
      hasErrors = true;
    } else {
      setConfirmPasswordError("");
    }

    if (hasErrors) return;

    setLoading(true);
    setGeneralError("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const token = await user.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/force-password-change`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      if (response.ok) {
        setPasswordChangeSuccess(true);
        setGeneralError("");
        setRedirectCountdown(5);
        const countdownInterval = setInterval(() => {
          setRedirectCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              signOut().then(() => navigate("/login")).catch(() => navigate("/login"));
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      if (error.message.includes("no coinciden")) {
        setConfirmPasswordError("Las contraseñas no coinciden.");
      } else if (error.message.includes("8 caracteres")) {
        setNewPasswordError("La contraseña debe tener al menos 8 caracteres.");
      } else {
        setGeneralError(error.message || "Error al cambiar la contraseña. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);

    let strength = "none";
    if (value.length > 0) {
      if (value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value)) {
        strength = "strong";
      } else if (value.length >= 6) {
        strength = "medium";
      } else {
        strength = "weak";
      }
    }
    setPasswordStrength(strength);

    if (value.length < 8) {
      setNewPasswordError("La contraseña debe tener al menos 8 caracteres, incluir una letra mayúscula y un número.");
    } else {
      setNewPasswordError("");
    }
    if (confirmPassword && value !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden.");
    } else if (confirmPassword) {
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (newPassword !== value) {
      setConfirmPasswordError("Las contraseñas no coinciden.");
    } else {
      setConfirmPasswordError("");
    }
  };

  const isFormValid =
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !newPasswordError &&
    !confirmPasswordError &&
    !loading &&
    !passwordChangeSuccess;

  const BackgroundSVG = () => (
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
  );

  // Estado: Error general sin userInfo
  if (generalError && !userInfo) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2842 0%, #1a3a5c 50%, #0d2137 100%)' }}>
        <BackgroundSVG />
        <div className="relative z-10 w-full max-w-[380px] mx-4">
          <div className="bg-[#FBFCFB] rounded-3xl shadow-2xl px-10 py-10">
            <div className="flex flex-col items-center mb-5">
              <img src="./images/bytedental-logoAzul.png" alt="ByteDental" className="w-16 mb-3" />
              <h1 className="text-header-blue text-[22px] font-bold font-poppins text-center leading-tight">Error</h1>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-red-600 text-sm font-poppins text-center">{generalError}</p>
            </div>
            <Button onClick={() => navigate("/login")} className="!w-full !h-[42px] !rounded-[30px] !text-[14px] !bg-[#48A4D6] !text-white hover:!bg-[#3a8bb8]">
              Volver al Login
            </Button>
          </div>
          <div className="h-[3px] w-20 mx-auto mt-5 rounded-full" style={{ background: 'linear-gradient(90deg, #48A4D6, #3bbba1)' }} />
        </div>
      </div>
    );
  }

  // Estado: Cargando
  if (!userInfo && !generalError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2842 0%, #1a3a5c 50%, #0d2137 100%)' }}>
        <BackgroundSVG />
        <div className="relative z-10 w-full max-w-[380px] mx-4">
          <div className="bg-[#FBFCFB] rounded-3xl shadow-2xl px-10 py-10">
            <div className="flex flex-col items-center">
              <img src="./images/bytedental-logoAzul.png" alt="ByteDental" className="w-16 mb-3" />
              <div className="h-12 w-12 border-4 border-[#48A4D6] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500 text-sm font-poppins text-center">Validando tu información...</p>
            </div>
          </div>
          <div className="h-[3px] w-20 mx-auto mt-5 rounded-full" style={{ background: 'linear-gradient(90deg, #48A4D6, #3bbba1)' }} />
        </div>
      </div>
    );
  }

  // Estado: Contraseña cambiada exitosamente
  if (passwordChangeSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2842 0%, #1a3a5c 50%, #0d2137 100%)' }}>
        <BackgroundSVG />
        <div className="relative z-10 w-full max-w-[380px] mx-4">
          <div className="bg-[#FBFCFB] rounded-3xl shadow-2xl px-10 py-10">
            <div className="flex flex-col items-center mb-5">
              <img src="./images/bytedental-logoAzul.png" alt="ByteDental" className="w-16 mb-3" />
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-header-blue text-[22px] font-bold font-poppins text-center leading-tight">
                ¡Contraseña actualizada!
              </h1>
            </div>
            <p className="text-gray-500 text-sm font-poppins text-center mb-4">
              Tu contraseña ha sido cambiada correctamente. Por seguridad, debes iniciar sesión nuevamente.
            </p>
            {redirectCountdown !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
                <p className="text-[#48A4D6] text-sm font-poppins text-center">
                  Redirigiendo al login en {redirectCountdown}s...
                </p>
              </div>
            )}
            <Button
              onClick={() => {
                signOut().then(() => navigate("/login")).catch(() => navigate("/login"));
              }}
              className="!w-full !h-[42px] !rounded-[30px] !text-[14px] !bg-[#48A4D6] !text-white hover:!bg-[#3a8bb8]"
            >
              Iniciar Sesión
            </Button>
          </div>
          <div className="h-[3px] w-20 mx-auto mt-5 rounded-full" style={{ background: 'linear-gradient(90deg, #48A4D6, #3bbba1)' }} />
        </div>
      </div>
    );
  }

  // Estado: Formulario principal
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2842 0%, #1a3a5c 50%, #0d2137 100%)' }}>
      <BackgroundSVG />

      <div className="relative z-10 w-full max-w-[380px] mx-4">
        <div className="bg-[#FBFCFB] rounded-3xl shadow-2xl px-10 py-10">

          {/* Logo y título */}
          <div className="flex flex-col items-center mb-5">
            <img src="./images/bytedental-logoAzul.png" alt="ByteDental" className="w-16 mb-3" />
            <h1 className="text-header-blue text-[22px] font-bold font-poppins text-center leading-tight">
              Configurar nueva contraseña
            </h1>
            {userInfo && (
              <p className="text-gray-400 text-[12px] font-poppins text-center mt-1.5">
                Hola <span className="font-semibold text-gray-600">{userInfo.first_name}</span>, crea tu contraseña para continuar.
              </p>
            )}
          </div>

          {/* Error general */}
          {generalError && userInfo && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-poppins text-center">
              {generalError}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
            {/* Nueva Contraseña */}
            <div className="w-full max-w-[340px]">
              <label htmlFor="newPassword" className="block text-header-blue text-[13px] font-poppins mb-1.5 font-semibold">
                Nueva Contraseña
              </label>
              <InputPassword
                id="newPassword"
                placeholder="Ingrese su nueva contraseña"
                value={newPassword}
                onChange={handleNewPasswordChange}
                error={!!newPasswordError}
              />
              {newPasswordError && (
                <p className="text-red-500 text-[11px] font-poppins mt-1">{newPasswordError}</p>
              )}
              <SafetyMeter strength={passwordStrength} />
            </div>

            {/* Confirmar Contraseña */}
            <div className="w-full max-w-[340px]">
              <label htmlFor="confirmPassword" className="block text-header-blue text-[13px] font-poppins mb-1.5 font-semibold">
                Confirmar Contraseña
              </label>
              <InputPassword
                id="confirmPassword"
                placeholder="Confirme su nueva contraseña"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                error={!!confirmPasswordError}
              />
              {confirmPasswordError && (
                <p className="text-red-500 text-[11px] font-poppins mt-1">{confirmPasswordError}</p>
              )}
            </div>

            {/* Botón Actualizar */}
            <Button type="submit" className="!w-full max-w-[280px] !h-[42px] !rounded-[30px] !text-[14px] !bg-[#48A4D6] !text-white hover:!bg-[#3a8bb8] shadow-lg" disabled={!isFormValid}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Actualizando...
                </span>
              ) : "Actualizar Contraseña"}
            </Button>
          </form>

          {/* Info de seguridad */}
          <div className="mt-5 w-full max-w-[340px] mx-auto bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-amber-700 text-[11px] font-poppins text-center leading-relaxed">
              La contraseña debe tener mínimo <strong>8 caracteres</strong>, incluir una <strong>mayúscula</strong> y un <strong>número</strong>.
            </p>
          </div>
        </div>

        {/* Accent line */}
        <div className="h-[3px] w-20 mx-auto mt-5 rounded-full" style={{ background: 'linear-gradient(90deg, #48A4D6, #3bbba1)' }} />
      </div>
    </div>
  );
};

export default ForcePasswordChange;
