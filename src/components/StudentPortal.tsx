import { useState, useEffect, type FormEvent } from 'react';
import QRCode from 'react-qr-code';
import { User, LogOut, QrCode, ArrowRight, UserPlus } from 'lucide-react';

interface Student {
  folio: string;
  name: string;
  group_name: string;
}

interface StudentPortalProps {
  onLogout: () => void;
}

export default function StudentPortal({ onLogout }: StudentPortalProps) {
  const [view, setView] = useState<'login' | 'register' | 'qr'>('login');
  const [student, setStudent] = useState<Student | null>(null);
  
  // Form states
  const [folio, setFolio] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const savedFolio = localStorage.getItem('studentFolio');
    if (savedFolio) {
      handleLogin(savedFolio);
    }
  }, []);

  const handleLogin = async (loginFolio: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/students/${loginFolio}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
        localStorage.setItem('studentFolio', data.folio);
        setView('qr');
      } else {
        if (view === 'login') {
          setError('No se encontró un alumno con ese folio. Verifica o regístrate.');
        } else {
          // If auto-login failed, clear storage
          localStorage.removeItem('studentFolio');
          setView('login');
        }
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (folio.trim()) {
      handleLogin(folio.trim());
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio: folio.trim(), name, group_name: group }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Error al registrarse');
      } else {
        // Automatically log in after successful registration
        handleLogin(folio.trim());
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentFolio');
    onLogout();
  };

  if (view === 'qr' && student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-6 text-center relative">
            <button 
              onClick={handleLogout}
              className="absolute top-4 right-4 text-indigo-200 hover:text-white transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">{student.name}</h2>
            <p className="text-indigo-200 font-medium mt-1">Grupo: {student.group_name}</p>
          </div>
          
          <div className="p-8 flex flex-col items-center">
            <p className="text-sm text-slate-500 text-center mb-6">
              Presenta este código QR en el escáner de la entrada para registrar tu asistencia.
            </p>
            
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
              <QRCode value={student.folio} size={200} level="H" />
            </div>
            
            <p className="mt-6 font-mono text-lg font-bold text-slate-900 tracking-widest">
              {student.folio}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <QrCode className="w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
          Portal del Alumno
        </h2>
        <p className="text-center text-slate-500 mb-8">
          {view === 'login' ? 'Ingresa tu folio para ver tu código QR' : 'Regístrate para obtener tu código QR'}
        </p>

        {view === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Folio / Matrícula</label>
              <input
                type="text"
                required
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-lg"
                placeholder="Ej. 123456"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center disabled:opacity-70"
            >
              {loading ? 'Buscando...' : 'Ver mi Código QR'}
              {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
            </button>

            <div className="pt-4 text-center">
              <p className="text-sm text-slate-600">
                ¿No estás registrado?{' '}
                <button 
                  type="button" 
                  onClick={() => { setView('register'); setError(''); setFolio(''); }}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Folio / Matrícula</label>
              <input
                type="text"
                required
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ej. 123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grupo</label>
              <input
                type="text"
                required
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ej. 3A"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 mt-2"
            >
              {loading ? 'Registrando...' : 'Registrarme'}
              {!loading && <UserPlus className="w-5 h-5 ml-2" />}
            </button>

            <div className="pt-4 text-center">
              <p className="text-sm text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <button 
                  type="button" 
                  onClick={() => { setView('login'); setError(''); }}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button 
            onClick={onLogout}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
