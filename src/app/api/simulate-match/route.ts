import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'create') {
      // Sadece tek bir dummy maç yarat (Tarihi 27 Haziran yapalım ki grup maçlarında çıksın)
      const { error } = await supabase.from('matches').upsert({
        id: 'TEST-MACI',
        home_team: 'Türkiye',
        away_team: 'Brezilya',
        commence_time: '2026-06-27T20:00:00Z',
        home_odds: 4,
        away_odds: 2,
        draw_odds: 3,
        status: 'upcoming',
        home_score: null,
        away_score: null
      });
      if (error) throw error;

      // Eski tahminleri sıfırla ki sıfırdan test edilebilsin
      await supabase.from('predictions').delete().eq('match_id', 'TEST-MACI');

      return NextResponse.json({ success: true, message: 'TEST-MACI başarıyla oluşturuldu ve eski test tahminleri temizlendi! Dashboardı yenileyin ve tahmin yapın.' });
    } 
    
    if (action === 'finish') {
      // TEST-MACI'nı bitir (Türkiye 3-1 yensin!)
      const { error } = await supabase.from('matches').update({
        status: 'completed',
        home_score: 3,
        away_score: 1
      }).eq('id', 'TEST-MACI');
      
      if (error) throw error;

      // Puanları hesapla
      const host = request.headers.get('host');
      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
      await fetch(`${protocol}://${host}/api/calculate-points`);

      return NextResponse.json({ success: true, message: 'TEST-MACI (Türkiye 3 - 1 Brezilya) olarak tamamlandı ve puanlar hesaplandı! Liderlik tablosunu kontrol et.' });
    }

    if (action === 'delete') {
      await supabase.from('matches').delete().eq('id', 'TEST-MACI');
      return NextResponse.json({ success: true, message: 'TEST-MACI başarıyla silindi.' });
    }

    return NextResponse.json({ error: 'Geçersiz action. Sadece ?action=create, finish veya delete kullanın.' });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
