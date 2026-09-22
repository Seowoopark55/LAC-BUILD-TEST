import './styles.css';
import {loadLayoutStudioProfile, saveLayoutStudioProfile, clearLayoutStudioProfile, applyLayoutStudioProfile, applyLayoutStudioPreset, adjustLayoutStudioValue} from './ui/layoutStudio.js';
import { envReady } from './lib/supabase.js';
import {loadHubBoardList,createHubTicket,loadHubTicket,replyHubTicket,setHubTicketStatus,publishHubNotice,checkHubBoardFiles,uploadHubBoardFiles,hubBoardImageUrl} from './lib/hubBoardApi.js';
import {
  getSession, refreshSession, signInWithDiscord, signOut, onAuthStateChange,
  listCompanies, createCompany, redeemCompanyCreateCode, issueCompanyCreateCode, claimDiscordMemberships, getMemberships, updateMembershipRole, updateMembershipStatus, updateMembershipAlias, updateMembershipEmploymentDate, updateMembershipNote, updateCompanyName,
  getModuleCatalog, getCompanyModules, setCompanyModule, updateCompanyModuleSettings,
  getCookingOrderTypes, saveCookingOrderType, setCookingOrderTypeEnabled, getCookingDiscordConfig, saveCookingDiscordGuide,
  getCompanySettings, updateCompanySettings,
  getDiscordConnection, getDiscordChannels, getDiscordRoles, getDiscordCompanyConfig, saveCompanyAiChannel, saveDiscordCompanyConfig,
  getFundAdminRequests, getFundAdminPeriodStatus, reviewFundRequest, setFundFeeRule, getFundEvidenceSignedUrl, uploadFundEvidence, removeUnclaimedFundEvidence,
  startDiscordConnection, startDiscordPermissionReapproval, completeDiscordConnection, createGuidedSetupChannels, getQuestionBoard, createSupportQuestion, getSupportQuestion, addSupportQuestionMessage, updateQuestionStatus, markSupportQuestionSeen, getPlatformSupportQuestions, notifySupportQuestionAnswer, uploadSupportAttachment, attachSupportQuestionFile, getSupportAttachmentSignedUrl, removeSupportAttachments, deleteSupportQuestion, listGuidedSetupMembers, bulkRegisterDiscordMembers, registerDiscordMember, getCompanyOnboardingStatus, requestCompanyDiscordReconnect,
  getFundTreasurySnapshot, saveFundLedgerEntry, cancelFundLedgerEntry, getFundLedgerAttachments, attachFundLedgerEvidence,
  isPlatformAdmin, canCreateCompany, getPlatformCompanies, getCompanySubscription, updatePlatformSubscription, deletePlatformCompany, listPlatformContentSettings, updatePlatformContentSetting,
  getWebAssetsSnapshot, saveWebAsset, manageWebAsset,
  getWebAccountsSnapshot, submitWebAccountRequest, reviewWebAccountRequest,
  getSuggestionBoard, createSuggestion, getSuggestion, addSuggestionMessage, updateSuggestionStatus, markSuggestionSeen,
  getPlatformSuggestions, notifySuggestionAnswer, uploadSuggestionAttachment, attachSuggestionFile, getSuggestionAttachmentSignedUrl,
  removeSuggestionAttachments, deleteSuggestion, getGameInformation, getCompanyModbooks,
} from './lib/productApi.js';
import { renderShell, canAdmin, currentMembership, moduleEnabled, moduleRow } from './ui/render.js';
import { initializePrimaryScreenHistory, readPrimaryScreen, recordPrimaryScreen } from './platform/screenHistory.js';

const root = document.querySelector('#app');
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
const validPages = ['hub','hub-board','dashboard','fund','members','assets','accounts','questions','suggestions','settings','platform','info','game-info','layout'];

const state = {
  envReady,
  loginCreateCode: sessionStorage.getItem('lac_one_pending_create_code') || '',
  session: null,
  companies: [],
  companyId: localStorage.getItem('axe_product_company_id') || null,
  memberships: [],
  moduleCatalog: [],
  modules: [],
  cookingOrderTypes: [],
  cookingDiscordConfig: null,
  companySettings: null,
  discordConnection: null,
  discordChannels: [],
  discordRoles: [],
  discordCompanyConfig: null,
  onboardingStatus: null,
  page: 'hub',
  fundTab: localStorage.getItem('axe_product_fund_tab') || 'ledger',
  fundMonth: currentMonth,
  fundWeeklyMonth: currentMonth,
  currentMonth,
  fundSnapshot: null,
  fundRequests: [],
  fundMonthlyRows: [],
  fundWeeklyFee: 0,
  fundWeeklyLoading: false,
  fundFilters: { person:'all', type:'all', account:'all' }, fundLedgerPage:1, fundReviewPage:1,
  memberFilter: 'all', memberRole:'', memberQuery:'', memberPage:1,
  assetTab: 'assets', assetQuery:'', assetCategory:'', assetStatus:'', assetPage:1, returnPage:1, assetsSnapshot:null,
  accountQuery:'', accountStatus:'', accountPage:1, accountsSnapshot:null,
  platformAdmin:false, canCreateCompany:false, companyCreatePermissionError:false, platformSnapshot:[], platformSupport:{counts:{pending:0,checking:0,complete:0,unread:0,total:0},items:[],error:''}, platformSuggestions:{counts:{pending:0,checking:0,complete:0,unread:0,total:0},items:[],error:''}, platformQuery:'', platformStatus:'all', platformPage:1, platformView:'companies', platformContentSettings:null, platformContentError:'', currentSubscription:null,
  fundLedgerAttachments:[], ledgerPendingFiles:[],
  settingsTab: localStorage.getItem('axe_product_settings_tab') || 'basic',
  questionBoard: { configured:true, counts:{ pending:0, checking:0, complete:0, unread:0, mine:0, total:0 }, items:[], error:'' }, questionStatus:'all', questionScope:'all', questionPage:1,
  suggestionBoard: { configured:true, private:true, counts:{ pending:0, checking:0, complete:0, unread:0, total:0 }, items:[], error:'' }, suggestionStatus:'all', suggestionCategory:'all', suggestionPage:1,
  hubBoard:{notices:[],tickets:[],ticket:null,files:[],mode:'list',tab:'support',filterContent:'all',filterCategory:'all',noticeId:null,error:'',userId:null},
  info: { table:'info_crafts', craftGroup:'근접무기', modbookCategory:'', query:'', selectedId:'', filterPrimary:'__all__', filterSecondary:'__all__', showInactive:false, loading:false, loaded:false, error:'', modbookError:'', companyId:null, data:{} },
  cookingQuery:'', cookingStatus:'all', cookingPage:1,
  questionPendingFiles: [],
  suggestionPendingFiles: [],
  supportImageViewer: null,
  companyMenuOpen: false,
  accountMenuOpen: false,
  layoutDraft: loadLayoutStudioProfile(), layoutSaved: loadLayoutStudioProfile(), layoutDirty: false, layoutAdvanced: false, issuedCompanyCode: '',
  modal: null,
  setupDemo: null,
  testCenter: null,
  setupGuide: null,
  setupGuideDismissed: false,
  loading: false,
  ready: false,
  error: '',
  notice: '',
};

applyLayoutStudioProfile(state.layoutSaved);

let noticeTimer = null;
let mutationBusy = false;
let reconnectPollTimer = null;
let reconnectPollAttempts = 0;
let catalogPollTimer = null;
let catalogPollAttempts = 0;
let sessionRecoveryBusy = false;
let lastSessionRecoveryAt = 0;
let manualSignOutUntil = 0;
let sessionHealthTimer = null;
let infoLoadSequence = 0;

function resetScopedGameInfo(){
  ++infoLoadSequence;
  state.info.loaded=false;
  state.info.loading=false;
  state.info.error='';
  state.info.modbookError='';
  state.info.companyId=null;
  state.info.selectedId='';
  state.info.query='';
  state.info.data={};
}

function subscriptionEffectiveStatus(row){
  if(!row) return 'active';
  return String(row.effective_status||row.status||'active');
}
function subscriptionAllowsUse(row){
  return !['paused','expired'].includes(subscriptionEffectiveStatus(row));
}
function applyPlatformCompanyVisibility(){
  if(!state.platformAdmin || !(state.platformSnapshot||[]).length) return false;
  const blocked=new Set((state.platformSnapshot||[])
    .filter(row=>['paused','expired'].includes(String(row.effective_status||row.subscription_status||'')))
    .map(row=>String(row.company_id||'')));
  const previous=state.companyId;
  state.companies=(state.companies||[]).filter(company=>!blocked.has(String(company.id)));
  if(!state.companies.length){
    state.companyId=null;
    localStorage.removeItem('axe_product_company_id');
    clearCompanyData();
    return previous!==null;
  }
  if(!state.companies.some(company=>company.id===state.companyId)){
    state.companyId=state.companies[0].id;
    localStorage.setItem('axe_product_company_id',state.companyId);
    return previous!==state.companyId;
  }
  return false;
}
function clearLedgerPendingFiles(){
  for(const item of state.ledgerPendingFiles||[]){ try{ if(item.previewUrl) URL.revokeObjectURL(item.previewUrl); }catch{} }
  state.ledgerPendingFiles=[];
}
function clearQuestionPendingFiles(){
  for(const item of state.questionPendingFiles||[]){ try{ if(item.previewUrl) URL.revokeObjectURL(item.previewUrl); }catch{} }
  state.questionPendingFiles=[];
}
function questionPendingPreviewHtml(){
  const pending=state.questionPendingFiles||[];
  if(!pending.length) return '<span class="support-attachment-empty">아직 첨부한 사진이 없습니다.</span>';
  return pending.map(item=>`<figure><img src="${item.previewUrl}" alt="질문 첨부 미리보기"><figcaption><span>${String(item.file?.name||'붙여넣은 이미지').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}</span><button type="button" data-action="remove-question-pending" data-pending-id="${item.id}">제거</button></figcaption></figure>`).join('');
}
function refreshQuestionPendingAttachmentUi(){
  const list=root.querySelector('[data-support-pending-list]');
  const count=root.querySelector('[data-support-pending-count]');
  if(list) list.innerHTML=questionPendingPreviewHtml();
  if(count) count.textContent=`${(state.questionPendingFiles||[]).length}/5`;
}
function addQuestionPendingFiles(files){
  const current=state.questionPendingFiles||[];
  const allowed=['image/jpeg','image/png','image/webp'];
  let changed=false;
  for(const file of Array.from(files||[])){
    if(!(file instanceof File) || !allowed.includes(file.type)){ setError('질문 사진은 JPG, PNG, WEBP 이미지만 첨부할 수 있습니다.'); continue; }
    if(file.size>10*1024*1024){ setError('사진 한 장은 10MB 이하만 첨부할 수 있습니다.'); continue; }
    if(current.length>=5){ setError('질문에는 사진을 최대 5장까지 첨부할 수 있습니다.'); break; }
    current.push({id:crypto.randomUUID(),file,previewUrl:URL.createObjectURL(file)});
    changed=true;
  }
  state.questionPendingFiles=current;
  if(changed) refreshQuestionPendingAttachmentUi();
}
async function uploadQuestionPendingAttachments(questionId,messageId=null){
  const pending=[...(state.questionPendingFiles||[])];
  const result={uploaded:0,failed:0,lastError:''};
  if(!questionId || !pending.length) return result;
  for(const item of pending){
    let path='';
    try{
      path=await uploadSupportAttachment(state.companyId,questionId,state.session.user.id,item.file);
      await attachSupportQuestionFile(questionId,messageId,{storagePath:path,fileName:item.file.name||'clipboard-image',mimeType:item.file.type,sizeBytes:item.file.size});
      result.uploaded+=1;
    }catch(error){
      result.failed+=1; result.lastError=String(error?.message||error||'사진 첨부 실패');
      if(path) await removeSupportAttachments([path]).catch(()=>{});
    }
  }
  return result;
}
async function hydrateSupportAttachments(items){
  const rows=Array.isArray(items)?items:[];
  return Promise.all(rows.map(async item=>({
    ...item,
    signed_url: await getSupportAttachmentSignedUrl(item.storage_path).catch(()=>''),
  })));
}
async function hydrateSupportQuestion(question){
  if(!question) return question;
  const rootAttachments=await hydrateSupportAttachments(question.attachments);
  const messages=await Promise.all((Array.isArray(question.messages)?question.messages:[]).map(async message=>({
    ...message,
    attachments: await hydrateSupportAttachments(message.attachments),
  })));
  return {...question,attachments:rootAttachments,messages};
}
function supportQuestionStoragePaths(question){
  const paths=[];
  for(const item of question?.attachments||[]) if(item?.storage_path) paths.push(String(item.storage_path));
  for(const message of question?.messages||[]) for(const item of message?.attachments||[]) if(item?.storage_path) paths.push(String(item.storage_path));
  return [...new Set(paths)];
}

function clearSuggestionPendingFiles(){
  for(const item of state.suggestionPendingFiles||[]){ try{ if(item.previewUrl) URL.revokeObjectURL(item.previewUrl); }catch{} }
  state.suggestionPendingFiles=[];
}
function suggestionPendingPreviewHtml(){
  const pending=state.suggestionPendingFiles||[];
  if(!pending.length) return '<span class="support-attachment-empty">아직 첨부한 사진이 없습니다.</span>';
  return pending.map(item=>`<figure><img src="${item.previewUrl}" alt="건의 첨부 미리보기"><figcaption><span>${String(item.file?.name||'붙여넣은 이미지').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}</span><button type="button" data-action="remove-suggestion-pending" data-pending-id="${item.id}">제거</button></figcaption></figure>`).join('');
}
function refreshSuggestionPendingAttachmentUi(){
  const list=root.querySelector('[data-suggestion-pending-list]');
  const count=root.querySelector('[data-suggestion-pending-count]');
  if(list) list.innerHTML=suggestionPendingPreviewHtml();
  if(count) count.textContent=`${(state.suggestionPendingFiles||[]).length}/5`;
}
function addSuggestionPendingFiles(files){
  const current=state.suggestionPendingFiles||[];
  const allowed=['image/jpeg','image/png','image/webp'];
  let changed=false;
  for(const file of Array.from(files||[])){
    if(!(file instanceof File) || !allowed.includes(file.type)){ setError('건의 사진은 JPG, PNG, WEBP 이미지만 첨부할 수 있습니다.'); continue; }
    if(file.size>10*1024*1024){ setError('사진 한 장은 10MB 이하만 첨부할 수 있습니다.'); continue; }
    if(current.length>=5){ setError('게시글 또는 답변에는 사진을 최대 5장까지 첨부할 수 있습니다.'); break; }
    current.push({id:crypto.randomUUID(),file,previewUrl:URL.createObjectURL(file)});
    changed=true;
  }
  state.suggestionPendingFiles=current;
  if(changed) refreshSuggestionPendingAttachmentUi();
}
async function uploadSuggestionPendingAttachments(suggestionId,messageId=null,companyId=state.companyId){
  const pending=[...(state.suggestionPendingFiles||[])];
  const result={uploaded:0,failed:0,lastError:''};
  if(!suggestionId || !pending.length) return result;
  for(const item of pending){
    let path='';
    try{
      path=await uploadSuggestionAttachment(companyId,suggestionId,state.session.user.id,item.file);
      await attachSuggestionFile(suggestionId,messageId,{storagePath:path,fileName:item.file.name||'clipboard-image',mimeType:item.file.type,sizeBytes:item.file.size});
      result.uploaded+=1;
    }catch(error){
      result.failed+=1; result.lastError=String(error?.message||error||'사진 첨부 실패');
      if(path) await removeSuggestionAttachments([path]).catch(()=>{});
    }
  }
  return result;
}
async function hydrateSuggestionAttachments(items){
  const rows=Array.isArray(items)?items:[];
  return Promise.all(rows.map(async item=>({
    ...item,
    signed_url: await getSuggestionAttachmentSignedUrl(item.storage_path).catch(()=>''),
  })));
}
async function hydrateSuggestion(suggestion){
  if(!suggestion) return suggestion;
  const rootAttachments=await hydrateSuggestionAttachments(suggestion.attachments);
  const messages=await Promise.all((Array.isArray(suggestion.messages)?suggestion.messages:[]).map(async message=>({
    ...message,
    attachments: await hydrateSuggestionAttachments(message.attachments),
  })));
  return {...suggestion,attachments:rootAttachments,messages};
}
function suggestionStoragePaths(suggestion){
  const paths=[];
  for(const item of suggestion?.attachments||[]) if(item?.storage_path) paths.push(String(item.storage_path));
  for(const message of suggestion?.messages||[]) for(const item of message?.attachments||[]) if(item?.storage_path) paths.push(String(item.storage_path));
  return [...new Set(paths)];
}
function addLedgerPendingFiles(files){
  const current=state.ledgerPendingFiles||[];
  const allowed=['image/jpeg','image/png','image/webp'];
  for(const file of Array.from(files||[])){
    if(!(file instanceof File) || !allowed.includes(file.type)) continue;
    if(file.size>10*1024*1024){ setError('사진 한 장은 10MB 이하만 첨부할 수 있습니다.'); continue; }
    if(current.length>=5){ setError('공금 내역에는 사진을 최대 5장까지 첨부할 수 있습니다.'); break; }
    current.push({id:crypto.randomUUID(),file,previewUrl:URL.createObjectURL(file)});
  }
  state.ledgerPendingFiles=current; render();
}
function ledgerEntryIdFromSave(saved){
  if(!saved) return '';
  if(typeof saved==='string') return saved;
  if(Array.isArray(saved)) return ledgerEntryIdFromSave(saved[0]);
  return String(saved.id||saved.entry_id||saved.ledger_entry_id||saved.data?.id||saved.data?.entry_id||'');
}
async function uploadLedgerPendingEvidence(entryId){
  if(!entryId || !(state.ledgerPendingFiles||[]).length) return;
  for(const item of state.ledgerPendingFiles){
    const path=await uploadFundEvidence(state.companyId,state.session.user.id,item.file);
    try{
      await attachFundLedgerEvidence(state.companyId,entryId,{storagePath:path,fileName:item.file.name||'clipboard-image',mimeType:item.file.type,sizeBytes:item.file.size});
    }catch(error){
      try{await removeUnclaimedFundEvidence(path);}catch{}
      throw error;
    }
  }
}
function createSetupDemoState(){
  const demoModules={fund:true,ammo:true,outlaw:false,modbook:true,pinball:true,cooking:false,assets:true};
  for(const row of state.modules||[]){
    const key=String(row?.module_key||'');
    if(key&&!Object.prototype.hasOwnProperty.call(demoModules,key)) demoModules[key]=Boolean(row.enabled);
  }
  return {
    step:0,
    connected:false,
    adminRole:'대표',
    memberRole:'회사원',
    modules:demoModules,
    channelMode:'quick',
    categoryName:'LAC HUB',
    channelsGenerated:false,
    generatedChannels:{fund:'공금현황판',ammo3:'3시-총알',ammo10:'10시-총알',outlaw:'전적-등록',modbook:'개조서',pinball:'핀볼-모집',cooking:'요리-주문',accountLookup:'계좌조회'},
    channels:{fund:'#공금현황판',ammo3:'#3시-총알',ammo10:'#10시-총알',outlaw:'#전적-등록',modbook:'#개조서',pinball:'#핀볼-모집',cooking:'#요리-주문',accountLookup:'#계좌조회'},
    memberFilter:'member',
    memberTargetRole:'member',
    memberSelected:['m1','m2','m3','m4','m5','m6'],
    memberImportDone:false,
    memberImportSkipped:false
  };
}

