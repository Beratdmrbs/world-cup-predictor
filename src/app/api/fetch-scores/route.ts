import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key eksik' }, { status: 500 });
    }

    // Dünya Kupası veya aktif ligi seç
    const sportKey = 'soccer_fifa_world_cup'; 
    // Not: The Odds API daysFrom parametresi ile son 1-3 gün içindeki maçların skorlarını getirir
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=3`;

    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`The Odds API Error: ${errorData.message || res.statusText}`);
    }

    const data = await res.json();
    
    // Veritabanımızdaki 'upcoming' durumundaki maçları çekelim (Hala oynanmadı sandığımız maçlar)
    const { data: dbMatches, error: dbError } = await supabase
      .from('matches')
      .select('id, home_team, away_team')
      .eq('status', 'upcoming');

    if (dbError) throw dbError;
    if (!dbMatches || dbMatches.length === 0) {
      return NextResponse.json({ success: true, message: 'Veritabanında sonucu beklenecek aktif maç yok.', updated: 0 });
    }

    let updatedCount = 0;

    for (const dbMatch of dbMatches) {
      // API'den gelen veriler arasında bu maçı bul
      const apiMatch = data.find((m: any) => m.id === dbMatch.id);
      
      // Eğer maç varsa, "completed" (tamamlandı) statüsündeyse ve skorları girilmişse
      if (apiMatch && apiMatch.completed === true && apiMatch.scores) {
        
        const homeScoreObj = apiMatch.scores.find((s: any) => s.name === dbMatch.home_team);
        const awayScoreObj = apiMatch.scores.find((s: any) => s.name === dbMatch.away_team);

        if (homeScoreObj && awayScoreObj) {
          const homeScore = parseInt(homeScoreObj.score);
          const awayScore = parseInt(awayScoreObj.score);

          // Veritabanında maçı güncelle
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              status: 'completed',
              home_score: homeScore,
              away_score: awayScore
            })
            .eq('id', dbMatch.id);

          if (!updateError) {
            updatedCount++;
          }
        }
      }
    }

    // Eğer yeni biten maçlar varsa, liderlik tablosu puanlarını hesapla
    if (updatedCount > 0) {
      const host = request.headers.get('host');
      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
      
      try {
        await fetch(`${protocol}://${host}/api/calculate-points`, { method: 'GET' });
      } catch (err) {
        console.error('Puan hesaplama tetiklenirken hata oluştu:', err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${updatedCount} maçın skoru güncellendi ve puanlar hesaplandı.`,
      updated: updatedCount
    });

  } catch (err: any) {
    console.error('Fetch scores error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
