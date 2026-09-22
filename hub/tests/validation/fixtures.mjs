// Synthetic data only. Fixed dates/IDs; no real accounts or external services.
export function fixture(overrides={}) {
 const memberships=Array.from({length:18},(_,i)=>({id:`m${i}`,user_id:i===0?'test-user':`user${i}`,display_name:i===1?'테스트 매우 긴 멤버 이름 ABCDEFG':'테스트멤버'+String(i).padStart(2,'0'),discord_display_name:`fixture_discord_${i}`,role:i===0?'owner':i===1?'admin':'member',status:i===17?'left':'active',employment_started_on:'2026-01-05'}));
 const board={configured:true,counts:{pending:0,checking:0,complete:0,unread:0,total:0},items:[],error:''};
 return {
 envReady:true,session:{user:{id:'test-user',user_metadata:{full_name:'검증 OWNER'}}},ready:true,loading:false,error:'',notice:'',
 companies:[{id:'fixture-company',name:'AXE 검증 회사'}],companyId:'fixture-company',memberships,
 modules:['fund','assets','cooking','ammo','outlaw','modbook','pinball'].map(module_key=>({module_key,enabled:true,settings:{}})),moduleCatalog:[],
 page:'dashboard',currentMonth:'2026-09',fundMonth:'2026-09',fundWeeklyMonth:'2026-09',fundTab:'ledger',fundFilters:{person:'all',type:'all',account:'all'},fundLedgerPage:1,fundReviewPage:1,
 fundSnapshot:{balance:{public:123456789},fee_rules:[{weekly_fee:10000,week:1,enabled:true}],ledger:Array.from({length:18},(_,i)=>({id:`l${i}`,membership_id:`m${i}`,member_display_name:`테스트멤버${i}`,ledger_date:'2026-09-10',amount:i%2?-120000:1234567,entry_type:'manual',category:'테스트 내역',ledger_type:'직접기입',direction:i%2?'지출':'수입',account:'공용계좌',memo:i===1?'긴 메모 ABCDEFG 123456789 검증용':'검증용',can_edit:true}))},fundRequests:[],fundLedgerAttachments:[],ledgerPendingFiles:[],fundWeeklyFee:10000,fundWeeklyLoading:false,
 fundMonthlyRows:memberships.map(m=>({name:m.display_name,role:m.role,weeks:['완료','미납','면제','검수대기','예정']})),
 memberFilter:'all',memberRole:'',memberQuery:'',memberPage:1,
 assetsSnapshot:{assets:memberships.map((m,i)=>({id:`a${i}`,asset_name:`검증 차량 ${i}`,owner_name:m.display_name,membership_id:i%3?m.id:null,asset_category:'차량',acquisition_method:'구매',note:'검증 메모'})),returns:memberships.map((m,i)=>({id:`r${i}`,asset_name:`반납 차량 ${i}`,owner_name:m.display_name,checker_name:'테스트 OWNER',created_at:'2026-09-10T12:00:00Z',note:'검증 반납'}))},
 assetTab:'assets',assetQuery:'',assetCategory:'',assetStatus:'',assetPage:1,returnPage:1,
 accountsSnapshot:{accounts:memberships.map((m,i)=>({membership_id:m.id,display_name:m.display_name,role:m.role,member_status:m.status,account:String(10000000+i),enabled:true})),requests:[]},accountQuery:'',accountStatus:'',accountPage:1,
 cookingOrderTypes:Array.from({length:12},(_,i)=>({type_key:`food${i}`,label:`검증 메뉴 ${i}`,detail:'fixture 메뉴 설명',price_per_set:10000+i,sort_order:i,enabled:i%3!==0})),cookingDiscordConfig:{},cookingQuery:'',cookingStatus:'all',cookingPage:1,
 companySettings:{settings:{}},discordConnection:{status:'connected',guild_name:'검증 서버'},discordChannels:[{channel_id:'ch1',channel_name:'검증채널'}],discordRoles:[{role_id:'role1',role_name:'검증역할'}],discordCompanyConfig:{admin_role_id:'role1',member_role_id:'role1'},onboardingStatus:{status:'ready',catalog_ready:true,current_step:'complete'},settingsTab:'basic',
 platformAdmin:true,platformSnapshot:Array.from({length:9},(_,i)=>({company_id:`company${i}`,company_name:`검증 회사 ${i}`,guild_name:`검증 서버 ${i}`,member_count:18,effective_status:'active',subscription_status:'active',plan:'standard',ends_at:'2027-01-01',days_remaining:107,owner_name:'테스트 OWNER'})),platformSupport:structuredClone(board),platformSuggestions:structuredClone(board),platformQuery:'',platformStatus:'all',platformPage:1,platformView:'companies',currentSubscription:{effective_status:'active',status:'active'},
 questionBoard:structuredClone(board),suggestionBoard:structuredClone(board),questionStatus:'all',questionScope:'all',questionPage:1,suggestionStatus:'all',suggestionCategory:'all',suggestionPage:1,
 questionPendingFiles:[],suggestionPendingFiles:[],companyMenuOpen:false,accountMenuOpen:false,modal:null,setupGuide:null,setupDemo:null,testCenter:null,setupGuideDismissed:true,supportImageViewer:null,...overrides};
}
export const cases=[
 ['dashboard',{},null],
 ['fund',{page:'fund'},['.axe-fund-ledger-columns','.axe-fund-ledger-row',8,'.axe-fund-ledger-action']],
 ['weekly',{page:'fund',fundTab:'weekly'},['.axe-fund-week-row--head','.axe-fund-week-row:not(.axe-fund-week-row--head)',7,null]],
 ['review',{page:'fund',fundTab:'review',fundRequests:[{request_id:'req1',member_display_name:'검증 멤버',status:'pending',year:2026,month:9,week:1,amount:10000,payment_mode:'계좌'}]},['.axe-fund-review-columns','.axe-fund-review-row',7,'.axe-fund-review-actions']],
 ['members',{page:'members'},['.ops-lane-head--member','.ops-lane-row--member',6,'[data-action="edit-member"]']],
 ['assets',{page:'assets'},['.ops-lane-head--asset','.ops-lane-row--asset',7,'[data-action="edit-asset"]']],
 ['returns',{page:'assets',assetTab:'returns'},['.ops-lane-head--return','.ops-lane-row--return',6,null]],
 ['accounts',{page:'accounts'},['.ops-lane-head--account','.ops-lane-row--account',5,'.ops-mgmt-action']],
 ['cooking',{page:'settings',settingsTab:'cooking'},['.ops-cooking-menu-columns','.ops-cooking-menu-row',6,'[data-action="edit-cooking-menu"]']],
 ['settings',{page:'settings'},null],['modules',{page:'settings',settingsTab:'modules'},null],
 ['platform',{page:'platform'},['.platform-company-head','.platform-company-row',8,'.ops-mgmt-action']],
 ['modal',{page:'members',modal:{type:'member',membershipId:'m1'}},null],
 ['empty-members',{page:'members',memberships:[{id:'m0',user_id:'test-user',role:'owner',status:'active'}],memberQuery:'NO_MATCH'},null],
 ['empty-fund',{page:'fund',fundSnapshot:{balance:{public:0},ledger:[]}},null],
 ['empty-assets',{page:'assets',assetsSnapshot:{assets:[],returns:[]}},null],
 ['empty-accounts',{page:'accounts',accountsSnapshot:{accounts:[],requests:[]}},null],
 ['empty-cooking',{page:'settings',settingsTab:'cooking',cookingOrderTypes:[]},null],
 ['empty-platform',{page:'platform',platformSnapshot:[]},null],
 ['questions',{page:'questions'},null],['suggestions',{page:'suggestions'},null]
];
