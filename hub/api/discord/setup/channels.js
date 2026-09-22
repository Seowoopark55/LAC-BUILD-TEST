import { getDiscordBotToken } from '../../../server/discordSecurity.js';
import { requireCompanyAdmin, requireUser, getCompanyDiscordConnection } from '../../../server/supabaseUser.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CHANNELS = 8;

function cleanName(value, fallback = '') {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  return (name || fallback).slice(0, 90);
}

async function discordJson(path, init = {}) {
  const token = getDiscordBotToken();
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const error = new Error(data?.message || 'Discord 채널 작업에 실패했습니다.');
    error.statusCode = response.status;
    error.discordCode = data?.code;
    throw error;
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const companyId = String(req.body?.company_id || '').trim();
    if (!UUID_RE.test(companyId)) return res.status(400).json({ error: '회사 ID가 올바르지 않습니다.' });

    const { token, user } = await requireUser(req);
    await requireCompanyAdmin(token, user.id, companyId);
    const connection = await getCompanyDiscordConnection(token, companyId);
    const guildId = String(connection.guild_id || '');

    const categoryName = cleanName(req.body?.category_name, 'LAC HUB');
    const requested = Array.isArray(req.body?.channels) ? req.body.channels.slice(0, MAX_CHANNELS) : [];
    const channels = requested
      .map((item) => ({
        key: String(item?.key || '').trim().slice(0, 40),
        name: cleanName(item?.name),
      }))
      .filter((item) => item.key && item.name);

    const normalizedKeys = channels.map((item) => item.key.toLowerCase());
    const normalizedNames = channels.map((item) => item.name.toLocaleLowerCase('ko-KR'));
    if (new Set(normalizedKeys).size !== normalizedKeys.length) {
      return res.status(400).json({ error: '같은 채널 설정 키를 두 번 사용할 수 없습니다.' });
    }
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      return res.status(400).json({ error: '같은 채널명을 두 번 생성할 수 없습니다. 채널명을 다르게 지정해 주세요.' });
    }

    const existing = await discordJson(`/guilds/${guildId}/channels`);
    const existingRows = Array.isArray(existing) ? existing : [];

    let category = existingRows.find((row) => Number(row?.type) === 4 && String(row?.name || '') === categoryName) || null;
    let categoryCreated = false;
    if (!category) {
      category = await discordJson(`/guilds/${guildId}/channels`, {
        method: 'POST',
        headers: { 'X-Audit-Log-Reason': encodeURIComponent('LAC HUB guided setup') },
        body: JSON.stringify({ name: categoryName, type: 4 }),
      });
      categoryCreated = true;
    }

    const results = [];
    for (const item of channels) {
      let row = existingRows.find((entry) => Number(entry?.type) === 0 && String(entry?.parent_id || '') === String(category.id) && String(entry?.name || '') === item.name) || null;
      let created = false;
      if (!row) {
        row = await discordJson(`/guilds/${guildId}/channels`, {
          method: 'POST',
          headers: { 'X-Audit-Log-Reason': encodeURIComponent('LAC HUB guided setup') },
          body: JSON.stringify({
            name: item.name,
            type: 0,
            parent_id: String(category.id),
          }),
        });
        created = true;
      }
      results.push({ key: item.key, id: String(row.id), name: String(row.name || item.name), type: 'text', created });
    }

    return res.status(200).json({
      guild_id: guildId,
      category: { id: String(category.id), name: String(category.name || categoryName), created: categoryCreated },
      channels: results,
    });
  } catch (error) {
    let status = Number(error?.statusCode || 500);
    let message = error?.message || 'Discord 채널을 생성하지 못했습니다.';
    if (status === 403) message = 'Discord 봇에 채널 관리 권한이 필요합니다. 서버 연결을 다시 승인하거나 봇 역할 권한을 확인해 주세요.';
    if (status >= 500) status = 500;
    return res.status(status).json({ error: message });
  }
}
