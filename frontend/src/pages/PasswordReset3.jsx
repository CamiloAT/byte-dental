import React, { useState, useEffect } from "react";
import ProgressIndicator from "../components/ProgressIndicator";
import InputPassword from "../components/InputPassword";
import Button from "../components/Button";
import SafetyMeter from "../components/SafetyMeter";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";

const PasswordReset3 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("none");
  const [loading, setLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);
  const [email, setEmail] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  const auth = getAuth();
  const oobCode = searchParams.get("oobCode");

  // Verificar el código cuando se monta el componente
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setGeneralError("Código de restablecimiento no válido. Por favor, solicita un nuevo enlace.");
        return;
      }

      try {
        // Verificar que el código sea válido y obtener el email
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setIsValidCode(true);
      } catch (error) {
        console.error("Error verificando código:", error);
        setGeneralError("El enlace de restablecimiento ha expirado o no es válido. Por favor, solicita uno nuevo.");
      }
    };

    verifyCode();
  }, [oobCode, auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidCode || !oobCode) {
      setGeneralError("Código de restablecimiento no válido.");
      return;
    }

    let hasErrors = false;

    // Validación de la nueva contraseña
    if (newPassword.length < 8) {
      setNewPasswordError("La contraseña debe tener al menos 8 caracteres.");
      hasErrors = true;
    } else {
      setNewPasswordError("");
    }

    // Validación de la coincidencia
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden.");
      hasErrors = true;
    } else {
      setConfirmPasswordError("");
    }

    if (hasErrors) {
      return;
    }

    setLoading(true);
    setGeneralError("");

    try {
      // Confirmar el cambio de contraseña con Firebase
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      // Mostrar mensaje de éxito y iniciar redirección
      setPasswordResetSuccess(true);
      setGeneralError("");
      
      // Iniciar contador de redirección
      setRedirectCountdown(5);
      const countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            navigate("/"); // Redirigir al login
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Error actualizando contraseña:", error);
      
      if (error.code === 'auth/weak-password') {
        setNewPasswordError("La contraseña es muy débil.");
      } else if (error.code === 'auth/expired-action-code') {
        setGeneralError("El enlace de restablecimiento ha expirado. Por favor, solicita uno nuevo.");
      } else if (error.code === 'auth/invalid-action-code') {
        setGeneralError("El código de restablecimiento no es válido.");
      } else {
        setGeneralError("Error al actualizar la contraseña. Inténtalo de nuevo.");
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
    isValidCode &&
    !loading &&
    !passwordResetSuccess;

  // Background SVG shared across all states
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
        <filter id="bgSoftGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
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
        <circle cx="350" cy="650" r="3.5" fill="#48A4D6" fillOpacity="0.25" />
        <circle cx="820" cy="500" r="3.5" fill="#48A4D6" fillOpacity="0.25" />
        <circle cx="520" cy="700" r="3" fill="#48A4D6" fillOpacity="0.2" />
      </g>
      <circle cx="120" cy="200" r="1.5" fill="#48A4D6" fillOpacity="0.2"><animate attributeName="cy" values="200;192;200" dur="5s" repeatCount="indefinite" /></circle>
      <circle cx="900" cy="450" r="1.5" fill="#48A4D6" fillOpacity="0.18"><animate attributeName="cy" values="450;442;450" dur="6s" repeatCount="indefinite" /></circle>
      <circle cx="600" cy="300" r="1.2" fill="#3bbba1" fillOpacity="0.15"><animate attributeName="cy" values="300;294;300" dur="7s" repeatCount="indefinite" /></circle>
    </svg>
  );

  const AccentLine = () => (
    <div className="h-[3px] w-20 mx-auto mt-5 rounded-full" style={{ background: 'linear-gradient(90deg, #48A4D6, #3bbba1)' }} />
  );

  // Si hay un error general (código inválido)
  if (generalError && !isValidCode) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2842 0%, #0d3259 50%, #0f3a66 100%)' }}>
        <BackgroundSVG />
        <div className="relative z-10 w-full max-w-[380px] mx-4">
          <div className="bg-[#FBFCFB] rounded-3xl shadow-2xl px-10 py-10">
            <div className="flex flex-col items-center mb-5">
              <img src="./images/bytedental-logoAzul.png" alt="ByteDental" className="w-16 mb-3" />
              <ProgressIndicator step={3} />
              <h1 className="text-header-blue text-[22px] font-bold font-poppins text-center">Error</h1>
            </div>
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-poppins text-center mb-5">
              {generalError}
            </div>
            <div className="flex flex-col items-center gap-4">
              <Button onClick={() => navigate("/")} className="!w-full max-w-[280px] !h-[42px] !rounded-[30px] !text-[14px] !bg-[#48A4D6] !text-white hover:!bg-[#3a8bb8] shadow-lg">
                Volver al Login
              </Button>
            </div>
          </div>
          <AccentLine />
        </div>
      </div>
    );
  }

  // Si aún está verificando
  if (!isValidCode && !generalError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2842 0%, #0d3259 50%, #0f3a66 100%)' }}>
        <BackgroundSVG />
        <div className="relative z-10 w-full max-w-[380px] mx-4">
          <div className="bg-[#FBFCFB] rounded-3xl shadow-2xl px-10 py-10">
            <div className="flex flex-col items-center">
              <img src="./images/bytedental-logoAzul.png" alt="ByteDental" className="w-16 mb-3" />
              <ProgressIndicator step={3} />
              <h1 className="text-header-blue text-[22px] font-bold font-poppins text-center mb-2">Verificando...</h1>
              <p className="text-gray-500 text-[13px] font-poppins text-center">Validando el enlace de restablecimiento...</p>
            </div>
          </div>
          <AccentLine />
        </div>
      </div>
    );
  }

  // Si la contraseña fue cambiada exitosamente
  if (passwordResetSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2842 0%, #0d3259 50%, #0f3a66 100%)' }}>
        <BackgroundSVG />
        <div className="relative z-10 w-full max-w-[380px] mx-4">
          <div className="bg-[#FBFCFB] rounded-3xl shadow-2xl px-10 py-10">
            <div className="flex flex-col items-center mb-5">
              <img src="./images/bytedental-logoAzul.png" alt="ByteDental" className="w-16 mb-3" />
              <ProgressIndicator step={3} />
              <h1 className="text-green-700 text-[22px] font-bold font-poppins text-center">¡Contraseña actualizada!</h1>
            </div>
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-500 text-[13px] font-poppins text-center">
                Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              {redirectCountdown !== null && (
                <p className="text-gray-400 text-[12px] font-poppins">Redirigiendo al login en {redirectCountdown}s...</p>
              )}
              <Button onClick={() => navigate("/")} className="!w-full max-w-[280px] !h-[42px] !rounded-[30px] !text-[14px] !bg-[#48A4D6] !text-white hover:!bg-[#3a8bb8] shadow-lg">
                Ir al Login
              </Button>
            </div>
          </div>
          <AccentLine />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b2842 0%, #0d3259 50%, #0f3a66 100%)' }}>
      <BackgroundSVG />

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-[#0b2842]/40">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-white/20 border-t-[#48A4D6]" />
            <p className="text-white/50 text-[12px] font-poppins">Guardando...</p>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-[380px] mx-4">
        <div className="bg-[#FBFCFB] rounded-3xl shadow-2xl px-10 py-12">
          
          <div className="flex flex-col items-center mb-5">
            <img src="./images/bytedental-logoAzul.png" alt="ByteDental" className="w-16 mb-3" />
            <ProgressIndicator step={3} />
            <h1 className="text-header-blue text-[22px] font-bold font-poppins text-center leading-tight">
              Nueva contraseña
            </h1>
            {email && (
              <p className="text-gray-500 text-[12px] font-poppins text-center mt-1.5">
                Para: <strong className="text-header-blue">{email}</strong>
              </p>
            )}
          </div>

          {generalError && isValidCode && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-poppins text-center">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
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

            <Button type="submit" className="!w-full max-w-[280px] !h-[42px] !rounded-[30px] !text-[14px] !bg-[#48A4D6] !text-white hover:!bg-[#3a8bb8] shadow-lg" disabled={!isFormValid}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>

            <a onClick={() => { setLoading(true); setTimeout(() => navigate('/'), 400); }} className="text-header-blue hover:underline text-[13px] font-poppins font-semibold cursor-pointer">
              Volver a Inicio de sesión
            </a>
          </form>
        </div>
        <AccentLine />
      </div>
    </div>
  );
};

export default PasswordReset3;