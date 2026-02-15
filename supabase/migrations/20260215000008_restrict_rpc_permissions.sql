-- security definer RPC 함수 권한 제한
-- public(anon, authenticated) 사용자의 직접 호출 차단, service_role만 허용

revoke all on function public.find_similar_group(text, text, float, integer) from public;
revoke all on function public.find_similar_group(text, text, float, integer) from anon;
revoke all on function public.find_similar_group(text, text, float, integer) from authenticated;
grant execute on function public.find_similar_group(text, text, float, integer) to service_role;

revoke all on function public.increment_article_count(uuid) from public;
revoke all on function public.increment_article_count(uuid) from anon;
revoke all on function public.increment_article_count(uuid) from authenticated;
grant execute on function public.increment_article_count(uuid) to service_role;
