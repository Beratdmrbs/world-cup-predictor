import Link from 'next/link';
import styles from './page.module.css';
import { Trophy, Users } from 'lucide-react';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={`container ${styles.hero}`}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>🏆 2026 Dünya Kupası Özel</div>
          <h1 className={styles.title}>
            Tahminlerini Yap, <br />
            <span className="text-gradient">Arkadaşlarını Yen!</span>
          </h1>
          <p className={styles.description}>
            Gerçek canlı oranlarla hesaplanan dinamik puanlama sistemiyle arkadaş grubunun fantezi futbol ligini kur. En iyi tahminleri yapan şampiyon olsun!
          </p>
          
          <div className={styles.actions}>
            <Link href="/create-league" className="btn-primary">
              <Trophy size={20} />
              Yeni Turnuva Kur
            </Link>
            <Link href="/join" className="btn-secondary">
              <Users size={20} />
              Bir Turnuvaya Katıl
            </Link>
          </div>
        </div>

        <div className={`glass-panel ${styles.howToPlay}`}>
          <h2>Nasıl Oynanır?</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepIcon}>1</div>
              <h3>Ligini Kur</h3>
              <p>Turnuvanı oluştur ve davet linkini arkadaşlarına gönder. E-posta veya telefon ile kayıt olmaya hiç gerek yok!</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepIcon}>2</div>
              <h3>Tahmin Yap</h3>
              <p>Dünya kupası maçlarının kazananını ve kaç farklı biteceğini tahmin et. Sadece galibiyet dersen 1 fark sayılır.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepIcon}>3</div>
              <h3>Puanları Topla</h3>
              <p>Gerçek bahis oranları (yuvarlanmış) üzerinden puan kazan. Farkı da doğru bilirsen +1 ekstra puan kap!</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
