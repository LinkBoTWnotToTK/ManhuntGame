-- Game save data table (public, no auth required for this game)
CREATE TABLE public.game_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  save_code TEXT NOT NULL UNIQUE,
  coins INTEGER NOT NULL DEFAULT 0,
  powerups TEXT[] NOT NULL DEFAULT '{}',
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  prestige INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  equipped_skin TEXT NOT NULL DEFAULT '',
  equipped_trail TEXT NOT NULL DEFAULT '',
  equipped_hat TEXT NOT NULL DEFAULT '',
  campaign_completed TEXT[] NOT NULL DEFAULT '{}',
  campaign_best_times JSONB NOT NULL DEFAULT '{}',
  campaign_stars JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read saves by code" ON public.game_saves FOR SELECT USING (true);
CREATE POLICY "Anyone can insert saves" ON public.game_saves FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update saves" ON public.game_saves FOR UPDATE USING (true);

-- Leaderboard table
CREATE TABLE public.game_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  save_code TEXT,
  player_name TEXT NOT NULL DEFAULT 'Anonymous',
  mode TEXT NOT NULL,
  role TEXT NOT NULL,
  map TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  time_seconds NUMERIC NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'lose')),
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard" ON public.game_leaderboard FOR SELECT USING (true);
CREATE POLICY "Anyone can insert leaderboard" ON public.game_leaderboard FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_game_saves_updated_at
  BEFORE UPDATE ON public.game_saves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();