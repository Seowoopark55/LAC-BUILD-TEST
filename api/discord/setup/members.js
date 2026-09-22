import { getDiscordBotToken } from '../../../server/discordSecurity.js';
import { requireCompanyAdmin, requireUser, getCompanyDiscordConnection } from '../../../server/supabaseUser.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SNOWFLAKE_RE = /^\d{15,22}$/;
const MAX_SCAN = 5000;

async function discordJson(path) {
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bot ${getDiscordBotToken()}` },
  });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const error = new Error(data?.message || 'Discord 멤버 목록을 불러오지 못했습니다.');
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
    const roleId = String(req.body?.role_id || '').trim();
    if (!UUID_RE.test(companyId)) return res.status(400).json({ error: '회사 ID가 올바르지 않습니다.' });
    if (!SNOWFLAKE_RE.test(roleId)) return res.status(400).json({ error: 'Discord 역할 ID가 올바르지 않습니다.' });

    const { token, user } = await requireUser(req);
    await requireCompanyAdmin(token, user.id, companyId);
    const connection = await getCompanyDiscordConnection(token, companyId);
    const guildId = String(connection.guild_id || '');

    const roles = await discordJson(`/guilds/${guildId}/roles`);
    const role = Array.isArray(roles) ? roles.find((item) => String(item?.id) === roleId) : null;
    if (!role || role.managed || roleId === guildId) return res.status(400).json({ error: '필터에 사용할 수 없는 Discord 역할입니다.' });

    const matched = [];
    let after = '0';
    let scanned = 0;
    while (scanned < MAX_SCAN) {
      const rows = await discordJson(`/guilds/${guildId}/members?limit=1000&after=${encodeURIComponent(after)}`);
      if (!Array.isArray(rows) || !rows.length) break;
      scanned += rows.length;
      for (const member of rows) {
        if (member?.user?.bot) continue;
        if (!Array.isArray(member?.roles) || !member.roles.map(String).includes(roleId)) continue;
        const u = member.user || {};
        const display = String(member.nick || u.global_name || u.username || 'Discord 멤버');
        matched.push({
          discord_user_id: String(u.id || ''),
          display_name: display,
          discord_display_name: display,
          username: String(u.username || ''),
          avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : null,
        });
      }
      if (rows.length < 1000) break;
      after = String(rows[rows.length - 1]?.user?.id || '0');
      if (!SNOWFLAKE_RE.test(after)) break;
    }

    return res.status(200).json({ role: { id: roleId, name: String(role.name || '') }, scanned, members: matched });
  } catch (error) {
    let status = Number(error?.statusCode || 500);
    let message = error?.message || 'Discord 멤버 목록을 불러오지 못했습니다.';
    if (status === 403) message = 'Discord 멤버 목록 권한이 없습니다. Developer Portal의 Server Members Intent와 봇 권한을 확인해 주세요.';
    if (status >= 500) status = 500;
    return res.status(status).json({ error: message });
  }
}
