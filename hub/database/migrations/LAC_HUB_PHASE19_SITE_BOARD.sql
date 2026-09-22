-- LAC HUB Phase 19 / separate site-wide private support board.
-- Execute once in the existing Supabase project SQL Editor BEFORE deploying Phase 19.
-- Existing axe_product.support_questions / suggestions and attachments are untouched.
-- Only authenticated Discord accounts may submit; a company membership is NOT required.
begin;

create table if not exists axe_product.hub_tickets (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id),
  author_name text not null default 'Discord 사용자',
  content_key text not null check(content_key in ('company','game_info','build','cook','hub')),
  category text not null check(category in ('question','suggestion','bug')),
  title text not null check(char_length(btrim(title)) between 2 and 120),
  body text not null check(char_length(btrim(body)) between 2 and 4000),
  status text not null default 'pending' check(status in ('pending','checking','complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hub_tickets_owner_recent on axe_product.hub_tickets(author_id,updated_at desc);
create index if not exists hub_tickets_queue on axe_product.hub_tickets(status,updated_at desc);

create table if not exists axe_product.hub_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references axe_product.hub_tickets(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  author_name text not null,
  is_staff boolean not null default false,
  body text not null check(char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists hub_ticket_messages_thread on axe_product.hub_ticket_messages(ticket_id,created_at);

create table if not exists axe_product.hub_ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references axe_product.hub_tickets(id) on delete cascade,
  message_id uuid references axe_product.hub_ticket_messages(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes bigint not null check(size_bytes between 1 and 10485760),
  created_at timestamptz not null default now()
);
create index if not exists hub_ticket_attachments_thread on axe_product.hub_ticket_attachments(ticket_id,message_id);

create table if not exists axe_product.hub_notices (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id),
  title text not null check(char_length(btrim(title)) between 2 and 120),
  body text not null check(char_length(btrim(body)) between 2 and 4000),
  published_at timestamptz not null default now()
);
create index if not exists hub_notices_recent on axe_product.hub_notices(published_at desc);

alter table axe_product.hub_tickets enable row level security;
alter table axe_product.hub_ticket_messages enable row level security;
alter table axe_product.hub_ticket_attachments enable row level security;
alter table axe_product.hub_notices enable row level security;
revoke all on axe_product.hub_tickets,axe_product.hub_ticket_messages,axe_product.hub_ticket_attachments,axe_product.hub_notices from public, anon, authenticated;
grant select on axe_product.hub_tickets,axe_product.hub_ticket_messages,axe_product.hub_ticket_attachments,axe_product.hub_notices to authenticated;
grant insert on axe_product.hub_ticket_attachments to authenticated;

drop policy if exists hub_tickets_private_read on axe_product.hub_tickets;
create policy hub_tickets_private_read on axe_product.hub_tickets for select to authenticated
 using(author_id=auth.uid() or axe_product.platform_is_admin());
drop policy if exists hub_messages_private_read on axe_product.hub_ticket_messages;
create policy hub_messages_private_read on axe_product.hub_ticket_messages for select to authenticated
 using(exists(select 1 from axe_product.hub_tickets t where t.id=ticket_id and (t.author_id=auth.uid() or axe_product.platform_is_admin())));
drop policy if exists hub_attachments_private_read on axe_product.hub_ticket_attachments;
create policy hub_attachments_private_read on axe_product.hub_ticket_attachments for select to authenticated
 using(exists(select 1 from axe_product.hub_tickets t where t.id=ticket_id and (t.author_id=auth.uid() or axe_product.platform_is_admin())));
drop policy if exists hub_attachments_user_insert on axe_product.hub_ticket_attachments;
create policy hub_attachments_user_insert on axe_product.hub_ticket_attachments for insert to authenticated
 with check(
    author_id=auth.uid()
    and split_part(storage_path,'/',1)=auth.uid()::text
    and split_part(storage_path,'/',2)=ticket_id::text
    and exists(select 1 from axe_product.hub_tickets t where t.id=ticket_id and (t.author_id=auth.uid() or axe_product.platform_is_admin()))
    and (message_id is null or exists(select 1 from axe_product.hub_ticket_messages m where m.id=message_id and m.ticket_id=ticket_id and m.author_id=auth.uid()))
    and (select count(*) from axe_product.hub_ticket_attachments a where a.ticket_id=hub_ticket_attachments.ticket_id and a.message_id is not distinct from hub_ticket_attachments.message_id)<5
 );
drop policy if exists hub_notices_authenticated_read on axe_product.hub_notices;
create policy hub_notices_authenticated_read on axe_product.hub_notices for select to authenticated using(true);

-- Security-definer writes: never trust a client-supplied author/status/staff flag.
create or replace function axe_product.hub_board_create(p_content_key text,p_category text,p_title text,p_body text)
returns uuid language plpgsql security definer set search_path to '' as $$
declare v_id uuid;v_uid uuid:=auth.uid();v_title text:=btrim(coalesce(p_title,''));v_body text:=btrim(coalesce(p_body,''));v_name text;
begin
 if v_uid is null then raise exception '로그인이 필요합니다.' using errcode='42501'; end if;
 if p_content_key not in ('company','game_info','build','cook','hub') or p_category not in ('question','suggestion','bug') then raise exception '콘텐츠와 문의 유형을 확인해 주세요.' using errcode='22023'; end if;
 if char_length(v_title) not between 2 and 120 or char_length(v_body) not between 2 and 4000 then raise exception '제목 2~120자, 내용 2~4000자로 입력해 주세요.' using errcode='22023'; end if;
 if (select count(*) from axe_product.hub_tickets where author_id=v_uid and created_at>now()-interval '24 hours')>=15 then raise exception '24시간 등록 한도를 초과했습니다.' using errcode='22023'; end if;
 if exists(select 1 from axe_product.hub_tickets where author_id=v_uid and title=v_title and created_at>now()-interval '60 seconds') then raise exception '방금 등록한 동일한 제목의 글이 있습니다.' using errcode='22023'; end if;
 v_name:=left(coalesce(nullif(btrim(auth.jwt()->'user_metadata'->>'full_name'),''),nullif(btrim(auth.jwt()->'user_metadata'->>'name'),''),'Discord 사용자'),70);
 insert into axe_product.hub_tickets(author_id,author_name,content_key,category,title,body) values(v_uid,v_name,p_content_key,p_category,v_title,v_body) returning id into v_id;
 return v_id;
end;$$;

create or replace function axe_product.hub_board_reply(p_ticket_id uuid,p_body text)
returns uuid language plpgsql security definer set search_path to '' as $$
declare v_uid uuid:=auth.uid();v_owner uuid;v_id uuid;v_staff boolean;v_name text;v_body text:=btrim(coalesce(p_body,''));
begin
 if v_uid is null then raise exception '로그인이 필요합니다.' using errcode='42501'; end if;
 select author_id into v_owner from axe_product.hub_tickets where id=p_ticket_id for update;
 if not found then raise exception '게시글을 찾을 수 없습니다.' using errcode='22023';end if;
 v_staff:=axe_product.platform_is_admin();
 if v_uid<>v_owner and not v_staff then raise exception '접근 권한이 없습니다.' using errcode='42501';end if;
 if char_length(v_body) not between 1 and 4000 then raise exception '답변은 1~4000자로 입력해 주세요.' using errcode='22023';end if;
 if (select count(*) from axe_product.hub_ticket_messages where ticket_id=p_ticket_id and created_at>now()-interval '1 minute' and author_id=v_uid)>=5 then raise exception '잠시 후 다시 등록해 주세요.' using errcode='22023';end if;
 v_name:=case when v_staff then 'LAC HUB 운영자' else '작성자' end;
 insert into axe_product.hub_ticket_messages(ticket_id,author_id,author_name,is_staff,body) values(p_ticket_id,v_uid,v_name,v_staff,v_body) returning id into v_id;
 update axe_product.hub_tickets set updated_at=now(),status=case when not v_staff then 'pending' when status='pending' then 'checking' else status end where id=p_ticket_id;
 return v_id;
end;$$;

create or replace function axe_product.hub_board_set_status(p_ticket_id uuid,p_status text)
returns void language plpgsql security definer set search_path to '' as $$
begin
 if auth.uid() is null or not axe_product.platform_is_admin() then raise exception '운영자 권한이 필요합니다.' using errcode='42501';end if;
 if p_status not in ('pending','checking','complete') then raise exception '처리 상태가 올바르지 않습니다.' using errcode='22023';end if;
 update axe_product.hub_tickets set status=p_status,updated_at=now() where id=p_ticket_id;
 if not found then raise exception '게시글을 찾을 수 없습니다.' using errcode='22023';end if;
end;$$;

create or replace function axe_product.hub_board_publish_notice(p_title text,p_body text)
returns uuid language plpgsql security definer set search_path to '' as $$
declare v_id uuid;v_title text:=btrim(coalesce(p_title,''));v_body text:=btrim(coalesce(p_body,''));
begin
 if auth.uid() is null or not axe_product.platform_is_admin() then raise exception '운영자 권한이 필요합니다.' using errcode='42501';end if;
 if char_length(v_title) not between 2 and 120 or char_length(v_body) not between 2 and 4000 then raise exception '제목 2~120자, 내용 2~4000자로 입력해 주세요.' using errcode='22023';end if;
 insert into axe_product.hub_notices(author_id,title,body) values(auth.uid(),v_title,v_body) returning id into v_id;
 return v_id;
end;$$;

revoke all on function axe_product.hub_board_create(text,text,text,text),axe_product.hub_board_reply(uuid,text),axe_product.hub_board_set_status(uuid,text),axe_product.hub_board_publish_notice(text,text) from public,anon;
grant execute on function axe_product.hub_board_create(text,text,text,text),axe_product.hub_board_reply(uuid,text),axe_product.hub_board_set_status(uuid,text),axe_product.hub_board_publish_notice(text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('lac-hub-board-images','lac-hub-board-images',false,10485760,array['image/jpeg','image/png','image/webp']::text[])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- Prefix = authenticated user ID / valid private ticket ID / random image filename.
drop policy if exists lac_hub_board_image_read on storage.objects;
create policy lac_hub_board_image_read on storage.objects for select to authenticated
 using(bucket_id='lac-hub-board-images' and exists(
   select 1 from axe_product.hub_tickets t
   where t.id::text=split_part(name,'/',2) and
    (t.author_id=auth.uid() or axe_product.platform_is_admin())));
drop policy if exists lac_hub_board_image_upload on storage.objects;
create policy lac_hub_board_image_upload on storage.objects for insert to authenticated
 with check(bucket_id='lac-hub-board-images'
  and split_part(name,'/',1)=auth.uid()::text
  and lower(right(name,4)) in ('.jpg','.png','webp')
  and exists(select 1 from axe_product.hub_tickets t
    where t.id::text=split_part(name,'/',2)
    and (t.author_id=auth.uid() or axe_product.platform_is_admin())));
-- Upload rollback only: a user may remove their own blob if it has no metadata record.
drop policy if exists lac_hub_board_orphan_cleanup on storage.objects;
create policy lac_hub_board_orphan_cleanup on storage.objects for delete to authenticated
 using(bucket_id='lac-hub-board-images' and split_part(name,'/',1)=auth.uid()::text
  and not exists(select 1 from axe_product.hub_ticket_attachments a where a.storage_path=name));
commit;
