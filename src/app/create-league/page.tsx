'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { generateInviteCode } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, AlertCircle } from 'lucide-react';
import styles from '../auth.module.css';

export default function CreateLeague() {
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim()) return;

    // Eğer env dosyası henüz yüklenmediyse kullanıcıyı doğrudan UI üzerinde uyaralım
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
      setError('Veritabanı bağlantısı kurulamadı. Lütfen kodları yazdığın siyah ekranda (terminal) Ctrl+C yapıp sunucuyu durdur ve tekrar "npm run dev" yazarak başlat.');
      return;
    }

    setLoading(true);
    setError('');

    const inviteCode = generateInviteCode();

    const { data, error: dbError } = await supabase
      .from('leagues')
      .insert([{ name: leagueName.trim(), invite_code: inviteCode }])
      .select()
      .single();

    if (dbError) {
      console.error(dbError);
      setError('Lig oluşturulurken bir hata oluştu. Lütfen tekrar dene.');
      setLoading(false);
      return;
    }

    router.push(`/join?code=${inviteCode}&new=true`);
  };

  return (
    <div className={styles.wrapper}>
      <Link href="/" className={styles.backLink}>
        <ArrowLeft size={20} /> Ana Sayfaya Dön
      </Link>

      <div className={`glass-panel ${styles.card}`}>
        <h1 className={styles.title}>Yeni Turnuva Kur</h1>
        <p className={styles.subtitle}>
          Arkadaşlarınla yarışmak için kendi fantezi ligini oluştur.
        </p>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="leagueName" className={styles.label}>Turnuva Adı</label>
            <input
              id="leagueName"
              type="text"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              placeholder="Örn: Şirket Ligi, Bizim Ekip"
              required
              className={styles.input}
            />
          </div>

          <button type="button" onClick={handleCreate} className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Oluşturuluyor...' : (
              <>
                <Trophy size={20} /> Ligi Oluştur
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
