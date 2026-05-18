import React, { useState } from "react";
import { Camera } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await checkAdminAndRedirect(userCred.user);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("E-mail ou senha incorretos.");
      } else {
        setError("Falha ao entrar: " + err.message);
      }
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Por favor, preencha o campo de e-mail para recuperar a senha.");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Instruções de recuperação foram enviadas para o seu e-mail.");
    } catch (err: any) {
      setError("Falha ao enviar e-mail de recuperação: " + err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCred = await signInWithPopup(auth, provider);
      
      // Ensure user profile exists
      const userDocRef = doc(db, "users", userCred.user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          email: userCred.user.email,
          name: userCred.user.displayName || "Cliente",
          role: "client",
          createdAt: serverTimestamp()
        });
      }

      await checkAdminAndRedirect(userCred.user);
    } catch (err: any) {
      setError("Falha ao entrar com Google: " + err.message);
      setLoading(false);
    }
  };

  const checkAdminAndRedirect = async (user: any) => {
    const { uid, email, displayName } = user;
    
    // Auto-setup admin for the primary email
    if (email === "andreafontesestudiofotografico@gmail.com") {
      const adminDocRef = doc(db, "admins", uid);
      const adminSnap = await getDoc(adminDocRef);
      if (!adminSnap.exists()) {
        try {
          await setDoc(adminDocRef, {
            email: email,
            createdAt: serverTimestamp()
          });
          
          await setDoc(doc(db, "users", uid), {
            email: email,
            name: displayName || "Admin Andrea",
            role: "admin",
            createdAt: serverTimestamp()
          }, { merge: true });
          
          console.log("Admin account successfully bootstrapped.");
        } catch (error) {
          console.error("Failed to bootstrap admin:", error);
        }
      }
    }

    const adminDoc = await getDoc(doc(db, "admins", uid));
    
    // Check if there's a redirect query param
    const state = location.state as { from?: { pathname: string } };
    const redirectTo = state?.from?.pathname;

    if (adminDoc.exists()) {
      navigate(redirectTo && redirectTo.startsWith('/admin') ? redirectTo : "/admin");
    } else {
      navigate(redirectTo && !redirectTo.startsWith('/admin') ? redirectTo : "/cliente");
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 font-sans">
      <div className="hidden md:block relative bg-black">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          src="https://i.postimg.cc/qq8WMy3K/Chat-GPT-Image-18-de-mai-de-2026-10-30-46.png" 
          alt="Login" 
          className="w-full h-full object-cover animate-in fade-in duration-1000"
        />
        <div className="absolute bottom-12 left-12 z-20 text-white">
          <Camera className="w-12 h-12 mb-6" />
          <h2 className="font-black tracking-tighter uppercase text-4xl mb-4">Acesso ao Sistema</h2>
          <p className="text-white/80 max-w-sm font-medium">Área restrita para clientes e administração do estúdio.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="md:hidden text-center mb-12">
            <h1 className="font-black tracking-tighter uppercase text-3xl">Acesso ao Sistema</h1>
          </div>
          
          {error && <div className="bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest p-4 mb-6 border border-red-100">{error}</div>}
          {message && <div className="bg-green-50 text-green-600 text-xs font-bold uppercase tracking-widest p-4 mb-6 border border-green-100">{message}</div>}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">E-mail</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-gray-200 bg-transparent py-3 text-sm font-medium focus:border-black outline-none transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <div>
               <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Senha</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-gray-200 bg-transparent py-3 text-sm font-medium focus:border-black outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 uppercase tracking-widest text-xs font-black hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4">
              {loading ? "Autenticando..." : "Entrar"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
              <span className="bg-white px-4 text-gray-400">Ou continue com</span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full border border-gray-200 bg-white py-4 flex items-center justify-center gap-3 uppercase tracking-widest text-xs font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <div className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
            Esqueceu a senha? <button type="button" onClick={handleResetPassword} className="underline hover:text-black">Recuperar via E-mail</button>
          </div>
          <div className="mt-8 text-center">
            <Link to="/" className="text-xs font-black uppercase tracking-widest border-b border-black pb-1 hover:text-gray-500 transition-colors">Voltar para a Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