function createTestCenterState(){
  return {
    scenario:'first-run',
    screen:'preview',
    memberCheck:'',
    fakeCompanyName:'LAC TEST',
    fakeDiscordName:'테스트 팀원',
    fakeDiscordId:'123456789012345678'
  };
}

function createSetupGuideState(step = 0){
  const moduleMap={};
  for(const row of state.modules||[]) moduleMap[row.module_key]=Boolean(row.enabled);
  const settingsByKey={};
  for(const row of state.modules||[]) settingsByKey[row.module_key]=row.settings||{};
  const cfg=state.discordCompanyConfig||{};
  const roleRows=(state.discordRoles||[]).filter(r=>!r.managed&&r.role_name!=='@everyone');
  const memberFilterRoleId=String(cfg.member_role_id||roleRows[0]?.role_id||'');
  return {
    step:Math.max(0,Math.min(6,Number(step||0))),
    adminRoleId:String(cfg.admin_role_id||''),
    memberRoleId:String(cfg.member_role_id||''),
    modules:moduleMap,
    channelMode:'quick',
    categoryName:'LAC HUB',
    generatedChannels:{fund:'공금현황판',ammo3:'3시-총알',ammo10:'10시-총알',outlaw:'전적-등록',modbook:'개조서',pinball:'핀볼-모집',cooking:'요리-주문',accountLookup:'계좌조회'},
    directChannels:{
      fund:String(settingsByKey.fund?.status_channel_id||''),
      ammo3:String(settingsByKey.ammo?.three_channel_id||''),
      ammo10:String(settingsByKey.ammo?.ten_channel_id||''),
      outlaw:String(settingsByKey.outlaw?.record_channel_id||''),
      modbook:String(settingsByKey.modbook?.channel_id||''),
      pinball:String(settingsByKey.pinball?.channel_id||''),
      cooking:String(settingsByKey.cooking?.order_channel_id||''),
      accountLookup:String(settingsByKey.assets?.account_lookup_channel_id||''),
    },
    createdChannelIds:{},
    memberFilterRoleId,
    memberTargetRole:'member',
    memberCandidates:[],
    memberSelected:[],
    memberScanCount:0,
    memberListLoaded:false,
    memberImportDone:false,
    memberImportSkipped:false,
    permissionIssue:null,
    permissionMessage:'',
  };
}

function savedSetupGuideProgress(){
  const value=state.companySettings?.settings?.guided_setup;
  return value&&typeof value==='object'?value:null;
}

function resolveSetupGuideResumeStep(requestedStep = 0){
  let step=Math.max(0,Math.min(6,Number(requestedStep||0)));
  if(state.discordConnection?.status!=='connected'||state.onboardingStatus?.catalog_ready===false) return 1;
  if(!state.discordCompanyConfig?.admin_role_id||!state.discordCompanyConfig?.member_role_id) return 2;
  if(String(state.onboardingStatus?.status||'')==='onboarding'&&String(state.onboardingStatus?.current_step||'')==='modules') step=Math.max(step,3);
  return step;
}

async function persistSetupGuideProgress(step,{completed=false}={}){
  if(!state.companyId||!state.session?.user?.id)return;
  const settings={...(state.companySettings?.settings||{}),guided_setup:{step:Math.max(0,Math.min(6,Number(step||0))),completed:Boolean(completed),updated_at:new Date().toISOString()}};
  await updateCompanySettings(state.companyId,{locale:state.companySettings?.locale||'ko-KR',timezone:state.companySettings?.timezone||'Asia/Seoul',settings},state.session.user.id);
  state.companySettings={...(state.companySettings||{}),settings};
}

function openSetupGuide(step = 0){
  state.setupGuide=createSetupGuideState(step);
  state.modal={type:'setup-guide'};
  render();
}

function setupGuideChannelPlan(){
  const modules=state.setupGuide?.modules||{};
  const rows=[];
  if(modules.fund)rows.push({key:'fund',moduleKey:'fund',settingKey:'status_channel_id',label:'공금 관리',name:state.setupGuide.generatedChannels?.fund||'공금현황판',type:'text'});
  if(modules.ammo){
    rows.push({key:'ammo3',moduleKey:'ammo',settingKey:'three_channel_id',label:'총알 관리 · 3시',name:state.setupGuide.generatedChannels?.ammo3||'3시-총알'});
    rows.push({key:'ammo10',moduleKey:'ammo',settingKey:'ten_channel_id',label:'총알 관리 · 10시',name:state.setupGuide.generatedChannels?.ammo10||'10시-총알'});
  }
  if(modules.outlaw)rows.push({key:'outlaw',moduleKey:'outlaw',settingKey:'record_channel_id',label:'무법지대 전적',name:state.setupGuide.generatedChannels?.outlaw||'전적-등록'});
  if(modules.modbook)rows.push({key:'modbook',moduleKey:'modbook',settingKey:'channel_id',label:'개조서 조회 · 가격',name:state.setupGuide.generatedChannels?.modbook||'개조서'});
  if(modules.pinball)rows.push({key:'pinball',moduleKey:'pinball',settingKey:'channel_id',label:'핀볼 모집',name:state.setupGuide.generatedChannels?.pinball||'핀볼-모집'});
  if(modules.cooking)rows.push({key:'cooking',moduleKey:'cooking',settingKey:'order_channel_id',label:'요리 주문',name:state.setupGuide.generatedChannels?.cooking||'요리-주문'});
  if(modules.assets)rows.push({key:'accountLookup',moduleKey:'assets',settingKey:'account_lookup_channel_id',label:'계좌 조회',name:state.setupGuide.generatedChannels?.accountLookup||'계좌조회'});
  return rows;
}

async function loadSetupGuideMembers(){
  if(!state.setupGuide || !state.companyId) return;
  const roleId=String(state.setupGuide.memberFilterRoleId||'');
  if(!roleId){state.setupGuide.memberCandidates=[];state.setupGuide.memberSelected=[];state.setupGuide.memberListLoaded=true;render();return;}
  const data=await listGuidedSetupMembers(state.companyId,roleId);
  const rows=Array.isArray(data?.members)?data.members:[];
  state.setupGuide.memberCandidates=rows;
  state.setupGuide.memberSelected=rows.map(row=>String(row.discord_user_id));
  state.setupGuide.memberScanCount=Number(data?.scanned||rows.length);
  state.setupGuide.memberListLoaded=true;
  render();
}

async function saveSetupGuideRoles(){
  if(!state.setupGuide) return;
  const adminRoleId=String(state.setupGuide.adminRoleId||'');
  const memberRoleId=String(state.setupGuide.memberRoleId||'');
  if(!adminRoleId||!memberRoleId) throw new Error('관리자 역할과 일반 멤버 역할을 모두 선택해 주세요.');
  await saveDiscordCompanyConfig(state.companyId,{
    notification_channel_id:state.discordCompanyConfig?.notification_channel_id||null,
    command_channel_id:state.discordCompanyConfig?.command_channel_id||null,
    admin_role_id:adminRoleId,
    member_role_id:memberRoleId,
  },state.session.user.id);
  await loadBaseCompanyData();
  state.setupGuide={...createSetupGuideState(3),modules:{...(state.setupGuide?.modules||{})},adminRoleId,memberRoleId};
}

async function saveSetupGuideModules(){
  if(!state.setupGuide) return;
  for(const row of state.modules||[]){
    if(!Object.prototype.hasOwnProperty.call(state.setupGuide.modules||{},row.module_key)) continue;
    const enabled=Boolean(state.setupGuide.modules[row.module_key]);
    if(Boolean(row.enabled)!==enabled) await setCompanyModule(state.companyId,row.module_key,enabled,state.session.user.id);
  }
  await loadBaseCompanyData();
  const previous=state.setupGuide;
  const next=createSetupGuideState(4);
  next.channelMode=previous.channelMode||'quick';
  next.categoryName=previous.categoryName||'LAC HUB';
  next.generatedChannels={...(previous.generatedChannels||next.generatedChannels)};
  state.setupGuide=next;
}

function setupGuideChannelBinding(key){
  const map={
    fund:['fund','status_channel_id'],
    ammo3:['ammo','three_channel_id'],
    ammo10:['ammo','ten_channel_id'],
    outlaw:['outlaw','record_channel_id'],
    modbook:['modbook','channel_id'],
    pinball:['pinball','channel_id'],
    cooking:['cooking','order_channel_id'],
    accountLookup:['assets','account_lookup_channel_id'],
  };
  return map[key]||null;
}

async function persistSetupGuideChannels(channelMap){
  const grouped=new Map();
  for(const [key,channelId] of Object.entries(channelMap||{})){
    const binding=setupGuideChannelBinding(key); if(!binding||!channelId)continue;
    const [moduleKey,settingKey]=binding;
    if(!grouped.has(moduleKey)) grouped.set(moduleKey,{});
    grouped.get(moduleKey)[settingKey]=String(channelId);
  }
  for(const [moduleKey,patch] of grouped){
    const row=(state.modules||[]).find(m=>m.module_key===moduleKey); if(!row)continue;
    await updateCompanyModuleSettings(state.companyId,moduleKey,{...(row.settings||{}),...patch},state.session.user.id);
  }
  await loadBaseCompanyData();
}

async function cleanupLegacyPwa() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('axe-product-pwa-')).map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn('LAC HUB legacy PWA cleanup failed', error);
  }
}

function suppressBrowserFormHistory() {
  root.querySelectorAll('form').forEach(form => form.setAttribute('autocomplete','off'));
  root.querySelectorAll('input, textarea').forEach(field => {
    if (!field.hasAttribute('autocomplete')) field.setAttribute('autocomplete','off');
    field.setAttribute('autocorrect','off');
    field.setAttribute('autocapitalize','off');
    field.setAttribute('spellcheck','false');
  });
}
function navigatePrimaryScreen(page) {
  recordPrimaryScreen(window.history, page);
  state.page = page;
}

function allowedHistoryPage(target) {
  const companyAvailable = Boolean(state.companyId && state.companies.some(company => company.id === state.companyId));
  if (!state.session?.user) return 'hub';
  if (target === 'hub' || target === 'hub-board') return target;
  if (target === 'company-start') return state.companies.length ? 'hub' : target;
  if (target === 'game-info') return companyAvailable ? target : 'hub';
  if (['platform', 'layout'].includes(target)) return state.platformAdmin ? target : 'hub';
  return companyAvailable ? target : 'hub';
}

function installPrimaryScreenHistory() {
  // Restore the target before the first authenticated render, so a restored
  // company route is never briefly painted and then replaced by HUB (or vice versa).
  const initial = initializePrimaryScreenHistory(window.history);
  state.page = initial;
  window.addEventListener('popstate', event => {
    const target = readPrimaryScreen(event.state);
    if (!target) return; // An unrelated browser entry remains the browser's responsibility.
    state.page = allowedHistoryPage(target);
    state.accountMenuOpen = false;
    state.companyMenuOpen = false;
    state.modal = null;
    if (state.page !== 'hub' && state.page !== 'company-start') {
      localStorage.setItem('axe_product_page', state.page);
    }
    render();
    if (state.page === 'hub-board') void loadHubBoard();
    // Existing page loaders remain scoped to the selected company. Only lazy
    // loading for the restored view is needed; never re-run OAuth on Back/Forward.
    if (['info','game-info'].includes(state.page) && !state.info.loaded && !state.info.loading) {
      void loadGameInfo();
    }
  });
}

function render() { renderShell(root, state); suppressBrowserFormHistory(); }
function setNotice(message) {
  state.notice = String(message || ''); state.error = ''; render();
  if (noticeTimer) clearTimeout(noticeTimer);
  if (state.notice) noticeTimer = setTimeout(() => {
    state.notice = '';
    // Do not re-render the whole app just to hide a notice. A full root.innerHTML
    // replacement closes an open native <select>, which made role/channel
    // dropdowns appear to close by themselves a few seconds after catalog load.
    root.querySelector('.runtime-banner--notice')?.remove();
  }, 3200);
}
function setError(error) { state.error = String(error?.message || error || '오류가 발생했습니다.'); render(); }
function clearCompanyData() {
  resetScopedGameInfo();
  state.memberships=[]; state.moduleCatalog=[]; state.modules=[]; state.cookingOrderTypes=[]; state.cookingDiscordConfig=null; state.companySettings=null;
  state.discordConnection=null; state.discordChannels=[]; state.discordRoles=[]; state.discordCompanyConfig=null; state.onboardingStatus=null;
  state.fundSnapshot=null; state.fundRequests=[]; state.fundMonthlyRows=[]; state.fundLedgerAttachments=[]; state.assetsSnapshot=null; state.accountsSnapshot=null; state.currentSubscription=null;
  state.questionBoard={configured:true,counts:{pending:0,checking:0,complete:0,unread:0,mine:0,total:0},items:[],error:''};
  state.suggestionBoard={configured:true,private:true,counts:{pending:0,checking:0,complete:0,unread:0,total:0},items:[],error:''};
  state.fundLedgerPage=1;state.fundReviewPage=1;state.memberPage=1;state.assetPage=1;state.returnPage=1;state.accountPage=1;state.questionPage=1;state.suggestionPage=1;state.cookingPage=1;state.platformPage=1;
  clearQuestionPendingFiles();
  clearSuggestionPendingFiles();
}

async function loadCompanies() {
  const previousCompanyId=state.companyId;
  state.companies = await listCompanies();
  if (!state.companies.length) { state.companyId=null; localStorage.removeItem('axe_product_company_id'); clearCompanyData(); return; }
  if (!state.companies.some(c=>c.id===state.companyId)) state.companyId=state.companies[0].id;
  if (previousCompanyId!==state.companyId) resetScopedGameInfo();
  localStorage.setItem('axe_product_company_id', state.companyId);
}

async function loadBaseCompanyData() {
  if (!state.companyId) { clearCompanyData(); return; }
  const memberships = await getMemberships(state.companyId);
  state.memberships = memberships || [];
  const [catalog, modules, cookingTypes, cookingConfig, settings, discord, channels, roles, config, onboarding, subscription] = await Promise.all([
    getModuleCatalog(), getCompanyModules(state.companyId), getCookingOrderTypes(state.companyId), getCookingDiscordConfig(state.companyId), getCompanySettings(state.companyId),
    getDiscordConnection(state.companyId), getDiscordChannels(state.companyId), getDiscordRoles(state.companyId), getDiscordCompanyConfig(state.companyId),
    getCompanyOnboardingStatus(state.companyId),
    getCompanySubscription(state.companyId).catch(()=>null),
  ]);
  state.moduleCatalog=catalog||[];
  const moduleRows=new Map((modules||[]).map(row=>[row.module_key,row]));
  state.modules=(catalog||[]).map(item=>moduleRows.get(item.module_key)||{
    company_id:state.companyId,module_key:item.module_key,enabled:false,settings:{},updated_at:null,
  });
  state.cookingOrderTypes=cookingTypes||[]; state.cookingDiscordConfig=cookingConfig||null; state.companySettings=settings||null;
  state.discordConnection=discord||null; state.discordChannels=channels||[]; state.discordRoles=roles||[]; state.discordCompanyConfig=config||null; state.onboardingStatus=onboarding||null; state.currentSubscription=subscription||null;
}

async function loadFundSnapshot() {
  if (!canAdmin(state) || !moduleEnabled(state,'fund')) { state.fundSnapshot=null; state.fundRequests=[]; return; }
  const [y,m] = state.fundMonth.split('-').map(Number);
  const [snapshot, requests, attachments] = await Promise.all([
    getFundTreasurySnapshot(state.companyId,y,m,200),
    getFundAdminRequests(state.companyId,null,100),
    getFundLedgerAttachments(state.companyId,null).catch(()=>[]),
  ]);
  state.fundSnapshot=snapshot||{}; state.fundRequests=requests||[]; state.fundLedgerAttachments=attachments||[];
}

function fundWeekNumbersForMonth(year, month) {
  const safeYear=Number(year);
  const safeMonth=Number(month);
  const lastDay=new Date(Date.UTC(safeYear,safeMonth,0)).getUTCDate();
  const weeks=[];
  for(let day=1;day<=lastDay;day+=1){
    if(new Date(Date.UTC(safeYear,safeMonth-1,day)).getUTCDay()===6) weeks.push(weeks.length+1);
  }
  return weeks;
}

async function loadFundWeeklyMonth(monthValue = state.fundWeeklyMonth) {
  if (!canAdmin(state) || !moduleEnabled(state,'fund')) { state.fundMonthlyRows=[]; return; }
  state.fundWeeklyLoading=true; render();
  const [year,month]=String(monthValue).split('-').map(Number);
  const weekNumbers=fundWeekNumbersForMonth(year,month);
  const results = await Promise.all(weekNumbers.map(async week => {
    try { return await getFundAdminPeriodStatus(state.companyId,year,month,week); } catch { return []; }
  }));
  const map=new Map(); let fee=0;
  results.forEach((weekRows,index)=>{
    for(const row of weekRows||[]){
      const key=row.membership_id || row.display_name;
      if(!map.has(key)) map.set(key,{name:row.display_name||'멤버',role:(row.member_role||'member').toUpperCase(),weeks:['예정','예정','예정','예정','예정']});
      map.get(key).weeks[index]=row.status||'예정';
      if(!fee && Number(row.expected_amount)>0) fee=Number(row.expected_amount);
    }
  });
  state.fundMonthlyRows=[...map.values()]; state.fundWeeklyFee=fee; state.fundWeeklyLoading=false; render();
}

