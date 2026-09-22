function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

function config() {
  return {
    url: requiredEnv('VITE_SUPABASE_URL').replace(/\/+$/, ''),
    key: requiredEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  };
}

function bearerToken(req) {
  const auth = String(req.headers.authorization || '');
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    const error = new Error('로그인이 필요합니다.');
    error.statusCode = 401;
    throw error;
  }
  return match[1].trim();
}

async function readJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function requireUser(req) {
  const token = bearerToken(req);
  const { url, key } = config();

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await readJsonSafe(response);

  if (!response.ok || !data?.id) {
    const error = new Error('로그인 세션을 확인하지 못했습니다.');
    error.statusCode = 401;
    throw error;
  }

  return { token, user: data };
}


export async function requireCompanyMember(token, userId, companyId) {
  const { url, key } = config();
  const params = new URLSearchParams({
    company_id: `eq.${companyId}`,
    user_id: `eq.${userId}`,
    status: 'eq.active',
    select: 'company_id,user_id,role,display_name,discord_user_id',
    limit: '1',
  });

  const response = await fetch(`${url}/rest/v1/company_memberships?${params.toString()}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      'Accept-Profile': 'axe_product',
    },
  });
  const data = await readJsonSafe(response);
  if (!response.ok) {
    const error = new Error('회사 멤버 권한 확인에 실패했습니다.');
    error.statusCode = response.status;
    throw error;
  }
  if (!Array.isArray(data) || !data.length) {
    const error = new Error('현재 회사의 활동 멤버만 질문게시판을 사용할 수 있습니다.');
    error.statusCode = 403;
    throw error;
  }
  return data[0];
}

export async function getCompanySettingsRow(token, companyId) {
  const { url, key } = config();
  const params = new URLSearchParams({
    company_id: `eq.${companyId}`,
    select: 'company_id,settings',
    limit: '1',
  });
  const response = await fetch(`${url}/rest/v1/company_settings?${params.toString()}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      'Accept-Profile': 'axe_product',
    },
  });
  const data = await readJsonSafe(response);
  if (!response.ok) {
    const error = new Error('회사 지원 설정을 확인하지 못했습니다.');
    error.statusCode = response.status;
    throw error;
  }
  return Array.isArray(data) ? (data[0] || null) : null;
}
export async function requireCompanyAdmin(token, userId, companyId) {
  const { url, key } = config();
  const params = new URLSearchParams({
    company_id: `eq.${companyId}`,
    user_id: `eq.${userId}`,
    status: 'eq.active',
    role: 'in.(owner,admin)',
    select: 'company_id,user_id,role',
    limit: '1',
  });

  const response = await fetch(
    `${url}/rest/v1/company_memberships?${params.toString()}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        'Accept-Profile': 'axe_product',
      },
    }
  );

  const data = await readJsonSafe(response);

  if (!response.ok) {
    const error = new Error('회사 권한 확인에 실패했습니다.');
    error.statusCode = response.status;
    throw error;
  }

  if (!Array.isArray(data) || !data.length) {
    const error = new Error('OWNER / ADMIN만 Discord 서버를 연결할 수 있습니다.');
    error.statusCode = 403;
    throw error;
  }

  return data[0];
}


export async function getCompanyDiscordConnection(token, companyId) {
  const { url, key } = config();
  const params = new URLSearchParams({
    company_id: `eq.${companyId}`,
    status: 'eq.connected',
    select: 'company_id,guild_id,guild_name,status',
    limit: '1',
  });

  const response = await fetch(
    `${url}/rest/v1/discord_connections?${params.toString()}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        'Accept-Profile': 'axe_product',
      },
    }
  );

  const data = await readJsonSafe(response);
  if (!response.ok) {
    const error = new Error('Discord 연결 정보를 확인하지 못했습니다.');
    error.statusCode = response.status;
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.guild_id) {
    const error = new Error('연결된 Discord 서버가 없습니다.');
    error.statusCode = 409;
    throw error;
  }
  return row;
}


