import { supabase } from './supabase.js';

const assertClient = () => { if (!supabase) throw new Error('Supabase 연결을 확인해 주세요.'); };
const resultData = (result, message) => {
  if (result.error) throw new Error(`${message} ${result.error.message || ''}`.trim());
  return result.data;
};

export async function loadHubBoardList(isAdmin = false) {
  assertClient();
  // RLS, not isAdmin, decides which private tickets may be returned.
  const [notices,tickets] = await Promise.all([
    supabase.from('hub_notices').select('id,title,body,published_at').order('published_at',{ascending:false}).limit(30),
    supabase.from('hub_tickets').select('id,author_id,author_name,content_key,category,title,status,created_at,updated_at').order('updated_at',{ascending:false}).limit(isAdmin?150:80),
  ]);
  return {notices:resultData(notices,'공지 조회에 실패했습니다.')||[],tickets:resultData(tickets,'문의 조회에 실패했습니다.')||[]};
}
export async function createHubTicket({contentKey,category,title,body}) {
  assertClient();
  const result=await supabase.rpc('hub_board_create',{p_content_key:contentKey,p_category:category,p_title:title,p_body:body});
  return resultData(result,'게시글 등록에 실패했습니다.');
}
export async function loadHubTicket(ticketId) {
  assertClient();
  const ticket=resultData(await supabase.from('hub_tickets').select('id,author_id,author_name,content_key,category,title,body,status,created_at,updated_at').eq('id',ticketId).single(),'게시글을 불러오지 못했습니다.');
  const [messages,attachments]=await Promise.all([
    supabase.from('hub_ticket_messages').select('id,ticket_id,author_id,author_name,is_staff,body,created_at').eq('ticket_id',ticketId).order('created_at',{ascending:true}).limit(100),
    supabase.from('hub_ticket_attachments').select('id,ticket_id,message_id,storage_path,file_name,mime_type,size_bytes,created_at').eq('ticket_id',ticketId).order('created_at',{ascending:true}).limit(150),
  ]);
  return {...ticket,messages:resultData(messages,'답변을 불러오지 못했습니다.')||[],attachments:resultData(attachments,'첨부파일을 불러오지 못했습니다.')||[]};
}
export async function replyHubTicket(ticketId, body) {
  assertClient();
  return resultData(await supabase.rpc('hub_board_reply',{p_ticket_id:ticketId,p_body:body}),'답변 등록에 실패했습니다.');
}
export async function setHubTicketStatus(ticketId,status) {
  assertClient();
  resultData(await supabase.rpc('hub_board_set_status',{p_ticket_id:ticketId,p_status:status}),'처리 상태를 변경하지 못했습니다.');
}
export async function publishHubNotice(title,body) {
  assertClient();
  return resultData(await supabase.rpc('hub_board_publish_notice',{p_title:title,p_body:body}),'공지 등록에 실패했습니다.');
}
const BOARD_BUCKET='lac-hub-board-images';
const MIME_EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
export function checkHubBoardFiles(files) {
  const selected=Array.from(files||[]);
  if(selected.length>5) throw new Error('사진은 한 번에 최대 5장까지 첨부할 수 있습니다.');
  for(const file of selected){
    if(!MIME_EXT[file.type]) throw new Error('사진은 JPG, PNG, WEBP 형식만 첨부할 수 있습니다.');
    if(!file.size || file.size>10485760) throw new Error('사진 한 장은 10MB 이하로 첨부해 주세요.');
  }
  return selected;
}
export async function uploadHubBoardFiles(ticketId, messageId, userId, files){
  assertClient();
  const selected=checkHubBoardFiles(files);
  for(const file of selected){
    const path=`${userId}/${ticketId}/${crypto.randomUUID()}.${MIME_EXT[file.type]}`;
    resultData(await supabase.storage.from(BOARD_BUCKET).upload(path,file,{contentType:file.type,cacheControl:'300',upsert:false}),'사진 업로드에 실패했습니다.');
    const meta=await supabase.from('hub_ticket_attachments').insert({ticket_id:ticketId,message_id:messageId||null,author_id:userId,storage_path:path,file_name:file.name||'첨부 사진',mime_type:file.type,size_bytes:file.size});
    if(meta.error){
      // Do not leave an unregistered blob on a metadata-insert failure.
      await supabase.storage.from(BOARD_BUCKET).remove([path]).catch(()=>{});
      throw new Error(`사진 연결에 실패했습니다. ${meta.error.message||''}`.trim());
    }
  }
}
export async function hubBoardImageUrl(storagePath){
  assertClient();
  const result=await supabase.storage.from(BOARD_BUCKET).createSignedUrl(storagePath,600);
  const data=resultData(result,'사진을 열지 못했습니다.');
  if(!data?.signedUrl)throw new Error('사진 임시 주소를 만들지 못했습니다.');
  return data.signedUrl;
}
