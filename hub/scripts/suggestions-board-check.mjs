import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const files={
  main:read('src/main.js'), render:read('src/ui/render.js'), api:read('src/lib/productApi.js'),
  sql:read('database/migrations/SUPABASE_MIGRATION_3_25_0_PRIVATE_SUGGESTION_BOARD.sql'),
  notify:read('api/suggestions/notify.js'), pages:read('src/styles/pages.css'), management:read('src/styles/management.css')
};
const checks=[];const failures=[];const expect=(label,ok)=>{checks.push([label,!!ok]);if(!ok)failures.push(label);};
expect('suggestions route is valid and shared support tab exists', files.main.includes("'suggestions'") && files.render.includes('supportTabNav(state) + renderSuggestions(state)') && files.render.includes('data-page="suggestions"'));
expect('legacy feedback modal/contact UI removed', !files.render.includes('feedbackModal') && !files.render.includes('회신 Discord') && !files.main.includes("type==='feedback'"));
expect('customer list is author-scoped in SQL', /where s\.company_id = p_company_id[\s\S]{0,180}s\.created_by_user_id = auth\.uid\(\)/.test(files.sql));
expect('detail blocks same-company non-author', files.sql.includes("v_s.created_by_user_id is distinct from auth.uid()") && files.sql.includes('작성자와 AXE PRODUCT 운영자만 볼 수 있습니다.'));
expect('platform global suggestion queue exists', files.api.includes('getPlatformSuggestions') && files.render.includes('renderPlatformSuggestionQueue') && files.sql.includes('platform_suggestion_list'));
expect('platform-only answer/status path exists', files.sql.includes('platform admin required') && files.main.includes("action==='suggestion-status'") && files.render.includes('답변 등록 · 완료 처리'));
expect('author follow-up reopens pending', files.sql.includes("status='pending'") && files.render.includes('추가 메시지 보내기'));
expect('customer unread badge and dashboard notice exist', files.render.includes('Number(state.suggestionBoard?.counts?.unread||0)') && files.render.includes('supportTabNav(state)') && files.render.includes('건의 답변 도착'));
expect('private image bucket and attachment RPCs exist', files.sql.includes('axe-suggestion-attachments') && files.api.includes('uploadSuggestionAttachment') && files.api.includes('attachSuggestionFile'));
expect('upload paste drop inputs wired', files.render.includes('data-suggestion-attachment-input') && files.render.includes('data-suggestion-attachment-drop') && files.main.includes("['suggestion-create','suggestion-thread'].includes(state.modal?.type)"));
expect('shared in-app image lightbox used', files.render.includes('open-support-image') && files.render.includes('supportAttachmentGallery(q.attachments)'));
expect('platform replies upload into suggestion company tenant', files.main.includes("state.modal.suggestion?.company_id") && files.main.includes('uploadSuggestionPendingAttachments(suggestionId,result.message_id,targetCompanyId)'));
expect('author or platform delete path exists', files.sql.includes('web_suggestion_delete') && files.main.includes("action==='delete-suggestion'") && files.render.includes('건의 삭제'));
expect('category and status filters exist', files.render.includes('data-suggestion-category="improvement"') && files.render.includes('data-suggestion-status="checking"'));
expect('board is bounded to five rows per page', files.render.includes('suggestions:5') && files.render.includes("renderDataPager('suggestions'"));
expect('Discord is notification-only and linked id is automatic', files.notify.includes('LAC HUB 건의에 답변이 등록되었습니다.') && files.sql.includes('discord_user_id') && !files.render.includes('name="contact"'));
expect('creation closes and does not auto-open thread', files.main.includes("state.modal=null; state.suggestionStatus='all'; state.suggestionCategory='all'; state.suggestionPage=1;") && !/type==='suggestion-create'[\s\S]{0,900}openSuggestion\(/.test(files.main));
expect('suggestions remain accessible before subscription lock', files.render.indexOf("state.page === 'suggestions'") < files.render.indexOf('subscriptionState'));
expect('platform dashboard counts private suggestions', files.render.includes('platformSuggestionCount') && files.render.includes('건의 · 제보'));
expect('private board copy is explicit', files.render.includes('같은 회사의 대표·관리자·멤버도 다른 사람이 작성한 건의를 볼 수 없습니다.'));
expect('DB creation has duplicate and spam guards', files.sql.includes("interval '15 seconds'") && files.sql.includes('v_open_count') && files.sql.includes('v_daily_count'));
expect('direct authenticated table access is revoked', files.sql.includes('revoke all on table axe_product.suggestions from anon, authenticated') && files.sql.includes('enable row level security'));
expect('suggestion queue styles are restrained/reused', files.pages.includes('.suggestion-private-banner') && files.management.includes('.platform-suggestion-board'));
if(failures.length){console.error('PRIVATE SUGGESTION BOARD: FAIL');for(const [l,o] of checks)console.error(`${o?' PASS':' FAIL'} ${l}`);process.exit(1);}console.log(`PRIVATE SUGGESTION BOARD: ${checks.length}/${checks.length} PASS`);for(const [l] of checks)console.log(` - ${l}: PASS`);
