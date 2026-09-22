import { getDiscordBotToken, getHubAppUrl } from '../../server/discordSecurity.js';
import { callAxeProductRpc, requirePlatformAdmin, requireUser } from '../../server/supabaseUser.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DISCORD_ID_RE = /^\d{15,22}$/;

async function discordJson(path, init = {}) {
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${getDiscordBotToken()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const error = new Error(data?.message || 'Discord 알림 전송에 실패했습니다.');
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

  let token = '';
  let questionId = '';
  try {
    questionId = String(req.body?.question_id || '').trim();
    if (!UUID_RE.test(questionId)) {
      return res.status(400).json({ error: '질문 ID가 올바르지 않습니다.' });
    }

    const auth = await requireUser(req);
    token = auth.token;
    await requirePlatformAdmin(token);

    const target = await callAxeProductRpc(token, 'platform_support_notification_target', {
      p_question_id: questionId,
    });
    const discordUserId = String(target?.discord_user_id || '').trim();
    if (!DISCORD_ID_RE.test(discordUserId)) {
      await callAxeProductRpc(token, 'platform_support_mark_dm_result', {
        p_question_id: questionId,
        p_sent: false,
        p_error: 'Discord 계정 미연동',
      }).catch(() => {});
      return res.status(200).json({ sent: false, reason: 'unlinked' });
    }

    const dm = await discordJson('/users/@me/channels', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: discordUserId }),
    });
    if (!dm?.id) throw new Error('Discord DM 채널을 열지 못했습니다.');

    const appUrl = getHubAppUrl();
    await discordJson(`/channels/${dm.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: [
          '**LAC HUB 질문에 답변이 등록되었습니다.**',
          `> ${String(target?.title || '질문').slice(0, 160)}`,
          `회사: ${String(target?.company_name || 'LAC HUB')}`,
          `${appUrl}`,
          '사이트 로그인 후 **질문게시판**에서 답변을 확인해 주세요.',
        ].join('\n'),
        allowed_mentions: { parse: [] },
      }),
    });

    await callAxeProductRpc(token, 'platform_support_mark_dm_result', {
      p_question_id: questionId,
      p_sent: true,
      p_error: null,
    }).catch(() => {});

    return res.status(200).json({ sent: true });
  } catch (error) {
    if (token && UUID_RE.test(questionId)) {
      await callAxeProductRpc(token, 'platform_support_mark_dm_result', {
        p_question_id: questionId,
        p_sent: false,
        p_error: String(error?.message || error || 'Discord DM 실패').slice(0, 500),
      }).catch(() => {});
    }
    const status = Number(error?.statusCode || 500);
    if (status >= 500) {
      return res.status(200).json({ sent: false, reason: 'dm_failed' });
    }
    return res.status(status).json({ error: error?.message || '알림 요청을 처리하지 못했습니다.' });
  }
}