async function loadAssetsAndAccounts() {
  if (!canAdmin(state) || !moduleEnabled(state,'assets')) { state.assetsSnapshot=null; state.accountsSnapshot=null; return; }
  const [assets, accounts] = await Promise.all([getWebAssetsSnapshot(state.companyId), getWebAccountsSnapshot(state.companyId)]);
  state.assetsSnapshot=assets||{}; state.accountsSnapshot=accounts||{};
}

async function loadQuestionBoard() {
  if (!state.companyId) {
    state.questionBoard={configured:true,counts:{pending:0,checking:0,complete:0,unread:0,mine:0,total:0},items:[],error:''};
    return;
  }
  try {
    const board=await getQuestionBoard(state.companyId);
    state.questionBoard={configured:true,counts:{pending:0,checking:0,complete:0,unread:0,mine:0,total:0},items:[],error:'',...(board||{})};
  } catch (error) {
    state.questionBoard={...(state.questionBoard||{}),error:String(error?.message||error||'질문게시판을 불러오지 못했습니다.')};
  }
}

async function loadSuggestionBoard() {
  if (!state.companyId) {
    state.suggestionBoard={configured:true,private:true,counts:{pending:0,checking:0,complete:0,unread:0,total:0},items:[],error:''};
    return;
  }
  try {
    const board=await getSuggestionBoard(state.companyId);
    state.suggestionBoard={configured:true,private:true,counts:{pending:0,checking:0,complete:0,unread:0,total:0},items:[],error:'',...(board||{})};
  } catch (error) {
    state.suggestionBoard={...(state.suggestionBoard||{}),error:String(error?.message||error||'건의게시판을 불러오지 못했습니다.')};
  }
}

async function loadPlatformSuggestions() {
  if (!state.platformAdmin) {
    state.platformSuggestions={counts:{pending:0,checking:0,complete:0,unread:0,total:0},items:[],error:''};
    return;
  }
  try {
    const board=await getPlatformSuggestions(120);
    state.platformSuggestions={counts:{pending:0,checking:0,complete:0,unread:0,total:0},items:[],error:'',...(board||{})};
  } catch (error) {
    state.platformSuggestions={...(state.platformSuggestions||{}),error:String(error?.message||error||'전체 건의 현황을 불러오지 못했습니다.')};
  }
}

async function loadPlatformSupport() {
  if (!state.platformAdmin) {
    state.platformSupport={counts:{pending:0,checking:0,complete:0,unread:0,total:0},items:[],error:''};
    return;
  }
  try {
    const board=await getPlatformSupportQuestions(120);
    state.platformSupport={counts:{pending:0,checking:0,complete:0,unread:0,total:0},items:[],error:'',...(board||{})};
  } catch (error) {
    state.platformSupport={...(state.platformSupport||{}),error:String(error?.message||error||'전체 질문 현황을 불러오지 못했습니다.')};
  }
}

async function openSupportQuestion(questionId) {
  const id=String(questionId||'').trim();
  if(!id) throw new Error('질문을 찾을 수 없습니다.');
  clearQuestionPendingFiles();
  const question=await hydrateSupportQuestion(await getSupportQuestion(id));
  await markSupportQuestionSeen(id).catch(()=>false);
  question.unread=false;
  state.modal={type:'support-question',questionId:id,question};
  if(state.platformAdmin) await loadPlatformSupport();
  if(String(question.company_id||'')===String(state.companyId||'')) await loadQuestionBoard();
}

async function openSuggestion(suggestionId) {
  const id=String(suggestionId||'').trim();
  if(!id) throw new Error('건의를 찾을 수 없습니다.');
  clearSuggestionPendingFiles();
  const suggestion=await hydrateSuggestion(await getSuggestion(id));
  await markSuggestionSeen(id).catch(()=>false);
  suggestion.unread=false;
  state.modal={type:'suggestion-thread',suggestionId:id,suggestion};
  if(state.platformAdmin) await loadPlatformSuggestions();
  if(String(suggestion.company_id||'')===String(state.companyId||'')) await loadSuggestionBoard();
}

// LAC HUB board has no company_id dependency; the DB policies enforce author/admin privacy.
function clearHubBoardFiles(){
  for(const item of state.hubBoard.files){try{URL.revokeObjectURL(item.url);}catch{}}
  state.hubBoard.files=[];
}
function syncHubBoardPreviews(){
  const container=root.querySelector('.hub-board__previews');
  if(!container)return;
  container.replaceChildren();
  for(const item of state.hubBoard.files){
    const frame=document.createElement('div');frame.className='hub-board__preview';
    const img=document.createElement('img');img.src=item.url;img.alt='첨부 예정 사진';
    const button=document.createElement('button');button.type='button';button.dataset.action='hub-board-file-remove';button.dataset.fileId=item.id;button.setAttribute('aria-label','첨부 제거');button.textContent='×';
    frame.append(img,button);container.append(frame);
  }
}
function addHubBoardFiles(files){
  const selected=checkHubBoardFiles([...state.hubBoard.files.map(item=>item.file),...Array.from(files||[])]);
  const previous=state.hubBoard.files.length;
  for(const file of selected.slice(previous))state.hubBoard.files.push({id:crypto.randomUUID(),file,url:URL.createObjectURL(file)});
  syncHubBoardPreviews();
}
async function loadHubBoard(){
  if(!state.session?.user)return;
  const userId=state.session.user.id;
  if(state.hubBoard.userId!==userId){clearHubBoardFiles();state.hubBoard={notices:[],tickets:[],ticket:null,files:[],mode:'list',tab:'support',filterContent:'all',filterCategory:'all',noticeId:null,error:'',userId};}
  try{
    const board=await loadHubBoardList(state.platformAdmin);
    if(state.session?.user?.id!==userId)return;
    state.hubBoard.notices=board.notices;state.hubBoard.tickets=board.tickets;state.hubBoard.error='';
  }catch(error){state.hubBoard.error=String(error?.message||error||'게시판을 불러오지 못했습니다.');}
  if(state.page==='hub'||state.page==='hub-board')render();
}
async function openHubBoardTicket(ticketId){
  const id=String(ticketId||'');
  if(!id)return;
  clearHubBoardFiles();state.hubBoard.mode='detail';state.hubBoard.ticket=null;render();
  const ticket=await loadHubTicket(id);
  if(state.page!=='hub-board'||state.hubBoard.mode!=='detail')return;
  ticket.attachments=await Promise.all(ticket.attachments.map(async item=>({...item,signedUrl:await hubBoardImageUrl(item.storage_path).catch(()=>'')})));
  state.hubBoard.ticket=ticket;render();
}
async function storeHubBoardFiles(ticketId,messageId){
  const files=state.hubBoard.files.map(item=>item.file);
  if(!files.length)return;
  await uploadHubBoardFiles(ticketId,messageId,state.session.user.id,files);
  clearHubBoardFiles();
}
async function loadCompanyData() {
  await loadBaseCompanyData();
  if (!canAdmin(state)) { await Promise.all([loadQuestionBoard(),loadSuggestionBoard()]); return; }
  if (canAdmin(state)) {
    const jobs=[];
    if (moduleEnabled(state,'fund')) jobs.push(loadFundSnapshot());
    if (moduleEnabled(state,'assets')) jobs.push(loadAssetsAndAccounts());
    jobs.push(loadQuestionBoard(),loadSuggestionBoard());
    await Promise.all(jobs);
    if (state.fundTab==='weekly' && moduleEnabled(state,'fund')) await loadFundWeeklyMonth(state.fundWeeklyMonth);
  }
}

async function loadGameInfo(){
  const request=++infoLoadSequence;
  const companyId=String(state.companyId||'');
  const userId=state.session?.user?.id;
  state.info.loading=true;
  state.info.error='';
  state.info.modbookError='';
  render();
  try {
    const data=await getGameInformation(Boolean(state.platformAdmin));
    let modbooks=[];
    let modbookError='';
    try {
      modbooks=await getCompanyModbooks(companyId, Boolean(state.platformAdmin));
    }catch(error){
      modbookError=String(error?.message||error||'개조서를 불러오지 못했습니다.');
    }
    if(request!==infoLoadSequence||String(state.companyId||'')!==companyId||state.session?.user?.id!==userId)return;
    state.info.data={...data,modbook_catalog:modbooks};
    state.info.companyId=companyId;
    state.info.modbookError=modbookError;
    state.info.loaded=true;
  } catch(error){
    if(request!==infoLoadSequence)return;
    state.info.error=String(error?.message||error||'게임 정보를 불러오지 못했습니다.');
    state.info.loaded=false;
  } finally {
    if(request!==infoLoadSequence)return;
    state.info.loading=false;
    render();
  }
}

async function loadPlatformContentSettings() {
  if (!state.platformAdmin) {
    state.platformContentSettings = null;
    state.platformContentError = '';
    return;
  }
  try {
    state.platformContentSettings = await listPlatformContentSettings();
    state.platformContentError = '';
  } catch (error) {
    state.platformContentSettings = null;
    state.platformContentError = String(error?.message || error || '설정 조회 실패');
  }
}

async function refreshAll() {
  resetScopedGameInfo();
  if (!state.session?.user) { state.ready=true; render(); return; }
  state.loading=true; state.error=''; render();
  try {
    state.platformAdmin=await isPlatformAdmin().catch(()=>false);
    if (!state.platformAdmin) { state.platformContentSettings=null; state.platformContentError=''; }
    // Fail closed for creation UI without blocking access to existing companies.
    state.companyCreatePermissionError=false;
    try { state.canCreateCompany=await canCreateCompany(); }
    catch { state.canCreateCompany=false; state.companyCreatePermissionError=true; }
    if(!state.platformAdmin && ['platform','layout'].includes(state.page)){state.page='dashboard';localStorage.setItem('axe_product_page','dashboard');}
    await claimDiscordMemberships();
    await loadCompanies();
    if(state.page==='company-start' && state.companies.length)state.page='hub';
    state.platformSnapshot=state.platformAdmin?await getPlatformCompanies().catch(()=>[]):[];
    await Promise.all([loadPlatformSupport(),loadPlatformSuggestions(),loadHubBoard()]);
    applyPlatformCompanyVisibility();
    state.page = allowedHistoryPage(state.page);
    await loadCompanyData();
    if(['info','game-info'].includes(state.page))await loadGameInfo();
    if(state.page==='platform' && state.platformView==='contents' && state.platformAdmin) await loadPlatformContentSettings();
    state.ready=true;
    const saved=savedSetupGuideProgress();
    if(currentMembership(state)?.role==='owner' && saved && !saved.completed && !state.setupGuideDismissed && !state.modal){
      const step=resolveSetupGuideResumeStep(Math.max(1,Math.min(6,Number(saved.step||1))));
      state.setupGuide=createSetupGuideState(step);
      state.modal={type:'setup-guide'};
    }
  }
  catch(error){ state.error=String(error?.message||error); }
  finally { state.loading=false; render(); }
}

function clearReconnectPoll() {
  if (reconnectPollTimer) clearTimeout(reconnectPollTimer);
  reconnectPollTimer = null;
  reconnectPollAttempts = 0;
}

function clearCatalogPoll() {
  if (catalogPollTimer) clearTimeout(catalogPollTimer);
  catalogPollTimer = null;
  catalogPollAttempts = 0;
}

function discordCatalogPending(status = state.onboardingStatus) {
  return state.discordConnection?.status === 'connected' && status?.catalog_ready === false;
}

function startCatalogStatusPoll() {
  clearCatalogPoll();
  const run = async () => {
    if (!state.companyId || !state.session?.user) return clearCatalogPoll();
    catalogPollAttempts += 1;
    try {
      const status = await getCompanyOnboardingStatus(state.companyId);
      state.onboardingStatus = status || null;
      if (!status?.discord_connected) {
        clearCatalogPoll();
        render();
        return;
      }
      if (status?.catalog_ready === true) {
        clearCatalogPoll();
        await loadBaseCompanyData();
        if(state.modal?.type==='setup-guide' && Number(state.setupGuide?.step||0)<=1){
          state.setupGuide=createSetupGuideState(2);
          render();
        }
        setNotice(`Discord 역할 ${Number(status.role_count||0)}개 · 채널 ${Number(status.channel_count||0)}개를 불러왔습니다.`);
        return;
      }
      render();
    } catch (error) {
      if (catalogPollAttempts >= 30) {
        clearCatalogPoll();
        setError(error);
        return;
      }
    }
    if (catalogPollAttempts < 30) catalogPollTimer=setTimeout(run,2000);
    else {
      clearCatalogPoll();
      setNotice('Discord 역할·채널 동기화가 지연되고 있습니다. 잠시 후 새로고침해 주세요.');
    }
  };
  catalogPollTimer=setTimeout(run,600);
}

function startReconnectStatusPoll() {
  clearReconnectPoll();
  const run = async () => {
    if (!state.companyId || !state.session?.user) return clearReconnectPoll();
    reconnectPollAttempts += 1;
    try {
      const status = await getCompanyOnboardingStatus(state.companyId);
      state.onboardingStatus = status || null;
      const phase = String(status?.status || '');
      if (phase === 'error') {
        clearReconnectPoll();
        setError(status?.last_error || 'Discord 연결 초기화에 실패했습니다.');
        return;
      }
      if (!['reset_requested','resetting'].includes(phase)) {
        clearReconnectPoll();
        await loadBaseCompanyData();
        state.settingsTab='basic';
        localStorage.setItem('axe_product_settings_tab','basic');
        setNotice('기존 Discord 연결 정리가 완료됐습니다. 다시 연결할 수 있습니다.');
        return;
      }
      render();
    } catch (error) {
      if (reconnectPollAttempts >= 20) {
        clearReconnectPoll();
        setError(error);
        return;
      }
    }
    if (reconnectPollAttempts < 20) reconnectPollTimer=setTimeout(run,2500);
    else { clearReconnectPoll(); setNotice('Discord 연결 정리가 진행 중입니다. 잠시 후 새로고침해 주세요.'); }
  };
  reconnectPollTimer=setTimeout(run,1200);
}

