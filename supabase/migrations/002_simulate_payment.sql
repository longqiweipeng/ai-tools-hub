-- 模拟支付：升级会员
-- 调用方式: select upgrade_membership('silver', 1)  -- 白银 1 个月
-- 返回: json { success: true, tier: 'silver', expires_at: '...' }

CREATE OR REPLACE FUNCTION upgrade_membership(
  p_tier TEXT,
  p_months INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_expires TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- 获取当前用户
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '未登录');
  END IF;

  -- 计算过期时间（在现有过期时间上叠加）
  SELECT COALESCE(member_expires_at, v_now) INTO v_expires
  FROM profiles WHERE id = v_user_id;

  IF v_expires < v_now THEN
    v_expires := v_now;
  END IF;

  v_expires := v_expires + (p_months || ' months')::INTERVAL;

  -- 更新会员信息
  UPDATE profiles
  SET
    member_tier = p_tier,
    member_expires_at = v_expires,
    updated_at = v_now
  WHERE id = v_user_id;

  -- 记录支付
  INSERT INTO payments (user_id, amount, currency, payment_method, order_id, status)
  VALUES (
    v_user_id,
    CASE
      WHEN p_tier = 'silver' AND p_months = 1 THEN 19.90
      WHEN p_tier = 'silver' AND p_months = 12 THEN 199.00
      WHEN p_tier = 'gold' AND p_months = 1 THEN 49.90
      WHEN p_tier = 'gold' AND p_months = 12 THEN 499.00
      ELSE 0
    END,
    'CNY',
    'simulate',
    'SIM-' || v_user_id || '-' || EXTRACT(EPOCH FROM v_now)::TEXT,
    'success'
  );

  RETURN json_build_object(
    'success', true,
    'tier', p_tier,
    'expires_at', v_expires
  );
END;
$$;

-- 给 profiles 表加 updated_at 字段（如果没有的话）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
