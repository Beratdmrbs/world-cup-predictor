-- 1. Ligler (Turnuvalar) Tablosu
create table leagues (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  invite_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Kullanıcılar (Lig Üyeleri) Tablosu
create table league_members (
  id uuid default gen_random_uuid() primary key,
  league_id uuid references leagues(id) on delete cascade not null,
  username text not null,
  pin_code text not null, -- Basit giriş sistemi için (Örn: 1234)
  score integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(league_id, username)
);

-- 3. Maçlar Tablosu
create table matches (
  id integer primary key, -- API-Football'dan gelen orijinal ID
  home_team text not null,
  away_team text not null,
  home_flag text,
  away_flag text,
  match_date timestamp with time zone not null,
  status text not null, -- 'NS' (Oynanmadı), 'LIVE' (Canlı), 'FT' (Bitti)
  home_score integer,
  away_score integer
);

-- 4. Oranlar Tablosu
create table odds (
  match_id integer references matches(id) on delete cascade primary key,
  home_win_odds numeric not null,
  away_win_odds numeric not null,
  draw_odds numeric not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tahminler Tablosu
create table predictions (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references league_members(id) on delete cascade not null,
  match_id integer references matches(id) on delete cascade not null,
  predicted_winner text not null, -- 'HOME', 'AWAY', veya 'DRAW'
  predicted_goal_diff integer default 0, -- Beraberlik için 0, galibiyet için >=1
  points_earned integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(member_id, match_id)
);
