'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, Calendar, Trophy, AlertCircle } from 'lucide-react';
import styles from '../dashboard.module.css';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  home_odds: number;
  away_odds: number;
  draw_odds: number;
}

const getRoundName = (dateStr: string) => {
  const time = new Date(dateStr).getTime();
  // 2026 Dünya Kupası takvimine göre tahmini tur sınırları
  if (time < new Date('2026-06-28').getTime()) return 'Grup Maçları';
  if (time < new Date('2026-07-04').getTime()) return 'Son 32 Turu';
  if (time < new Date('2026-07-09').getTime()) return 'Son 16 Turu';
  if (time < new Date('2026-07-14').getTime()) return 'Çeyrek Final';
  if (time < new Date('2026-07-18').getTime()) return 'Yarı Final';
  return 'Final / 3.lük Maçı';
};

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [leagueCode, setLeagueCode] = useState<string>('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, {winner: string, margin: number}>>({});
  const [savedPredictions, setSavedPredictions] = useState<Record<string, {winner: string, margin: number}>>({});
  const [leaguePredictions, setLeaguePredictions] = useState<Record<string, any[]>>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Session kontrolü
    const sessionData = localStorage.getItem('worldCupPredictorSession');
    if (!sessionData) {
      router.push('/join');
      return;
    }
    const parsed = JSON.parse(sessionData);
    setSession(parsed);

    fetchMatches();
    fetchPredictions(parsed.memberId);
    fetchLeaderboard(parsed.leagueId, parsed.memberId);
  }, [router]);

  const fetchPredictions = async (memberId: string) => {
    const { data } = await supabase
      .from('predictions')
      .select('match_id, predicted_winner, predicted_margin')
      .eq('member_id', memberId);
    
    if (data) {
      const predMap: Record<string, {winner: string, margin: number}> = {};
      data.forEach(p => {
        predMap[p.match_id] = {
          winner: p.predicted_winner, 
          margin: p.predicted_winner === 'Draw' ? 0 : (p.predicted_margin || 1)
        };
      });
      setPredictions(predMap);
      setSavedPredictions(predMap);
    }
  };

  const fetchLeaderboard = async (leagueId: string, currentMemberId: string) => {
    // Ligdeki tüm üyeleri çek
    const { data: leagueData } = await supabase
      .from('leagues')
      .select('invite_code')
      .eq('id', leagueId)
      .single();
    
    if (leagueData) {
      setLeagueCode(leagueData.invite_code);
    }

    const { data: members } = await supabase
      .from('league_members')
      .select('id, username')
      .eq('league_id', leagueId);
      
    if (!members) return;

    // Bu üyelerin tüm tahminlerini çek
    const memberIds = members.map(m => m.id);
    const { data: allPredictions } = await supabase
      .from('predictions')
      .select('member_id, match_id, predicted_winner, predicted_margin, points_earned')
      .in('member_id', memberIds);

    // Puanları topla
    const lb = members.map(m => {
      const memberPreds = (allPredictions || []).filter(p => p.member_id === m.id);
      const totalPoints = memberPreds.reduce((sum, p) => sum + (p.points_earned || 0), 0);
      return { ...m, totalPoints };
    });

    // Sırala
    lb.sort((a, b) => b.totalPoints - a.totalPoints);
    setLeaderboard(lb);

    // Diğer tahminleri state'e atalım
    if (allPredictions) {
      const lPreds: Record<string, any[]> = {};
      allPredictions.forEach(p => {
         const user = members.find(m => m.id === p.member_id);
         if (!user) return;
         if (!lPreds[p.match_id]) lPreds[p.match_id] = [];
         lPreds[p.match_id].push({
            username: user.username,
            winner: p.predicted_winner,
            margin: p.predicted_margin,
            isMe: user.id === currentMemberId
         });
      });
      setLeaguePredictions(lPreds);
    }
  };

  const handleSelectWinner = (matchId: string, winner: string) => {
    setPredictions(prev => {
      const existing = prev[matchId];
      return {
        ...prev,
        [matchId]: {
          winner,
          margin: winner === 'Draw' ? 0 : (existing?.margin || 1)
        }
      };
    });
    setSaveSuccess(false);
  };

  const handleSelectMargin = (matchId: string, margin: number) => {
    setPredictions(prev => {
      const existing = prev[matchId];
      if (!existing) return prev;
      return {
        ...prev,
        [matchId]: { ...existing, margin }
      };
    });
    setSaveSuccess(false);
  };

  const handleSavePredictions = async () => {
    setSaving(true);
    setSaveSuccess(false);
    
    const upserts = Object.keys(predictions).filter(matchId => {
      // Sadece saati geçmemiş olan maçları kaydetmeye izin ver
      const match = matches.find(m => m.id === matchId);
      return match && new Date(match.commence_time).getTime() > Date.now();
    }).map(matchId => ({
      member_id: session.memberId,
      match_id: matchId,
      predicted_winner: predictions[matchId].winner,
      predicted_margin: predictions[matchId].margin
    }));

    if (upserts.length === 0) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('predictions')
      .upsert(upserts, { onConflict: 'member_id, match_id' });

    setSaving(false);
    if (error) {
      console.error(error);
      alert('Tahminler kaydedilirken bir hata oluştu!');
    } else {
      setSavedPredictions({...predictions});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'upcoming')
      .order('commence_time', { ascending: true });
    
    if (data) setMatches(data);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('worldCupPredictorSession');
    router.push('/');
  };

  if (!session) return null; // Hydration mismatch önlemek için

  return (
    <div className={styles.dashboardWrapper}>
      <header className={`glass-panel ${styles.header}`}>
        <div>
          <h1 className={styles.title}>{session.leagueName}</h1>
          <p className={styles.subtitle}>Hoş geldin, {session.username}</p>
        </div>
        
        <div className={styles.headerRight}>
          {leagueCode && (
            <div className={styles.codeBox} onClick={() => {
              navigator.clipboard.writeText(leagueCode);
              alert('Lig kodu kopyalandı! Arkadaşlarına gönderebilirsin.');
            }}>
              <span className={styles.codeLabel}>Lig Kodu:</span>
              <span className={styles.codeValue}>{leagueCode}</span>
              <span className={styles.copyHint}>(Tıkla Kopyala)</span>
            </div>
          )}

          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} /> Çıkış Yap
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Sol Taraf: Maçlar ve Tahminler */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Calendar size={20} /> 
            {matches.length > 0 ? getRoundName(matches[0].commence_time) : 'Yaklaşan Maçlar'}
          </h2>
          
          {loading ? (
            <div className={`glass-panel ${styles.emptyState}`}>
              <p>Maçlar yükleniyor...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className={`glass-panel ${styles.emptyState}`}>
              <AlertCircle size={40} style={{ opacity: 0.5, marginBottom: 10 }} />
              <p>Şu an oynanacak güncel maç bulunmuyor.</p>
              <p style={{ fontSize: 13, marginTop: 5 }}>API entegrasyonu tamamlandığında maçlar buraya düşecek.</p>
            </div>
          ) : (
            matches
              .filter(match => getRoundName(match.commence_time) === getRoundName(matches[0].commence_time))
              .map(match => {
                const matchStarted = new Date(match.commence_time).getTime() < Date.now();
                return (
              <div key={match.id} className={`glass-panel ${styles.matchCard}`}>
                <div className={styles.matchHeader}>
                  <span>{getRoundName(match.commence_time)}</span>
                  <span>{new Date(match.commence_time).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className={styles.teams}>
                  <span>{match.home_team}</span>
                  <span className={styles.vs}>v</span>
                  <span>{match.away_team}</span>
                </div>
                
                {savedPredictions[match.id] || matchStarted ? (
                  <div className={styles.lockedPrediction}>
                    <div className={styles.lockedHeader} style={{ color: matchStarted && !savedPredictions[match.id] ? '#ff4444' : '' }}>
                      {matchStarted ? 'MAÇ BAŞLADI - KİLİTLENDİ' : 'TAHMİNİNİZ KAYDEDİLDİ'}
                    </div>
                    <div className={styles.lockedBody}>
                      {savedPredictions[match.id] ? (
                        <>
                          <span className={styles.lockedWinner}>
                            {savedPredictions[match.id].winner === 'Draw' ? 'Beraberlik' : `${savedPredictions[match.id].winner} Kazanır`}
                          </span>
                          {savedPredictions[match.id].winner !== 'Draw' && (
                            <span className={styles.lockedMargin}>{savedPredictions[match.id].margin || 1} Fark</span>
                          )}
                        </>
                      ) : (
                        <span className={styles.lockedWinner} style={{color: '#ff4444'}}>Tahmin Yapmadınız (0 Puan)</span>
                      )}
                    </div>
                    
                    {leaguePredictions[match.id] && leaguePredictions[match.id].filter((p: any) => !p.isMe).length > 0 && (
                      <div className={styles.othersPredictions}>
                        <div className={styles.othersTitle}>Ligdeki Diğer Tahminler</div>
                        {leaguePredictions[match.id].filter((p: any) => !p.isMe).map((p: any, i: number) => (
                          <div key={i} className={styles.otherPredictionItem}>
                            <div className={styles.otherAvatar}>{p.username.charAt(0).toUpperCase()}</div>
                            <span className={styles.otherName}>{p.username}</span>
                            <span className={styles.otherPick}>
                              {p.winner === 'Draw' ? 'Beraberlik' : `${p.winner} (${p.margin || 1} Fark)`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className={styles.oddsRow}>
                      <button 
                        onClick={() => handleSelectWinner(match.id, match.home_team)}
                        className={`${styles.oddBtn} ${predictions[match.id]?.winner === match.home_team ? styles.selected : ''}`}>
                        <span className={styles.oddLabel}>MS 1</span>
                        <span className={styles.oddValue}>{match.home_odds}</span>
                      </button>
                      <button 
                        onClick={() => handleSelectWinner(match.id, 'Draw')}
                        className={`${styles.oddBtn} ${predictions[match.id]?.winner === 'Draw' ? styles.selected : ''}`}>
                        <span className={styles.oddLabel}>MS 0</span>
                        <span className={styles.oddValue}>{match.draw_odds}</span>
                      </button>
                      <button 
                        onClick={() => handleSelectWinner(match.id, match.away_team)}
                        className={`${styles.oddBtn} ${predictions[match.id]?.winner === match.away_team ? styles.selected : ''}`}>
                        <span className={styles.oddLabel}>MS 2</span>
                        <span className={styles.oddValue}>{match.away_odds}</span>
                      </button>
                    </div>

                    {/* Skor / Fark Seçici */}
                    {predictions[match.id] && predictions[match.id].winner !== 'Draw' && (
                      <div className={styles.marginSelector}>
                        <span className={styles.marginLabel}>Kaç Farkla Kazanır?</span>
                        <div className={styles.marginButtons}>
                          {[1, 2, 3, 4, 5].map(num => (
                            <button 
                              key={num}
                              onClick={() => handleSelectMargin(match.id, num)}
                              className={`${styles.marginBtn} ${predictions[match.id].margin === num ? styles.selectedMargin : ''}`}
                            >
                              {num} Fark
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )})
          )}

          {/* Toplu Kaydetme Butonu */}
          {matches.length > 0 && (
            <div className={`glass-panel ${styles.saveAction}`}>
              <button onClick={handleSavePredictions} disabled={saving} className={`btn-primary ${styles.saveBtn}`}>
                {saving ? 'Kaydediliyor...' : 'Tahminlerimi Onayla ve Kaydet'}
              </button>
              {saveSuccess && <span className={styles.successMsg}>✓ Başarıyla kaydedildi!</span>}
            </div>
          )}
        </div>

        {/* Sağ Taraf: Liderlik Tablosu */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}><Trophy size={20} /> Liderlik Tablosu</h2>
          <div className={`glass-panel`} style={{ overflow: 'hidden' }}>
            {leaderboard.length === 0 ? (
              <div className={styles.emptyState} style={{ padding: '30px 20px' }}>
                <p>Sıralama hesaplanıyor...</p>
              </div>
            ) : (
              leaderboard.map((user, index) => (
                <div key={user.id} className={`${styles.leaderboardItem} ${index === 0 ? styles.isRank1 : ''}`}>
                  <div className={styles.rankAndName}>
                    <span className={`${styles.rank} ${styles[`rank${index + 1}`] || ''}`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <div className={styles.avatar}>{user.username.charAt(0).toUpperCase()}</div>
                    <span className={styles.lbUsername}>
                      {user.username} {user.id === session.memberId && '(Sen)'} {index === 0 && '👑'}
                    </span>
                  </div>
                  <span className={styles.lbPoints}>{user.totalPoints} Puan</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
