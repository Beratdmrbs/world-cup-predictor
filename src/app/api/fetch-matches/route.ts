import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key eksik. Lütfen .env.local dosyasına ODDS_API_KEY ekleyin.' }, { status: 500 });
    }

    // Dünya Kupası şu an aktif olduğu için doğrudan kendi lig key'ini kullanıyoruz!
    const sportKey = 'soccer_fifa_world_cup'; 
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h`;

    const res = await fetch(url, { next: { revalidate: 3600 } }); // 1 saatte bir cache yenile
    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ error: 'The Odds API verisi çekilemedi', details: errorData }, { status: res.status });
    }

    const data = await res.json();
    
    // API'den gelen veriyi bizim veritabanı tablomuza (matches) uygun hale getiriyoruz
    const matchesToInsert = data.map((match: any) => {
      // İlk sıradaki bahis şirketinin (bookmaker) oranlarını alalım
      const h2hMarket = match.bookmakers[0]?.markets.find((m: any) => m.key === 'h2h');
      
      let homeOdds = 0;
      let awayOdds = 0;
      let drawOdds = 0;

      if (h2hMarket && h2hMarket.outcomes) {
        h2hMarket.outcomes.forEach((outcome: any) => {
          // Puanlama sistemimiz gereği oranları en yakın tam sayıya yuvarlıyoruz (Örn: 2.80 -> 3)
          if (outcome.name === match.home_team) homeOdds = Math.round(outcome.price);
          else if (outcome.name === match.away_team) awayOdds = Math.round(outcome.price);
          else if (outcome.name === 'Draw') drawOdds = Math.round(outcome.price);
        });
      }

      return {
        id: match.id,
        home_team: match.home_team,
        away_team: match.away_team,
        commence_time: match.commence_time,
        home_odds: homeOdds || 1, // Eğer oran çekilemezse varsayılan 1 puan
        away_odds: awayOdds || 1,
        draw_odds: drawOdds || 1,
        status: 'upcoming'
      };
    });

    if (matchesToInsert.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'Aktif maç bulunamadı.' });
    }

    // Veritabanına kaydet (Eğer maç zaten varsa günceller - upsert)
    const { error } = await supabase
      .from('matches')
      .upsert(matchesToInsert, { onConflict: 'id' });

    if (error) {
      return NextResponse.json({ error: 'Veritabanına kaydedilirken hata oluştu', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: matchesToInsert.length });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
