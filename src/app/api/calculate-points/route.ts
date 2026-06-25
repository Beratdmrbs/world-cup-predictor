import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // 1. Durumu "completed" olan tüm maçları çekiyoruz
    const { data: matches, error: matchesErr } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'completed');

    if (matchesErr || !matches || matches.length === 0) {
      return NextResponse.json({ success: true, message: 'Hesaplanacak tamamlanmış maç bulunamadı.', count: 0 });
    }

    let updatedCount = 0;

    for (const match of matches) {
      // Sadece skoru girilmiş olanları işle
      if (match.home_score === null || match.away_score === null) continue;

      // Gerçek sonucu bulalım (MS 1, MS 0, MS 2)
      let actualWinner = 'Draw';
      if (match.home_score > match.away_score) actualWinner = match.home_team;
      else if (match.away_score > match.home_score) actualWinner = match.away_team;

      // Gerçek gol farkını bulalım
      const actualMargin = Math.abs(match.home_score - match.away_score);

      // 2. Bu maça yapılmış tüm tahminleri çekelim
      const { data: predictions } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', match.id);

      if (!predictions) continue;

      // Her tahmin için puan hesapla ve güncelle
      for (const pred of predictions) {
        let earned = 0;

        // Kullanıcı kazananı doğru bildi mi?
        if (pred.predicted_winner === actualWinner) {
          // Doğru bildiği ihtimalin oranını bulalım
          let odds = match.draw_odds;
          if (actualWinner === match.home_team) odds = match.home_odds;
          else if (actualWinner === match.away_team) odds = match.away_odds;

          // Temel puan = Oran
          earned = odds || 0;

          // Fark bonusu kontrolü:
          // Beraberlikte fark 0'dır, eğer doğru bildiyse zaten bonus almalı.
          // Diğerlerinde kullanıcının fark tahminiyle gerçek fark aynıysa bonus almalı.
          if (actualWinner === 'Draw' || pred.predicted_margin === actualMargin) {
            earned += 2; // +2 Puan Fark Bonusu
          }
        }

        // Eğer hesaplanan puan eskisinden farklıysa güncelle (gereksiz veritabanı yazmasını engelle)
        if (pred.points_earned !== earned) {
          await supabase
            .from('predictions')
            .update({ points_earned: earned })
            .eq('id', pred.id);
          updatedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, updated_predictions: updatedCount });

  } catch (err: any) {
    console.error('Points calculation error:', err);
    return NextResponse.json({ error: 'Puanlar hesaplanırken hata oluştu' }, { status: 500 });
  }
}
