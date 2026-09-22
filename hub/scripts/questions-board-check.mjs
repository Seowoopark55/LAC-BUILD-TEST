import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const checks=[];
const ok=(name,pass)=>checks.push([name,Boolean(pass)]);

const main=read('src/main.js');
const render=read('src/ui/render.js');
const api=read('src/lib/productApi.js');
const notifyApi=read('api/support/notify.js');
const setupApi=read('api/discord/setup/channels.js');
const migration=read('database/migrations/SUPABASE_MIGRATION_3_23_2_NATIVE_SUPPORT_ATTACHMENTS_DELETE.sql');
const supportMigration=read('database/migrations/SUPABASE_MIGRATION_3_23_6_SUPPORT_MINE_SCOPE.sql');
const security=read('server/discordSecurity.js');
const pages=read('src/styles/pages.css');
const management=read('src/styles/management.css');

ok('questions page is a first-class route', main.includes("'questions'") && render.includes("state.page === 'questions'"));
ok('historic question board stays reachable through HUB archive and separate tab', !render.includes("navItem(state,'questions','문의 · 건의')") && render.includes('supportTabNav(state) + renderQuestions(state)') && read('src/ui/hubBoard.js').includes('data-page="questions"'));
ok('legacy usage guide launcher removed', !main.includes("action==='open-guide'") && !render.includes('사용 가이드') && !render.includes('guideCenterModal'));
ok('question board is available to active members', render.indexOf("state.page === 'questions'") < render.indexOf("if (!canAdmin(state))"));
ok('question board creates questions on site', api.includes('web_support_create_question') && main.includes("type==='support-question-create'"));
ok('question thread supports platform answer and author follow-up', api.includes('web_support_add_message') && render.includes('추가 질문 보내기') && render.includes('답변 등록 · 완료 처리') && migration.includes('추가 질문은 최초 질문 작성자만 등록할 수 있습니다.'));
ok('only platform owner path can answer', supportMigration.includes("'viewer_can_answer', v_platform") && render.includes('답변은 LAC HUB 운영자만 등록할 수 있습니다.'));
ok('my questions scope exists', supportMigration.includes("'mine', count(*) filter") && supportMigration.includes('as is_mine') && render.includes('data-action="question-scope"') && render.includes('내 질문'));
ok('question creation closes without reopening detail', main.includes("state.modal=null; state.questionScope='mine';") && !main.includes('if(questionId) await openSupportQuestion(questionId);'));
ok('question list is bounded and paged', render.includes('questions:5') && render.includes("renderDataPager('questions'"));
ok('other company members get read-only FAQ view', migration.includes("'viewer_can_reply'") && render.includes('다른 멤버가 작성한 질문입니다.'));
ok('support remains available even when subscription is blocked', render.indexOf("state.page === 'questions'") < render.indexOf("['paused','expired']"));
ok('question state is stored in axe_product DB', migration.includes('axe_product.support_questions') && migration.includes('axe_product.support_question_messages'));
ok('platform owner has global support queue', api.includes('platform_support_list_questions') && render.includes('SUPPORT QUEUE'));
ok('platform dashboard surfaces unanswered support', render.includes('고객 질문 ${platformQuestions}건') && render.includes("page:'platform'"));
ok('site unread badge exists', migration.includes('customer_unread') && render.includes('nav-item__badge'));
ok('Discord is notification only', notifyApi.includes('질문에 답변이 등록되었습니다') && !fs.existsSync(path.join(root,'api/discord/questions.js')));
ok('guided setup does not create a question forum', !main.includes('questionForum') && !render.includes('질문게시판 · 포럼'));
ok('guided channel API creates regular text channels only', setupApi.includes("type: 0") && !setupApi.includes('QUESTION_STATUS_TAGS'));
ok('Manage Threads was removed again', security.includes("DISCORD_BOT_BASE_PERMISSIONS = '93200'") && !security.includes('MANAGE_THREADS'));
ok('question board styling exists', pages.includes('.axe-questions') && pages.includes('.support-thread-message'));
ok('platform support styling exists', management.includes('.platform-support-board') && management.includes('.platform-support-row'));

ok('question delete is author/platform controlled', api.includes('web_support_delete_question') && main.includes("action==='delete-question'") && migration.includes("create or replace function axe_product.web_support_delete_question") && migration.includes("'viewer_can_delete'"));
ok('question image upload exists', api.includes("axe-support-attachments") && api.includes('web_support_attach_file') && render.includes('data-support-attachment-input') && migration.includes('support_question_attachments'));
ok('question clipboard paste exists', main.includes("['support-question-create','support-question'].includes(state.modal?.type)") && render.includes('Ctrl+V로 바로 붙여넣을 수 있습니다.'));
ok('question drag and drop exists', main.includes("data-support-attachment-drop") && render.includes('끌어놓아도 됩니다.'));
ok('support attachment bucket is private and restricted', migration.includes("'axe-support-attachments'") && migration.includes('support_storage_can_read') && migration.includes('support_storage_can_write') && migration.includes('support_storage_can_delete'));
ok('question attachment opens inside app lightbox', render.includes('data-action=\"open-support-image\"') && render.includes('support-image-lightbox') && main.includes("action==='open-support-image'"));
ok('question lightbox has explicit close affordances', render.includes('data-action=\"close-support-image\"') && main.includes("action==='close-support-image'") && main.includes("event.key==='Escape'"));
ok('question lightbox renders above runtime modal', pages.includes('.support-image-lightbox{position:fixed;inset:0;z-index:8000') && read('src/styles.css').includes('.runtime-modal-backdrop{position:fixed;z-index:5000'));
ok('question attachments no longer force a new tab', !render.includes('target=\"_blank\" rel=\"noopener noreferrer\"><img src=\"${esc(item.signed_url)}'));

const failed=checks.filter(([,pass])=>!pass);
for(const [name,pass] of checks) console.log(`${pass?'PASS':'FAIL'} · ${name}`);
if(failed.length) process.exit(1);
console.log(`Native Question Board: ${checks.length}/${checks.length} PASS`);
