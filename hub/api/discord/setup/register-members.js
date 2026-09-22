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
const MAX_SCAN = 5000;
const MAX_IMPORT = 500;

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

async function findSelectedRoleMembers(guildId, roleId, selectedIds) {
  const wanted = new Set(selectedIds);
  const found = new Map();
  let after = '0';
  let scanned = 0;
  while (scanned < MAX_SCAN && found.size < wanted.size) {
    const rows = await discordJson(`/guilds/${guildId}/members?limit=1000&after=${encodeURIComponent(after)}`);
    if (!Array.isArray(rows) || !rows.length) break;
    scanned += rows.length;
    for (const member of rows) {
      const u = member?.user || {};
      const id = String(u.id || '');
      if (!wanted.has(id) || u.bot) continue;
      if (!Array.isArray(member?.roles) || !member.roles.map(String).includes(roleId)) continue;
      const display = String(member.nick || u.global_name || u.username || 'Discord 멤버');
      found.set(id, {
        discord_user_id: id,
        display_name: display,
        discord_display_name: display,
      });
    }
    if (rows.length < 1000) break;
    after = String(rows[rows.length - 1]?.user?.id || '0');
    if (!SNOWFLAKE_RE.test(after)) break;
  }
  return { scanned, members: [...found.values()] };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const companyId = String(req.body?.company_id || '').trim();
    const roleId = String(req.body?.role_id || '').trim();
    const targetRole = String(req.body?.target_role || '') === 'admin' ? 'admin' : 'member';
    const selectedIds = [...new Set((Array.isArray(req.body?.discord_user_ids) ? req.body.discord_user_ids : [])
      .map((value) => String(value || '').trim())
      .filter((value) => SNOWFLAKE_RE.test(value)))]
      .slice(0, MAX_IMPORT);

    if (!UUID_RE.test(companyId)) return res.status(400).json({ error: '회사 ID가 올바르지 않습니다.' });
    if (!SNOWFLAKE_RE.test(roleId)) return res.status(400).json({ error: 'Discord 역할 ID가 올바르지 않습니다.' });
    if (!selectedIds.length) return res.status(400).json({ error: '등록할 멤버를 한 명 이상 선택해 주세요.' });

    const { token, user } = await requireUser(req);
    await requireCompanyAdmin(token, user.id, companyId);
    const connection = await getCompanyDiscordConnection(token, companyId);
    const guildId = String(connection.guild_id || '');

    const roles = await discordJson(`/guilds/${guildId}/roles`);
    const sourceRole = Array.isArray(roles) ? roles.find((item) => String(item?.id) === roleId) : null;
    if (!sourceRole || sourceRole.managed || roleId === guildId) {
      return res.status(400).json({ error: '멤버 필터에 사용할 수 없는 Discord 역할입니다.' });
    }

    // Re-scan on the server so the browser cannot submit arbitrary Discord IDs.
    const verified = await findSelectedRoleMembers(guildId, roleId, selectedIds);
    const verifiedIds = verified.members.map((member) => member.discord_user_id);
    const existing = await getCompanyMembershipsByDiscordIds(token, companyId, verifiedIds);
    const existingIds = new Set(existing.map((row) => String(row.discord_user_id || '')));
    const existingActive = existing.filter((row) => String(row.status || '') === 'active');
    const requiresManualReactivation = existing.filter((row) => String(row.status || '') !== 'active');
    const rows = verified.members
      .filter((member) => !existingIds.has(member.discord_user_id))
      .map((member) => ({
        company_id: companyId,
        role: targetRole,
        status: 'active',
        display_name: member.display_name,
        discord_user_id: member.discord_user_id,
        discord_display_name: member.discord_display_name,
      }));

    const inserted = await insertCompanyMembershipRows(token, rows);
    const rejectedIds = selectedIds.filter((id) => !verifiedIds.includes(id));
    return res.status(200).json({
      inserted,
      skipped: existingActive,
      requires_manual_reactivation: requiresManualReactivation,
      rejected_count: rejectedIds.length,
      scanned: verified.scanned,
      source_role: { id: roleId, name: String(sourceRole.name || '') },
    });
  } catch (error) {
    let status = Number(error?.statusCode || 500);
    let message = error?.message || 'Discord 멤버를 등록하지 못했습니다.';
    if (status === 403) message = 'Discord 멤버 확인 권한이 없습니다. Server Members Intent와 회사 관리자 권한을 확인해 주세요.';
    if (status >= 500) status = 500;
    return res.status(status).json({ error: message });
  }
}
