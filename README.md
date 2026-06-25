# 🏆 Dünya Kupası Tahmin Ligi (World Cup Predictor)

Dünya Kupası Tahmin Ligi, arkadaşlarınızla kendi aranızda kapalı ligler oluşturup maç sonuçlarını ve gol farklarını tahmin ederek yarışabileceğiniz, modern web teknolojileri ile geliştirilmiş bir skor tahmin oyunudur.

## 🌟 Özellikler

- **🔒 Kapalı Lig Sistemi:** Sadece sizin belirlediğiniz şifreli kodla girilebilen özel ligler oluşturabilirsiniz.
- **⚡ Canlı Veri Akışı:** Maç fikstürü ve güncel oranlar The Odds API üzerinden otomatik olarak çekilir.
- **🎯 Skor Farkı Tahmini:** Sadece kazananı bilmek yetmez; maçı kaç farkla kazanacağını da tahmin ederek ekstra rekabet yaratabilirsiniz.
- **🕵️ Kopya Koruması (Anti-Cheat):** Maçlar oynanmadan ve herkes kendi tahminini kilitlemeden önce, diğer oyuncuların ne tahmin yaptığı gizli kalır. Maçlar kilitlendiği an şeffaf bir şekilde herkesin tahmini ekrana düşer.
- **🥇 Dinamik Liderlik Tablosu:** Her güncellenen maç sonucuyla beraber liderlik tablosu puanlara göre otomatik olarak değişir. Lidere özel altın taç ve parlama efektleri bulunur.
- **📱 Responsive Tasarım:** Hem bilgisayardan hem de telefondan pürüzsüz çalışan karanlık tema (Dark Mode) ve Glassmorphism tasarımı.

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** Next.js (App Router), React, Vanilla CSS (CSS Modules)
- **Backend & Database:** Supabase (PostgreSQL), Next.js API Routes
- **Veri Sağlayıcı:** The Odds API
- **Tasarım Dili:** Glassmorphism, Dark Mode, Lucide Icons

## 🚀 Kurulum ve Çalıştırma

Kendi bilgisayarınızda projeyi ayağa kaldırmak için aşağıdaki adımları izleyin:

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/KULLANICI_ADINIZ/world-cup-predictor.git
cd world-cup-predictor
```

### 2. Gerekli Paketleri Yükleyin
```bash
npm install
```

### 3. Çevre Değişkenlerini Ayarlayın
Proje ana dizininde `.env.local` adında bir dosya oluşturun ve Supabase ile The Odds API bilgilerinizi girin:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ODDS_API_KEY=your_odds_api_key
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda `http://localhost:3000` adresine giderek projeyi görüntüleyebilirsiniz.

## 🏆 Puanlama Sistemi
- **Doğru Sonuç:** O maçın sahip olduğu iddaa oranı kadar puan kazanırsınız. Oranlar otomatik yuvarlanır.

## 🤝 Katkıda Bulunma
Bu proje geliştirilmeye açıktır. Herhangi bir hata bulursanız veya özellik eklemek isterseniz, lütfen bir "Issue" açın veya "Pull Request" gönderin.

---

<div align="center">
  <b>Geliştirici:</b> Berat Demirbaş<br><br>
  <a href="https://www.linkedin.com/in/berat-demirbas/">
    <img src="https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Badge"/>
  </a>
  <a href="https://github.com/Beratdmrbs">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Badge"/>
  </a>
</div>
