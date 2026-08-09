import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Result, Spin, message } from 'antd';
import { googleLogin } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // Prevent strict mode double-firing which might cause duplicate token exchange
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const code = searchParams.get('code');
    const authError = searchParams.get('error');

    if (authError) {
      setError(`Otorisasi ditolak: ${authError}`);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!code) {
      setError('Kode otorisasi tidak ditemukan');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    const processLogin = async () => {
      try {
        const result = await googleLogin(code);
        
        // Persist token
        login(result.token);
        
        message.success('Login dengan Google berhasil!');
        
        // Redirect based on role with a slight delay to ensure state propagates
        setTimeout(() => {
          if (result.roleid === 1) {
            window.location.href = '/admin/dashboard';
          } else {
            window.location.href = '/dashboard';
          }
        }, 800);
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Gagal login menggunakan Google. ' + (err.message || '');
        console.error('OAuth Error:', err);
        setError(msg);
        // We removed the auto-redirect here so you can read the error message
      }
    };

    processLogin();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-low/30">
      {error ? (
        <Result
          status="error"
          title="Login Gagal"
          subTitle={error}
          extra={<span>Mengarahkan kembali ke halaman login...</span>}
        />
      ) : (
        <div className="text-center">
          <Spin size="large" className="mb-4" />
          <h2 className="text-xl font-semibold text-on-surface">Memproses login Google...</h2>
          <p className="text-on-surface/60">Mohon tunggu sebentar, Anda akan segera dialihkan.</p>
        </div>
      )}
    </div>
  );
};

export default OAuthCallback;
