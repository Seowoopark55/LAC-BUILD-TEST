import { getDiscordBotToken } from '../../../server/discordSecurity.js';
import {
  getCompanyDiscordConnection,
  getCompanyMembershipsByDiscordIds,
  insertCompanyMembershipRows,
  requireCompanyAdmin,
  requireUser,
} from '../../../server/supabaseUser.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SNOWFLAKE_RE = /^\d{15,22}$/;
const ALLOWED_ROLES = new Set(['admin','manager','member']);

async function discordJson(path) {
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bot ${getDiscordBotToken()}` },
  });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const error = new Error(data?.message || 'Discord 멤버 정보를 확인하지 못했습니다.');
    error.statusCode = response.status;
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
    const discordUserId = String(req.body?.discord_user_id || '').trim();
    const requestedRole = String(req.body?.target_role || 'member').trim();
    const targetRole = ALLOWED_ROLES.has(requestedRole) ? requestedRole : 'member';

    if (!UUID_RE.test(companyId)) return res.status(400).json({ error: '회사 ID가 올바르지 않습니다.' });
    if (!SNOWFLAKE_RE.test(discordUserId)) return res.status(400).json({ error: 'Discord ID는 15~22자리 숫자로 입력해 주세요.' });

    const { token, user } = await requireUser(req);
    await requireCompanyAdmin(token, user.id, companyId);
    const connection = await getCompanyDiscordConnection(token, companyId);
    const guildId = String(connection?.guild_id || '').trim();
    if (!guildId) {
      return res.status(409).json({ error: '먼저 회사 설정에서 Discord 서버를 연결해 주세요.' });
    }

    const existing = await getCompanyMembershipsByDiscordIds(token, companyId, [discordUserId]);
    if (existing.length) {
      return res.status(200).json({ status: 'existing', membership: existing[0] });
    }

    let member;
    try {
      member = await discordJson(`/guilds/${guildId}/members/${discordUserId}`);
    } catch (error) {
      if (Number(error?.statusCode || 0) === 404) {
        return res.status(404).json({ error: '현재 연결된 Discord 서버에서 해당 사용자를 찾지 못했습니다. Discord ID와 서버 참여 여부를 확인해 주세요.' });
      }
      throw error;
    }

    const discordUser = member?.user || {};
    if (!discordUser?.id || discordUser.bot) {
      return res.status(400).json({ error: '등록할 수 없는 Discord 계정입니다.' });
    }

    const displayName = String(member?.nick || discordUser.global_name || discordUser.username || 'Discord 멤버').trim();
    const rows = await insertCompanyMembershipRows(token, [{
      company_id: companyId,
      role: targetRole,
      status: 'active',
      display_name: displayName,
      discord_user_id: discordUserId,
      discord_display_name: displayName,
    }]);

    return res.status(200).json({ status: 'created', membership: rows[0] || null });
  } catch (error) {
    let status = Number(error?.statusCode || 500);
    let message = error?.message || 'Discord 멤버를 등록하지 못했습니다.';
    if (status === 403) message = '멤버 등록 권한 또는 Discord 멤버 확인 권한이 없습니다. 회사 관리자 권한과 Discord BOT 권한을 확인해 주세요.';
    if (status >= 500) status = 500;
    return res.status(status).json({ error: message });
  }
}
