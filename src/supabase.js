import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const toRow = (job) => ({
  id: job.id,
  applied_date: job.appliedDate || null,
  company: job.company || null,
  company_website_url: job.companyWebsiteUrl || null,
  job_board: job.jobBoard || null,
  job_post_url: job.jobPostUrl || null,
  location: job.location || null,
  employment_type: job.employmentType || null,
  job_type: job.jobType || null,
  salary_range: job.salaryRange || null,
  monthly_pay: job.monthlyPay || null,
  work_hours: job.workHours || null,
  overtime: job.overtime || null,
  remote_condition: job.remoteCondition || null,
  side_job: job.sideJob || null,
  status: job.status || null,
  interview_date: job.interviewDate || null,
  interview_time: job.interviewTime || null,
  interview_method: job.interviewMethod || null,
  interview_url: job.interviewUrl || null,
  decline_reason: job.declineReason || null,
});

const fromRow = (row) => ({
  id: row.id,
  appliedDate: row.applied_date || "",
  company: row.company || "",
  companyWebsiteUrl: row.company_website_url || "",
  jobBoard: row.job_board || "",
  jobPostUrl: row.job_post_url || "",
  location: row.location || "",
  employmentType: row.employment_type || "",
  jobType: row.job_type || "",
  salaryRange: row.salary_range || "",
  monthlyPay: row.monthly_pay || "",
  workHours: row.work_hours || "",
  overtime: row.overtime || "",
  remoteCondition: row.remote_condition || "",
  sideJob: row.side_job || "",
  status: row.status || "書類選考中",
  interviewDate: row.interview_date || "",
  interviewTime: row.interview_time || "",
  interviewMethod: row.interview_method || "オンライン",
  interviewUrl: row.interview_url || "",
  declineReason: row.decline_reason || "",
});

export const dbLoadJobs = async () => {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow);
};

export const dbSaveJob = async (job) => {
  const row = toRow(job);
  const { data, error } = await supabase
    .from("jobs")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
};

export const dbDeleteJob = async (id) => {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
};

// ai_judgments テーブル用
const toAiRow = (job) => ({
  id: job.id,
  company_name: job.company_name || null,
  position: job.position || null,
  location: job.location || null,
  salary: job.salary || null,
  employee_count: job.employee_count ? String(job.employee_count) : null,
  fixed_overtime: job.fixed_overtime || null,
  company_type: job.company_type || null,
  has_web_production: job.has_web_production || false,
  has_direction_or_planning: job.has_direction_or_planning || false,
  is_production_company: job.is_production_company || false,
  has_ai_usage: job.has_ai_usage || false,
  side_job_ok: job.side_job_ok ?? null,
  work_style: job.work_style || "office",
  ng_triggered: job.ng_triggered || false,
  ng_reasons: job.ng_reasons || [],
  strengths: job.strengths || [],
  concerns: job.concerns || [],
  unknowns: job.unknowns || [],
  missing_info_priority: job.missing_info_priority || [],
  comment: job.comment || null,
  job_category: job.job_category || [],
  job_text: job.jobText || null,
  score: job.score || 0,
  judgment: job.judgment || null,
  priority: job.priority || null,
  judged_at: job.judgedAt || new Date().toISOString(),
  applied: job.applied || false,
  linked_job_id: job.linked_job_id || null,
});

const fromAiRow = (row) => ({
  id: row.id,
  company_name: row.company_name || "",
  position: row.position || "",
  location: row.location || "",
  salary: row.salary || "",
  employee_count: row.employee_count || null,
  fixed_overtime: row.fixed_overtime || null,
  company_type: row.company_type || "",
  has_web_production: row.has_web_production || false,
  has_direction_or_planning: row.has_direction_or_planning || false,
  is_production_company: row.is_production_company || false,
  has_ai_usage: row.has_ai_usage || false,
  side_job_ok: row.side_job_ok ?? null,
  work_style: row.work_style || "office",
  ng_triggered: row.ng_triggered || false,
  ng_reasons: row.ng_reasons || [],
  strengths: row.strengths || [],
  concerns: row.concerns || [],
  unknowns: row.unknowns || [],
  missing_info_priority: row.missing_info_priority || [],
  comment: row.comment || "",
  job_category: row.job_category || [],
  jobText: row.job_text || "",
  score: row.score || 0,
  judgment: row.judgment || "×",
  priority: row.priority || "D",
  judgedAt: row.judged_at || new Date().toISOString(),
  applied: row.applied || false,
  linked_job_id: row.linked_job_id || null,
});

export const dbLoadAiJudgments = async () => {
  const { data, error } = await supabase
    .from("ai_judgments")
    .select("*")
    .order("judged_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(fromAiRow);
};

export const dbSaveAiJudgment = async (job) => {
  const { error } = await supabase
    .from("ai_judgments")
    .upsert(toAiRow(job), { onConflict: "id" });
  if (error) throw error;
};

export const dbDeleteAiJudgment = async (id) => {
  const { error } = await supabase.from("ai_judgments").delete().eq("id", id);
  if (error) throw error;
};

export const dbDeleteAllJobs = async () => {
  // ai_judgments は linked_job_id の ON DELETE CASCADE で自動削除される
  // ただし linked_job_id が null のものは別途削除
  await supabase.from("ai_judgments").delete().is("linked_job_id", null);
  await supabase.from("jobs").delete().neq("id", "___never___");
};
