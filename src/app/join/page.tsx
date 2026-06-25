'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import styles from '../auth.module.css';

function JoinLeagueForm() {
  const [inviteCode, setInviteCode] = useState('');
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code);
    }
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !username.trim() || !pinCode.trim()) return;

    // Eğer env dosyası henüz yüklenmediyse kullanıcıyı doğrudan UI üzerinde uyaralım
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
      setError('Veritabanı bağlantısı kurulamadı. Lütfen kodları yazdığın siyah ekranda (terminal) Ctrl+C yapıp sunucuyu durdur ve tekrar "npm run dev" yazarak başlat.');
      return;
    }

    setLoading(true);
    setError('');

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single();

    if (leagueError || !league) {
      setError('Geçersiz davet kodu. Lütfen tekrar kontrol et.');
      setLoading(false);
      return;
    }

    const { data: existingUser, error: userError } = await supabase
      .from('league_members')
      .select('id, pin_code')
      .eq('league_id', league.id)
      .eq('username', username.trim())
      .single();

    let finalMemberId = '';

    if (existingUser) {
      if (existingUser.pin_code !== pinCode) {
        setError('Bu kullanıcı adı alınmış veya girdiğin şifre (PIN) yanlış.');
        setLoading(false);
        return;
      }
      finalMemberId = existingUser.id;
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from('league_members')
        .insert([{ 
          league_id: league.id, 
          username: username.trim(), 
          pin_code: pinCode 
        }])
        .select()
        .single();

      if (insertError) {
        setError('Kayıt sırasında bir hata oluştu. Lütfen tekrar dene.');
        setLoading(false);
        return;
      }
      finalMemberId = newUser.id;
    }

    const sessionData = {
      leagueId: league.id,
      leagueName: league.name,
      memberId: finalMemberId,
      username: username.trim(),
    };
    localStorage.setItem('worldCupPredictorSession', JSON.stringify(sessionData));

    router.push('/dashboard');
  };

  return (
    <form className={styles.form}>
      <div className={styles.inputGroup}>
        <label htmlFor="inviteCode" className={styles.label}>Turnuva Davet Kodu</label>
        <input
          id="inviteCode"
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="Örn: X7A9B"
          required
          className={styles.input}
          style={{ textTransform: 'uppercase' }}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="username" className={styles.label}>Kullanıcı Adı</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Kendine bir lakap belirle"
          required
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="pinCode" className={styles.label}>Şifre / PIN</label>
        <input
          id="pinCode"
          type="password"
          value={pinCode}
          onChange={(e) => setPinCode(e.target.value)}
          placeholder="Daha sonra tekrar girmek için belirle"
          required
          className={styles.input}
        />
      </div>

      {error && (
        <div className={styles.error}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <button type="button" onClick={handleJoin} className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
        {loading ? 'Giriş Yapılıyor...' : (
          <>
            <KeyRound size={20} /> Lige Katıl / Giriş Yap
          </>
        )}
      </button>
    </form>
  );
}

export default function JoinLeague() {
  return (
    <div className={styles.wrapper}>
      <Link href="/" className={styles.backLink}>
        <ArrowLeft size={20} /> Ana Sayfaya Dön
      </Link>

      <div className={`glass-panel ${styles.card}`}>
        <h1 className={styles.title}>Turnuvaya Katıl</h1>
        <p className={styles.subtitle}>
          Eğer daha önce katıldıysan aynı kullanıcı adını ve şifreni girerek devam edebilirsin.
        </p>

        <Suspense fallback={<div style={{ textAlign: 'center', color: 'white' }}>Yükleniyor...</div>}>
          <JoinLeagueForm />
        </Suspense>
      </div>
    </div>
  );
}
