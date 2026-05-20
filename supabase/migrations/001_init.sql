-- 用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  member_tier TEXT DEFAULT 'free',
  member_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看公开资料"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "用户可以更新自己的资料"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tool_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, tool_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看自己的收藏"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户添加收藏"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户删除收藏"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- 支付记录表
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'CNY',
  payment_method TEXT,
  order_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看自己的支付"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- 工具提交表
CREATE TABLE IF NOT EXISTS tool_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT,
  description TEXT,
  website_url TEXT,
  category TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tool_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户提交工具"
  ON tool_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户查看自己的提交"
  ON tool_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- 创建新用户时自动创建资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
