import { neon } from "@neondatabase/serverless";

const sendJson = (res, status, data) => {
  res.status(status).json(data);
};

const getDb = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sql = getDb();
  const { action } = req.query;

  try {
    // ── jobs ──────────────────────────────────────────
    if (action === "load-jobs") {
      const rows = await sql`SELECT * FROM jobs ORDER BY created_at DESC`;
      return sendJson(res, 200, rows);
    }

    if (action === "save-job") {
      const j = req.body;
      const rows = await sql`
        INSERT INTO jobs (
          id, applied_date, company, company_website_url, job_board, job_post_url,
          location, employment_type, job_type, salary_range, monthly_pay,
          work_hours, overtime, remote_condition, side_job, status,
          interview_date, interview_time, interview_method, interview_url, decline_reason
        ) VALUES (
          ${j.id}, ${j.applied_date}, ${j.company}, ${j.company_website_url},
          ${j.job_board}, ${j.job_post_url}, ${j.location}, ${j.employment_type},
          ${j.job_type}, ${j.salary_range}, ${j.monthly_pay}, ${j.work_hours},
          ${j.overtime}, ${j.remote_condition}, ${j.side_job}, ${j.status},
          ${j.interview_date}, ${j.interview_time}, ${j.interview_method},
          ${j.interview_url}, ${j.decline_reason}
        )
        ON CONFLICT (id) DO UPDATE SET
          applied_date      = EXCLUDED.applied_date,
          company           = EXCLUDED.company,
          company_website_url = EXCLUDED.company_website_url,
          job_board         = EXCLUDED.job_board,
          job_post_url      = EXCLUDED.job_post_url,
          location          = EXCLUDED.location,
          employment_type   = EXCLUDED.employment_type,
          job_type          = EXCLUDED.job_type,
          salary_range      = EXCLUDED.salary_range,
          monthly_pay       = EXCLUDED.monthly_pay,
          work_hours        = EXCLUDED.work_hours,
          overtime          = EXCLUDED.overtime,
          remote_condition  = EXCLUDED.remote_condition,
          side_job          = EXCLUDED.side_job,
          status            = EXCLUDED.status,
          interview_date    = EXCLUDED.interview_date,
          interview_time    = EXCLUDED.interview_time,
          interview_method  = EXCLUDED.interview_method,
          interview_url     = EXCLUDED.interview_url,
          decline_reason    = EXCLUDED.decline_reason
        RETURNING *`;
      return sendJson(res, 200, rows[0]);
    }

    if (action === "delete-job") {
      const { id } = req.body;
      await sql`DELETE FROM jobs WHERE id = ${id}`;
      return sendJson(res, 200, { ok: true });
    }

    // ── ai_judgments ──────────────────────────────────
    if (action === "load-ai-judgments") {
      const rows = await sql`SELECT * FROM ai_judgments ORDER BY judged_at DESC`;
      return sendJson(res, 200, rows);
    }

    if (action === "save-ai-judgment") {
      const j = req.body;
      await sql`
        INSERT INTO ai_judgments (
          id, company_name, position, location, salary, employee_count,
          fixed_overtime, company_type, has_web_production, has_direction_or_planning,
          is_production_company, has_ai_usage, side_job_ok, work_style,
          ng_triggered, ng_reasons, strengths, concerns, unknowns,
          missing_info_priority, comment, job_category, job_text,
          score, judgment, priority, judged_at, applied, linked_job_id
        ) VALUES (
          ${j.id}, ${j.company_name}, ${j.position}, ${j.location}, ${j.salary},
          ${j.employee_count}, ${j.fixed_overtime}, ${j.company_type},
          ${j.has_web_production}, ${j.has_direction_or_planning},
          ${j.is_production_company}, ${j.has_ai_usage}, ${j.side_job_ok},
          ${j.work_style}, ${j.ng_triggered},
          ${JSON.stringify(j.ng_reasons)}, ${JSON.stringify(j.strengths)},
          ${JSON.stringify(j.concerns)}, ${JSON.stringify(j.unknowns)},
          ${JSON.stringify(j.missing_info_priority)},
          ${j.comment}, ${JSON.stringify(j.job_category)}, ${j.job_text},
          ${j.score}, ${j.judgment}, ${j.priority}, ${j.judged_at},
          ${j.applied}, ${j.linked_job_id}
        )
        ON CONFLICT (id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          position = EXCLUDED.position,
          score = EXCLUDED.score,
          judgment = EXCLUDED.judgment,
          priority = EXCLUDED.priority,
          ng_triggered = EXCLUDED.ng_triggered,
          ng_reasons = EXCLUDED.ng_reasons,
          strengths = EXCLUDED.strengths,
          concerns = EXCLUDED.concerns,
          comment = EXCLUDED.comment,
          applied = EXCLUDED.applied,
          judged_at = EXCLUDED.judged_at`;
      return sendJson(res, 200, { ok: true });
    }

    if (action === "delete-ai-judgment") {
      const { id } = req.body;
      await sql`DELETE FROM ai_judgments WHERE id = ${id}`;
      return sendJson(res, 200, { ok: true });
    }

    if (action === "delete-all") {
      await sql`DELETE FROM ai_judgments WHERE linked_job_id IS NULL`;
      await sql`DELETE FROM jobs`;
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 400, { error: "Unknown action" });

  } catch (e) {
    console.error(e);
    return sendJson(res, 500, { error: e.message });
  }
}
