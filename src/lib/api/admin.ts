import { supabase } from '../supabase';
import { unwrap } from '../errors';
import type { AdminConfession, AdminReport, ConfessionFeedRow, ConfessionScope } from '@/types/db';

export async function listReports(status: 'open' | 'reviewing' | 'actioned' | 'dismissed' | 'all' = 'open'): Promise<AdminReport[]> {
  const res = await supabase.rpc('admin_list_reports', { p_status: status });
  return unwrap<AdminReport[]>(res) ?? [];
}

export async function resolveReport(id: string, action: 'reviewing' | 'actioned' | 'dismissed'): Promise<void> {
  const res = await supabase.rpc('admin_resolve_report', { p_id: id, p_status: action });
  unwrap(res as { data: unknown; error: unknown });
}

export async function listPendingConfessions(): Promise<ConfessionFeedRow[]> {
  const res = await supabase.rpc('admin_list_pending_confessions');
  return unwrap<ConfessionFeedRow[]>(res) ?? [];
}

export async function reviewConfession(id: string, approve: boolean): Promise<void> {
  const res = await supabase.rpc('admin_review_confession', { p_id: id, p_approve: approve });
  unwrap(res as { data: unknown; error: unknown });
}

/** Admin list WITH the author's name. Needs supabase/phase5_confessions.sql. */
export async function listAdminConfessions(scope: ConfessionScope = 'pending'): Promise<AdminConfession[]> {
  const res = await supabase.rpc('admin_list_confessions', { p_scope: scope });
  return unwrap<AdminConfession[]>(res) ?? [];
}

/** Admin can delete any confession at any time. */
export async function deleteConfession(id: string): Promise<void> {
  const res = await supabase.rpc('admin_delete_confession', { p_id: id });
  unwrap(res as { data: unknown; error: unknown });
}
