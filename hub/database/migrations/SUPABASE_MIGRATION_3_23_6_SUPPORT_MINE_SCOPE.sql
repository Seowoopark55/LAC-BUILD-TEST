-- AXE PRODUCT 3.23.6
-- Question board: "내 질문" scope metadata + explicit reply capability flags.
-- Safe additive/replace patch for axe_product schema.

begin;

create or replace function axe_product.web_support_list_questions(
  p_company_id uuid,
  p_limit integer default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_platform boolean := axe_product.platform_is_admin();
  v_member boolean;
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 200));
  v_counts jsonb;
  v_items jsonb;
begin
  select exists(
    select 1
    from axe_product.company_memberships cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status, 'active') = 'active'
  ) into v_member;

  if not v_platform and not v_member then
    raise exception 'company membership required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'pending', count(*) filter (where q.status = 'pending'),
    'checking', count(*) filter (where q.status = 'checking'),
    'complete', count(*) filter (where q.status = 'complete'),
    'unread', count(*) filter (
      where case
        when v_platform then q.platform_unread
        else (q.customer_unread and q.created_by_user_id = auth.uid())
      end
    ),
    'mine', count(*) filter (where q.created_by_user_id = auth.uid()),
    'total', count(*)
  )
  into v_counts
  from axe_product.support_questions q
  where q.company_id = p_company_id;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.last_message_at desc), '[]'::jsonb)
  into v_items
  from (
    select
      q.id,
      q.company_id,
      q.title,
      left(q.body, 260) as body_preview,
      q.status,
      q.author_name,
      q.created_at,
      q.updated_at,
      q.last_message_at,
      q.answered_at,
      q.dm_notified_at,
      (q.created_by_user_id = auth.uid()) as is_mine,
      case
        when v_platform then q.platform_unread
        else (q.customer_unread and q.created_by_user_id = auth.uid())
      end as unread,
      (1 + (
        select count(*)
        from axe_product.support_question_messages m
        where m.question_id = q.id
      ))::integer as message_count
    from axe_product.support_questions q
    where q.company_id = p_company_id
    order by q.last_message_at desc
    limit v_limit
  ) x;

  return jsonb_build_object(
    'configured', true,
    'counts', coalesce(
      v_counts,
      jsonb_build_object('pending',0,'checking',0,'complete',0,'unread',0,'mine',0,'total',0)
    ),
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$$;

create or replace function axe_product.web_support_get_question(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_q axe_product.support_questions%rowtype;
  v_platform boolean := axe_product.platform_is_admin();
  v_member boolean;
  v_messages jsonb;
  v_root_attachments jsonb;
begin
  select * into v_q
  from axe_product.support_questions
  where id = p_question_id;

  if not found then
    raise exception '질문을 찾을 수 없습니다.' using errcode = '22023';
  end if;

  select exists(
    select 1
    from axe_product.company_memberships cm
    where cm.company_id = v_q.company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status, 'active') = 'active'
  ) into v_member;

  if not v_platform and not v_member then
    raise exception 'question access denied' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'storage_path', a.storage_path,
    'file_name', a.file_name,
    'mime_type', a.mime_type,
    'size_bytes', a.size_bytes,
    'created_at', a.created_at
  ) order by a.created_at asc), '[]'::jsonb)
  into v_root_attachments
  from axe_product.support_question_attachments a
  where a.question_id = v_q.id and a.message_id is null;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'author_type', m.author_type,
    'author_name', m.author_name,
    'body', m.body,
    'created_at', m.created_at,
    'attachments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'storage_path', a.storage_path,
        'file_name', a.file_name,
        'mime_type', a.mime_type,
        'size_bytes', a.size_bytes,
        'created_at', a.created_at
      ) order by a.created_at asc)
      from axe_product.support_question_attachments a
      where a.message_id = m.id
    ), '[]'::jsonb)
  ) order by m.created_at asc), '[]'::jsonb)
  into v_messages
  from axe_product.support_question_messages m
  where m.question_id = v_q.id;

  return jsonb_build_object(
    'id', v_q.id,
    'company_id', v_q.company_id,
    'company_name', (select c.name from axe_product.companies c where c.id = v_q.company_id),
    'title', v_q.title,
    'body', v_q.body,
    'status', v_q.status,
    'author_name', v_q.author_name,
    'created_at', v_q.created_at,
    'updated_at', v_q.updated_at,
    'last_message_at', v_q.last_message_at,
    'answered_at', v_q.answered_at,
    'dm_notified_at', v_q.dm_notified_at,
    'is_mine', (v_q.created_by_user_id = auth.uid()),
    'unread', case
      when v_platform then v_q.platform_unread
      else (v_q.customer_unread and v_q.created_by_user_id = auth.uid())
    end,
    'viewer_is_platform', v_platform,
    -- Only the AXE PRODUCT platform owner/admin path can write an answer.
    'viewer_can_answer', v_platform,
    -- Company users never answer one another. Only the original author can add a follow-up.
    'viewer_can_follow_up', (not v_platform and v_q.created_by_user_id = auth.uid()),
    -- Backward-compatible flag for older web clients.
    'viewer_can_reply', (v_platform or v_q.created_by_user_id = auth.uid()),
    'viewer_can_delete', (v_platform or v_q.created_by_user_id = auth.uid()),
    'attachments', coalesce(v_root_attachments, '[]'::jsonb),
    'messages', coalesce(v_messages, '[]'::jsonb)
  );
end;
$$;

commit;