function discordOAuthErrorMessage(code) {
  const map={access_denied:'Discord 서버 연결이 취소됐습니다.',invalid_request:'Discord 인증 요청이 올바르지 않습니다.',temporarily_unavailable:'Discord 인증 서비스를 잠시 사용할 수 없습니다.',token_exchange_failed:'Discord 인증 코드 교환에 실패했습니다.',guild_not_returned:'선택한 Discord 서버 정보를 확인하지 못했습니다.',guild_mismatch:'권한을 승인한 Discord 서버가 현재 연결된 회사 서버와 다릅니다.',oauth_validation_failed:'Discord 인증 보안 검증에 실패했습니다.',missing_oauth_response:'Discord 인증 결과가 비어 있습니다.',oauth_failed:'Discord 서버 연결에 실패했습니다.'};
  return map[code]||'Discord 서버 연결에 실패했습니다.';
}
async function handleDiscordOAuthReturn() {
  const raw=String(location.hash||'').replace(/^#/,''); if(!raw)return;
  const params=new URLSearchParams(raw); const token=params.get('discord_link'); const error=params.get('discord_error');
  if(!token&&!error)return; history.replaceState(history.state,'',`${location.pathname}${location.search}`);
  if(error) throw new Error(discordOAuthErrorMessage(error));
  if(!state.session?.user) throw new Error('Discord 서버 연결을 완료하려면 다시 로그인해 주세요.');
  const connection=await completeDiscordConnection(token); clearReconnectPoll(); clearCatalogPoll(); state.companyId=connection.company_id; localStorage.setItem('axe_product_company_id',state.companyId); await refreshAll(); state.page='settings'; state.settingsTab='basic'; localStorage.setItem('axe_product_page','settings'); localStorage.setItem('axe_product_settings_tab','basic');
  const resumeGuide=localStorage.getItem('axe_product_setup_resume')==='1';
  const resumeStepRaw=Number(localStorage.getItem('axe_product_setup_resume_step'));
  localStorage.removeItem('axe_product_setup_resume');
  localStorage.removeItem('axe_product_setup_resume_step');
  if(resumeGuide){
    const requestedStep=Number.isInteger(resumeStepRaw)&&resumeStepRaw>=0&&resumeStepRaw<=6?resumeStepRaw:(discordCatalogPending()?1:2);
    const resumeStep=resolveSetupGuideResumeStep(requestedStep);
    state.setupGuide=createSetupGuideState(resumeStep);
    state.modal={type:'setup-guide'};
    render();
  }
  if(discordCatalogPending()){setNotice(`Discord 서버 ${connection.guild_name||''} 연결 완료 · 역할·채널 정보를 불러오는 중입니다.`);startCatalogStatusPoll();}
  else setNotice(`Discord 서버 ${connection.guild_name||''} 연결이 완료됐습니다.`);
}

async function recoverSessionOnResume({force=false}={}) {
  if(!envReady || document.visibilityState==='hidden' || sessionRecoveryBusy) return;
  const nowMs=Date.now();
  if(!force && nowMs-lastSessionRecoveryAt<8000) return;
  sessionRecoveryBusy=true; lastSessionRecoveryAt=nowMs;
  try{
    let session=await getSession();
    const expiresAt=Number(session?.expires_at||0)*1000;
    if(session && (!expiresAt || expiresAt-nowMs<5*60*1000)){
      try{session=await refreshSession()||session;}catch(error){console.warn('LAC HUB session refresh deferred',error);}
    }
    if(!session){
      try{session=await refreshSession();}catch(error){
        const msg=String(error?.message||error||'');
        if(!/session.*missing|refresh.*token.*not found|invalid refresh/i.test(msg)) throw error;
      }
    }
    if(session?.user){
      const before=state.session?.user?.id||null; const after=session.user.id;
      state.session=session;
      if(before!==after || !state.ready){state.ready=false;await refreshAll();}
      return;
    }
    if(state.session?.user){state.session=null;state.canCreateCompany=false;state.companyCreatePermissionError=false;clearCompanyData();state.ready=true;render();}
  }catch(error){
    console.warn('LAC HUB session recovery skipped after transient error',error);
  }finally{sessionRecoveryBusy=false;}
}

function installSessionResumeRecovery(){
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')recoverSessionOnResume({force:true});});
  window.addEventListener('focus',()=>recoverSessionOnResume());
  window.addEventListener('online',()=>recoverSessionOnResume({force:true}));
  if(sessionHealthTimer)clearInterval(sessionHealthTimer);
  sessionHealthTimer=setInterval(()=>{if(document.visibilityState==='visible'&&state.session?.user)recoverSessionOnResume();},10*60*1000);
}

async function boot() {
  if(!envReady){state.ready=true;render();return;}
  installPrimaryScreenHistory();
  // Keep the HUB startup screen until the session and the requested route are ready.
  render();
  try{state.session=await getSession();if(state.session){const exp=Number(state.session.expires_at||0)*1000;if(!exp||exp-Date.now()<5*60*1000)state.session=await refreshSession()||state.session;}}catch(error){state.error=String(error?.message||error);} render(); await refreshAll();
  installSessionResumeRecovery();
  if(discordCatalogPending()) startCatalogStatusPoll();
  try{await handleDiscordOAuthReturn();}catch(error){setError(error);}
  onAuthStateChange((event,session)=>{
    setTimeout(async()=>{
      if(event==='SIGNED_OUT' && Date.now()>manualSignOutUntil){await recoverSessionOnResume({force:true});return;}
      const before=state.session?.user?.id||null; const after=session?.user?.id||null;
      state.session=session;
      if(before!==after){state.canCreateCompany=false;state.companyCreatePermissionError=false;state.ready=false;await refreshAll();}
    },0);
  });
}

function closeModal({force=false}={}) {
  if(state.modal?.type==='setup-demo' && state.modal?.returnToTestCenter){
    state.setupDemo=null;
    state.modal={type:'test-center'};
    render();
    return true;
  }
  if(state.modal?.type==='setup-demo') state.setupDemo=null;
  if(state.modal?.type==='test-center') state.testCenter=null;
  if(state.modal?.type==='setup-guide'){ state.setupGuide=null; state.setupGuideDismissed=true; }
  if(['ledger','ledger-correction'].includes(state.modal?.type)) clearLedgerPendingFiles();
  if(['support-question-create','support-question'].includes(state.modal?.type)) clearQuestionPendingFiles();
  if(['suggestion-create','suggestion-thread'].includes(state.modal?.type)) clearSuggestionPendingFiles();
  state.supportImageViewer=null; state.modal=null; render(); return true;
}

async function withMutation(fn){ if(mutationBusy)return; mutationBusy=true; state.loading=true; render(); try{await fn();}catch(error){setError(error);}finally{mutationBusy=false;state.loading=false;render();} }

function isCurrentCompanyOwner(){ return currentMembership(state)?.role==='owner'; }

function onboardingPhase(){ return String(state.onboardingStatus?.status||''); }
function onboardingStep(){ return String(state.onboardingStatus?.current_step||''); }
function isOnboardingStep(step){ return onboardingPhase()==='onboarding' && onboardingStep()===step; }

function assertOnboardingRoles(data){
  if(!isOnboardingStep('roles')) return;
  if(discordCatalogPending()) throw new Error('Discord 역할·채널 정보를 불러오는 중입니다. 잠시만 기다려 주세요.');
  if(!String(data.get('admin_role_id')||'').trim()) throw new Error('관리자 역할을 선택해 주세요.');
  if(!String(data.get('member_role_id')||'').trim()) throw new Error('일반 멤버 역할을 선택해 주세요.');
}

async function saveBasicSettingsData(data,{requireOnboardingRoles=false}={}){
  if(requireOnboardingRoles) assertOnboardingRoles(data);
  const companyName=String(data.get('company_name')||'').trim();
  if(!companyName) throw new Error('회사 이름을 입력해 주세요.');
  if(companyName!==(state.companies.find(c=>c.id===state.companyId)?.name||'')) await updateCompanyName(state.companyId,companyName);
  let settings={...(state.companySettings?.settings||{})};
  await updateCompanySettings(state.companyId,{locale:state.companySettings?.locale||'ko-KR',timezone:state.companySettings?.timezone||'Asia/Seoul',settings},state.session.user.id);
  await saveDiscordCompanyConfig(state.companyId,{notification_channel_id:state.discordCompanyConfig?.notification_channel_id||null,command_channel_id:state.discordCompanyConfig?.command_channel_id||null,admin_role_id:String(data.get('admin_role_id')||'')||null,member_role_id:String(data.get('member_role_id')||'')||null},state.session.user.id);
}

async function saveModuleSettingsData(form,data){
  // Validate against the currently connected company's synced Discord channel list.
  const aiChannelId=String(data.get('ai_channel_id')||'').trim();
  if(aiChannelId){
    const connectedGuildId=String(state.discordConnection?.guild_id||'');
    const channel=(state.discordChannels||[]).find(c=>String(c.channel_id)===aiChannelId
      && String(c.guild_id)===connectedGuildId && c.is_text_based===true);
    if(!channel) throw new Error('현재 회사에서 사용할 수 있는 AI 전용 텍스트 채널을 선택해 주세요.');
    // Avoid processing an existing functional channel twice (normal BOT command + AI message).
    const used=(state.modules||[]).filter(m=>m.enabled).flatMap(m=>
      Object.entries(m.settings||{}).filter(([key])=>key.endsWith('channel_id')).map(([,value])=>String(value||'')));
    if(used.includes(aiChannelId)) throw new Error('AI 전용 채널은 기존 기능 채널과 다르게 지정해 주세요.');
  }
  const beforeAiChannelId=String(state.discordCompanyConfig?.ai_channel_id||'');
  if(aiChannelId!==beforeAiChannelId){
    if(!state.discordCompanyConfig) throw new Error('Discord 회사 설정을 먼저 완료해 주세요.');
    await saveCompanyAiChannel(state.companyId,aiChannelId,state.session.user.id);
  }
  for(const mod of state.modules){
    const settings={...(mod.settings||{})};
    for(const key of ['status_channel_id','three_channel_id','ten_channel_id','record_channel_id','channel_id','order_channel_id','account_lookup_channel_id']){
      const field=`module_${mod.module_key}_${key}`; if(form.elements[field])settings[key]=String(data.get(field)||'')||null;
    }
    await updateCompanyModuleSettings(state.companyId,mod.module_key,settings,state.session.user.id);
  }
}

root.addEventListener('click', async event => {
  const pageBtn=event.target.closest('[data-page]');
  if(pageBtn){ if(pageBtn.dataset.page==='hub'){navigatePrimaryScreen('hub');state.accountMenuOpen=false;state.companyMenuOpen=false;render();return;} state.accountMenuOpen=false; navigatePrimaryScreen(pageBtn.dataset.page); localStorage.setItem('axe_product_page',state.page); if(['dashboard','fund'].includes(state.page)&&!state.fundSnapshot) await withMutation(loadFundSnapshot); if(['dashboard','assets','accounts'].includes(state.page)&&!state.assetsSnapshot) await withMutation(loadAssetsAndAccounts); if(state.page==='questions') await withMutation(loadQuestionBoard); if(state.page==='suggestions') await withMutation(loadSuggestionBoard); if(state.page==='info'&&!state.info.loaded) await loadGameInfo(); if(state.page==='platform'&&state.platformAdmin){state.platformSnapshot=await getPlatformCompanies().catch(()=>state.platformSnapshot||[]);await Promise.all([loadPlatformSupport(),loadPlatformSuggestions()]);} render(); return; }
  const infoTab=event.target.closest('[data-info-table]');
  if(infoTab){state.info.table=infoTab.dataset.infoTable;state.info.craftGroup='근접무기';state.info.modbookCategory='';state.info.selectedId='';state.info.query='';state.info.filterPrimary='__all__';state.info.filterSecondary='__all__';render();return;}
  const infoFilter=event.target.closest('[data-info-filter]');
  if(infoFilter){const field=infoFilter.dataset.infoFilter;if(!['craftGroup','primary','secondary','modbookCategory'].includes(field))return;const key=field==='craftGroup'?'craftGroup':field==='primary'?'filterPrimary':field==='secondary'?'filterSecondary':'modbookCategory';const value=infoFilter.dataset.infoValue;state.info[key]=field==='secondary'&&state.info.table==='info_quests'&&state.info[key]===value?'__all__':value;if(field==='craftGroup'){state.info.filterPrimary='__all__';state.info.filterSecondary='__all__';}else if(field==='primary')state.info.filterSecondary='__all__';if(field!=='modbookCategory')state.info.modbookCategory='';state.info.query='';state.info.selectedId='';render();return;}
  // A global result opens its source category; the search text is cleared only after navigation.
  const infoResult=event.target.closest('[data-info-result-table]');
  if(infoResult){const source=infoResult.dataset.infoResultTable;if(!['info_crafts','info_material_recipes','info_processes','info_quests','info_skill_ranks','modbook_catalog'].includes(source))return;state.info.table=source==='info_material_recipes'?'info_crafts':source;state.info.craftGroup=source==='info_material_recipes'?'무기부품':source==='info_crafts'?infoResult.dataset.infoResultGroup:'근접무기';state.info.filterPrimary=infoResult.dataset.infoResultPrimary||'__all__';state.info.filterSecondary=infoResult.dataset.infoResultSecondary||'__all__';state.info.modbookCategory=infoResult.dataset.infoResultModbookCategory||'';state.info.selectedId=infoResult.dataset.infoResultId;state.info.query='';render();return;}
  const infoRow=event.target.closest('[data-info-id]');
  if(infoRow){state.info.selectedId=infoRow.dataset.infoId;render();return;}
  const fundTab=event.target.closest('[data-fund-tab]');
  if(fundTab){state.fundTab=fundTab.dataset.fundTab;localStorage.setItem('axe_product_fund_tab',state.fundTab);render();if(state.fundTab==='weekly') await loadFundWeeklyMonth();return;}
  const memberFilter=event.target.closest('[data-member-filter]'); if(memberFilter){state.memberFilter=memberFilter.dataset.memberFilter;state.memberPage=1;render();return;}
  const assetTab=event.target.closest('[data-asset-tab]'); if(assetTab){state.assetTab=assetTab.dataset.assetTab;if(state.assetTab==='assets')state.assetPage=1;else state.returnPage=1;render();return;}
  const settingsTab=event.target.closest('[data-settings-tab]');
  if(settingsTab){
    const nextTab=String(settingsTab.dataset.settingsTab||'basic');
    if(nextTab==='modules' && state.settingsTab==='basic' && isOnboardingStep('roles')){
      if(discordCatalogPending()){setError('Discord 역할·채널 정보를 불러오는 중입니다. 잠시만 기다려 주세요.');startCatalogStatusPoll();return;}
      const activeForm=root.querySelector('form[data-form="settings-basic"]');
      if(!activeForm){setError('기본 설정 화면을 다시 열어 주세요.');return;}
      const activeData=new FormData(activeForm);
      await withMutation(async()=>{
        await saveBasicSettingsData(activeData,{requireOnboardingRoles:true});
        await loadBaseCompanyData();
        state.settingsTab='modules';
        localStorage.setItem('axe_product_settings_tab','modules');
        setNotice('역할 설정을 저장했습니다. 기능·채널 설정으로 이동합니다.');
      });
      return;
    }
    if(nextTab==='modules' && state.settingsTab==='basic' && isOnboardingStep('discord')){
      setError('먼저 Discord 서버를 연결해 주세요.');
      return;
    }
    state.settingsTab=nextTab;localStorage.setItem('axe_product_settings_tab',state.settingsTab);render();return;
  }
  if(event.target.matches('[data-support-image-backdrop]')){state.supportImageViewer=null;render();return;}
  if(event.target.matches('[data-modal-backdrop]')){ if(['cooking-menu'].includes(state.modal?.type))return; closeModal(); return; }

  const actionEl=event.target.closest('[data-action]'); if(!actionEl)return; const action=actionEl.dataset.action;
  if(action==='list-page'){
    const key=String(actionEl.dataset.listKey||''); const page=Math.max(1,Number(actionEl.dataset.listPage||1));
    const map={fundLedger:'fundLedgerPage',fundReview:'fundReviewPage',members:'memberPage',assets:'assetPage',returns:'returnPage',accounts:'accountPage',cooking:'cookingPage',questions:'questionPage',suggestions:'suggestionPage',platform:'platformPage'};
    if(map[key]){state[map[key]]=page;render();}
    return;
  }
  if(action==='question-filter'){state.questionStatus=String(actionEl.dataset.questionStatus||'all');state.questionPage=1;render();return;}
  if(action==='question-scope'){state.questionScope=String(actionEl.dataset.questionScope||'all')==='mine'?'mine':'all';state.questionPage=1;render();return;}
  if(action==='suggestion-filter'){state.suggestionStatus=String(actionEl.dataset.suggestionStatus||'all');state.suggestionPage=1;render();return;}
  if(action==='suggestion-category'){state.suggestionCategory=String(actionEl.dataset.suggestionCategory||'all');state.suggestionPage=1;render();return;}
  if(action==='toggle-company-menu'){state.accountMenuOpen=false;state.companyMenuOpen=!state.companyMenuOpen;render();return;}
  if(action==='toggle-account-menu'){state.companyMenuOpen=false;state.accountMenuOpen=!state.accountMenuOpen;render();return;}
  if(action==='open-layout-studio'){if(!state.platformAdmin){state.accountMenuOpen=false;render();return;}state.accountMenuOpen=false;navigatePrimaryScreen('layout');localStorage.setItem('axe_product_page','layout');state.layoutSaved=loadLayoutStudioProfile();state.layoutDraft={...state.layoutSaved};state.layoutDirty=false;applyLayoutStudioProfile(state.layoutDraft);render();return;}
  if(action==='layout-toggle-advanced'){if(!state.platformAdmin||state.page!=='layout')return;state.layoutAdvanced=!state.layoutAdvanced;render();return;}
  if(action==='layout-preset'){if(!state.platformAdmin||state.page!=='layout')return;state.layoutDraft=applyLayoutStudioPreset(state.layoutDraft,String(actionEl.dataset.layoutType||''),String(actionEl.dataset.layoutValue||''));state.layoutDirty=true;applyLayoutStudioProfile(state.layoutDraft);render();return;}
  if(action==='layout-adjust'){if(!state.platformAdmin||state.page!=='layout')return;state.layoutDraft=adjustLayoutStudioValue(state.layoutDraft,String(actionEl.dataset.layoutKey||''),Number(actionEl.dataset.layoutDelta||0));state.layoutDirty=true;applyLayoutStudioProfile(state.layoutDraft);render();return;}
  if(action==='layout-save'){if(!state.platformAdmin||state.page!=='layout')return;state.layoutSaved=saveLayoutStudioProfile(state.layoutDraft);state.layoutDraft={...state.layoutSaved};state.layoutDirty=false;applyLayoutStudioProfile(state.layoutDraft);render();return;}
  if(action==='layout-revert'){if(!state.platformAdmin||state.page!=='layout')return;state.layoutDraft={...state.layoutSaved};state.layoutDirty=false;applyLayoutStudioProfile(state.layoutDraft);render();return;}
  if(action==='layout-reset-default'){if(!state.platformAdmin||state.page!=='layout')return;state.layoutDraft=clearLayoutStudioProfile();state.layoutSaved={...state.layoutDraft};state.layoutDirty=false;applyLayoutStudioProfile(state.layoutDraft);render();return;}
  if(action==='open-platform-admin'){if(!state.platformAdmin){state.accountMenuOpen=false;render();return;}state.accountMenuOpen=false;navigatePrimaryScreen('platform');localStorage.setItem('axe_product_page','platform');state.platformSnapshot=await getPlatformCompanies().catch(()=>state.platformSnapshot||[]);await Promise.all([loadPlatformSupport(),loadPlatformSuggestions(),...(state.platformView==='contents'?[loadPlatformContentSettings()]:[])]);render();return;}
  if(action==='info-refresh'){await loadGameInfo();return;}
  if(action==='open-test-center'){if(!state.platformAdmin){state.accountMenuOpen=false;render();return;}state.accountMenuOpen=false;state.testCenter=createTestCenterState();state.modal={type:'test-center'};render();return;}
  if(action==='test-center-exit'){state.testCenter=null;state.modal=null;render();return;}
  if(action==='test-center-select'){
    if(!state.platformAdmin||!state.testCenter)return;
    state.testCenter.scenario=String(actionEl.dataset.scenario||'first-run');
    state.testCenter.screen='preview';state.testCenter.memberCheck='';
    render();return;
  }
  if(action==='test-center-open-new-company'){if(!state.platformAdmin||!state.testCenter)return;state.testCenter.screen='company-form';render();return;}
  if(action==='test-center-company-back'){if(!state.platformAdmin||!state.testCenter)return;state.testCenter.screen='preview';render();return;}
  if(action==='test-center-copy-info'){
    if(!state.platformAdmin||!state.testCenter)return;
    const text=`회사 관리 멤버 등록 요청\nDiscord 이름: ${state.testCenter.fakeDiscordName}\nDiscord ID: ${state.testCenter.fakeDiscordId}`;
    try{await navigator.clipboard.writeText(text);setNotice('테스트용 등록 정보를 복사했습니다. 실제 회사 데이터에는 반영되지 않습니다.');}catch{setNotice('테스트 모드입니다. 실제 데이터에는 아무 변화가 없습니다.');}
    return;
  }
  if(action==='test-center-member-check'){
    if(!state.platformAdmin||!state.testCenter)return;
    if(state.testCenter.scenario==='member-registered'){
      state.testCenter.screen='dashboard';
      state.testCenter.memberCheck='registered';
    }else{
      state.testCenter.memberCheck='waiting';
    }
    render();return;
  }
  if(action==='test-center-show-dashboard'){if(!state.platformAdmin||!state.testCenter)return;state.testCenter.screen='dashboard';render();return;}
  if(action==='test-center-launch-setup'){
    if(!state.platformAdmin||!state.testCenter)return;
    const step=Math.max(0,Math.min(6,Number(actionEl.dataset.step||0)));
    state.setupDemo=createSetupDemoState();
    state.setupDemo.step=step;
    state.setupDemo.connected=step>=2;
    if(step>=5) state.setupDemo.channelsGenerated=true;
    state.modal={type:'setup-demo',returnToTestCenter:true};
    render();return;
  }
  if(action==='go-hub'){state.accountMenuOpen=false;state.companyMenuOpen=false;navigatePrimaryScreen('hub');state.modal=null;render();return;}
  if(action==='hub-board-notices'){clearHubBoardFiles();state.hubBoard.ticket=null;state.hubBoard.mode='list';navigatePrimaryScreen('hub-board');await loadHubBoard();state.hubBoard.tab='notices';render();return;}
  if(action==='hub-board-open'||action==='hub-board-compose'){
    clearHubBoardFiles();state.hubBoard.ticket=null;state.hubBoard.mode=action==='hub-board-compose'?'compose':'list';state.hubBoard.tab='support';
    navigatePrimaryScreen('hub-board');render();if(action==='hub-board-open')await loadHubBoard();return;
  }
  if(action==='hub-board-quick'){const category=String(actionEl.dataset.boardCategory||'all');state.hubBoard.filterCategory=state.hubBoard.filterCategory===category?'all':category;state.hubBoard.mode='list';state.hubBoard.tab='support';render();return;}
  if(action==='hub-board-tab'){clearHubBoardFiles();state.hubBoard.mode='list';state.hubBoard.tab=String(actionEl.dataset.boardTab||'support')==='notices'?'notices':'support';render();return;}
  if(action==='hub-board-cancel'){clearHubBoardFiles();state.hubBoard.mode='list';state.hubBoard.ticket=null;render();return;}
  if(action==='hub-board-notice'){
    const id=String(actionEl.dataset.noticeId||'');
    if(state.page!=='hub-board')navigatePrimaryScreen('hub-board');
    clearHubBoardFiles();state.hubBoard.tab='notices';state.hubBoard.noticeId=id;state.hubBoard.mode='notice';render();return;
  }
  if(action==='hub-board-notice-compose'){if(!state.platformAdmin)return;clearHubBoardFiles();state.hubBoard.mode='notice-compose';state.hubBoard.tab='notices';render();return;}
  if(action==='hub-board-ticket'){
    navigatePrimaryScreen('hub-board');await withMutation(async()=>{await openHubBoardTicket(actionEl.dataset.ticketId);});return;
  }
  if(action==='hub-board-image'){
    await withMutation(async()=>{const url=await hubBoardImageUrl(String(actionEl.dataset.imagePath||''));window.open(url,'_blank','noopener,noreferrer');});return;
  }
  if(action==='hub-board-file-remove'){
    const id=String(actionEl.dataset.fileId||'');const file=state.hubBoard.files.find(item=>item.id===id);
    if(file){try{URL.revokeObjectURL(file.url);}catch{}state.hubBoard.files=state.hubBoard.files.filter(item=>item.id!==id);syncHubBoardPreviews();}
    return;
  }
  if(action==='open-company-start'){if(state.companies.length){navigatePrimaryScreen('hub');render();return;}navigatePrimaryScreen('company-start');render();return;}
  if(action==='open-hub-game-info'){
    if(!state.companyId || !state.companies.some(company=>company.id===state.companyId)){navigatePrimaryScreen('company-start');render();return;}
    navigatePrimaryScreen('game-info');
    if(!state.info.loaded || String(state.info.companyId||'')!==String(state.companyId||'')) await loadGameInfo();
    render();return;
  }
  if(action==='open-company-console'){
    if(!state.companyId || !state.companies.some(company=>company.id===state.companyId)){
      navigatePrimaryScreen('company-start');render();return;
    }
    navigatePrimaryScreen('dashboard');localStorage.setItem('axe_product_page','dashboard');
    if(!state.fundSnapshot)await withMutation(loadFundSnapshot);
    if(!state.assetsSnapshot)await withMutation(loadAssetsAndAccounts);
    render();return;
  }
  if(action==='switch-company'){const next=String(actionEl.dataset.companyId||'');clearReconnectPoll();clearCatalogPoll();state.companyMenuOpen=false;if(!next||next===state.companyId){render();return;}resetScopedGameInfo();state.companyId=next;localStorage.setItem('axe_product_company_id',next);state.fundSnapshot=null;state.fundLedgerAttachments=[];state.assetsSnapshot=null;state.accountsSnapshot=null;state.fundMonthlyRows=[];state.fundLedgerPage=1;state.fundReviewPage=1;state.memberPage=1;state.assetPage=1;state.returnPage=1;state.accountPage=1;state.questionPage=1;state.suggestionPage=1;state.cookingPage=1;state.platformPage=1;await withMutation(loadCompanyData);if(['info','game-info'].includes(state.page)&&state.companyId===next)await loadGameInfo();return;}
  if(action==='dismiss-error'){state.error='';render();return;}
  if(action==='open-support-image'){const url=String(actionEl.dataset.imageUrl||'');if(!url)return;state.supportImageViewer={url,name:String(actionEl.dataset.imageName||'첨부 사진')};render();return;}
  if(action==='close-support-image'){state.supportImageViewer=null;render();return;}
  if(action==='close-modal'){closeModal();return;}
  if(action==='open-member-register'){if(!canAdmin(state)){setError('멤버 등록은 OWNER 또는 관리자만 할 수 있습니다.');return;}if(state.discordConnection?.status!=='connected'){setError('먼저 회사 설정에서 Discord 서버를 연결해 주세요.');return;}state.modal={type:'member-register'};render();return;}
  if(action==='open-issue-company-code'){if(!state.platformAdmin){setError('서비스 운영자만 코드를 발급할 수 있습니다.');return;}state.issuedCompanyCode='';state.modal={type:'issue-company-code'};render();return;}
  if(action==='copy-company-code'){if(!state.platformAdmin||!state.issuedCompanyCode)return;try{await navigator.clipboard.writeText(state.issuedCompanyCode);setNotice('개설 코드를 복사했습니다.');}catch{setError('코드를 복사하지 못했습니다. 직접 복사해 주세요.');}return;}
  if(action==='open-create-company'){
    // UI and direct-action guard: a user with an assigned company cannot
    // create another one from the HUB/company console, even when the RPC
    // reports eligibility because this account has never been the creator.
    if(state.companies.length){setError('이미 소속 회사가 설정되어 있어 새 회사를 만들 수 없습니다.');return;}
    // Recheck at click time so an old tab or a stale UI cannot open the form.
    try { state.canCreateCompany=await canCreateCompany(); state.companyCreatePermissionError=false; }
    catch(error){state.canCreateCompany=false;state.companyCreatePermissionError=true;setError(error);return;}
    if(!state.canCreateCompany){setError('이미 회사를 생성한 계정은 새 회사를 추가로 만들 수 없습니다. 기존 회사에 멤버로 가입하는 것은 가능합니다.');return;}
    state.modal={type:'create-company'};render();return;
  }
  if(action==='copy-registration-info'){
    const discord=currentDiscordIdentity();
    if(!discord.id){setError('Discord 계정 정보를 확인하지 못했습니다. 다시 로그인해 주세요.');return;}
    const text=`회사 관리 멤버 등록 요청\nDiscord 이름: ${discord.name}\nDiscord ID: ${discord.id}`;
    try{await navigator.clipboard.writeText(text);setNotice('대표에게 전달할 등록 정보를 복사했습니다.');}catch{setError('등록 정보를 복사하지 못했습니다. Discord ID를 직접 전달해 주세요.');}
    return;
  }
  if(action==='check-member-registration'){
    await withMutation(async()=>{
      await claimDiscordMemberships();
      await loadCompanies();
      if(!state.companies.length) throw new Error('아직 멤버 등록이 확인되지 않습니다. 대표 또는 관리자에게 현재 Discord 계정 등록을 요청해 주세요.');
      if(!state.companyId||!state.companies.some(company=>company.id===state.companyId)) state.companyId=state.companies[0].id;
      localStorage.setItem('axe_product_company_id',state.companyId);
      navigatePrimaryScreen('dashboard');localStorage.setItem('axe_product_page','dashboard');
      await loadCompanyData();
      state.ready=true;
      setNotice('멤버 등록을 확인했습니다. 소속 회사로 연결했습니다.');
    });
    return;
  }
  if(action==='go-dashboard'){state.accountMenuOpen=false;navigatePrimaryScreen('dashboard');localStorage.setItem('axe_product_page','dashboard');if(!state.fundSnapshot)await withMutation(loadFundSnapshot);if(!state.assetsSnapshot)await withMutation(loadAssetsAndAccounts);render();return;}
  if(action==='open-setup-guide'){
    if(!isCurrentCompanyOwner()){setError('초기설정은 회사 OWNER만 진행할 수 있습니다.');return;}
    const saved=savedSetupGuideProgress();
    const requestedStep=saved&&!saved.completed?Math.max(0,Math.min(6,Number(saved.step||0))):0;
    openSetupGuide(resolveSetupGuideResumeStep(requestedStep)); return;
  }
  if(action==='setup-guide-back'){if(!state.setupGuide)return;state.setupGuide.step=Math.max(0,Number(state.setupGuide.step||0)-1);render();return;}
  if(action==='setup-guide-jump'){if(!state.setupGuide)return;const target=Number(actionEl.dataset.step||0);if(target<=Number(state.setupGuide.step||0)){state.setupGuide.step=Math.max(0,Math.min(6,target));render();}return;}
  if(action==='setup-guide-next'){
    if(!state.setupGuide)return;
    const step=Number(state.setupGuide.step||0);
    if(step===1){if(state.discordConnection?.status!=='connected'){setError('먼저 Discord 서버를 연결해 주세요.');return;}if(state.onboardingStatus?.catalog_ready===false){setError('Discord 역할·채널 정보를 불러오는 중입니다. 잠시만 기다려 주세요.');startCatalogStatusPoll();return;}}
    state.setupGuide.step=Math.min(6,step+1);await withMutation(async()=>{await persistSetupGuideProgress(state.setupGuide.step);});return;
  }
  if(action==='setup-guide-connect'){
    if(!state.setupGuide||!isCurrentCompanyOwner()){setError('초기설정은 회사 OWNER만 진행할 수 있습니다.');return;}
    await withMutation(async()=>{localStorage.setItem('axe_product_setup_resume','1');localStorage.removeItem('axe_product_setup_resume_step');const started=await startDiscordConnection(state.companyId);location.assign(started.authorize_url);});return;
  }
  if(action==='setup-guide-reapprove-channels'){
    if(!state.setupGuide||!isCurrentCompanyOwner()){setError('초기설정은 회사 OWNER만 진행할 수 있습니다.');return;}
    await withMutation(async()=>{
      localStorage.setItem('axe_product_setup_resume','1');
      localStorage.setItem('axe_product_setup_resume_step','4');
      const started=await startDiscordPermissionReapproval(state.companyId);
      location.assign(started.authorize_url);
    });return;
  }
  if(action==='setup-guide-save-roles'){
    if(!state.setupGuide||!isCurrentCompanyOwner()){setError('초기설정은 회사 OWNER만 진행할 수 있습니다.');return;}
    await withMutation(async()=>{await saveSetupGuideRoles();await persistSetupGuideProgress(3);setNotice('Discord 역할 설정을 저장했습니다.');});return;
  }
  if(action==='setup-guide-toggle-module'){
    if(!state.setupGuide)return;const key=String(actionEl.dataset.moduleKey||'');if(Object.prototype.hasOwnProperty.call(state.setupGuide.modules||{},key)){state.setupGuide.modules[key]=!state.setupGuide.modules[key];render();}return;
  }
  if(action==='setup-guide-save-modules'){
    if(!state.setupGuide||!isCurrentCompanyOwner()){setError('초기설정은 회사 OWNER만 진행할 수 있습니다.');return;}
    await withMutation(async()=>{await saveSetupGuideModules();await persistSetupGuideProgress(4);setNotice('사용 기능을 저장했습니다.');});return;
  }
  if(action==='setup-guide-channel-mode'){if(!state.setupGuide)return;state.setupGuide.channelMode=String(actionEl.dataset.mode||'quick')==='direct'?'direct':'quick';if(state.setupGuide.channelMode==='direct'){state.setupGuide.permissionIssue=null;state.setupGuide.permissionMessage='';}render();return;}
  if(action==='setup-guide-create-channels'){
    if(!state.setupGuide||!isCurrentCompanyOwner()){setError('초기설정은 회사 OWNER만 진행할 수 있습니다.');return;}
    await withMutation(async()=>{
      const plan=setupGuideChannelPlan();
      const category=String(state.setupGuide.categoryName||'LAC HUB').trim();
      if(!category)throw new Error('카테고리 이름을 입력해 주세요.');
      if(plan.some(row=>!String(row.name||'').trim()))throw new Error('생성할 채널 이름을 모두 입력해 주세요.');
      const normalizedNames=plan.map(row=>String(row.name||'').trim().toLocaleLowerCase('ko-KR'));
      if(new Set(normalizedNames).size!==normalizedNames.length)throw new Error('같은 채널명을 두 번 사용할 수 없습니다. 채널명을 다르게 지정해 주세요.');
      let result;
      try{
        result=await createGuidedSetupChannels(state.companyId,category,plan.map(row=>({key:row.key,name:row.name,type:row.type||'text'})));
      }catch(error){
        const message=String(error?.message||error||'');
        if(Number(error?.statusCode||0)===403 || /채널 관리 권한/.test(message)){
          state.setupGuide.permissionIssue='manage_channels';
          state.setupGuide.permissionMessage='회사 관리에서 Discord 채널을 자동 생성하려면 현재 연결된 서버에서 채널 관리 권한 승인이 필요합니다.';
          render();
          return;
        }
        throw error;
      }
      state.setupGuide.permissionIssue=null;
      state.setupGuide.permissionMessage='';
      const map={};for(const row of result?.channels||[])if(row?.key&&row?.id)map[String(row.key)]=String(row.id);
      await persistSetupGuideChannels(map);
      await loadQuestionBoard();
      state.setupGuide=createSetupGuideState(5);await persistSetupGuideProgress(5);
      setNotice(`${Object.keys(map).length}개 Discord 채널을 준비하고 기능에 연결했습니다.`);
    });return;
  }
  if(action==='setup-guide-save-direct-channels'){
    if(!state.setupGuide||!isCurrentCompanyOwner()){setError('초기설정은 회사 OWNER만 진행할 수 있습니다.');return;}
    await withMutation(async()=>{
      const plan=setupGuideChannelPlan(); const map={};
      for(const row of plan){const id=String(state.setupGuide.directChannels?.[row.key]||'');if(!id)throw new Error(`${row.label}에 연결할 Discord 채널을 선택해 주세요.`);map[row.key]=id;}
      await persistSetupGuideChannels(map);await loadQuestionBoard();state.setupGuide=createSetupGuideState(5);await persistSetupGuideProgress(5);setNotice('기존 Discord 채널을 회사 관리 기능에 연결했습니다.');
    });return;
  }
  if(action==='setup-guide-load-members'){
    if(!state.setupGuide||!isCurrentCompanyOwner()){setError('초기설정은 회사 OWNER만 진행할 수 있습니다.');return;}
    await withMutation(loadSetupGuideMembers);return;
  }
  if(action==='setup-guide-select-members'){
    if(!state.setupGuide)return;const ids=(state.setupGuide.memberCandidates||[]).map(m=>String(m.discord_user_id));const selected=new Set((state.setupGuide.memberSelected||[]).map(String));const all=ids.length>0&&ids.every(id=>selected.has(id));ids.forEach(id=>all?selected.delete(id):selected.add(id));state.setupGuide.memberSelected=[...selected];render();return;
  }
  if(action==='setup-guide-import-members'){
    if(!state.setupGuide||!isCurrentCompanyOwner()){setError('초기설정은 회사 OWNER만 진행할 수 있습니다.');return;}
    await withMutation(async()=>{
      const selected=new Set((state.setupGuide.memberSelected||[]).map(String));const members=(state.setupGuide.memberCandidates||[]).filter(m=>selected.has(String(m.discord_user_id)));
      if(!members.length)throw new Error('등록할 멤버를 한 명 이상 선택해 주세요.');
      const result=await bulkRegisterDiscordMembers(state.companyId,state.setupGuide.memberFilterRoleId,members.map(m=>String(m.discord_user_id)),state.setupGuide.memberTargetRole||'member');
      await loadBaseCompanyData();state.setupGuide.memberImportDone=true;state.setupGuide.memberImportSkipped=false;await persistSetupGuideProgress(6);
      const insertedCount=Number(result?.inserted?.length||0);const existingCount=Number(result?.skipped?.length||0);const inactiveCount=Number(result?.requires_manual_reactivation?.length||0);
      setNotice(`${insertedCount}명 등록 완료 · ${existingCount}명 기존 등록${inactiveCount?` · ${inactiveCount}명은 퇴사/정지 이력으로 멤버 관리에서 상태 확인 필요`:''}`);
    });return;
  }
  if(action==='setup-guide-skip-members'){if(!state.setupGuide)return;state.setupGuide.memberImportDone=true;state.setupGuide.memberImportSkipped=true;await withMutation(async()=>{await persistSetupGuideProgress(6);});return;}
  if(action==='setup-guide-finish'){if(!state.setupGuide||!isCurrentCompanyOwner()){setError('초기설정은 회사 OWNER만 완료할 수 있습니다.');return;}await withMutation(async()=>{await persistSetupGuideProgress(6,{completed:true});state.setupGuide=null;state.modal=null;state.page='dashboard';localStorage.setItem('axe_product_page','dashboard');setNotice('초기설정이 완료됐습니다. 대시보드에서 현재 운영 상태를 확인하세요.');});return;}
  if(action==='open-setup-demo'){state.setupDemo=createSetupDemoState();state.modal={type:'setup-demo'};render();return;}
  if(action==='setup-demo-connect'){if(!state.setupDemo)return;state.setupDemo.connected=true;render();return;}
  if(action==='setup-demo-next'){if(!state.setupDemo)return;if(state.setupDemo.step===1&&!state.setupDemo.connected){state.setupDemo.connected=true;render();return;}state.setupDemo.step=Math.min(6,Number(state.setupDemo.step||0)+1);render();return;}
  if(action==='setup-demo-back'){if(!state.setupDemo)return;state.setupDemo.step=Math.max(0,Number(state.setupDemo.step||0)-1);render();return;}
  if(action==='setup-demo-restart'){if(!state.setupDemo)return;state.setupDemo=createSetupDemoState();render();return;}
  if(action==='setup-demo-finish'){const back=Boolean(state.modal?.returnToTestCenter);state.setupDemo=null;state.modal=back?{type:'test-center'}:null;render();return;}
  if(action==='setup-demo-jump'){if(!state.setupDemo)return;const target=Number(actionEl.dataset.step||0);if(target<=Number(state.setupDemo.step||0)){state.setupDemo.step=Math.max(0,Math.min(6,target));render();}return;}
  if(action==='setup-demo-toggle-module'){if(!state.setupDemo)return;const key=String(actionEl.dataset.moduleKey||'');if(key){state.setupDemo.modules[key]=!Boolean(state.setupDemo.modules[key]);state.setupDemo.channelsGenerated=false;render();}return;}
  if(action==='setup-demo-channel-mode'){if(!state.setupDemo)return;const mode=String(actionEl.dataset.mode||'quick');state.setupDemo.channelMode=mode==='direct'?'direct':'quick';state.setupDemo.channelsGenerated=false;render();return;}
  if(action==='setup-demo-generate-channels'){if(!state.setupDemo)return;state.setupDemo.channelsGenerated=true;render();return;}
  if(action==='setup-demo-select-visible-members'){
    if(!state.setupDemo)return;
    const groups={member:['m1','m2','m3','m4','m5','m6'],admin:['a1','a2'],guest:['g1','g2','g3','g4','g5','g6','g7','g8','g9','g10']};
    const visible=groups[state.setupDemo.memberFilter]||groups.member;
    const selected=new Set(state.setupDemo.memberSelected||[]);
    const allSelected=visible.every(id=>selected.has(id));
    visible.forEach(id=>allSelected?selected.delete(id):selected.add(id));
    state.setupDemo.memberSelected=[...selected];state.setupDemo.memberImportDone=false;state.setupDemo.memberImportSkipped=false;render();return;
  }
  if(action==='setup-demo-import-members'){
    if(!state.setupDemo)return;
    if(!(state.setupDemo.memberSelected||[]).length){setNotice('등록할 멤버를 한 명 이상 선택해 주세요.');return;}
    state.setupDemo.memberImportDone=true;state.setupDemo.memberImportSkipped=false;render();return;
  }
  if(action==='setup-demo-skip-members'){if(!state.setupDemo)return;state.setupDemo.memberImportDone=true;state.setupDemo.memberImportSkipped=true;render();return;}
  if(action==='refresh-questions'){await withMutation(loadQuestionBoard);return;}
  if(action==='refresh-platform-support'){await withMutation(loadPlatformSupport);return;}
  if(action==='open-question-create'){clearQuestionPendingFiles();state.modal={type:'support-question-create'};render();return;}
  if(action==='open-question'){
    const questionId=String(actionEl.dataset.questionId||'');
    await withMutation(async()=>{await openSupportQuestion(questionId);});return;
  }
  if(action==='remove-question-pending'){
    const id=String(actionEl.dataset.pendingId||'');
    const item=(state.questionPendingFiles||[]).find(x=>x.id===id);
    try{if(item?.previewUrl)URL.revokeObjectURL(item.previewUrl);}catch{}
    state.questionPendingFiles=(state.questionPendingFiles||[]).filter(x=>x.id!==id);
    refreshQuestionPendingAttachmentUi();
    return;
  }
  if(action==='delete-question'){
    const questionId=String(actionEl.dataset.questionId||'');
    const question=state.modal?.type==='support-question'&&String(state.modal.questionId||'')===questionId?state.modal.question:null;
    if(!question?.viewer_can_delete){setError('이 질문을 삭제할 권한이 없습니다.');return;}
    if(!window.confirm('이 질문과 답변, 첨부사진을 모두 삭제할까요?'))return;
    await withMutation(async()=>{
      const paths=supportQuestionStoragePaths(question);
      if(paths.length) await removeSupportAttachments(paths);
      await deleteSupportQuestion(questionId);
      clearQuestionPendingFiles();
      state.modal=null;
      await loadQuestionBoard();
      if(state.platformAdmin)await loadPlatformSupport();
      setNotice('질문을 삭제했습니다.');
    });
    return;
  }
  if(action==='question-status'){
    if(!state.platformAdmin){setError('질문 상태 변경은 PLATFORM OWNER만 가능합니다.');return;}
    const questionId=String(actionEl.dataset.questionId||'');const status=String(actionEl.dataset.status||'');
    await withMutation(async()=>{
      await updateQuestionStatus(questionId,status);
      let notifyResult=null;
      if(status==='complete') notifyResult=await notifySupportQuestionAnswer(questionId).catch(()=>({sent:false,reason:'dm_failed'}));
      await loadPlatformSupport();
      if(state.companyId) await loadQuestionBoard();
      const question=await hydrateSupportQuestion(await getSupportQuestion(questionId));
      question.unread=false;
      state.modal={type:'support-question',questionId,question};
      setNotice(status==='complete'?(notifyResult?.sent?'답변완료 처리 후 작성자에게 Discord DM을 보냈습니다.':'답변완료 처리했습니다. 사이트 알림은 유지되고 Discord DM은 전달되지 않았습니다.'):'질문 상태를 변경했습니다.');
    });return;
  }
  if(action==='refresh-suggestions'){await withMutation(loadSuggestionBoard);return;}
  if(action==='refresh-platform-suggestions'){await withMutation(loadPlatformSuggestions);return;}
  if(action==='open-suggestion-create'){clearSuggestionPendingFiles();state.modal={type:'suggestion-create'};render();return;}
  if(action==='open-suggestion'){
    const suggestionId=String(actionEl.dataset.suggestionId||'');
    await withMutation(async()=>{await openSuggestion(suggestionId);});return;
  }
  if(action==='remove-suggestion-pending'){
    const id=String(actionEl.dataset.pendingId||'');
    const item=(state.suggestionPendingFiles||[]).find(x=>x.id===id);
    try{if(item?.previewUrl)URL.revokeObjectURL(item.previewUrl);}catch{}
    state.suggestionPendingFiles=(state.suggestionPendingFiles||[]).filter(x=>x.id!==id);
    refreshSuggestionPendingAttachmentUi();
    return;
  }
  if(action==='delete-suggestion'){
    const suggestionId=String(actionEl.dataset.suggestionId||'');
    const suggestion=state.modal?.type==='suggestion-thread'&&String(state.modal.suggestionId||'')===suggestionId?state.modal.suggestion:null;
    if(!suggestion?.viewer_can_delete){setError('이 건의를 삭제할 권한이 없습니다.');return;}
    if(!window.confirm('이 건의와 답변, 첨부사진을 모두 삭제할까요?'))return;
    await withMutation(async()=>{
      const paths=suggestionStoragePaths(suggestion);
      if(paths.length) await removeSuggestionAttachments(paths);
      await deleteSuggestion(suggestionId);
      clearSuggestionPendingFiles();
      state.modal=null;
      await loadSuggestionBoard();
      if(state.platformAdmin)await loadPlatformSuggestions();
      setNotice('건의를 삭제했습니다.');
    });
    return;
  }
  if(action==='suggestion-status'){
    if(!state.platformAdmin){setError('건의 상태 변경은 PLATFORM OWNER만 가능합니다.');return;}
    const suggestionId=String(actionEl.dataset.suggestionId||'');const status=String(actionEl.dataset.status||'');
    await withMutation(async()=>{
      await updateSuggestionStatus(suggestionId,status);
      let notifyResult=null;
      if(status==='complete') notifyResult=await notifySuggestionAnswer(suggestionId).catch(()=>({sent:false,reason:'dm_failed'}));
      await loadPlatformSuggestions();
      if(state.companyId) await loadSuggestionBoard();
      const suggestion=await hydrateSuggestion(await getSuggestion(suggestionId));
      suggestion.unread=false;
      state.modal={type:'suggestion-thread',suggestionId,suggestion};
      setNotice(status==='complete'?(notifyResult?.sent?'답변완료 처리 후 작성자에게 Discord DM을 보냈습니다.':'답변완료 처리했습니다. 사이트 알림은 유지되고 Discord DM은 전달되지 않았습니다.'):'건의 상태를 변경했습니다.');
    });return;
  }
  if(action==='dashboard-jump'){
    const page=String(actionEl.dataset.page||'dashboard');
    if(validPages.includes(page)){navigatePrimaryScreen(page);localStorage.setItem('axe_product_page',page);}
    if(actionEl.dataset.fundTab){state.fundTab=String(actionEl.dataset.fundTab);localStorage.setItem('axe_product_fund_tab',state.fundTab);}
    if(actionEl.dataset.settingsTab){state.settingsTab=String(actionEl.dataset.settingsTab);localStorage.setItem('axe_product_settings_tab',state.settingsTab);}
    if(['dashboard','fund'].includes(state.page)&&!state.fundSnapshot) await withMutation(loadFundSnapshot);
    if(['dashboard','assets','accounts'].includes(state.page)&&!state.assetsSnapshot) await withMutation(loadAssetsAndAccounts);
    if(state.page==='questions') await withMutation(loadQuestionBoard);
    if(state.page==='suggestions') await withMutation(loadSuggestionBoard);
    if(state.page==='platform'&&state.platformAdmin){state.platformSnapshot=await getPlatformCompanies().catch(()=>state.platformSnapshot||[]);await Promise.all([loadPlatformSupport(),loadPlatformSuggestions()]);}
    render();return;
  }
  if(action==='open-ledger'){clearLedgerPendingFiles();state.modal={type:'ledger',entryId:null};render();return;}
  if(action==='edit-ledger'){clearLedgerPendingFiles();const entryId=actionEl.dataset.entryId;const row=(state.fundSnapshot?.ledger||[]).find(r=>String(r.id)===String(entryId));state.modal={type:row?.can_edit?'ledger':'ledger-correction',entryId};render();return;}
  if(action==='remove-ledger-pending'){const id=String(actionEl.dataset.pendingId||'');const item=(state.ledgerPendingFiles||[]).find(x=>x.id===id);try{if(item?.previewUrl)URL.revokeObjectURL(item.previewUrl);}catch{}state.ledgerPendingFiles=(state.ledgerPendingFiles||[]).filter(x=>x.id!==id);render();return;}
  if(action==='open-ledger-evidence'){const entryId=String(actionEl.dataset.entryId||'');state.modal={type:'ledger-evidence',entryId};render();return;}
  if(action==='open-ledger-attachment'){const path=String(actionEl.dataset.storagePath||'');if(!path)return;await withMutation(async()=>{const url=await getFundEvidenceSignedUrl(path);window.open(url,'_blank','noopener,noreferrer');});return;}
  if(action==='edit-platform-subscription'){if(!state.platformAdmin){setError('PLATFORM OWNER 권한이 필요합니다.');return;}state.modal={type:'platform-subscription',companyId:String(actionEl.dataset.companyId||'')};render();return;}
  if(action==='platform-view'){
    if(!state.platformAdmin){setError('서비스 운영자 권한이 필요합니다.');return;}
    const view=String(actionEl.dataset.platformView||'companies');
    if(!['companies','support','suggestions','contents'].includes(view))return;
    state.platformView=view;
    if(view==='support')await withMutation(loadPlatformSupport);
    else if(view==='suggestions')await withMutation(loadPlatformSuggestions);
    else if(view==='contents')await withMutation(loadPlatformContentSettings);
    else render();
    return;
  }
  if(action==='refresh-platform-contents'){
    if(!state.platformAdmin){setError('서비스 운영자 권한이 필요합니다.');return;}
    await withMutation(loadPlatformContentSettings);
    return;
  }
  if(action==='toggle-platform-content'){
    if(!state.platformAdmin){setError('서비스 운영자 권한이 필요합니다.');return;}
    const key=String(actionEl.dataset.contentKey||'');
    const field=String(actionEl.dataset.field||'');
    if(!['is_published','is_free'].includes(field))return;
    const current=(state.platformContentSettings||[]).find(item=>item.content_key===key);
    if(!current)return;
    // These flags are configuration only in phase 2; access gates are NOT wired.
    await withMutation(async()=>{
      await updatePlatformContentSetting(key,
        field==='is_published'?!current.is_published:current.is_published,
        field==='is_free'?!current.is_free:current.is_free);
      // Reload persisted values rather than assuming a successful optimistic flip.
      await loadPlatformContentSettings();
      if (state.platformContentError) throw new Error(state.platformContentError);
      setNotice('콘텐츠 설정을 저장했습니다. 실제 서비스 접근 정책은 아직 적용되지 않습니다.');
    });
    return;
  }
  if(action==='open-delete-company'){if(!state.platformAdmin){setError('회사 삭제는 PLATFORM OWNER만 할 수 있습니다.');return;}const companyId=String(actionEl.dataset.companyId||'');const row=(state.platformSnapshot||[]).find(r=>String(r.company_id)===companyId);if(!row){setError('삭제할 회사를 찾지 못했습니다.');return;}state.modal={type:'company-delete',companyId};render();return;}
  if(action==='edit-member'){state.modal={type:'member',membershipId:actionEl.dataset.membershipId};render();return;}
  if(action==='open-asset'){state.modal={type:'asset',assetId:null};render();return;}
  if(action==='edit-asset'){state.modal={type:'asset',assetId:actionEl.dataset.assetId};render();return;}
  if(action==='open-account-request'){state.modal={type:'account'};render();return;}
  if(action==='open-account-row'){const membershipId=String(actionEl.dataset.membershipId||'');state.modal=membershipId===currentMembership(state)?.id?{type:'account'}:{type:'account-detail',membershipId};render();return;}
  if(action==='reset-fund-filter'){state.fundFilters={person:'all',type:'all',account:'all'};state.fundLedgerPage=1;render();return;}
  if(action==='open-discord-reconnect'){if(!canAdmin(state)){setError('관리자 권한이 필요합니다.');return;}if(state.discordConnection?.status!=='connected'){setError('현재 연결된 Discord 서버가 없습니다.');return;}state.modal={type:'discord-reconnect'};render();return;}
  await withMutation(async()=>{
    if(action==='discord-login'){await signInWithDiscord();return;}
    if(action==='logout'){state.loginCreateCode='';sessionStorage.removeItem('lac_one_pending_create_code');clearReconnectPoll();manualSignOutUntil=Date.now()+6000;await signOut();state.modal=null;state.setupGuide=null;return;}
    if(action==='refresh'){await refreshAll();setNotice('최신 데이터를 불러왔습니다.');return;}
    if(action==='refresh-platform'){if(!state.platformAdmin)throw new Error('PLATFORM OWNER 권한이 필요합니다.');await loadCompanies();state.platformSnapshot=await getPlatformCompanies();await Promise.all([loadPlatformSupport(),loadPlatformSuggestions(),...(state.platformView==='contents'?[loadPlatformContentSettings()]:[])]);const changed=applyPlatformCompanyVisibility();if(changed)await loadCompanyData();setNotice('서비스 현황을 새로고침했습니다.');return;}
    if(action==='refresh-fund'){await loadFundSnapshot();if(state.fundTab==='weekly')await loadFundWeeklyMonth();setNotice('공금 데이터를 새로고침했습니다.');return;}
    if(action==='connect-discord'){if(!canAdmin(state))throw new Error('관리자 권한이 필요합니다.');if(['reset_requested','resetting'].includes(String(state.onboardingStatus?.status||'')))throw new Error('기존 Discord 연결을 정리 중입니다. 완료 후 다시 연결해 주세요.');const started=await startDiscordConnection(state.companyId);location.assign(started.authorize_url);return;}
    if(action==='toggle-module'){
      if(!canAdmin(state))throw new Error('관리자 권한이 필요합니다.');if(['reset_requested','resetting'].includes(String(state.onboardingStatus?.status||'')))throw new Error('Discord 연결을 정리 중에는 기능 설정을 변경할 수 없습니다.'); const key=actionEl.dataset.moduleKey; const current=moduleRow(state,key); if(!current)throw new Error('기능 설정을 찾지 못했습니다.');
      await setCompanyModule(state.companyId,key,!current.enabled,state.session.user.id); await loadCompanyData(); setNotice(`${(current.enabled?'기능을 껐습니다.':'기능을 켰습니다.')}`); return;
    }
    if(action==='open-cooking-menu'){if(!canAdmin(state))throw new Error('요리 메뉴 관리는 OWNER 또는 관리자만 가능합니다.');state.modal={type:'cooking-menu',typeKey:null};render();return;}
    if(action==='edit-cooking-menu'){if(!canAdmin(state))throw new Error('요리 메뉴 관리는 OWNER 또는 관리자만 가능합니다.');state.modal={type:'cooking-menu',typeKey:String(actionEl.dataset.typeKey||'')};render();return;}
    if(action==='toggle-cooking-menu'){
      if(!canAdmin(state))throw new Error('요리 메뉴 관리는 OWNER 또는 관리자만 가능합니다.');
      const typeKey=String(actionEl.dataset.typeKey||''); const current=state.cookingOrderTypes.find(x=>String(x.type_key)===typeKey);
      if(!current)throw new Error('요리 메뉴를 찾지 못했습니다.');
      await setCookingOrderTypeEnabled(state.companyId,typeKey,current.enabled===false);
      state.cookingOrderTypes=await getCookingOrderTypes(state.companyId);
      setNotice(current.enabled===false?'요리 메뉴를 사용하도록 변경했습니다.':'요리 메뉴를 숨겼습니다.');return;
    }
    if(action==='cancel-ledger'){const id=actionEl.dataset.entryId;if(!window.confirm('이 공금 내역을 취소할까요?'))return;const input=window.prompt('취소 사유를 입력해 주세요.','');if(input===null)return;const reason=input.trim();if(!reason)throw new Error('취소 사유를 입력해 주세요.');await cancelFundLedgerEntry(state.companyId,id,reason);state.modal=null;await loadFundSnapshot();setNotice('공금 내역을 취소했습니다.');return;}
    if(action==='return-asset'){const id=actionEl.dataset.assetId;if(!window.confirm('이 자산을 반납 처리할까요?'))return;const note=window.prompt('반납 메모 (선택)','')??'';await manageWebAsset(state.companyId,id,'return',note);state.modal=null;await loadAssetsAndAccounts();setNotice('자산을 반납 처리했습니다.');return;}
    if(action==='account-review'){const req=actionEl.dataset.requestId;const reviewAction=actionEl.dataset.reviewAction;const note=reviewAction==='reject'?(window.prompt('반려 사유 (선택)','')??''):'';await reviewWebAccountRequest(state.companyId,req,reviewAction,note);await loadAssetsAndAccounts();setNotice(reviewAction==='approve'?'계좌 신청을 승인했습니다.':'계좌 신청을 반려했습니다.');return;}
    if(action==='fund-review'){const req=actionEl.dataset.requestId;const reviewAction=actionEl.dataset.reviewAction;const note=reviewAction!=='approve'?(window.prompt(reviewAction==='reject'?'반려 사유 (선택)':'보류 메모 (선택)','')??''):'';await reviewFundRequest(state.companyId,req,reviewAction,note);await loadFundSnapshot();setNotice(reviewAction==='approve'?'납부를 승인했습니다.':reviewAction==='hold'?'납부 신청을 보류했습니다.':'납부 신청을 반려했습니다.');return;}
    if(action==='open-evidence'){const url=await getFundEvidenceSignedUrl(actionEl.dataset.evidencePath,300);if(url)window.open(url,'_blank','noopener,noreferrer');return;}
  });
});

root.addEventListener('change', async event => {
  try{
    if(event.target.matches('[data-hub-board-images]')){addHubBoardFiles(event.target.files);event.target.value='';return;}
    if(event.target.matches('[data-hub-board-filter]')){const key=event.target.dataset.hubBoardFilter;if(key==='content')state.hubBoard.filterContent=event.target.value;else if(key==='category')state.hubBoard.filterCategory=event.target.value;else if(key==='status')state.hubBoard.filterStatus=event.target.value;render();return;}
    if(event.target.matches('[data-hub-board-status]')){if(!state.platformAdmin)return;const ticketId=String(event.target.dataset.ticketId||'');await withMutation(async()=>{await setHubTicketStatus(ticketId,event.target.value);await openHubBoardTicket(ticketId);await loadHubBoard();});return;}
    if(event.target.matches('[data-info-filter-select]')){const field=event.target.dataset.infoFilterSelect;if(!['primary','secondary'].includes(field))return;state.info[field==='primary'?'filterPrimary':'filterSecondary']=event.target.value;if(field==='primary')state.info.filterSecondary='__all__';state.info.selectedId='';render();return;}
    if(event.target.matches('[data-info-inactive]')){state.info.showInactive=Boolean(event.target.checked);state.info.selectedId='';await loadGameInfo();return;}
    if(event.target.matches('[data-fund-ledger-month]')){state.fundMonth=event.target.value;state.fundLedgerPage=1;await withMutation(loadFundSnapshot);return;}
    if(event.target.matches('[data-fund-weekly-month]')){state.fundWeeklyMonth=event.target.value;state.fundMonthlyRows=[];await loadFundWeeklyMonth();return;}
    if(event.target.matches('[data-fund-filter]')){state.fundFilters[event.target.dataset.fundFilter]=event.target.value;state.fundLedgerPage=1;render();return;}
    if(event.target.matches('[data-member-role]')){state.memberRole=event.target.value;state.memberPage=1;render();return;}
    if(event.target.matches('[data-asset-category]')){state.assetCategory=event.target.value;state.assetPage=1;render();return;}
    if(event.target.matches('[data-asset-status]')){state.assetStatus=event.target.value;state.assetPage=1;render();return;}
    if(event.target.matches('[data-account-status]')){state.accountStatus=event.target.value;state.accountPage=1;render();return;}
    if(event.target.matches('[data-cooking-status]')){state.cookingStatus=String(event.target.value||'all');state.cookingPage=1;render();return;}
    if(event.target.matches('[data-asset-holder]')){const status=root.querySelector('[data-asset-modal-status]');if(status)status.value=event.target.value?'보유':'미배정';return;}
    if(event.target.matches('[data-asset-modal-status]')){const holder=root.querySelector('[data-asset-holder]');if(event.target.value==='미배정'&&holder)holder.value='';return;}
    if(event.target.matches('[data-guide-role]')){if(!state.setupGuide)return;state.setupGuide[event.target.dataset.guideRole]=String(event.target.value||'');render();return;}
    if(event.target.matches('[data-guide-direct-channel]')){if(!state.setupGuide)return;const key=String(event.target.dataset.guideDirectChannel||'');state.setupGuide.directChannels=state.setupGuide.directChannels||{};state.setupGuide.directChannels[key]=String(event.target.value||'');render();return;}
    if(event.target.matches('[data-guide-category-name]')){if(!state.setupGuide)return;state.setupGuide.categoryName=String(event.target.value||'').trim()||'LAC HUB';render();return;}
    if(event.target.matches('[data-guide-generated-channel]')){if(!state.setupGuide)return;const key=String(event.target.dataset.guideGeneratedChannel||'');state.setupGuide.generatedChannels=state.setupGuide.generatedChannels||{};state.setupGuide.generatedChannels[key]=String(event.target.value||'').replace(/^#+/,'').trim();render();return;}
    if(event.target.matches('[data-guide-member-filter]')){if(!state.setupGuide)return;state.setupGuide.memberFilterRoleId=String(event.target.value||'');state.setupGuide.memberListLoaded=false;state.setupGuide.memberCandidates=[];state.setupGuide.memberSelected=[];if(state.setupGuide.memberFilterRoleId)await withMutation(loadSetupGuideMembers);else render();return;}
    if(event.target.matches('[data-guide-member-target-role]')){if(!state.setupGuide)return;state.setupGuide.memberTargetRole=String(event.target.value||'')==='admin'?'admin':'member';render();return;}
    if(event.target.matches('[data-guide-member-select]')){if(!state.setupGuide)return;const id=String(event.target.dataset.guideMemberSelect||'');const selected=new Set((state.setupGuide.memberSelected||[]).map(String));event.target.checked?selected.add(id):selected.delete(id);state.setupGuide.memberSelected=[...selected];render();return;}
    if(event.target.matches('[data-setup-role]')){if(!state.setupDemo)return;state.setupDemo[event.target.dataset.setupRole]=String(event.target.value||'');render();return;}
    if(event.target.matches('[data-platform-status]')){state.platformStatus=String(event.target.value||'all');state.platformPage=1;render();return;}
    if(event.target.matches('[data-platform-query]')){state.platformQuery=String(event.target.value||'');render();return;}
    if(event.target.matches('[data-ledger-evidence-input]')){addLedgerPendingFiles(event.target.files);event.target.value='';return;}
    if(event.target.matches('[data-support-attachment-input]')){addQuestionPendingFiles(event.target.files);event.target.value='';return;}
    if(event.target.matches('[data-suggestion-attachment-input]')){addSuggestionPendingFiles(event.target.files);event.target.value='';return;}
    if(event.target.matches('[data-setup-channel]')){if(!state.setupDemo)return;const key=String(event.target.dataset.setupChannel||'');state.setupDemo.channels=state.setupDemo.channels||{};const map={'공금현황판':'fund','3시-총알':'ammo3','10시-총알':'ammo10','전적-등록':'outlaw','개조서':'modbook','핀볼-모집':'pinball','요리-주문':'cooking','계좌조회':'accountLookup'};state.setupDemo.channels[map[key]||key]=String(event.target.value||'');render();return;}
    if(event.target.matches('[data-setup-category-name]')){if(!state.setupDemo)return;state.setupDemo.categoryName=String(event.target.value||'').trim()||'LAC HUB';state.setupDemo.channelsGenerated=false;render();return;}
    if(event.target.matches('[data-setup-generated-channel]')){if(!state.setupDemo)return;const key=String(event.target.dataset.setupGeneratedChannel||'');state.setupDemo.generatedChannels=state.setupDemo.generatedChannels||{};state.setupDemo.generatedChannels[key]=String(event.target.value||'').replace(/^#+/,'').trim();state.setupDemo.channelsGenerated=false;render();return;}
    if(event.target.matches('[data-setup-member-filter]')){
      if(!state.setupDemo)return;
      const filter=String(event.target.value||'member');
      const groups={member:['m1','m2','m3','m4','m5','m6'],admin:['a1','a2'],guest:['g1','g2','g3','g4','g5','g6','g7','g8','g9','g10']};
      state.setupDemo.memberFilter=['member','admin','guest'].includes(filter)?filter:'member';
      state.setupDemo.memberSelected=[...(groups[state.setupDemo.memberFilter]||groups.member)];
      if(state.setupDemo.memberFilter==='admin')state.setupDemo.memberTargetRole='admin';
      if(state.setupDemo.memberFilter==='member')state.setupDemo.memberTargetRole='member';
      state.setupDemo.memberImportDone=false;state.setupDemo.memberImportSkipped=false;render();return;
    }
    if(event.target.matches('[data-setup-member-target-role]')){if(!state.setupDemo)return;state.setupDemo.memberTargetRole=String(event.target.value||'member')==='admin'?'admin':'member';state.setupDemo.memberImportDone=false;state.setupDemo.memberImportSkipped=false;render();return;}
    if(event.target.matches('[data-setup-member-select]')){if(!state.setupDemo)return;const id=String(event.target.dataset.setupMemberSelect||'');const selected=new Set(state.setupDemo.memberSelected||[]);event.target.checked?selected.add(id):selected.delete(id);state.setupDemo.memberSelected=[...selected];state.setupDemo.memberImportDone=false;state.setupDemo.memberImportSkipped=false;render();return;}
  }catch(error){setError(error);}
});
root.addEventListener('input', event => {
  if(event.target.matches('[data-hub-board-search]')){state.hubBoard.searchQuery=String(event.target.value||'');const pos=event.target.selectionStart;render();const el=root.querySelector('[data-hub-board-search]');el?.focus();el?.setSelectionRange?.(pos,pos);return;}
  if(event.target.matches('[data-login-create-code]')){state.loginCreateCode=String(event.target.value||'').trim();if(state.loginCreateCode)sessionStorage.setItem('lac_one_pending_create_code',state.loginCreateCode);else sessionStorage.removeItem('lac_one_pending_create_code');return;}
  if(event.target.matches('[data-layout-scale]')&&state.platformAdmin&&state.page==='layout'){state.layoutDraft={fontScale:Number(event.target.value)};state.layoutDirty=true;applyLayoutStudioProfile(state.layoutDraft);const label=root.querySelector('[data-layout-scale-label]');if(label)label.textContent=`${state.layoutDraft.fontScale}%`;const saved=root.querySelector('.layout-studio-saved');if(saved){saved.textContent='저장되지 않은 변경 사항';saved.classList.add('is-dirty');}return;}
  if(event.target.matches('[data-info-query]')){state.info.query=event.target.value;state.info.selectedId='';const pos=event.target.selectionStart;render();const el=root.querySelector('[data-info-query]');el?.focus();el?.setSelectionRange?.(pos,pos);return;}
  if(event.target.matches('[data-member-query]')){state.memberQuery=event.target.value;state.memberPage=1;const pos=event.target.selectionStart;render();const el=root.querySelector('[data-member-query]');el?.focus();el?.setSelectionRange?.(pos,pos);}
  if(event.target.matches('[data-asset-query]')){state.assetQuery=event.target.value;state.assetPage=1;const pos=event.target.selectionStart;render();const el=root.querySelector('[data-asset-query]');el?.focus();el?.setSelectionRange?.(pos,pos);}
  if(event.target.matches('[data-account-query]')){state.accountQuery=event.target.value;state.accountPage=1;const pos=event.target.selectionStart;render();const el=root.querySelector('[data-account-query]');el?.focus();el?.setSelectionRange?.(pos,pos);}
  if(event.target.matches('[data-cooking-query]')){state.cookingQuery=event.target.value;state.cookingPage=1;const pos=event.target.selectionStart;render();const el=root.querySelector('[data-cooking-query]');el?.focus();el?.setSelectionRange?.(pos,pos);}
  if(event.target.matches('[data-platform-query]')){state.platformQuery=event.target.value;state.platformPage=1;const pos=event.target.selectionStart;render();const el=root.querySelector('[data-platform-query]');el?.focus();el?.setSelectionRange?.(pos,pos);}
});

document.addEventListener('click', event => {
  let changed=false;
  if(state.companyMenuOpen && !event.target.closest('.runtime-company-picker')){state.companyMenuOpen=false;changed=true;}
  if(state.accountMenuOpen && !event.target.closest('.runtime-account-picker')){state.accountMenuOpen=false;changed=true;}
  if(changed)render();
});

document.addEventListener('keydown', event=>{
  if(event.key==='Escape' && state.supportImageViewer){event.preventDefault();state.supportImageViewer=null;render();}
});

root.addEventListener('paste', event=>{
  const files=Array.from(event.clipboardData?.files||[]).filter(f=>f.type?.startsWith('image/'));
  if(!files.length)return;
  if(state.page==='hub-board' && event.target.closest('.hub-board__form')){event.preventDefault();try{addHubBoardFiles(files);}catch(error){setError(error);}return;}
  if(event.target.closest('[data-ledger-evidence-drop]')){event.preventDefault();addLedgerPendingFiles(files);return;}
  if(['support-question-create','support-question'].includes(state.modal?.type)){event.preventDefault();addQuestionPendingFiles(files);return;}
  if(['suggestion-create','suggestion-thread'].includes(state.modal?.type)){event.preventDefault();addSuggestionPendingFiles(files);}
});
root.addEventListener('dragover', event=>{if(event.target.closest('[data-hub-board-drop],[data-ledger-evidence-drop],[data-support-attachment-drop],[data-suggestion-attachment-drop]'))event.preventDefault();});
root.addEventListener('drop', event=>{
  const supportDrop=event.target.closest('[data-support-attachment-drop]');
  const suggestionDrop=event.target.closest('[data-suggestion-attachment-drop]');
  const ledgerDrop=event.target.closest('[data-ledger-evidence-drop]');
  const hubDrop=event.target.closest('[data-hub-board-drop]');
  if(!supportDrop&&!suggestionDrop&&!ledgerDrop&&!hubDrop)return;
  event.preventDefault();
  const files=Array.from(event.dataTransfer?.files||[]).filter(f=>f.type?.startsWith('image/'));
  if(!files.length)return;
  if(hubDrop){try{addHubBoardFiles(files);}catch(error){setError(error);}return;}
  if(supportDrop)addQuestionPendingFiles(files);
  else if(suggestionDrop)addSuggestionPendingFiles(files);
  else addLedgerPendingFiles(files);
});

root.addEventListener('submit', async event => {
  const form=event.target.closest('form[data-form]'); if(!form)return; event.preventDefault(); const type=form.dataset.form; const data=new FormData(form);
  await withMutation(async()=>{
    if(type==='hub-board-ticket'){
      if(state.page!=='hub-board')throw new Error('게시판에서 작성해 주세요.');
      const contentKey=String(data.get('content_key')||'');const category=String(data.get('category')||'');
      const title=String(data.get('title')||'').trim();const body=String(data.get('body')||'').trim();
      checkHubBoardFiles(state.hubBoard.files.map(item=>item.file));
      const ticketId=await createHubTicket({contentKey,category,title,body});
      try{await storeHubBoardFiles(ticketId,null);}catch(error){state.hubBoard.mode='list';await loadHubBoard();setNotice('글은 등록됐지만 사진 첨부에 실패했습니다. 글을 열고 추가 답변에 사진을 다시 첨부해 주세요.');throw error;}
      await loadHubBoard();await openHubBoardTicket(ticketId);setNotice('문의가 등록됐습니다.');return;
    }
    if(type==='hub-board-reply'){
      const ticketId=String(state.hubBoard.ticket?.id||'');
      if(!ticketId)throw new Error('게시글을 먼저 선택해 주세요.');
      const body=String(data.get('body')||'').trim();checkHubBoardFiles(state.hubBoard.files.map(item=>item.file));
      const messageId=await replyHubTicket(ticketId,body);
      try{await storeHubBoardFiles(ticketId,messageId);}catch(error){await openHubBoardTicket(ticketId);setNotice('답변은 등록됐지만 사진 첨부에 실패했습니다.');throw error;}
      await openHubBoardTicket(ticketId);await loadHubBoard();setNotice('답변을 등록했습니다.');return;
    }
    if(type==='hub-board-notice'){
      if(!state.platformAdmin)throw new Error('운영자만 공지를 등록할 수 있습니다.');
      await publishHubNotice(String(data.get('title')||'').trim(),String(data.get('body')||'').trim());
      state.hubBoard.mode='list';state.hubBoard.tab='notices';await loadHubBoard();setNotice('공지사항을 등록했습니다.');return;
    }
    if(type==='test-center-company'){
      if(!state.platformAdmin||!state.testCenter)throw new Error('PLATFORM OWNER 테스트 모드가 아닙니다.');
      const name=String(data.get('name')||'').trim();
      if(!name)throw new Error('테스트 회사 이름을 입력해 주세요.');
      state.testCenter.fakeCompanyName=name;
      state.setupDemo=createSetupDemoState();
      state.setupDemo.step=1;
      state.setupDemo.connected=false;
      state.modal={type:'setup-demo',returnToTestCenter:true};
      return;
    }
    if(type==='member-register'){
      if(!canAdmin(state))throw new Error('멤버 등록은 OWNER 또는 관리자만 할 수 있습니다.');
      const discordUserId=String(data.get('discord_user_id')||'').trim();
      const role=String(data.get('role')||'member').trim();
      const result=await registerDiscordMember(state.companyId,discordUserId,role);
      state.modal=null;
      await loadBaseCompanyData();
      state.memberFilter='active';state.memberRole='';state.memberQuery='';state.memberPage=1;
      if(result?.status==='existing' && result?.membership?.status && result.membership.status!=='active') setNotice('이미 등록 이력이 있는 멤버입니다. 멤버 관리에서 현재 상태를 확인해 주세요.');
      else setNotice(result?.status==='existing'?'이미 등록된 Discord 멤버입니다. 멤버 목록에서 확인해 주세요.':'멤버를 등록했습니다. 해당 팀원은 등록 확인 후 바로 회사에 연결됩니다.');
      return;
    }
    if(type==='issue-company-code'){
      if(!state.platformAdmin)throw new Error('서비스 운영자만 개설 코드를 발급할 수 있습니다.');
      state.issuedCompanyCode=await issueCompanyCreateCode(String(data.get('company_name')||'').trim(),Number(data.get('hours')||24));
      render();return;
    }
    if(type==='create-company'){
      if(state.companies.length)throw new Error('이미 소속 회사가 설정되어 있어 새 회사를 만들 수 없습니다.');
      // Check again before reserving a code; the DB checks once more at INSERT.
      state.canCreateCompany=await canCreateCompany();
      if(!state.canCreateCompany)throw new Error('이미 회사를 생성한 계정은 추가 회사를 등록할 수 없습니다.');
      const requestedName=String(data.get('name')||'').trim();
      const createCode=String(data.get('create_code')||'').trim();
      if(!requestedName||!createCode)throw new Error('회사 이름과 개설 코드를 입력해 주세요.');
      await redeemCompanyCreateCode(createCode,requestedName);
      const created=await createCompany(requestedName);
      // Admin stays eligible; a regular account has now used its one creation.
      state.canCreateCompany=await canCreateCompany().catch(()=>false);
      state.loginCreateCode='';sessionStorage.removeItem('lac_one_pending_create_code');
      if(!created?.id)throw new Error('회사 등록 상태를 확인하지 못했습니다. 새로고침 후 회사 목록을 확인해 주세요.');
      state.companyId=created.id;
      localStorage.setItem('axe_product_company_id',created.id);
      await claimDiscordMemberships();
      state.modal=null;state.page='settings';state.settingsTab='basic';
      localStorage.setItem('axe_product_page','settings');localStorage.setItem('axe_product_settings_tab','basic');
      await loadCompanies();await loadCompanyData();
      state.ready=true;
      if(!isCurrentCompanyOwner())throw new Error('회사 등록은 확인됐지만 OWNER 권한 연결을 확인하지 못했습니다. 새로고침 후에도 같다면 관리자에게 문의해 주세요.');
      state.setupGuideDismissed=false;
      await persistSetupGuideProgress(1);
      state.setupGuide=createSetupGuideState(1);state.modal={type:'setup-guide'};
      setNotice('회사 등록이 완료되었습니다. 이어서 초기설정을 시작합니다.');
      return;
    }
    if(type==='reconnect-discord'){clearCatalogPoll();if(data.get('confirm')!=='yes')throw new Error('Discord 연결 초기화 안내를 확인해 주세요.');const jobId=await requestCompanyDiscordReconnect(state.companyId);state.modal=null;state.onboardingStatus=await getCompanyOnboardingStatus(state.companyId);setNotice(`Discord 연결 정리를 시작했습니다. 작업 ${jobId.slice(0,8)}…`);startReconnectStatusPoll();return;}
    if(type==='suggestion-create'){
      const category=String(data.get('category')||'improvement').trim(); const title=String(data.get('title')||'').trim(); const body=String(data.get('body')||'').trim();
      const suggestionId=await createSuggestion(state.companyId,category,title,body);
      const attachmentResult=suggestionId?await uploadSuggestionPendingAttachments(suggestionId,null):{uploaded:0,failed:0};
      clearSuggestionPendingFiles();
      state.modal=null; state.suggestionStatus='all'; state.suggestionCategory='all'; state.suggestionPage=1;
      await loadSuggestionBoard(); if(state.platformAdmin)await loadPlatformSuggestions();
      setNotice(attachmentResult.failed?`건의는 등록됐지만 사진 ${attachmentResult.failed}장은 첨부하지 못했습니다.`:'건의를 등록했습니다. 건의게시판에서 확인할 수 있습니다.');
      return;
    }
    if(type==='suggestion-reply'){
      const suggestionId=String(data.get('suggestion_id')||'').trim(); const body=String(data.get('body')||'').trim();
      const result=await addSuggestionMessage(suggestionId,body);
      const targetCompanyId=state.modal?.type==='suggestion-thread'?String(state.modal.suggestion?.company_id||state.companyId||''):state.companyId;
      const attachmentResult=result?.message_id?await uploadSuggestionPendingAttachments(suggestionId,result.message_id,targetCompanyId):{uploaded:0,failed:0};
      clearSuggestionPendingFiles();
      let notifyResult=null;
      if(state.platformAdmin&&result?.status==='complete') notifyResult=await notifySuggestionAnswer(suggestionId).catch(()=>({sent:false,reason:'dm_failed'}));
      if(state.platformAdmin)await loadPlatformSuggestions(); if(state.companyId)await loadSuggestionBoard();
      const suggestion=await hydrateSuggestion(await getSuggestion(suggestionId)); await markSuggestionSeen(suggestionId).catch(()=>false); suggestion.unread=false;
      state.modal={type:'suggestion-thread',suggestionId,suggestion};
      if(attachmentResult.failed) setNotice(`${state.platformAdmin?'답변':'추가 메시지'}은 등록됐지만 사진 ${attachmentResult.failed}장은 첨부하지 못했습니다.`);
      else if(state.platformAdmin) setNotice(notifyResult?.sent?'답변을 등록하고 Discord DM을 보냈습니다.':'답변을 등록했습니다. 사이트 알림은 표시되고 Discord DM은 전달되지 않았습니다.');
      else setNotice('추가 메시지를 등록했습니다. 답변대기로 전환되었습니다.');
      return;
    }
    if(type==='support-question-create'){
      const title=String(data.get('title')||'').trim(); const body=String(data.get('body')||'').trim();
      const questionId=await createSupportQuestion(state.companyId,title,body);
      const attachmentResult=questionId?await uploadQuestionPendingAttachments(questionId,null):{uploaded:0,failed:0};
      clearQuestionPendingFiles();
      state.modal=null; state.questionScope='mine'; state.questionStatus='all'; state.questionPage=1;
      await loadQuestionBoard(); if(state.platformAdmin)await loadPlatformSupport();
      setNotice(attachmentResult.failed?`질문은 등록됐지만 사진 ${attachmentResult.failed}장은 첨부하지 못했습니다.`:'질문을 등록했습니다. 내 질문 목록에서 바로 확인할 수 있습니다.');
      return;
    }
    if(type==='support-question-reply'){
      const questionId=String(data.get('question_id')||'').trim(); const body=String(data.get('body')||'').trim();
      const result=await addSupportQuestionMessage(questionId,body);
      const attachmentResult=result?.message_id?await uploadQuestionPendingAttachments(questionId,result.message_id):{uploaded:0,failed:0};
      clearQuestionPendingFiles();
      let notifyResult=null;
      if(state.platformAdmin&&result?.status==='complete') notifyResult=await notifySupportQuestionAnswer(questionId).catch(()=>({sent:false,reason:'dm_failed'}));
      if(state.platformAdmin)await loadPlatformSupport(); if(state.companyId)await loadQuestionBoard();
      const question=await hydrateSupportQuestion(await getSupportQuestion(questionId)); await markSupportQuestionSeen(questionId).catch(()=>false); question.unread=false;
      state.modal={type:'support-question',questionId,question};
      if(attachmentResult.failed) setNotice(`${state.platformAdmin?'답변':'추가 질문'}은 등록됐지만 사진 ${attachmentResult.failed}장은 첨부하지 못했습니다.`);
      else if(state.platformAdmin) setNotice(notifyResult?.sent?'답변을 등록하고 Discord DM을 보냈습니다.':'답변을 등록했습니다. 사이트 알림은 표시되고 Discord DM은 전달되지 않았습니다.');
      else setNotice('추가 질문을 등록했습니다. 답변대기로 전환되었습니다.');
      return;
    }
    if(type==='ledger'){const existingId=String(data.get('entry_id')||'')||null;const payload={entryId:existingId,direction:String(data.get('direction')||''),amount:Number(data.get('amount')||0),account:String(data.get('account')||'공용계좌'),category:String(data.get('category')||'').trim(),membershipId:String(data.get('membership_id')||'')||null,memo:String(data.get('memo')||'').trim(),ledgerDate:String(data.get('ledger_date')||'')};const hadEvidence=(state.ledgerPendingFiles||[]).length>0;const saved=await saveFundLedgerEntry(state.companyId,payload);let entryId=existingId||ledgerEntryIdFromSave(saved);if((state.ledgerPendingFiles||[]).length&&!entryId){const [yy,mm]=payload.ledgerDate.split('-').map(Number);const fresh=await getFundTreasurySnapshot(state.companyId,yy||null,mm||null,200);const signed=payload.direction==='지출'?-Math.abs(payload.amount):Math.abs(payload.amount);const matches=(fresh?.ledger||[]).filter(r=>String(r.category||'')===payload.category&&String(r.account||'')===payload.account&&dateKey(r.ledger_date)===payload.ledgerDate&&Number(r.amount||0)===signed);entryId=String(matches.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')))[0]?.id||'');}if((state.ledgerPendingFiles||[]).length&&!entryId)throw new Error('내역은 저장됐지만 첨부사진 연결 대상을 확인하지 못했습니다. 해당 내역의 수정 화면에서 사진만 다시 첨부해 주세요.');if(entryId)await uploadLedgerPendingEvidence(entryId);clearLedgerPendingFiles();state.modal=null;await loadFundSnapshot();setNotice(hadEvidence?'공금 내역과 첨부사진을 저장했습니다.':'공금 내역을 저장했습니다.');return;}
    if(type==='ledger-correction'){const entryId=String(data.get('entry_id')||'');const row=(state.fundSnapshot?.ledger||[]).find(r=>String(r.id)===entryId);if(!row)throw new Error('정정할 공금 내역을 찾지 못했습니다.');const oldSigned=Number(row.amount||0);const targetAmount=Math.abs(Number(data.get('amount')||0));if(!Number.isFinite(targetAmount)||targetAmount<=0)throw new Error('최종 금액을 확인해 주세요.');const targetDirection=String(data.get('direction')||'수입');const targetSigned=targetDirection==='지출'?-targetAmount:targetAmount;const delta=targetSigned-oldSigned;if(delta===0)throw new Error('현재 금액과 동일합니다. 변경할 금액 또는 구분을 입력해 주세요.');const reason=String(data.get('reason')||'').trim();if(!reason)throw new Error('정정 사유를 입력해 주세요.');const correctionPayload={entryId:null,direction:delta<0?'지출':'수입',amount:Math.abs(delta),account:String(row.account||'공용계좌'),category:`${row.entry_type==='payment'?'주간공금':(row.category||'공금')} 정정`,membershipId:String(row.membership_id||'')||null,memo:`원본 ${entryId.slice(0,8)} 정정 · ${reason}`,ledgerDate:String(data.get('ledger_date')||dateKey(new Date()))};const hadEvidence=(state.ledgerPendingFiles||[]).length>0;const saved=await saveFundLedgerEntry(state.companyId,correctionPayload);let correctionId=ledgerEntryIdFromSave(saved);if(hadEvidence&&!correctionId){const [yy,mm]=correctionPayload.ledgerDate.split('-').map(Number);const fresh=await getFundTreasurySnapshot(state.companyId,yy||null,mm||null,200);const signed=correctionPayload.direction==='지출'?-Math.abs(correctionPayload.amount):Math.abs(correctionPayload.amount);const matches=(fresh?.ledger||[]).filter(r=>String(r.category||'')===correctionPayload.category&&String(r.account||'')===correctionPayload.account&&dateKey(r.ledger_date)===correctionPayload.ledgerDate&&Number(r.amount||0)===signed&&String(r.memo||'')===correctionPayload.memo);correctionId=String(matches.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')))[0]?.id||'');}if(hadEvidence&&!correctionId)throw new Error('정정은 반영됐지만 첨부사진 연결 대상을 확인하지 못했습니다. 새 정정 내역의 수정 화면에서 사진을 다시 첨부해 주세요.');if(correctionId)await uploadLedgerPendingEvidence(correctionId);clearLedgerPendingFiles();state.modal=null;await loadFundSnapshot();setNotice(hadEvidence?'정정 차액과 첨부사진을 반영했습니다.':'원본을 보존한 상태로 정정 차액을 반영했습니다.');return;}
    if(type==='platform-subscription'){if(!state.platformAdmin)throw new Error('PLATFORM OWNER 권한이 필요합니다.');const companyId=String(data.get('company_id')||'');const toIso=(v,end=false)=>{const s=String(v||'').trim();if(!s)return null;return new Date(`${s}T${end?'23:59:59':'00:00:00'}+09:00`).toISOString();};await updatePlatformSubscription(companyId,{plan:String(data.get('plan')||'standard'),status:String(data.get('status')||'active'),startsAt:toIso(data.get('starts_at')),endsAt:toIso(data.get('ends_at'),true),graceUntil:toIso(data.get('grace_until'),true),memo:String(data.get('memo')||'').trim()});await loadCompanies();state.platformSnapshot=await getPlatformCompanies();const changed=applyPlatformCompanyVisibility();if(changed)await loadCompanyData();state.modal=null;setNotice('구독 정보를 저장했습니다.');return;}
    if(type==='company-delete'){
      if(!state.platformAdmin)throw new Error('회사 삭제는 PLATFORM OWNER만 할 수 있습니다.');
      const companyId=String(data.get('company_id')||'').trim();
      const expectedName=String(data.get('company_name')||'').trim();
      const confirmName=String(data.get('confirm_name')||'').trim();
      if(!companyId||!expectedName)throw new Error('삭제할 회사 정보를 확인하지 못했습니다.');
      if(confirmName!==expectedName)throw new Error('회사 이름이 일치하지 않습니다. 표시된 회사 이름을 정확히 입력해 주세요.');
      const deletingCurrent=String(state.companyId||'')===companyId;
      await deletePlatformCompany(companyId,confirmName);
      state.modal=null; state.platformPage=1;
      await loadCompanies();
      state.platformSnapshot=await getPlatformCompanies();
      await Promise.all([loadPlatformSupport(),loadPlatformSuggestions()]);
      if(deletingCurrent) await loadCompanyData();
      setNotice(`회사 ${expectedName}을(를) 삭제했습니다.`);
      return;
    }
    if(type==='member'){const id=String(data.get('membership_id'));const row=state.memberships.find(m=>m.id===id);const role=String(data.get('role'));const status=String(data.get('status'));const aliasName=String(data.get('alias_name')||'').trim();const employmentStartedOn=String(data.get('employment_started_on')||'');const memberNote=String(data.get('member_note')||'').trim();if(String(row.alias_name||'')!==aliasName)await updateMembershipAlias(id,aliasName);if(row.role!==role)await updateMembershipRole(id,role);if(row.status!==status)await updateMembershipStatus(id,status);if(String(row.employment_started_on||'')!==employmentStartedOn)await updateMembershipEmploymentDate(id,employmentStartedOn);if(String(row.member_note||'')!==memberNote)await updateMembershipNote(id,memberNote);state.modal=null;await loadCompanyData();setNotice('멤버 정보를 저장했습니다.');return;}
    if(type==='asset'){let membershipId=String(data.get('membership_id')||'')||null;let status=String(data.get('status')||'').trim()||(membershipId?'보유':'미배정');if(status==='미배정')membershipId=null;if(membershipId)status='보유';const holder=membershipId?(state.assetsSnapshot?.members||[]).find(m=>m.id===membershipId):null;const assetId=String(data.get('asset_id')||'')||null;const existing=assetId?(state.assetsSnapshot?.assets||[]).find(a=>a.id===assetId):null;await saveWebAsset(state.companyId,{assetId,legacyNo:existing?.legacy_no||null,membershipId,ownerName:holder?.display_name||'미배정',category:String(data.get('asset_category')||'기타').trim(),name:String(data.get('asset_name')||'').trim(),acquisitionMethod:String(data.get('acquisition_method')||'').trim()||null,status,note:String(data.get('note')||'').trim()||null});state.modal=null;await loadAssetsAndAccounts();setNotice(membershipId?'자산을 저장하고 보유자를 배정했습니다.':'자산을 미배정 상태로 저장했습니다.');return;}
    if(type==='account-request'){await submitWebAccountRequest(state.companyId,String(data.get('account')||''),String(data.get('note')||''));state.modal=null;await loadAssetsAndAccounts();setNotice('계좌 등록·변경 신청을 제출했습니다.');return;}
    if(type==='fund-balance'){const game=Number(data.get('game_balance'));if(!Number.isFinite(game)||game<0)throw new Error('게임 내 공용계좌 잔액을 확인해 주세요.');const settings={...(state.companySettings?.settings||{}),fund_balance_check:{game_balance:game,note:String(data.get('note')||'').trim(),calculated_balance:Number(state.fundSnapshot?.balance?.public||0),checked_at:new Date().toISOString()}};await updateCompanySettings(state.companyId,{settings},state.session.user.id);state.companySettings=await getCompanySettings(state.companyId);setNotice('잔액 점검을 저장했습니다.');return;}
    if(type==='fund-fee-rule'){const feeMonth=String(data.get('fee_month')||state.fundMonth||state.currentMonth);const [feeYear,feeMonthNo]=feeMonth.split('-').map(Number);if(!feeYear||!feeMonthNo)throw new Error('적용 월을 확인해 주세요.');await setFundFeeRule(state.companyId,feeYear,feeMonthNo,Number(data.get('week')),Number(data.get('weekly_fee')),'WEB 공금 설정');const settings={...(state.companySettings?.settings||{}),fund_default_account:String(data.get('default_account')||'공용계좌')};await updateCompanySettings(state.companyId,{settings},state.session.user.id);state.companySettings=await getCompanySettings(state.companyId);state.fundMonth=feeMonth;await loadFundSnapshot();setNotice(`${feeYear}년 ${feeMonthNo}월 공금 설정을 저장했습니다.`);return;}
    if(type==='cooking-guide'){
      if(!canAdmin(state))throw new Error('요리 주문 안내 관리는 OWNER 또는 관리자만 가능합니다.');
      const membershipId=currentMembership(state)?.id||null;
      if(!membershipId)throw new Error('현재 회사 멤버 정보를 확인하지 못했습니다.');
      state.cookingDiscordConfig=await saveCookingDiscordGuide(state.companyId,{
        scheduleText:String(data.get('schedule_text')||''),
        extraGuide:String(data.get('extra_guide')||''),
      },membershipId);
      setNotice('Discord 요리 주문 안내를 저장했습니다.');return;
    }
    if(type==='cooking-menu'){
      if(!canAdmin(state))throw new Error('요리 메뉴 관리는 OWNER 또는 관리자만 가능합니다.');
      const existingKey=String(data.get('type_key')||'').trim();
      const randomPart=(globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`).replace(/-/g,'').slice(0,12);
      const typeKey=existingKey||`m_${randomPart}`;
      const label=String(data.get('label')||'').trim(); const shortLabel=String(data.get('short_label')||'').trim();
      if(!label)throw new Error('메뉴 이름을 입력해 주세요.');
      await saveCookingOrderType(state.companyId,{typeKey,label,shortLabel:shortLabel||label,detail:String(data.get('detail')||'').trim(),pricePerSet:Number(data.get('price_per_set')||0),sortOrder:Number(data.get('sort_order')||0),enabled:data.get('enabled')==='on'});
      state.cookingOrderTypes=await getCookingOrderTypes(state.companyId); state.modal=null;
      setNotice(existingKey?'요리 메뉴를 저장했습니다.':'요리 메뉴를 추가했습니다.');return;
    }
    if(type==='settings-basic'){
      const wasRoleStep=isOnboardingStep('roles');
      await saveBasicSettingsData(data,{requireOnboardingRoles:wasRoleStep});
      await loadCompanies();
      await loadBaseCompanyData();
      if(wasRoleStep || state.onboardingStatus?.current_step==='modules'){
        state.settingsTab='modules';
        localStorage.setItem('axe_product_settings_tab','modules');
      }
      setNotice(wasRoleStep?'역할 설정을 저장했습니다. 기능·채널 설정으로 이동합니다.':'기본 정보를 저장했습니다.');return;
    }
    if(type==='settings-modules'){
      const wasModuleStep=isOnboardingStep('modules');
      await saveModuleSettingsData(form,data);
      await loadBaseCompanyData();
      const completed=wasModuleStep && (String(state.onboardingStatus?.status||'')==='ready' || String(state.onboardingStatus?.current_step||'')==='complete');
      setNotice(completed?'초기 설정이 완료됐습니다.':'기능 설정을 저장했습니다.');return;
    }
  });
});

cleanupLegacyPwa();
boot();