export async function getCompanyMembershipsByDiscordIds(token, companyId, discordIds = []) {
  const { url, key } = config();
  const ids = [...new Set((Array.isArray(discordIds) ? discordIds : []).map((value) => String(value || '').trim()).filter(Boolean))];
  if (!ids.length) return [];

  const rows = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const chunk = ids.slice(offset, offset + 100);
    const params = new URLSearchParams({
      company_id: `eq.${companyId}`,
      discord_user_id: `in.(${chunk.join(',')})`,
      select: 'id,company_id,user_id,role,status,display_name,discord_user_id,discord_display_name',
    });
    const response = await fetch(`${url}/rest/v1/company_memberships?${params.toString()}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        'Accept-Profile': 'axe_product',
      },
    });
    const data = await readJsonSafe(response);
    if (!response.ok) {
      const error = new Error(data?.message || '기존 멤버 정보를 확인하지 못했습니다.');
      error.statusCode = response.status;
      throw error;
    }
    if (Array.isArray(data)) rows.push(...data);
  }
  return rows;
}

export async function insertCompanyMembershipRows(token, rows = []) {
  const { url, key } = config();
  const payload = Array.isArray(rows) ? rows : [];
  if (!payload.length) return [];
  const response = await fetch(`${url}/rest/v1/company_memberships?select=id,company_id,user_id,role,status,display_name,discord_user_id,discord_display_name`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Profile': 'axe_product',
      'Accept-Profile': 'axe_product',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  const data = await readJsonSafe(response);
  if (!response.ok) {
    const error = new Error(data?.message || '선택한 Discord 멤버를 등록하지 못했습니다.');
    error.statusCode = response.status;
    throw error;
  }
  return Array.isArray(data) ? data : [];
}

export async function upsertDiscordConnection({
  token,
  userId,
  companyId,
  guildId,
  guildName,
}) {
  const { url, key } = config();
  const now = new Date().toISOString();

  const response = await fetch(
    `${url}/rest/v1/discord_connections?on_conflict=company_id&select=id,company_id,guild_id,guild_name,status,connected_at,updated_at`,
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'axe_product',
        'Accept-Profile': 'axe_product',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        company_id: companyId,
        guild_id: guildId,
        guild_name: guildName || null,
        status: 'connected',
        linked_by: userId,
        metadata: {
          environment: 'staging',
          source: 'discord_oauth_code_grant',
          oauth_linked_at: now,
        },
        connected_at: now,
        updated_at: now,
      }),
    }
  );

  const data = await readJsonSafe(response);

  if (!response.ok) {
    const detail = `${data?.code || ''} ${data?.message || ''}`.trim();
    const error = new Error(
      detail.includes('discord_connections_guild_id_key') ||
      detail.includes('guild_id')
        ? '이 Discord 서버는 이미 다른 회사에 연결되어 있습니다.'
        : 'Discord 연결 정보를 저장하지 못했습니다.'
    );
    error.statusCode = response.status === 409 ? 409 : 400;
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.company_id) {
    const error = new Error('Discord 연결 저장 결과를 확인하지 못했습니다.');
    error.statusCode = 500;
    throw error;
  }

  return row;
}

export async function callAxeProductRpc(token, functionName, body = {}) {
  const { url, key } = config();
  const safeName = String(functionName || '').trim();
  if (!/^[a-z0-9_]+$/i.test(safeName)) {
    const error = new Error('RPC 이름이 올바르지 않습니다.');
    error.statusCode = 400;
    throw error;
  }
  const response = await fetch(`${url}/rest/v1/rpc/${safeName}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Profile': 'axe_product',
      'Accept-Profile': 'axe_product',
    },
    body: JSON.stringify(body || {}),
  });
  const data = await readJsonSafe(response);
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || 'Supabase RPC 요청에 실패했습니다.');
    error.statusCode = response.status;
    throw error;
  }
  return data;
}

export async function requirePlatformAdmin(token) {
  const allowed = await callAxeProductRpc(token, 'platform_is_admin', {});
  if (allowed !== true) {
    const error = new Error('PLATFORM OWNER 권한이 필요합니다.');
    error.statusCode = 403;
    throw error;
  }
  return true;
}
