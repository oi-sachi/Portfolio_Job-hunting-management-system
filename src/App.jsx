import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import { dbLoadJobs, dbSaveJob, dbDeleteJob, dbLoadAiJudgments, dbSaveAiJudgment, dbDeleteAiJudgment, dbDeleteAllJobs } from "./supabase";

const JOBS_KEY = "jt_sample_jobs_v1";
const DRAFT_KEY = "jt_sample_job_draft_v1";

const load = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const save = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // localStorage may be unavailable in private browsing or quota errors.
  }
};

const DAYS = ["日","月","火","水","木","金","土"];
const CALENDAR_COLUMNS = "repeat(7, minmax(0, 1fr))";
const STATUS_OPTIONS = ["書類選考中","一次面接","二次面接","最終面接","結果待ち","内定","内定辞退","不採用"];
const CELEBRATION_MESSAGES = {
  "一次面接": { title:"一次面接です。", message:"最初の一歩、しっかり前進しています。", tone:"soft", effect:"sparkle" },
  "二次面接": { title:"二次面接です。", message:"あなたは必要とされています。ちゃんと自信にして大丈夫です。", tone:"soft", effect:"sparkle" },
  "最終面接": { title:"最終面接です。", message:"深呼吸し、リラックスしてから挑みましょう。笑顔を忘れずに＾＾", tone:"lemon", effect:"sparkle" },
  "結果待ち": { title:"ここまで来ましたね。", message:"お疲れ様です。今日は自分を褒めてあげてください。", tone:"orange", effect:"petal" },
  "内定": { title:"内定おめでとうございます！", message:"これは大きな成果です。内定書を読んで、違和感があればどんどん質問しましょう。", tone:"offer", effect:"confetti" },
  "内定辞退": { title:"勇気ある決断をした！ よくがんばった！", message:"選ばない決断も、前に進むための大切な選択です。", tone:"purple", effect:"firework" },
  "不採用": { title:"記録しました", message:"あなたにとってベストな会社は他にあります。未来へ一歩進みましょう。", tone:"blue", effect:"none" },
};
const CELEBRATION_EFFECT_COUNTS = { sparkle:42, petal:34, confetti:78, firework:18 };
const detectJobBoardFromUrl = (url="") => {
  const text = String(url || "").toLowerCase();
  if (text.includes("bizreach.jp")) return "ビズリーチ";
  if (text.includes("daijob.com")) return "Daijob";
  if (text.includes("tenshoku.mynavi.jp")) return "マイナビ転職";
  if (text.includes("next.rikunabi.com")) return "リクナビNEXT";
  if (text.includes("massmedian.co.jp")) return "マスメディアン";
  if (text.includes("mid-tenshoku.com")) return "ミドルの転職";
  if (text.includes("employment.en-japan.com")) return "エン転職";
  if (text.includes("doda-x.jp")) return "doda X";
  if (text.includes("doda.jp")) return "doda";
  if (text.includes("scouting.mynavi.jp")) return "マイナビスカウティング";
  if (text.includes("directtype.jp")) return "Direct Type";
  if (text.includes("michaelpage.co.jp")) return "Michael Page";
  if (text.includes("levtech-direct.jp")) return "レバテック";
  if (text.includes("geekly.co.jp")) return "Geekly";
  if (text.includes("directscout.recruit.co.jp")) return "リクルートダイレクト";
  if (text.includes("openwork.jp")) return "OpenWork";
  if (text.includes("r-agent.com")) return "リクルートエージェント";  
  if (text.includes("moreworks.jp/")) return "MOREWORKS"; 
  if (text.includes("green-japan.com/")) return "Green"; 
  if (text.includes("baitoru.com")) return "バイトル"; 
  if (text.includes("baito.mynavi.jp")) return "マイナビバイト";    
  return "";
};

const formatJobBoardName = (value="") => {
  const text = String(value || "").trim();
  const lower = text.toLowerCase();
  if (!text) return "";
  if (lower === "daijob.com" || lower === "daijob") return "Daijob";
  if (lower.includes("bizreach")) return "ビズリーチ";
  if (lower.includes("mynavi") || text.includes("マイナビ")) return text.includes("スカウティング") ? "マイナビスカウティング" : "マイナビ転職";
  if (lower.includes("rikunabi") || text.includes("リクナビ")) return "リクナビNEXT";
  if (lower.includes("massmedian") || text.includes("マスメディアン")) return "マスメディアン";
  if (lower.includes("mid-tenshoku") || text.includes("ミドル")) return "ミドルの転職";
  if (lower.includes("en-japan") || text.includes("エン転職")) return "エン転職";
  if (lower === "doda x") return "doda X";
  if (lower === "doda") return "doda";
  if (lower.includes("direct type") || lower.includes("directtype")) return "Direct Type";
  if (lower.includes("michael page") || lower.includes("michaelpage")) return "Michael Page";
  if (lower.includes("levtech") || text.includes("レバテック")) return "レバテック";
  if (lower.includes("geekly")) return "Geekly";
  if (lower.includes("recruit direct") || lower.includes("directscout")) return "リクルートダイレクト";
  if (lower.includes("openwork")) return "OpenWork"; 
  if (lower.includes("recruit agent") || lower.includes("recruit agent")) return "リクルートエージェント";
  if (lower.includes("morework")) return "MOREWORKs";  
  return text;
};

const getJobBoardName = (job) => {
  if (!job.jobPostUrl) return "";
  return detectJobBoardFromUrl(job.jobPostUrl) || formatJobBoardName(job.jobBoard) || "自社サイト";
};
const getJobBoardLink = (job) => job.jobPostUrl || "";

const PREFECTURES = "北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県";
const PREF_RE = new RegExp("^(" + PREFECTURES + ")");

const normalizeLocation = (location="") => {
  const raw = String(location || "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower.includes("iwamachi") && lower.includes("osaka")) return "大阪府大阪市中央区岩町";
  if (lower.includes("sakaisuji-hommachi") || lower.includes("sakaisuji hommachi")) return "大阪府大阪市中央区";
  if (lower.includes("tokyo") && lower.includes("dogenzaka")) return "東京都渋谷区道玄坂";
  if (lower.includes("tokyo") && lower.includes("shibuya")) return "東京都渋谷区";
  if (lower.includes("tokyo") && lower.includes("ginza")) return "東京都中央区銀座";
  if (lower.includes("tokyo") && lower.includes("shinjuku")) return "東京都新宿区";
  if (lower.includes("tokyo") && lower.includes("minato")) return "東京都港区";
  if (lower.includes("tokyo")) return "東京都";
  if (lower.includes("osaka")) return "大阪府大阪市";
  if (lower.includes("kanagawa") || lower.includes("yokohama")) return "神奈川県横浜市";
  return raw.replace(/\s+/g, " ");
};

const escapeRegExp = (value="") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const removeCompanyFromLocation = (location="", company="") => {
  const raw = String(location || "").trim();
  const name = String(company || "").trim();
  if (!raw || !name) return raw;
  return raw
    .replace(new RegExp(`^\\s*${escapeRegExp(name)}\\s*[、,\\-/｜|\\s]*`, "i"), "")
    .replace(new RegExp(`[、,\\-/｜|\\s]*${escapeRegExp(name)}\\s*$`, "i"), "")
    .trim();
};

const getDetailedMapLocation = (location="") => {
  const raw = String(location || "").trim();
  const lower = raw.toLowerCase();
  if (lower.includes("iwamachi") && lower.includes("osaka")) {
    return "Osaka Sakaisuji L Tower 1-7-7 Iwamachi Chuo-ku Osaka City Osaka";
  }
  return raw;
};

const formatLocationForTable = (location="") => {
  const text = normalizeLocation(location);
  if (!text) return "";
  // 最寄り駅名を抽出（最初に出てくる「XX駅」）
  const stationMatch = text.match(/([^\s\u3000（(、,，・]+駅)/);
  if (stationMatch) return stationMatch[1];
  // 駅名がなければ 区+町名（3文字）まで
  const pref = text.match(PREF_RE)?.[1] || "";
  const rest = pref ? text.slice(pref.length) : text;
  const cityMatch = rest.match(/^(.+?[市区町村])/);
  if (!cityMatch) return text.split(/[\s\u3000]/)[0];
  const city = cityMatch[1];
  const afterCity = rest.slice(city.length).trim();
  const townMatch = afterCity.match(/^([^0-9０-９\s\u3000-ー−‐]+?)(?:[0-9０-９]|丁目|番|号|[-ー−‐]|\s|\u3000|$)/);
  const town = townMatch ? townMatch[1].slice(0, 3) : "";
  return `${city}${town}`;
};

const getCleanLocation = (job) => normalizeLocation(removeCompanyFromLocation(job.location, job.company));
const getMapUrl = (location="", company="") => {
  const cleanLocation = normalizeLocation(removeCompanyFromLocation(location, company));
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getDetailedMapLocation(cleanLocation) || cleanLocation || location)}`;
};
const formatYenAmount = (num) => `${Number(num).toLocaleString("ja-JP")}円`;
const formatMonthlyPay = (value="") => {
  const text = String(value || "").trim().replace(/^(月給|月収)\s*/g, "");
  if (!text) return "";
  const manRange = text.match(/([0-9０-９.]+)\s*(?:万(?:円)?)?\s*[-~〜～]\s*([0-9０-９.]+)\s*万(?:円)?/);
  if (manRange) {
    const min = Number(manRange[1].replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)));
    const max = Number(manRange[2].replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)));
    return `${formatYenAmount(min * 10000)}〜${formatYenAmount(max * 10000)}`;
  }
  const singleMan = text.match(/^([0-9０-９.]+)\s*万(?:円)?\s*[~〜～]?$/);
  if (singleMan) {
    const amount = Number(singleMan[1].replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)));
    return `${formatYenAmount(amount * 10000)}〜`;
  }
  return text
    .replace(/円?\s*[~～]\s*$/g, "円〜")
    .replace(/([0-9,])\s*[~～]\s*([0-9,])/g, "$1円〜$2")
    .replace(/^([0-9,]+)$/g, "$1円");
};

const formatWorkHours = (value="") => {
  const text = String(value || "").trim();
  if (!text) return "";

  const toHalfWidth = (input) => String(input || "").replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/　/g, " ");
  const to24Hour = (hour, minute, ampm = "") => {
    let h = Number(hour);
    const suffix = String(ampm || "").toLowerCase();
    if (suffix === "pm" && h < 12) h += 12;
    if (suffix === "am" && h === 12) h = 0;
    return String(h) + ":" + String(minute).padStart(2, "0");
  };

  const normalized = toHalfWidth(text)
    .replace(/～|~|－|–|—|\s+to\s+/gi, "〜")
    .replace(/a\.m\.|午前/gi, "AM")
    .replace(/p\.m\.|午後/gi, "PM");
  const range = normalized.match(/(\d{1,2})[:：](\d{2})\s*(AM|PM)?\s*[-〜]\s*(\d{1,2})[:：](\d{2})\s*(AM|PM)?/i);
  const startOnly = normalized.match(/(?:between|from|開始|始業|start(?: work)?(?: anytime)?(?: between)?)[^0-9]*(\d{1,2})[:：](\d{2})\s*(AM|PM)?/i) || normalized.match(/(\d{1,2})[:：](\d{2})\s*(AM|PM)?\s*〜/i);
  const hasFlex = /フレックス|フレックスタイム|flex/i.test(normalized);
  const flexStart = hasFlex ? startOnly : null;
  const flexNote = flexStart ? "（" + to24Hour(flexStart[1], flexStart[2], flexStart[3]) + "から就業可能）" : "";

  if (/コアタイム/i.test(normalized) && range) return "コアタイム " + to24Hour(range[1], range[2], range[3]) + "〜" + to24Hour(range[4], range[5], range[6]);
  if (range) return to24Hour(range[1], range[2], range[3]) + "〜" + to24Hour(range[4], range[5], range[6]) + flexNote;
  if (flexStart) return to24Hour(flexStart[1], flexStart[2], flexStart[3]) + "から就業可能";
  return hasFlex ? "" : normalized;
};

const formatOvertime = (value="") => {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalized = text.replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));

  // 平均XX〜XX時間/月 または 平均XX時間/月
  const avgRange = normalized.match(/平均\s*(\d+(?:\.\d+)?)\s*[~〜～]\s*(\d+(?:\.\d+)?)\s*時間/);
  const avgSingle = normalized.match(/平均\s*(\d+(?:\.\d+)?)\s*時間/);
  const avgText = avgRange
    ? `平均${avgRange[1]}〜${avgRange[2]}時間/月`
    : avgSingle ? `平均${avgSingle[1]}時間/月` : "";

  // 固定残業代 ￥XX〜￥XX（YY時間相当分）
  const fixedPay = normalized.match(/固定残業代[^（(¥￥\d]*([¥￥][\d,]+(?:\s*[~〜～]\s*[¥￥][\d,]+)?)\s*[（(][^）)]*[）)]/);
  const fixedPayText = fixedPay ? `※固定残業代${fixedPay[1]}（${fixedPay[0].match(/[（(]([^）)]+)[）)]/)?.[1]}）` : "";

  if (avgText) return avgText;

  const fixed = normalized.match(/(?:みなし残業|固定残業)[^0-9]*(\d+(?:\.\d+)?)\s*時間/);
  if (fixed) return `みなし残業${fixed[1]}時間`;
  const overtime = normalized.match(/(?:残業|時間外労働)[^0-9]*(\d+(?:\.\d+)?)\s*時間/);
  if (overtime) return `${overtime[1]}時間`;
  if (/時間外労働[:：]?(有り|有|あり)/.test(normalized)) return "時間外労働：有り";
  if (/不明|unknown|n\/a/i.test(normalized)) return "不明";
  return normalized;
};
const formatEmploymentType = (value="") => {
  const text = String(value || "").trim();
  const lower = text.toLowerCase();
  if (!text) return "";
  if (/正社員|permanent|full[-\s]?time|full time/.test(lower) || text.includes("正社員")) return "正社員";
  if (/contract|契約/.test(lower) || text.includes("契約社員")) return "契約社員";
  if (/temporary|派遣/.test(lower) || text.includes("派遣社員")) return "派遣社員";
  if (/freelance|業務委託/.test(lower) || text.includes("業務委託")) return "業務委託";
  if (/part[-\s]?time|アルバイト|パート/.test(lower) || text.includes("パート")) return "パート";
  return text;
};

const formatJobType = (value="") => {
  const text = String(value || "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  const labels = [];
  const add = (label) => { if (!labels.includes(label)) labels.push(label); };
  if (/project coordinator|プロジェクトコーディネーター/.test(lower)) add("プロジェクトコーディネーター");
  if (/ui\/?ux|ux\/ui/.test(lower)) add("UI/UXデザイナー");
  if (/web designer|web desiner|webデザイナー|ウェブデザイナー/.test(lower) || text.includes("Webデザイナー")) add("Webデザイナー");
  if (/web director|webディレクター|クリエイティブディレクター/.test(lower) || text.includes("Webディレクター")) add("Webディレクター");
  if (/web producer|webプロデューサー/.test(lower) || text.includes("Webプロデューサー")) add("Webプロデューサー");
  if (/contents? planning|content planning|planner|planning|プランナー|企画/.test(lower) || text.includes("プランナー")) add("プランナー");
  if (/editing|editor|編集/.test(lower) || text.includes("編集")) add("編集");
  if (/copywriter|コピーライター/.test(lower) || text.includes("コピーライター")) add("コピーライター");
  if (/product designer|プロダクトデザイナー/.test(lower) || text.includes("プロダクトデザイナー")) add("プロダクトデザイナー");
  if (/product manager|プロダクトマネージャー/.test(lower) || text.includes("プロダクトマネージャー")) add("プロダクトマネージャー");
  if (/ux research|uxリサーチ/.test(lower) || text.includes("UXリサーチ")) add("UXリサーチャー");
  if (/customer success|カスタマーサクセス/.test(lower) || text.includes("カスタマーサクセス")) add("カスタマーサクセス");
  if (labels.length > 0) return labels.join(" / ");
  return text.replace(/\s*,\s*/g, " / ").replace(/\s*&\s*/g, " / ");
};

const calcAnnualFromMonthly = (monthlyPay="") => {
  const text = String(monthlyPay || "").trim();
  if (!text) return "";
  const nums = [...text.matchAll(/([0-9,]+)円/g)].map(m => Number(m[1].replace(/,/g, ""))).filter(n => n > 0);
  if (nums.length === 0) return "";
  const toMan = (n) => `${Math.round(n * 12 / 10000)}万円`;
  if (nums.length >= 2) return `${toMan(nums[0])}〜${toMan(nums[1])}`;
  return `${toMan(nums[0])}〜`;
};

const extractFixedOvertimePay = (overtime="") => {
  const text = String(overtime || "");
  const m = text.match(/固定残業代([¥￥][\d,]+(?:\s*[~〜～]\s*[¥￥][\d,]+)?)\s*[（(]([^）)]+)[）)]/);
  if (!m) return "";
  return `（${m[1]} / ${m[2]}）`;
};

const looksLikeSalary = (text="") => /[0-9０-９万円]/.test(text) || /応相談|当社規定|経験|スキル/.test(text);

const getDisplaySalaryRange = (job) => {
  const annual = formatSalaryRange(job.salaryRange);
  if (annual && looksLikeSalary(annual)) return annual;
  const fromMonthly = calcAnnualFromMonthly(job.monthlyPay);
  return fromMonthly ? `${fromMonthly}（概算）` : (annual || "");
};

const formatSalaryRange = (value="") => {
  const text = String(value || "")
    .trim()
    .replace(/^(?:想定)?年収\s*[：:]?\s*/, "");
  if (!text) return "";
  const jpyK = text.match(/JPY\s*([0-9,]+)\s*K?\s*[-~〜]\s*JPY\s*([0-9,]+)\s*K?/i);
  if (jpyK) {
    const min = Number(jpyK[1].replace(/,/g, ""));
    const max = Number(jpyK[2].replace(/,/g, ""));
    return `${Math.round(min / 10)}万円〜${Math.round(max / 10)}万円`;
  }
  if (/[$€£]/.test(text)) return text.replace(/\s*[-~〜]\s*/g, "〜");
  if (text.includes("万")) {
    return text
      .replace(/(?:想定)?年収\s*[：:]?\s*/g, "")
      .replace(/\s*[-~～]\s*/g, "〜")
      .replace(/万円\s*〜\s*/g, "万円〜");
  }
  const nums = text.match(/[0-9][0-9,]*/g);
  if (!nums || nums.length === 0) return text;
  const values = nums.map(n => Number(n.replace(/,/g, ""))).filter(n => Number.isFinite(n));
  if (values.length === 0) return text;
  const toMan = (n) => `${Math.round(n / 10000)}万円`;
  if (values.length >= 2 && values[0] >= 1000000 && values[1] >= 1000000) return `${toMan(values[0])}〜${toMan(values[1])}`;
  return text;
};

const formatRemoteCondition = (value="") => {
  const text = String(value || "").trim();
  const lower = text.toLowerCase();
  if (!text) return "不明";
  if (/not available|on[-\s]?site|onsite|不可|なし|無し|出社/.test(lower) || text.includes("不可")) return "リモート不可";
  if (/full remote|fully remote|フルリモート|完全リモート/.test(lower)) return "リモート可（フルリモート）";
  const dayMatch = text.match(/(?:週|week)[^0-9０-９]*(\d|[０-９])/i) || text.match(/(\d|[０-９])\s*(?:日|days?)/i);
  if (dayMatch) {
    const days = Number(String(dayMatch[1]).replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)));
    if (days <= 2 || /最大|up to|まで/.test(lower)) return `リモート可（最大週${days}日）`;
    return `リモート可（週${days}日程度）`;
  }
  if (/remote|hybrid|リモート|在宅|テレワーク/.test(lower) || text.includes("リモート") || text.includes("在宅")) return "リモート可";
  if (/不明|unknown|n\/a/i.test(text)) return "不明";
  return "不明";
};
const normalizeInterviewTimeInput = (value, final = false) => {
  const text = String(value || "")
    .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .trim();
  if (!text) return "";

  const toTime = (hour, minute) => {
    const h = Number(hour);
    const m = Number(minute);
    if (!Number.isInteger(h) || !Number.isInteger(m) || h > 23 || m > 59) return text;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  };

  if (/^\d{1,2}:\d{0,2}$/.test(text)) {
    const [hour, minute = ""] = text.split(":");
    if (!final && minute.length < 2) return text;
    return toTime(hour, minute.padEnd(2, "0"));
  }

  const digits = text.replace(/\D/g, "");
  if (digits.length === 4) return toTime(digits.slice(0, 2), digits.slice(2));
  if (final && digits.length === 3) return toTime(digits.slice(0, 1), digits.slice(1));
  if (final && digits.length <= 2) return toTime(digits, "00");
  return text;
};

const getMeetingLinkLabel = (url="") => {
  const text = String(url || "").trim().toLowerCase();
  if (!text) return "";
  if (text.includes("zoom.us") || text.includes("zoom.com")) return "Zoom";
  if (text.includes("teams.microsoft.com") || text.includes("teams.live.com")) return "Teams";
  if (text.includes("meet.google") || text.includes("google.com/meet") || text.includes("google meet")) return "Google";
  return "オンラインURL";
};

const getTodayDateString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const JOB_FORM_FIELDS = [
  ["company","社名 *","text"],
  ["companyWebsiteUrl","企業HP URL","url"],
  ["appliedDate","応募日","date"],
  ["jobPostUrl","募集要項URL","url"],
  ["location","勤務地","text"],
  ["employmentType","雇用形態","text"],
  ["jobType","職種","text"],
  ["salaryRange","年収範囲","text"],
  ["monthlyPay","月給（みなし残業代）","text"],
  ["workHours","就業時間","text"],
  ["overtime","想定残業時間","text"],
  ["remoteCondition","リモート条件","text"],
  ["sideJob","副業","text"],
];
const JOB_FORM_KEYS = JOB_FORM_FIELDS.map(([key]) => key);

const emptyJob = () => ({
  id:"", appliedDate:getTodayDateString(),
  company:"", companyWebsiteUrl:"", jobBoard:"", jobPostUrl:"", location:"", employmentType:"", jobType:"", salaryRange:"", monthlyPay:"",
  workHours:"", overtime:"", remoteCondition:"", sideJob:"", status:"書類選考中",
  interviewDate:"", interviewTime:"", interviewMethod:"オンライン", interviewUrl:"", declineReason:""
});

const normalizeExtractedJob = (data) => {
  const normalized = {...data};
  if (normalized.status === "面接調整中") normalized.status = "一次面接";
  if (normalized.status !== "内定辞退") normalized.declineReason = "";
  if (normalized.declineReason) normalized.declineReason = String(normalized.declineReason).slice(0, 100);
  if (normalized.interviewMethod !== "オンライン") normalized.interviewUrl = "";
  if (!normalized.companyWebsiteUrl && normalized.companyUrl) normalized.companyWebsiteUrl = normalized.companyUrl;
  if (normalized.company) normalized.company = normalized.company
    .replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/　/g, " ")
    .replace(/（株）|\(株\)/g, "株式会社").replace(/（有）|\(有\)/g, "有限会社");
  if (normalized.monthlyPay) normalized.monthlyPay = formatMonthlyPay(normalized.monthlyPay);
  if (normalized.workHours) normalized.workHours = formatWorkHours(normalized.workHours);
  if (normalized.overtime) normalized.overtime = formatOvertime(normalized.overtime);
  if (normalized.location) normalized.location = normalizeLocation(removeCompanyFromLocation(normalized.location, normalized.company));
  if (normalized.employmentType) normalized.employmentType = formatEmploymentType(normalized.employmentType);
  if (normalized.jobType) normalized.jobType = formatJobType(normalized.jobType);
  if (normalized.salaryRange) {
    const formatted = formatSalaryRange(normalized.salaryRange);
    normalized.salaryRange = looksLikeSalary(formatted) ? formatted : "";
  }
  if (!normalized.salaryRange && normalized.monthlyPay) {
    const annual = calcAnnualFromMonthly(normalized.monthlyPay);
    if (annual) normalized.salaryRange = `${annual}（概算）`;
  }
  if (normalized.remoteCondition) normalized.remoteCondition = formatRemoteCondition(normalized.remoteCondition);
  if (normalized.jobPostUrl) normalized.jobBoard = detectJobBoardFromUrl(normalized.jobPostUrl) || "自社サイト";
  const source = [normalized.workHours, normalized.overtime].filter(Boolean).join(" / ");
  const notes = [];

  const overtimeMatch = source.match(/時間外労働\s*[：:]\s*(有り|有|あり)/);
  if (overtimeMatch) notes.push("※時間外労働：有り");

  if (notes.length > 0) {
    const current = normalized.overtime || "";
    const merged = [...new Set([...current.split(" / ").filter(Boolean), ...notes])];
    normalized.overtime = merged.join(" / ");
  }

  return normalized;
};

const fmtDateFull = (ds) => {
  if (!ds) return "";
  const d = new Date(ds + "T00:00:00");
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}（${DAYS[d.getDay()]}）`;
};

const Notice = ({children, color="#633806", bg="#FAEEDA", style={}}) => (
  <div style={{background:bg, borderRadius:"var(--border-radius-md)", padding:"0.75rem 1rem", fontSize:"12px", color, lineHeight:1.7, marginBottom:"0.75rem", ...style}}>
    {children}
  </div>
);

const Field = ({label, children}) => (
  <div className="form-field" style={{display:"grid", gridTemplateColumns:"130px 1fr", alignItems:"center", gap:"8px"}}>
    <label style={{fontSize:"12px", color:"var(--color-text-secondary)"}}>{label}</label>
    {children}
  </div>
);

const Btn = ({onClick, disabled, children, variant="default", style={}}) => {
  const base = {fontSize:"13px", cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1};
  if (variant==="primary") Object.assign(base, {background:"var(--color-text-primary)", color:"var(--color-background-primary)", borderColor:"var(--color-text-primary)", fontWeight:500});
  if (variant==="danger") Object.assign(base, {color:"#A32D2D", borderColor:"#F09595"});
  if (variant==="active") Object.assign(base, {background:"var(--color-text-primary)", color:"var(--color-background-primary)", borderColor:"var(--color-text-primary)"});
  return <button onClick={onClick} disabled={disabled} style={{...base,...style}}>{children}</button>;
};

// 日曜始まりカスタム日付ピッカー
const SundayDatePicker = ({ value, onChange, style }) => {
  const [open, setOpen] = React.useState(false);
  const [popupPos, setPopupPos] = React.useState({ top:0, left:0 });
  const [viewYear, setViewYear] = React.useState(() => {
    const d = value ? new Date(value + "T00:00:00") : new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = React.useState(() => {
    const d = value ? new Date(value + "T00:00:00") : new Date();
    return d.getMonth();
  });
  const inputRef = React.useRef();
  const popupRef = React.useRef();

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (inputRef.current?.contains(e.target) || popupRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    const rect = inputRef.current.getBoundingClientRect();
    const popupW = 240;
    const popupH = 260;
    const left = rect.left + popupW > window.innerWidth
      ? Math.max(4, window.innerWidth - popupW - 8)
      : rect.left;
    const top = rect.bottom + popupH > window.innerHeight
      ? rect.top - popupH - 4
      : rect.bottom + 4;
    setPopupPos({ top, left });
    const d = value ? new Date(value + "T00:00:00") : new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen(true);
  };

  const selectDate = (day) => {
    const y = String(viewYear);
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange({ target: { value: `${y}-${m}-${d}` } });
    setOpen(false);
  };

  const prevMonth = () => { const d = new Date(viewYear, viewMonth - 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); };
  const nextMonth = () => { const d = new Date(viewYear, viewMonth + 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); };

  const parsed    = value ? new Date(value + "T00:00:00") : null;
  const todayObj  = new Date();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay(); // 0=日
  const displayVal  = value ? value.replace(/-/g, "/") : "";
  const DOW_LABELS  = ["日","月","火","水","木","金","土"];

  return (
    <>
      <input
        ref={inputRef}
        readOnly
        value={displayVal}
        placeholder="YYYY/MM/DD"
        onClick={handleOpen}
        style={{ ...style, cursor:"pointer" }}
      />
      {open && (
        <div ref={popupRef} style={{
          position:"fixed", top: popupPos.top, left: popupPos.left, zIndex:9999,
          background:"white", border:"1px solid #D8D5D0", borderRadius:"10px",
          boxShadow:"0 6px 20px rgba(0,0,0,0.15)", padding:"10px", width:"224px",
        }}>
          {/* 月ナビ */}
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px"}}>
            <button onClick={prevMonth} style={{background:"none", border:"none", cursor:"pointer", fontSize:"16px", color:"#555", padding:"2px 8px"}}>‹</button>
            <span style={{fontSize:"13px", fontWeight:600}}>{viewYear}年{viewMonth+1}月</span>
            <button onClick={nextMonth} style={{background:"none", border:"none", cursor:"pointer", fontSize:"16px", color:"#555", padding:"2px 8px"}}>›</button>
          </div>
          {/* 曜日ヘッダー（日曜始まり） */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:"2px"}}>
            {DOW_LABELS.map((d,i)=>(
              <div key={d} style={{textAlign:"center", fontSize:"10px", fontWeight:500,
                color:i===0?"#E24B4A":i===6?"#185FA5":"#888", padding:"2px 0"}}>
                {d}
              </div>
            ))}
          </div>
          {/* 日グリッド */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)"}}>
            {Array.from({length:firstDow}).map((_,i)=><div key={`e${i}`}/>)}
            {Array.from({length:daysInMonth}).map((_,i)=>{
              const day = i+1;
              const dow = (firstDow+i)%7;
              const isSelected = parsed && parsed.getFullYear()===viewYear && parsed.getMonth()===viewMonth && parsed.getDate()===day;
              const isToday = todayObj.getFullYear()===viewYear && todayObj.getMonth()===viewMonth && todayObj.getDate()===day;
              return (
                <div key={day} onClick={()=>selectDate(day)} style={{
                  textAlign:"center", fontSize:"12px", padding:"4px 0", cursor:"pointer",
                  borderRadius:"50%", width:"28px", height:"28px", lineHeight:"20px",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  margin:"1px auto",
                  background: isSelected?"#E8610A":"transparent",
                  color: isSelected?"white":isToday?"#E8610A":dow===0?"#E24B4A":dow===6?"#185FA5":"#333",
                  fontWeight: isSelected||isToday?600:400,
                }}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

const ModalWrap = ({children, onClose}) => (
  <div className="modal-backdrop" style={{
    position:"absolute", top:0, left:0, width:"100%", minHeight:"100%",
    background:"rgba(180,180,180,0.96)", display:"flex", alignItems:"flex-start",
    justifyContent:"center", zIndex:100, padding:"1.5rem 1rem", boxSizing:"border-box"
  }}>
    <div className="modal-panel" style={{
      background:"var(--color-background-primary)",
      border:"0.5px solid var(--color-border-secondary)",
      borderRadius:"var(--border-radius-lg)", padding:"1.5rem",
      width:"100%", maxWidth:"600px", boxSizing:"border-box"
    }}>
      {children}
    </div>
  </div>
);

const ModalHeader = ({title, onClose, titleSize="16px"}) => (
  <div style={{display:"flex", justifyContent:title?"space-between":"flex-end", alignItems:"center", marginBottom:"1.25rem"}}>
    {title && <h2 style={{margin:0, fontSize:titleSize, fontWeight:500}}>{title}</h2>}
    <button onClick={onClose} style={{
      width:"32px", height:"32px", borderRadius:"4px",
      background:"#555", color:"white", border:"none",
      fontSize:"18px", cursor:"pointer", display:"flex",
      alignItems:"center", justifyContent:"center", lineHeight:1,
      fontWeight:300, flexShrink:0
    }}>×</button>
  </div>
);

const gcAi = j => ({"◎":"#22c55e","○":"#60a5fa","△":"#fbbf24","×":"#f87171"}[j]||"#64748b");
const scAi = s => s>=80?"#22c55e":s>=65?"#60a5fa":s>=50?"#fbbf24":"#f87171";

function AiScoreBar({score}){
  const [w,setW]=useState(0);
  useEffect(()=>{setTimeout(()=>setW(score),100);},[score]);
  return(
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{flex:1,height:8,background:"rgba(255,255,255,0.07)",borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${w}%`,background:scAi(score),borderRadius:99,transition:"width 0.9s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:`0 0 10px ${scAi(score)}50`}}/>
      </div>
      <span style={{fontSize:21,fontWeight:800,color:scAi(score),minWidth:48,fontFamily:"monospace"}}>{score}</span>
    </div>
  );
}

function AiChip({icon,label,val,alert,hi}){
  return(
    <div style={{padding:"8px 11px",borderRadius:8,background:alert?"rgba(248,113,113,0.06)":hi?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.03)",border:`1px solid ${alert?"rgba(248,113,113,0.18)":hi?"rgba(34,197,94,0.18)":"rgba(255,255,255,0.06)"}`}}>
      <div style={{fontSize:11,color:"#94a3b8",marginBottom:2}}>{icon} {label}</div>
      <div style={{fontSize:13,fontWeight:500,color:val?"#e2e8f0":"#94a3b8"}}>{val||"不明"}</div>
    </div>
  );
}

function AiSec({title,items,color}){
  if(!items?.length)return null;
  return(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:12,fontWeight:600,color,marginBottom:5}}>{title}</div>
      <ul style={{margin:0,paddingLeft:16}}>
        {items.map((x,i)=><li key={i} style={{fontSize:13,color:"#94a3b8",lineHeight:1.8}}>{x}</li>)}
      </ul>
    </div>
  );
}

function AiResultCard({r, onSaveToDB, onBack, onUpdateField}){
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(null); // どのフィールドを編集中か
  const [vals,setVals]=useState({
    location: r.location||"",
    employee_count: r.employee_count||"",
    salary: r.salary||"",
    fixed_overtime: r.fixed_overtime||"",
    side_job_ok: r.side_job_ok, // true/false/null
    company_type: r.company_type||"",
  });
  const jc=gcAi(r.judgment);

  // テキスト入力フィールド（共通）
  const scoreAffecting = ["location","employee_count","side_job_ok"];
  const commitField = (key, value) => {
    setVals(prev=>({...prev,[key]:value}));
    setEditing(null);
    if(onUpdateField) onUpdateField(key, value);
  };
  // インライン編集セル
  const EditableChip = ({icon, label, fieldKey, isAlert, isHi, displayVal}) => {
    const [tmp, setTmp] = useState(String(vals[fieldKey]??""));
    const affects = scoreAffecting.includes(fieldKey);
    return(
      <div style={{padding:"8px 11px",borderRadius:8,background:isAlert?"rgba(248,113,113,0.06)":isHi?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.03)",border:`1px solid ${isAlert?"rgba(248,113,113,0.18)":isHi?"rgba(34,197,94,0.18)":"rgba(255,255,255,0.06)"}`}}>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:2,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>{icon} {label}</span>
          {affects && <span style={{fontSize:9,color:"#6366f1",fontWeight:700}}>採点対象</span>}
        </div>
        {editing===fieldKey ? (
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
            <input value={tmp} onChange={e=>setTmp(e.target.value)} autoFocus
              style={{flex:1,minWidth:0,padding:"3px 6px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(99,102,241,0.5)",borderRadius:5,color:"#e2e8f0",fontSize:12,outline:"none"}}
              onKeyDown={e=>{if(e.key==="Enter")commitField(fieldKey,tmp);if(e.key==="Escape")setEditing(null);}}
            />
            <button onClick={()=>commitField(fieldKey,tmp)} style={{background:"#6366f1",border:"none",borderRadius:4,color:"white",fontSize:10,padding:"3px 6px",cursor:"pointer",whiteSpace:"nowrap"}}>保存</button>
          </div>
        ):(
          <div style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={()=>{setTmp(String(vals[fieldKey]??""));setEditing(fieldKey);}}>
            <span style={{fontSize:13,fontWeight:500,color:displayVal?"#e2e8f0":"#94a3b8"}}>{displayVal||"不明"}</span>
            <span style={{fontSize:10,color:"#64748b"}}>✏️</span>
          </div>
        )}
      </div>
    );
  };
  // 副業は3択セレクト
  const SideJobChip = () => {
    const v = vals.side_job_ok;
    const label = v===true?"OK ✓":v===false?"NG":"不明";
    return(
      <div style={{padding:"8px 11px",borderRadius:8,background:v===true?"rgba(34,197,94,0.06)":v===false?"rgba(248,113,113,0.06)":"rgba(255,255,255,0.03)",border:`1px solid ${v===true?"rgba(34,197,94,0.18)":v===false?"rgba(248,113,113,0.18)":"rgba(255,255,255,0.06)"}`}}>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:2,display:"flex",justifyContent:"space-between"}}>
          <span>🏠 副業</span>
          <span style={{fontSize:9,color:"#6366f1",fontWeight:700}}>採点対象</span>
        </div>
        {editing==="side_job_ok" ? (
          <select autoFocus value={v===true?"true":v===false?"false":"null"}
            onChange={e=>{
              const nv = e.target.value==="true"?true:e.target.value==="false"?false:null;
              commitField("side_job_ok", nv);
            }}
            style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(99,102,241,0.5)",borderRadius:5,color:"#e2e8f0",fontSize:12,padding:"3px 6px",outline:"none"}}
            onBlur={()=>setEditing(null)}
          >
            <option value="true">OK ✓</option>
            <option value="false">NG</option>
            <option value="null">不明</option>
          </select>
        ):(
          <div style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={()=>setEditing("side_job_ok")}>
            <span style={{fontSize:13,fontWeight:500,color:v===true?"#4ade80":v===false?"#f87171":"#94a3b8"}}>{label}</span>
            <span style={{fontSize:10,color:"#64748b"}}>✏️</span>
          </div>
        )}
      </div>
    );
  };
  return(
    <div style={{background:"rgba(15,23,42,0.95)",borderRadius:16,border:"1px solid rgba(255,255,255,0.06)",borderLeft:`4px solid ${jc}`,padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,borderRadius:"50%",background:jc+"18",border:`2px solid ${jc}45`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:jc}}>{r.judgment}</div>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>{r.company_name||"会社名不明"}</div>
            <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{r.position||"職種不明"}</div>
          </div>
        </div>
        <span style={{padding:"3px 11px",borderRadius:99,fontSize:11,fontWeight:700,background:`${scAi(r.score)}15`,color:scAi(r.score),border:`1px solid ${scAi(r.score)}30`}}>優先度 {r.priority}</span>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#64748b",marginBottom:5,fontWeight:600,letterSpacing:"0.08em"}}>適性スコア / 100</div>
        <AiScoreBar score={r.score}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:4,marginTop:8,marginBottom:14}}>
          {(()=>{
            const loc=String(r.location||"");
            const locPts=["中野","大久保","代々木","千駄ヶ谷"].some(x=>loc.includes(x))?10:["高円寺","阿佐ヶ谷","新宿"].some(x=>loc.includes(x))?8:loc.includes("吉祥寺")?5:loc.includes("四谷")?4:0;
            const workPts=(r.work_style==="hybrid"||r.work_style==="remote")?10:0;
            return [
              {label:"Web制作に関われる",val:r.has_web_production,pts:20},
              {label:"企画・ディレクション",val:r.has_direction_or_planning,pts:20},
              {label:"制作会社・多案件環境",val:r.is_production_company,pts:20},
              {label:"社員数30名以上",val:!isNaN(parseInt(r.employee_count))&&parseInt(r.employee_count)>=30,pts:10},
              {label:"副業OK",val:r.side_job_ok===true,pts:10},
              {label:"勤務地相性",val:locPts>0,pts:locPts,sub:locPts>0?`+${locPts}点`:"-"},
              {label:"働き方の柔軟性",val:workPts>0,pts:workPts},
            ].map((item,i)=>(
              <div key={i} style={{fontSize:11,padding:"4px 8px",borderRadius:4,background:item.val?"rgba(34,197,94,0.08)":"rgba(255,255,255,0.02)",color:item.val?"#4ade80":"#64748b",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>{item.label}</span>
                <span style={{fontWeight:700,marginLeft:6}}>{item.sub||(item.val?`+${item.pts}`:"-")}</span>
              </div>
            ));
          })()}
        </div>
      </div>
      <div style={{padding:"10px 14px",borderRadius:8,marginBottom:14,background:"rgba(99,102,241,0.06)",borderLeft:"3px solid rgba(99,102,241,0.45)",fontSize:13,color:"#94a3b8",lineHeight:1.7}}>{r.comment}</div>
      {r.ng_triggered&&<div style={{padding:"10px 14px",borderRadius:8,marginBottom:14,background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.22)",fontSize:13,color:"#fca5a5"}}><strong>⚠️ NG条件：</strong>{r.ng_reasons?.join("、")}</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))",gap:8,marginBottom:14}}>
        <EditableChip icon="📍" label="勤務地" fieldKey="location" displayVal={vals.location}/>
        <EditableChip icon="👥" label="社員数" fieldKey="employee_count" displayVal={vals.employee_count} isHi={!isNaN(parseInt(vals.employee_count))&&parseInt(vals.employee_count)>=30}/>
        <EditableChip icon="💰" label="給与" fieldKey="salary" displayVal={vals.salary}/>
        <EditableChip icon="⏰" label="固定残業" fieldKey="fixed_overtime" displayVal={vals.fixed_overtime} isAlert={vals.fixed_overtime&&parseInt(vals.fixed_overtime)>=40}/>
        <SideJobChip/>
        <EditableChip icon="🏢" label="会社種別" fieldKey="company_type" displayVal={vals.company_type}/>
      </div>
      <div style={{marginBottom:14}}>
        {r.job_category?.map((c,i)=><span key={i} style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:"rgba(99,102,241,0.1)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,0.22)",marginRight:5,display:"inline-block",marginBottom:3}}>{c}</span>)}
      </div>
      <button onClick={()=>setOpen(!open)} style={{background:"none",border:"none",color:"#64748b",fontSize:12,cursor:"pointer",padding:"3px 0",marginBottom:open?14:0,display:"block"}}>{open?"▲ 詳細を閉じる":"▼ 詳細を見る"}</button>
      {open&&(
        <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:14,marginBottom:14}}>
          <AiSec title="✅ 合っている点" items={r.strengths} color="#22c55e"/>
          <AiSec title="⚠️ 懸念点" items={r.concerns} color="#fbbf24"/>
          <AiSec title="❓ 確認が必要" items={r.unknowns} color="#64748b"/>
          {r.missing_info_priority?.length>0&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:"#a5b4fc",marginBottom:5}}>🔍 優先確認事項</div>
              <ol style={{margin:0,paddingLeft:16}}>{r.missing_info_priority.map((x,i)=><li key={i} style={{fontSize:13,color:"#94a3b8",lineHeight:1.8}}>{x}</li>)}</ol>
            </div>
          )}
        </div>
      )}
      <div style={{display:"flex",gap:10,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.05)",flexWrap:"wrap"}}>
        <button onClick={onSaveToDB} style={{padding:"9px 20px",borderRadius:8,border:"none",background:"#22c55e",color:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}>📋 DBに保存</button>
        {onBack && <button onClick={onBack} style={{padding:"9px 20px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8",fontSize:13,cursor:"pointer"}}>← 別の求人を判定</button>}
      </div>
    </div>
  );
}

export default function App() {
  const savedDraft = load(DRAFT_KEY);
  const initialDraft = savedDraft && !Array.isArray(savedDraft) ? savedDraft : null;
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [showDemoJobs, setShowDemoJobs] = useState(false);
  const [filter, setFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [calDate, setCalDate] = useState(new Date());
  const [modal, setModal] = useState(null);
  const [editJob, setEditJob] = useState(() => initialDraft?.editJob || emptyJob());
  const [inputMode, setInputMode] = useState(initialDraft?.inputMode || "paste");
  const [rawText, setRawText] = useState(initialDraft?.rawText || "");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(Boolean(initialDraft?.extracted));
  const [dragOver, setDragOver] = useState(false);
  const [previewImgs, setPreviewImgs] = useState(initialDraft?.previewImgs || (initialDraft?.previewImg ? [initialDraft.previewImg] : []));
  const [dayModal, setDayModal] = useState(null);
  const [extractedKeys, setExtractedKeys] = useState(initialDraft?.extractedKeys || []);
  const [extractSource, setExtractSource] = useState(initialDraft?.extractSource || "");
  const staleOpenAiWarning = /openai|platform\.openai/i.test(initialDraft?.extractWarning || "");
  const [extractWarning, setExtractWarning] = useState(staleOpenAiWarning ? "" : (initialDraft?.extractWarning || ""));
  const [pasteMenu, setPasteMenu] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [aiJudgedJobs, setAiJudgedJobs] = useState([]);
  const [aiJudgeModal, setAiJudgeModal] = useState(false);
  const [aiJudgeText, setAiJudgeText] = useState("");
  const [aiJudgeImgs, setAiJudgeImgs] = useState([]);
  const [aiJudgeInputMode, setAiJudgeInputMode] = useState("text");
  const [aiJudgeResult, setAiJudgeResult] = useState(null);
  const [aiJudgeLoading, setAiJudgeLoading] = useState(false);
  const [aiJudgeErr, setAiJudgeErr] = useState(null);
  const [aiDetailJob, setAiDetailJob] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [pendingAiJob, setPendingAiJob] = useState(null);
  const [sortOrder, setSortOrder] = useState("date_desc");
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newJobModalTab, setNewJobModalTab] = useState("paste");
  const [newJobModalText, setNewJobModalText] = useState("");
  const [newJobModalImgs, setNewJobModalImgs] = useState([]);
  const [dupWarning, setDupWarning] = useState(null); // null | { level: 1|2, onProceed: fn }

  const fileRef = useRef();
  const undoStackRef = useRef([]);
  const celebrationTimerRef = useRef(null);
  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {
      // Ignore storage cleanup errors.
    }
  };

  useEffect(() => {
    dbLoadJobs().then(setJobs).catch(console.error).finally(() => setJobsLoading(false));
    dbLoadAiJudgments().then(setAiJudgedJobs).catch(console.error);
  }, []);

  useEffect(() => () => {
    if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
  }, []);

  const triggerCelebration = (status) => {
    const next = CELEBRATION_MESSAGES[status];
    if (!next) return;
    if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
    setCelebration({...next, id:Date.now()});
    celebrationTimerRef.current = window.setTimeout(() => setCelebration(null), 6000);
  };

  const applyExtracted = useCallback((parsed, fallback={}) => {
    const clean = normalizeExtractedJob(Object.fromEntries(Object.entries({...fallback, ...parsed}).filter(([,v])=>v&&v!=="null")));
    setEditJob(prev => {
      const clearedFields = Object.fromEntries(JOB_FORM_KEYS.map(key => [key, ""]));
      return extracted ? {...prev, ...clean} : {...prev, ...clearedFields, appliedDate:getTodayDateString(), ...clean};
    });
    setExtractedKeys(prev => extracted ? Array.from(new Set([...prev, ...Object.keys(clean)])) : Object.keys(clean));
    setExtractWarning(Object.keys(clean).length === 0 ? "AIが読み取れる項目を見つけられませんでした。別のスクリーンショット、または本文貼り付けをお試しください。" : "");
    setExtracted(true);
  }, [extracted]);

  const postExtraction = async (path, body) => {
    const response = await fetch(path, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(body),
    });
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(data.error || "AI抽出に失敗しました。");
    return data;
  };

  const checkDupAfterExtract = (parsed) => {
    const company = parsed.company || "";
    const jobType = parsed.jobType || "";
    const location = parsed.location || "";
    const salaryRange = parsed.salaryRange || "";
    if (!company) return;
    const sameNameAndType = jobs.filter(j =>
      j.company && j.company === company &&
      j.jobType && j.jobType === jobType
    );
    const exactDup = sameNameAndType.filter(j =>
      j.location === location && j.salaryRange === salaryRange
    );
    if (exactDup.length > 0) {
      setDupWarning({ level: 2, phase: "extract", onProceed: () => setDupWarning(null) });
    } else if (sameNameAndType.length > 0) {
      setDupWarning({ level: 1, phase: "extract", onProceed: () => setDupWarning(null) });
    }
  };

  const extractText = async () => {
    if (!rawText.trim()) return;
    setExtracting(true);
    setExtractWarning("");
    setExtractSource("テキスト");
    try {
      const parsed = await postExtraction("/api/extract-text", {text: rawText});
      applyExtracted(parsed);
      checkDupAfterExtract(parsed);
    } catch(e) {
      console.error(e);
      setExtractWarning(e.message);
      setExtracted(true);
    }
    setExtracting(false);
  };

  const extractImage = useCallback(async (file) => {
    setExtracting(true);
    setExtractWarning("");
    setExtractSource("スクリーンショット");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setPreviewImgs(prev=>[...prev, dataUrl]);
      try {
        const parsed = await postExtraction("/api/extract-image", {image: dataUrl});
        applyExtracted(parsed);
        checkDupAfterExtract(parsed);
      } catch(e) {
        console.error(e);
        setExtractWarning(e.message);
        setExtracted(true);
      }
      setExtracting(false);
    };
    reader.readAsDataURL(file);
  }, [applyExtracted]);

  const extractImages = (files) => {
    Array.from(files || [])
      .filter(file => file.type.startsWith("image/"))
      .forEach(file => extractImage(file));
    if (fileRef.current) fileRef.current.value = "";
  };

  const pasteImageFromClipboard = async () => {
    setPasteMenu(null);
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(type=>type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          extractImage(new File([blob], "clipboard-image.png", {type:imageType}));
          return;
        }
      }
      setExtractWarning("クリップボードに画像が見つかりませんでした。スクリーンショットをコピーしてからもう一度お試しください。");
      setExtracted(true);
    } catch(e) {
      console.error(e);
      setExtractWarning("ブラウザがクリップボード画像の読み取りを許可しませんでした。Command+V / Ctrl+V、または画像選択をご利用ください。");
      setExtracted(true);
    }
  };
  const removePreviewImage = (index) => {
    setPreviewImgs(prev=>prev.filter((_, i)=>i!==index));
    setPasteMenu(null);
    if (fileRef.current) fileRef.current.value = "";
  };
  useEffect(() => {
    const onPaste = (e) => {
      if (modal !== "job" || inputMode !== "img") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) extractImage(file);
          break;
        }
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [modal, inputMode, extractImage]);

  useEffect(() => {
    if (modal !== "job") return;
    save(DRAFT_KEY, {
      modal,
      inputMode,
      editJob,
      rawText,
      extracted,
      previewImgs,
      extractedKeys,
      extractSource,
      extractWarning,
    });
  }, [modal, inputMode, editJob, rawText, extracted, previewImgs, extractedKeys, extractSource, extractWarning]);

  const saveJobConfirmed = async () => {
    setDupWarning(null);
    setSaveError(null);
    setSaving(true);
    try {
      const jobToSave = normalizeExtractedJob(editJob);
      const isNew = !jobToSave.id;
      if (isNew) jobToSave.id = String(Date.now());
      setShowDemoJobs(false);
      const saved = await dbSaveJob(jobToSave);
      const updatedJob = saved || jobToSave;
      if (isNew) setJobs(prev => [updatedJob, ...prev]);
      else setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
      clearDraft();
      setModal(null);
      if (pendingAiJob) {
        const updatedAiJob = { ...pendingAiJob, applied: true, linked_job_id: jobToSave.id };
        await dbSaveAiJudgment(updatedAiJob).catch(console.error);
        setAiJudgedJobs(prev => prev.map(j => j.id === pendingAiJob.id ? updatedAiJob : j));
        setPendingAiJob(null);
      }
    } catch (err) {
      console.error(err);
      alert("保存エラー: " + (err?.message || JSON.stringify(err)));
      setSaveError(err?.message || "保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  const saveJob = async () => {
    if (!editJob.company) return;
    const jobToSave = normalizeExtractedJob(editJob);
    const isNew = !jobToSave.id;
    if (isNew) {
      // 重複チェック
      const sameNameAndType = jobs.filter(j =>
        j.company && j.company === jobToSave.company &&
        j.jobType && j.jobType === jobToSave.jobType
      );
      const exactDup = sameNameAndType.filter(j =>
        j.location === jobToSave.location &&
        j.salaryRange === jobToSave.salaryRange
      );
      if (exactDup.length > 0) {
        setDupWarning({ level: 2, phase: "save", onProceed: saveJobConfirmed });
        return;
      }
      if (sameNameAndType.length > 0) {
        setDupWarning({ level: 1, phase: "save", onProceed: saveJobConfirmed });
        return;
      }
    }
    saveJobConfirmed();
  };


  const exportCSV = () => {
    const hd = ["応募日","求人媒体","社名","企業HP URL","勤務地","雇用形態","職種","年収","月給","就業時間","想定残業時間","リモート条件","副業","選考ステータス",...(showDeclineReasonColumn ? ["辞退理由"] : []),"募集要項URL"];
    const rows = filteredJobs.map(j=>[j.appliedDate,getJobBoardName(j),j.company,j.companyWebsiteUrl,formatLocationForTable(getCleanLocation(j)),formatEmploymentType(j.employmentType),formatJobType(j.jobType),getDisplaySalaryRange(j),formatMonthlyPay(j.monthlyPay),formatWorkHours(j.workHours),formatOvertime(j.overtime),formatRemoteCondition(j.remoteCondition),j.sideJob||"記載なし",j.status,...(showDeclineReasonColumn ? [j.status==="内定辞退" ? (j.declineReason || "") : ""] : []),j.jobPostUrl]);
    const csv = [hd,...rows].map(r=>r.map(c=>`"${(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv);
    a.download = "転職活動管理.csv"; a.click();
  };

  const cy = calDate.getFullYear(), cm = calDate.getMonth();
  const daysInMonth = new Date(cy, cm+1, 0).getDate();
  const firstDow = new Date(cy, cm, 1).getDay();

  const interviewStatuses = ["一次面接", "二次面接", "最終面接"];
  const isInterviewStatus = (status) => interviewStatuses.includes(status);
  const toInterviewEvent = (job) => {
    if (!isInterviewStatus(job.status) || !job.interviewDate) return null;
    return {
      id:`job-${job.id}`,
      jobId:job.id,
      date:job.interviewDate,
      time:job.interviewTime || "",
      type:job.status.replace("面接", ""),
      method:job.interviewMethod || "オンライン",
      url:job.interviewMethod === "オンライン" ? (job.interviewUrl || "") : "",
      location:getCleanLocation(job),
      company:job.company || "?",
      shortName:job.company || "?",
      jobStatus:job.status,
    };
  };
  const getInterviewEvents = (sourceJobs) => sourceJobs
    .map(toInterviewEvent)
    .filter(Boolean)
    .sort((a,b)=>a.date.localeCompare(b.date)||(a.time||"").localeCompare(b.time||""));

  const getIVsDay = (day) => {
    const ds = `${cy}-${String(cm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return getInterviewEvents(displayJobs).filter(iv=>iv.date===ds);
  };

  const displayJobs = jobs;
  const isInProgress = (job) => job.status !== "内定" && job.status !== "内定辞退" && job.status !== "不採用";
  const isOfferStatus = (job) => job.status === "内定";
  const isClosedStatus = (job) => job.status === "内定辞退" || job.status === "不採用";
  const jobCounts = {
    active: displayJobs.filter(isInProgress).length,
    all: displayJobs.length,
    offer: displayJobs.filter(isOfferStatus).length,
    closed: displayJobs.filter(isClosedStatus).length,
    interview: displayJobs.filter(j => ["一次面接","二次面接","最終面接","結果待ち"].includes(j.status)).length,
  };
  const pushUndoSnapshot = () => {
    undoStackRef.current = [
      ...undoStackRef.current.slice(-19),
      { jobs: displayJobs },
    ];
  };
  const updateJobField = (id, patch) => {
    setShowDemoJobs(false);
    setJobs(prev => {
      const updated = prev.map(j => j.id === id ? {...j, ...patch} : j);
      const job = updated.find(j => j.id === id);
      if (job) dbSaveJob(job).catch(console.error);
      return updated;
    });
  };
  const updateJobStatus = (id, status) => {
    const patch = {
      ...(isInterviewStatus(status) ? {status} : {status, interviewDate:"", interviewTime:"", interviewMethod:"オンライン", interviewUrl:""}),
      ...(status === "内定辞退" ? {} : {declineReason:""}),
    };
    triggerCelebration(status);
    updateJobField(id, patch);
  };
  const openEditJob = (job) => {
    clearDraft();
    const filled = {...job};
    if (!filled.salaryRange && filled.monthlyPay) {
      const annual = calcAnnualFromMonthly(filled.monthlyPay);
      if (annual) filled.salaryRange = `${annual}（概算）`;
    }
    setEditJob(filled);
    setRawText("");
    setExtracted(false);
    setInputMode("paste");
    setModal("job");
  };
  const deleteJob = (id) => {
    pushUndoSnapshot();
    setShowDemoJobs(false);
    setJobs(prev => prev.filter(j => j.id !== id));
    dbDeleteJob(id).catch(console.error);
  };
  const undoLastDelete = () => {
    const last = undoStackRef.current.at(-1);
    if (!last) return;
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setShowDemoJobs(false);
    setJobs(last.jobs);
  };
  const closeJobDraft = (clear=false) => {
    if (clear) clearDraft();
    setModal(null);
    setPreviewImgs([]);
    setPasteMenu(null);
  };
  const openNewJob = (mode) => {
    clearDraft();
    setEditJob(emptyJob());
    setRawText("");
    setExtracted(false);
    setPreviewImgs([]);
    setExtractedKeys([]);
    setExtractSource("");
    setExtractWarning("");
    setInputMode(mode);
    setModal("job");
  };
  // AI judge logic
  const calculateScore = (data, empOverride) => {
    let score = 0;
    const empNum = empOverride != null ? parseInt(empOverride) : parseInt(data.employee_count);
    if (data.has_web_production) score += 20;
    if (data.has_direction_or_planning) score += 20;
    if (data.is_production_company) score += 20;
    if (!isNaN(empNum) && empNum >= 30) score += 10;
    if (data.side_job_ok === true) score += 10;
    const loc = String(data.location || "");
    if (["中野","大久保","代々木","千駄ヶ谷"].some(x => loc.includes(x))) score += 10;
    else if (["高円寺","阿佐ヶ谷","新宿"].some(x => loc.includes(x))) score += 8;
    else if (loc.includes("吉祥寺")) score += 5;
    else if (loc.includes("四谷")) score += 4;
    if (data.work_style === "hybrid" || data.work_style === "remote") score += 10;
    return Math.min(score, 100);
  };

  const getJudgment = (score) => score >= 80 ? "◎" : score >= 65 ? "○" : score >= 50 ? "△" : "×";
  const getPriority = (score) => score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D";

  const postAiJudge = async (body) => {
    const response = await fetch("/api/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Geminiでの求人判定に失敗しました。");
    return data;
  };

  const recalcWithEmployeeCount = (r, empVal) => {
    const newScore = calculateScore(r, empVal);
    return { ...r, employee_count: empVal, score: newScore, judgment: getJudgment(newScore), priority: getPriority(newScore) };
  };

  const handleAiJudge = async () => {
    if (aiJudgeInputMode === "text" && aiJudgeText.trim().length < 50) {
      setAiJudgeErr("求人票を貼り付けてください（50文字以上）");
      return;
    }
    setAiJudgeLoading(true);
    setAiJudgeErr(null);
    try {
      let parsed;
      if (aiJudgeInputMode === "text") {
        parsed = await postAiJudge({mode: "text", text: aiJudgeText});
      } else {
        parsed = await postAiJudge({mode: "image", images: aiJudgeImgs.map(({base64, type}) => ({base64, type}))});
      }
      const score = calculateScore(parsed, null);
      const judgment = getJudgment(score);
      const priority = getPriority(score);
      const newResult = {
        ...parsed,
        score,
        judgment,
        priority,
        jobText: aiJudgeInputMode === "text" ? aiJudgeText : "",
        judgedAt: new Date().toISOString(),
        id: String(Date.now()),
        applied: false,
      };
      setAiJudgeResult(newResult);
      await dbSaveAiJudgment(newResult);
      setAiJudgedJobs(prev => [newResult, ...prev.filter(j => j.id !== newResult.id)]);
      setAiJudgeModal("result");
    } catch (e) {
      setAiJudgeErr(e.message || "エラーが発生しました");
    } finally {
      setAiJudgeLoading(false);
    }
  };

  const openAiJobForm = (aiJob) => {
    setPendingAiJob(aiJob);
    const mapped = {
      ...emptyJob(),
      company: aiJob.company_name || "",
      location: aiJob.location || "",
      salaryRange: aiJob.salary || "",
      overtime: aiJob.fixed_overtime || "",
      status: "書類選考中",
      appliedDate: new Date().toISOString().split("T")[0],
    };
    setEditJob(mapped);
    setModal("job");
    setInputMode("paste");
    setExtractedKeys(Object.keys(mapped).filter(k => mapped[k]));
  };

  const deleteAllData = async () => {
    await dbDeleteAllJobs();
    setJobs([]);
    setAiJudgedJobs([]);
    setShowDeleteAllConfirm(false);
  };

  const INTERVIEW_STATUSES = ["一次面接","二次面接","最終面接","結果待ち"];
  const searchQ = searchQuery.trim().toLowerCase();
  const filteredJobs = displayJobs
    .filter(j =>
      filter==="active"    ? isInProgress(j) :
      filter==="offer"     ? isOfferStatus(j) :
      filter==="closed"    ? isClosedStatus(j) :
      filter==="interview" ? INTERVIEW_STATUSES.includes(j.status) : true
    )
    .filter(j => {
      if (!searchQ) return true;
      return (
        (j.company || "").toLowerCase().includes(searchQ) ||
        (j.jobType || "").toLowerCase().includes(searchQ) ||
        (j.location || "").toLowerCase().includes(searchQ) ||
        (j.jobBoard || "").toLowerCase().includes(searchQ)
      );
    })
    .sort((a, b) => {
      if (sortOrder === "date_desc") {
        const da = a.appliedDate || "";
        const db = b.appliedDate || "";
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db.localeCompare(da);
      }
      if (sortOrder === "date_asc") {
        const da = a.appliedDate || "";
        const db = b.appliedDate || "";
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.localeCompare(db);
      }
      if (sortOrder === "name_asc") {
        return (a.company || "").localeCompare(b.company || "", "ja");
      }
      if (sortOrder === "location_asc") {
        return (formatLocationForTable(getCleanLocation(a)) || "").localeCompare(formatLocationForTable(getCleanLocation(b)) || "", "ja");
      }
      if (sortOrder === "board_asc") {
        return (getJobBoardName(a) || "").localeCompare(getJobBoardName(b) || "", "ja");
      }
      return 0;
    });
  const showDeclineReasonColumn = filter === "all" || filter === "closed";
  const showInterviewColumns = filter !== "closed" && filter !== "offer";
  const today = new Date();
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 6);
  today.setHours(0,0,0,0);
  sevenDaysLater.setHours(23,59,59,999);

  const displayIVs = getInterviewEvents(displayJobs)
    .filter(iv => {
      const date = new Date(iv.date + "T00:00:00");
      return date >= today && date <= sevenDaysLater;
    });

  useEffect(() => {
    const onKeyDown = (e) => {
      const tagName = e.target?.tagName;
      const isEditing = e.target?.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(tagName);
      if (isEditing || e.shiftKey || e.key.toLowerCase() !== "z" || (!e.metaKey && !e.ctrlKey)) return;
      e.preventDefault();
      undoLastDelete();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const readFieldLabels = JOB_FORM_FIELDS
    .filter(([key])=>extractedKeys.includes(key) && editJob[key])
    .map(([,label])=>label.replace(" *",""));
  const emptyFieldCount = JOB_FORM_FIELDS.filter(([key])=>!editJob[key]).length;
  const extractionSourceLabel = extractSource ? `${extractSource}から` : "";
  const fieldInputStyle = (key) => ({
    fontSize:"13px",
    boxSizing:"border-box",
    background: editJob[key] ? "#F8FFF2" : "#FFF",
    borderColor: editJob[key] ? "#A7C989" : "var(--color-border-primary)",
  });
  const renderExtractionNotice = () => (
    <Notice color={extractWarning ? "#8A5A00" : "#3B6D11"} bg={extractWarning ? "#FFF4D7" : "#EAF3DE"} style={{marginBottom:"1rem"}}>
      <div style={{fontWeight:500, marginBottom:"2px"}}>
        {extractWarning ? "AI抽出で確認が必要です。" : `${extractionSourceLabel}読み取れた内容を下のフォームに反映しました。`}
      </div>
      <div>
        {extractWarning || (readFieldLabels.length > 0
          ? `反映済み: ${readFieldLabels.join("、")}`
          : "まだ自動反映できた項目はありません。空欄はこのまま手入力できます。")}
        {emptyFieldCount > 0 && ` / 未入力: ${emptyFieldCount}項目`}
      </div>
    </Notice>
  );
  const renderJobFields = () => (
    <>
      {JOB_FORM_FIELDS.map(([k,l,t])=>(
        <Field key={k} label={l}>
          {t==="date" ? (
            <SundayDatePicker
              value={editJob[k]||""}
              onChange={e=>setEditJob(p=>({...p,[k]:e.target.value}))}
              style={fieldInputStyle(k)}
            />
          ) : (
            <input
              type={t}
              value={editJob[k]||""}
              placeholder={k==="jobPostUrl" ? "例: https://tenshoku.mynavi.jp/applied-job/..." : k==="companyWebsiteUrl" ? "例: https://www.example.co.jp/" : k==="salaryRange" && !editJob.salaryRange && editJob.monthlyPay ? calcAnnualFromMonthly(editJob.monthlyPay) ? `${calcAnnualFromMonthly(editJob.monthlyPay)}（概算）` : "読み取れなかった場合は手入力" : "読み取れなかった場合は手入力"}
              onChange={e=>setEditJob(p=>({...p,[k]:e.target.value}))}
              style={fieldInputStyle(k)}
            />
          )}
        </Field>
      ))}
      <Field label="ステータス">
        <select
          value={editJob.status}
          onChange={e=>{
            const status = e.target.value;
            triggerCelebration(status);
            setEditJob(p=>isInterviewStatus(status)
              ? {...p,status}
              : {
                ...p,
                status,
                interviewDate:"",
                interviewTime:"",
                interviewMethod:"オンライン",
                interviewUrl:"",
                declineReason:status === "内定辞退" ? p.declineReason : "",
              });
          }}
          style={{fontSize:"13px"}}
        >
          {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      {editJob.status === "内定辞退" && (
        <Field label="辞退の理由">
          <input
            type="text"
            maxLength={100}
            placeholder="100文字以内で入力"
            value={editJob.declineReason||""}
            onChange={e=>setEditJob(p=>({...p,declineReason:e.target.value.slice(0, 100)}))}
            style={fieldInputStyle("declineReason")}
          />
        </Field>
      )}
      {isInterviewStatus(editJob.status) && <>
        <Field label="面接日">
          <SundayDatePicker value={editJob.interviewDate||""} onChange={e=>setEditJob(p=>({...p,interviewDate:e.target.value}))} style={fieldInputStyle("interviewDate")} />
        </Field>
        <Field label="時間">
          <input type="text" inputMode="numeric" placeholder="例: 1300" value={editJob.interviewTime||""} onChange={e=>setEditJob(p=>({...p,interviewTime:normalizeInterviewTimeInput(e.target.value)}))} onBlur={e=>setEditJob(p=>({...p,interviewTime:normalizeInterviewTimeInput(e.target.value, true)}))} style={fieldInputStyle("interviewTime")} />
        </Field>
        <Field label="形式">
          <select
            value={editJob.interviewMethod||"オンライン"}
            onChange={e=>setEditJob(p=>e.target.value === "オンライン"
              ? {...p,interviewMethod:e.target.value}
              : {...p,interviewMethod:e.target.value, interviewUrl:""})}
            style={{fontSize:"13px"}}
          >
            <option>オンライン</option><option>対面</option>
          </select>
        </Field>
        {(editJob.interviewMethod||"オンライン") === "オンライン" && (
          <Field label="面接URL">
            <input
              type="url"
              placeholder="例: https://zoom.us/j/... / https://teams.microsoft.com/..."
              value={editJob.interviewUrl||""}
              onChange={e=>setEditJob(p=>({...p,interviewUrl:e.target.value}))}
              style={fieldInputStyle("interviewUrl")}
            />
          </Field>
        )}
      </>}
    </>
  );

  // ── DBテーブル sticky列の幅・位置を定数で一元管理 ────────────────────────
  const SC = {
    date:  { width: 60,  left: 0   },
    board: { width: 145, left: 60  },
    name:  { width: 180, left: 205 },
  };
  const TBL_BORDER = "1px solid #D8D5D0";
  const thBase = {
    padding:"8px 10px", textAlign:"left", fontWeight:600, fontSize:"11px",
    whiteSpace:"nowrap", borderLeft:"none", borderTop:"none",
    borderRight: TBL_BORDER, borderBottom: TBL_BORDER,
  };
  const stickyThStyle = (key, isLast, isActive) => ({
    ...thBase,
    width: SC[key].width, minWidth: SC[key].width, maxWidth: SC[key].width,
    position:"sticky", left: SC[key].left, zIndex:21,
    background: isActive ? "#E8E5E0" : "#F8F7F5",
    boxShadow: isLast ? "3px 0 6px -2px rgba(0,0,0,0.15)" : "none",
  });

  if (jobsLoading) return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", fontFamily:"var(--font-sans)", color:"var(--color-text-secondary)"}}>
      読み込み中...
    </div>
  );

  return (
    <div className="app-root" style={{fontFamily:"var(--font-sans)", background:"var(--color-background-primary)", minHeight:"100vh"}}>

      <>

      {celebration && (
        <div className={`celebration celebration-${celebration.tone}`} key={celebration.id} aria-live="polite">
          {celebration.effect !== "none" && (
            <div className="celebration-pieces" aria-hidden="true">
              {Array.from({length:CELEBRATION_EFFECT_COUNTS[celebration.effect] || 18}).map((_, i)=>(
                <span
                  key={i}
                  className={`celebration-piece celebration-piece-${celebration.effect}`}
                  style={{
                    "--x": `${8 + (i * 5) % 86}%`,
                    "--y": `${24 + (i * 17) % 48}%`,
                    "--delay": `${i === 0 ? 0 : (i % 18) * 0.18}s`,
                    "--rotate": `${(i * 47) % 180}deg`,
                    "--drift": `${((i % 7) - 3) * 18}px`,
                    "--scale": `${0.78 + (i % 5) * 0.08}`,
                  }}
                />
              ))}
            </div>
          )}
          {celebration.crackers && (
            <div className="celebration-crackers" aria-hidden="true">
              <span className="celebration-cracker celebration-cracker-left" />
              <span className="celebration-cracker celebration-cracker-right" />
            </div>
          )}
          <div className="celebration-card">
            <p className="celebration-title">{celebration.title}</p>
            <p className="celebration-message">{celebration.message}</p>
          </div>
        </div>
      )}

      {/* ── TOP SECTION（常に表示） ── */}
      <div className="top-section" style={{padding:"1.5rem", maxWidth:"940px", margin:"0 auto"}}>

        {/* Header */}
        <div style={{marginBottom:"1.25rem"}}>
          <h1 style={{fontSize:"24px", fontWeight:500, margin:"0 0 6px", color:"var(--color-text-primary)"}}>就活管理システム</h1>
          <p className="summary-counts" style={{margin:0, fontSize:"15px", color:"var(--color-text-tertiary)"}}>
            進行中 {jobCounts.active}社 ／ 応募した企業 {jobCounts.all}社 ／ 内定 {jobCounts.offer}社
          </p>
        </div>

        {/* This week banner */}
        <div className="upcoming-card" style={{background:"#F5F0E8", borderRadius:"12px", padding:"1rem 1.25rem", marginBottom:"3rem"}}>
          <p style={{margin:"0 0 6px", fontSize:"11px", fontWeight:600, color:"#5C4A2A", letterSpacing:"0.12em"}}>1週間以内に予定している面接</p>
          {displayIVs.length === 0 && (
            <p style={{margin:"2px 0", fontSize:"12px", color:"#8B7355", lineHeight:1.6}}>1週間以内に一次面接・二次面接・最終面接はありません。</p>
          )}
          {displayIVs.map(iv=>(
            <p className="upcoming-row" key={iv.id} style={{margin:"2px 0", fontSize:"13px", color:"#C0392B", lineHeight:1.6}}>
              <span className="upcoming-line">
                <span>{fmtDateFull(iv.date)} {iv.time}〜</span>
                <span className="upcoming-separator" style={{color:"#8B7355"}}>｜</span>
                <span style={{color:"#8B7355"}}>{iv.type}面接（{iv.method}）</span>
              </span>
              <span className="upcoming-line upcoming-company-line">
                <span style={{fontWeight:500}}>{iv.company}</span>
                {iv.url && (
                  <>
                    <span className="upcoming-link-gap" />
                    <a href={iv.url} target="_blank" rel="noreferrer" style={{color:"#185FA5", fontSize:"12px"}}>
                      {getMeetingLinkLabel(iv.url)}
                    </a>
                  </>
                )}
                {iv.method === "対面" && iv.location && (
                  <>
                    <span className="upcoming-link-gap" />
                    <a href={getMapUrl(iv.location)} target="_blank" rel="noreferrer" style={{color:"#185FA5", fontSize:"12px"}}>
                      {iv.location}
                    </a>
                  </>
                )}
              </span>
            </p>
          ))}
        </div>

        {/* Calendar */}
        <div className="calendar-card" style={{border:"1px solid #D8D5D0", borderRadius:"var(--border-radius-lg)", overflow:"hidden", marginBottom:"4rem"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.6rem 1rem", borderBottom:"1px solid #D8D5D0"}}>
            <Btn onClick={()=>setCalDate(d=>new Date(d.getFullYear(),d.getMonth()-1,1))} style={{fontSize:"16px", padding:"0 8px"}}>‹</Btn>
            <span style={{fontWeight:500, fontSize:"14px"}}>{cy}年 {cm+1}月</span>
            <Btn onClick={()=>setCalDate(d=>new Date(d.getFullYear(),d.getMonth()+1,1))} style={{fontSize:"16px", padding:"0 8px"}}>›</Btn>
          </div>
          <div style={{display:"grid", gridTemplateColumns:CALENDAR_COLUMNS, borderBottom:"1px solid #D8D5D0", background:"#F8F7F5"}}>
            {DAYS.map((d,i)=>(
              <div key={d} style={{textAlign:"center", fontSize:"11px", padding:"6px 0", color:i===0?"#E24B4A":i===6?"#185FA5":"var(--color-text-secondary)"}}>
                {d}
              </div>
            ))}
          </div>
          <div style={{display:"grid", gridTemplateColumns:CALENDAR_COLUMNS}}>
            {Array.from({length:firstDow}).map((_,i)=>(
              <div key={`e${i}`} style={{borderRight:"1px solid #D8D5D0", borderBottom:"1px solid #D8D5D0", aspectRatio:"1", background:"#FAFAF9"}} />
            ))}
            {Array.from({length:daysInMonth}).map((_,i)=>{
              const day=i+1, dow=(firstDow+i)%7;
              const dayIVs=getIVsDay(day), hasIV=dayIVs.length>0;
              const isToday=today.getDate()===day&&today.getMonth()===cm&&today.getFullYear()===cy;
              const ds=`${cy}-${String(cm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              return (
                <div key={day} onClick={()=>hasIV&&setDayModal({ds, ivs:dayIVs})} style={{
                  borderRight:"1px solid #D8D5D0",
                  borderBottom:"1px solid #D8D5D0",
                  aspectRatio:"1", padding:"4px 3px 4px 10px",
                  overflow:"hidden",
                  background:"transparent",
                  cursor:hasIV?"pointer":"default"
                }}>
                  <div style={{
                    fontSize:"12px", fontWeight:isToday?500:400,
                    background:isToday?"#E24B4A":"transparent",
                    color:isToday?"white":dow===0?"#E24B4A":dow===6?"#185FA5":"var(--color-text-secondary)",
                    width:"20px", height:"20px", borderRadius:"50%",
                    display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"2px", marginLeft:"-3px"
                  }}>{day}</div>
                  {dayIVs.slice(0,2).map(iv=>(
                    <div key={iv.id} style={{
                      fontSize:"9px",
                      lineHeight:1.35,
                      overflow:"hidden",
                      background:"#FCEBEB",
                      borderLeft:"3px solid #E24B4A",
                      borderRadius:"5px",
                      padding:"3px 4px",
                      marginTop:"3px",
                      color:"#A32D2D"
                    }}>
                      <div style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:500}}>{iv.time} {iv.shortName||iv.company}</div>
                      <div style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"#8B7355"}}>
                        {iv.type} {iv.method==="対面"?"対面":"オンライン"}
                        {iv.url && (
                          <>
                            {" / "}
                            <a
                              href={iv.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e=>e.stopPropagation()}
                              style={{color:"#185FA5", textDecoration:"underline"}}
                            >
                              {getMeetingLinkLabel(iv.url)}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {dayIVs.length>2&&<div style={{fontSize:"9px", color:"#A32D2D", marginTop:"3px"}}>+{dayIVs.length-2}件</div>}
                </div>
              );
            })}
            {Array.from({length: (7 - (firstDow + daysInMonth) % 7) % 7}).map((_,i)=>(
              <div key={`t${i}`} style={{borderRight:"1px solid #D8D5D0", borderBottom:"1px solid #D8D5D0", aspectRatio:"1", background:"#FAFAF9"}} />
            ))}
          </div>
        </div>

      </div>

      {/* ── BOTTOM SECTION（モーダルはここを覆う） ── */}
      <div className="app-main" style={{position:"relative", maxWidth:"940px", margin:"0 auto", padding:"0 1.5rem 3rem"}}>

        {/* Modals */}
        {modal==="job" && inputMode==="img" && (
          <ModalWrap onClose={()=>closeJobDraft(false)} >
            <ModalHeader title="新規登録" onClose={()=>closeJobDraft(false)} titleSize="17px" />

            {/* Tab switcher */}
            <div style={{display:"flex", gap:0, marginBottom:"1.5rem", border:"1px solid var(--color-border-primary)", borderRadius:"6px", overflow:"hidden"}}>
              <button onClick={()=>{ closeJobDraft(false); openNewJob("paste"); }} style={{flex:1, padding:"9px", border:"none", background:"white", color:"var(--color-text-secondary)", fontSize:"13px", fontWeight:400, cursor:"pointer"}}>テキストで入力</button>
              <button style={{flex:1, padding:"9px", border:"none", background:"#4D4D4D", color:"white", fontSize:"13px", fontWeight:600, cursor:"pointer"}}>スクショで入力</button>
            </div>

            <Notice>
求人ページのスクリーンショットを添付してください。読み取れなかった項目は確認フォームで手入力できます。
            </Notice>

            {/* Image drop zone */}
            <input type="file" ref={fileRef} accept="image/*" multiple style={{display:"none"}}
              onChange={e=>extractImages(e.target.files)} />
            <div
              onDragOver={e=>{e.preventDefault(); setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{
                e.preventDefault(); setDragOver(false);
                extractImages(e.dataTransfer.files);
              }}
              onContextMenu={e=>{
                e.preventDefault();
                setPasteMenu({x:e.clientX, y:e.clientY});
              }}
              style={{
                border:`2px dashed ${dragOver?"#555":"#D8D5D0"}`,
                borderRadius:"12px",
                padding:"2rem 1rem",
                textAlign:"center",
                background: dragOver?"#F5F5F5":"#FAFAF9",
                transition:"all 0.15s",
                cursor:"pointer",
                marginBottom: previewImgs.length>0?"1rem":"1.5rem"
              }}
              onClick={()=>fileRef.current.click()}
            >
	              {extracting ? (
	                <p style={{margin:0, fontSize:"13px", color:"var(--color-text-secondary)"}}>AIが画像を解析中…</p>
	              ) : previewImgs.length > 0 ? (
                <div style={{display:"flex", gap:"10px", justifyContent:"center", flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
                  {previewImgs.map((img, index)=>(
                    <div key={img.slice(0,80)+index} style={{position:"relative", display:"inline-block"}}>
                      <img src={img} style={{height:"150px", maxWidth:"180px", borderRadius:"8px", objectFit:"contain", border:"1px solid var(--color-border-tertiary)"}} />
                      <button
                        onClick={()=>removePreviewImage(index)}
                        aria-label="画像を外す"
                        title="画像を外す"
                        style={{
                          position:"absolute", top:"-10px", right:"-10px", width:"28px", height:"28px",
                          borderRadius:"50%", padding:0, border:"none", background:"#555", color:"white",
                          cursor:"pointer", fontSize:"18px", lineHeight:1, boxShadow:"0 2px 8px rgba(0,0,0,0.22)"
                        }}
                      >×</button>
                    </div>
                  ))}
                  <button onClick={e=>{e.stopPropagation(); fileRef.current.click();}} style={{height:"150px", minWidth:"140px", fontSize:"13px", cursor:"pointer", border:"1.5px dashed var(--color-border-primary)", borderRadius:"8px", background:"white"}}>＋ 追加</button>
                </div>
	              ) : (
                <>
                  <div style={{fontSize:"32px", marginBottom:"8px", color:"#BBB"}}>🖼</div>
                  <p style={{margin:"0 0 12px", fontSize:"13px", fontWeight:500}}>ここにスクリーンショットをドラッグ＆ドロップ</p>
                  <div style={{display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap"}}>
                    <button onClick={e=>{e.stopPropagation(); fileRef.current.click();}} style={{
                      fontSize:"13px", padding:"8px 20px", cursor:"pointer",
                      border:"1.5px solid var(--color-border-primary)",
                      borderRadius:"var(--border-radius-md)", background:"white"
                    }}>＋ 画像を選択</button>
                    <button onClick={e=>{e.stopPropagation(); pasteImageFromClipboard();}} style={{
                      fontSize:"13px", padding:"8px 20px", cursor:"pointer",
                      border:"1.5px solid var(--color-border-primary)",
                      borderRadius:"var(--border-radius-md)", background:"white"
                    }}>クリップボードから貼り付け</button>
                  </div>
                  <p style={{margin:"10px 0 0", fontSize:"11px", color:"var(--color-text-tertiary)"}}>Command+V / Ctrl+V、右クリックからも貼り付けできます</p>
                </>
              )}
            </div>
            {pasteMenu && (
              <div
                style={{
                  position:"fixed",
                  left:pasteMenu.x,
                  top:pasteMenu.y,
                  zIndex:200,
                  background:"white",
                  border:"1px solid var(--color-border-secondary)",
                  borderRadius:"var(--border-radius-md)",
                  boxShadow:"0 10px 24px rgba(0,0,0,0.16)",
                  padding:"4px"
                }}
                onClick={e=>e.stopPropagation()}
              >
                <button
                  onClick={pasteImageFromClipboard}
                  style={{border:"none", background:"white", padding:"8px 12px", fontSize:"13px", cursor:"pointer"}}
                >
                  クリップボードから貼り付け
                </button>
              </div>
            )}

            {extracted && renderExtractionNotice()}

            {extracted && <>
              <hr style={{border:"none", borderTop:"1px solid var(--color-border-tertiary)", margin:"0 0 1.25rem"}} />
              <div style={{display:"grid", gap:"8px", marginBottom:"1.25rem"}}>
                {renderJobFields()}
              </div>
              <div className="modal-actions" style={{display:"flex", gap:"8px"}}>
                <Btn onClick={()=>closeJobDraft(true)} style={{flex:1}}>キャンセル</Btn>
                <Btn onClick={()=>{saveJob(); setPreviewImgs([]);}} disabled={!editJob.company} variant="primary" style={{flex:2}}>求人を登録</Btn>
              </div>
            </>}

            {!extracted && (
              <div className="modal-actions" style={{display:"flex", gap:"8px", marginTop:"1.5rem"}}>
                <Btn onClick={()=>closeJobDraft(true)} style={{flex:1}}>キャンセル</Btn>
              </div>
            )}
          </ModalWrap>
        )}

        {modal==="job" && inputMode!=="img" && (
          <ModalWrap onClose={()=>closeJobDraft(false)}>
            <ModalHeader title={editJob.id?"求人を編集":"新規登録"} onClose={()=>closeJobDraft(false)} titleSize="17px" />
            {!editJob.id && !extracted && <>
              {/* Tab switcher */}
              <div style={{display:"flex", gap:0, marginBottom:"1rem", border:"1px solid var(--color-border-primary)", borderRadius:"6px", overflow:"hidden"}}>
                <button onClick={()=>setInputMode("paste")} style={{flex:1, padding:"9px", border:"none", background: inputMode==="paste"?"#4D4D4D":"white", color: inputMode==="paste"?"white":"var(--color-text-secondary)", fontSize:"13px", fontWeight: inputMode==="paste"?600:400, cursor:"pointer"}}>テキストで入力</button>
                <button onClick={()=>{ closeJobDraft(false); openNewJob("img"); }} style={{flex:1, padding:"9px", border:"none", background:"white", color:"var(--color-text-secondary)", fontSize:"13px", fontWeight:400, cursor:"pointer"}}>スクショで入力</button>
              </div>
              <p style={{margin:"0 0 8px", fontSize:"13px", color:"var(--color-text-secondary)"}}>求人ページの本文を全文コピーして貼り付けてください</p>
              <textarea value={rawText} onChange={e=>setRawText(e.target.value)} rows={10}
                placeholder="ここに求人本文をペースト…"
                style={{width:"100%", fontSize:"12px", fontFamily:"var(--font-mono)", resize:"vertical", boxSizing:"border-box", marginBottom:"12px"}} />
              <div className="modal-actions" style={{display:"flex", gap:"8px"}}>
                <Btn onClick={()=>closeJobDraft(true)} style={{flex:1}}>キャンセル</Btn>
                <button onClick={extractText} disabled={!rawText.trim()||extracting} style={{
                  flex:2, padding:"10px", fontSize:"13px", cursor:"pointer",
                  background:"#E8610A", color:"white", border:"none",
                  borderRadius:"var(--border-radius-md)", fontWeight:500,
                  opacity:!rawText.trim()||extracting?0.5:1
                }}>{extracting?"AIが情報を抽出中…":"AIで自動抽出 →"}</button>
              </div>
            </>}
            {(editJob.id || extracted) && <>
              {extracted && renderExtractionNotice()}
              <div style={{display:"grid", gap:"8px", marginBottom:"1.25rem"}}>
                {renderJobFields()}
              </div>
              {saveError && (
                <div style={{padding:"10px 14px", borderRadius:"6px", marginBottom:"1rem", background:"#FFF0F0", border:"1px solid #FFB3B3", fontSize:"13px", color:"#A32D2D"}}>
                  ⚠️ {saveError}
                </div>
              )}
              <div className="modal-actions" style={{display:"flex", gap:"8px"}}>
                <Btn onClick={()=>{ closeJobDraft(true); setSaveError(null); }} style={{flex:1}}>キャンセル</Btn>
                <Btn onClick={saveJob} disabled={!editJob.company || saving} variant="primary" style={{flex:2}}>
                  {saving ? "保存中..." : editJob.id ? "更新する" : "求人を登録"}
                </Btn>
              </div>
            </>}
          </ModalWrap>
        )}

        {dayModal && (
          <ModalWrap onClose={()=>setDayModal(null)} >
            <ModalHeader title={fmtDateFull(dayModal.ds)} onClose={()=>setDayModal(null)} />
            {dayModal.ivs.map(iv=>(
              <div key={iv.id} style={{borderTop:"0.5px solid var(--color-border-tertiary)", paddingTop:"0.75rem", marginTop:"0.75rem"}}>
                <p style={{margin:"0 0 3px", fontWeight:500, fontSize:"14px", color:"#791F1F"}}>{iv.time}〜 {iv.company}</p>
                <p style={{margin:"0 0 3px", fontSize:"12px", color:"var(--color-text-secondary)"}}>
                  {iv.type}面接 / {iv.method}
                  {iv.url && (
                    <>
                      {" / "}
                      <a href={iv.url} target="_blank" rel="noreferrer" style={{color:"#185FA5"}}>
                        {getMeetingLinkLabel(iv.url)}
                      </a>
                    </>
                  )}
                </p>
              </div>
            ))}
          </ModalWrap>
        )}


        {aiJudgeModal && (
          <ModalWrap onClose={()=>{setAiJudgeModal(false);setAiJudgeText("");setAiJudgeResult(null);setAiJudgeErr(null);setAiJudgeImgs([]);setAiJudgeInputMode("text");}}>
            <ModalHeader onClose={()=>{setAiJudgeModal(false);setAiJudgeText("");setAiJudgeResult(null);setAiJudgeErr(null);setAiJudgeImgs([]);setAiJudgeInputMode("text");}} />

            {aiJudgeModal === "input" && (
              <>
                <p style={{margin:"0 0 1.5rem", fontSize:"17px", fontWeight:500, textAlign:"center"}}>求人票をAI判定</p>

                <div style={{display:"flex", gap:0, marginBottom:"1rem", border:"1px solid var(--color-border-primary)", borderRadius:"6px", overflow:"hidden"}}>
                  {[["text","テキストで入力"],["img","スクショで入力"]].map(([mode,label])=>(
                    <button key={mode} onClick={()=>{setAiJudgeInputMode(mode);setAiJudgeErr(null);}} style={{flex:1, padding:"9px", border:"none", background: aiJudgeInputMode===mode?"#4D4D4D":"white", color: aiJudgeInputMode===mode?"white":"var(--color-text-secondary)", fontSize:"13px", fontWeight: aiJudgeInputMode===mode?600:400, cursor:"pointer"}}>{label}</button>
                  ))}
                </div>

                {aiJudgeInputMode === "text" && (
                  <div style={{position:"relative", marginBottom:"1rem"}}>
                    <textarea
                      value={aiJudgeText}
                      onChange={e=>{setAiJudgeText(e.target.value);setAiJudgeErr(null);}}
                      placeholder="ここに求人票を貼り付けてください..."
                      style={{width:"100%", minHeight:"240px", padding:"12px", fontSize:"13px", lineHeight:1.7, border:"1px solid var(--color-border-primary)", borderRadius:"6px", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit"}}
                    />
                    <div style={{fontSize:"11px", color:"var(--color-text-tertiary)", textAlign:"right", marginTop:"4px"}}>{aiJudgeText.length} 文字</div>
                  </div>
                )}

                {aiJudgeInputMode === "img" && (
                  <div style={{marginBottom:"1rem"}}>
                    <div
                      onDragOver={e=>e.preventDefault()}
                      onDrop={async e=>{
                        e.preventDefault();
                        const files = [...e.dataTransfer.files].filter(f=>f.type.startsWith("image/"));
                        const loaded = await Promise.all(files.map(f=>new Promise(res=>{
                          const reader = new FileReader();
                          reader.onload = ev => res({base64: ev.target.result.split(",")[1], type: f.type, name: f.name, preview: ev.target.result});
                          reader.readAsDataURL(f);
                        })));
                        setAiJudgeImgs(prev=>[...prev,...loaded]);
                      }}
                      style={{border:"2px dashed var(--color-border-primary)", borderRadius:"8px", padding:"2rem", textAlign:"center", cursor:"pointer", background:"#FAFAF9"}}
                      onClick={()=>document.getElementById("ai-img-input").click()}
                    >
                      <div style={{fontSize:"24px", marginBottom:"8px"}}>📷</div>
                      <p style={{margin:0, fontSize:"13px", color:"var(--color-text-secondary)"}}>クリックまたはドラッグ&ドロップ</p>
                      <input id="ai-img-input" type="file" accept="image/*" multiple style={{display:"none"}} onChange={async e=>{
                        const files = [...e.target.files];
                        const loaded = await Promise.all(files.map(f=>new Promise(res=>{
                          const reader = new FileReader();
                          reader.onload = ev => res({base64: ev.target.result.split(",")[1], type: f.type, name: f.name, preview: ev.target.result});
                          reader.readAsDataURL(f);
                        })));
                        setAiJudgeImgs(prev=>[...prev,...loaded]);
                      }}/>
                    </div>
                    {aiJudgeImgs.length > 0 && (
                      <div style={{display:"flex", gap:"8px", flexWrap:"wrap", marginTop:"12px"}}>
                        {aiJudgeImgs.map((img,i)=>(
                          <div key={i} style={{position:"relative"}}>
                            <img src={img.preview} style={{width:80, height:80, objectFit:"cover", borderRadius:"4px", border:"1px solid var(--color-border-primary)"}} alt={img.name}/>
                            <button onClick={()=>setAiJudgeImgs(prev=>prev.filter((_,idx)=>idx!==i))} style={{position:"absolute",top:-6,right:-6,background:"#A32D2D",color:"white",border:"none",borderRadius:"50%",width:18,height:18,fontSize:11,cursor:"pointer",lineHeight:1}}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {aiJudgeErr && <div style={{padding:"10px 14px", borderRadius:"6px", marginBottom:"1rem", background:"#FFF0F0", border:"1px solid #FFB3B3", fontSize:"13px", color:"#A32D2D"}}>⚠️ {aiJudgeErr}</div>}

                <div style={{display:"flex", gap:"10px", justifyContent:"center"}}>
                  <button
                    onClick={handleAiJudge}
                    disabled={aiJudgeLoading || (aiJudgeInputMode==="text" ? aiJudgeText.trim().length<50 : aiJudgeImgs.length===0)}
                    style={{padding:"10px 28px", borderRadius:"6px", border:"none", background:"#6366f1", color:"white", fontSize:"14px", fontWeight:600, cursor:"pointer", opacity: (aiJudgeLoading || (aiJudgeInputMode==="text" ? aiJudgeText.trim().length<50 : aiJudgeImgs.length===0)) ? 0.4 : 1}}
                  >{aiJudgeLoading ? "判定中..." : "🔍 AIで判定する"}</button>
                </div>
              </>
            )}

            {aiJudgeModal === "result" && aiJudgeResult && (
              <AiResultCard
                r={aiJudgeResult}
                onSaveToDB={()=>{ openAiJobForm(aiJudgeResult); setAiJudgeModal(false); setAiJudgeText(""); setAiJudgeImgs([]); setAiJudgeResult(null); setAiJudgeErr(null); setAiJudgeInputMode("text"); }}
                onBack={()=>setAiJudgeModal("input")}
                onUpdateField={(key, val)=>{
                  const patch = {[key]: val};
                  const base = {...aiJudgeResult, ...patch};
                  const updated = ["location","employee_count","side_job_ok"].includes(key)
                    ? recalcWithEmployeeCount(base, key==="employee_count"?val:base.employee_count)
                    : base;
                  setAiJudgeResult(updated);
                  dbSaveAiJudgment(updated);
                  setAiJudgedJobs(prev=>prev.map(j=>j.id===updated.id?updated:j));
                }}
              />
            )}
          </ModalWrap>
        )}

        {aiDetailJob && (
          <ModalWrap onClose={()=>setAiDetailJob(null)}>
            <ModalHeader onClose={()=>setAiDetailJob(null)} />
            <AiResultCard
              r={aiDetailJob}
              onSaveToDB={()=>{ openAiJobForm(aiDetailJob); setAiDetailJob(null); }}
              onUpdateField={(key, val)=>{
                const patch = {[key]: val};
                const base = {...aiDetailJob, ...patch};
                const updated = ["location","employee_count","side_job_ok"].includes(key)
                  ? recalcWithEmployeeCount(base, key==="employee_count"?val:base.employee_count)
                  : base;
                setAiDetailJob(updated);
                dbSaveAiJudgment(updated);
                setAiJudgedJobs(prev=>prev.map(j=>j.id===updated.id?updated:j));
              }}
            />
          </ModalWrap>
        )}

        {dupWarning && (
          <ModalWrap onClose={() => setDupWarning(null)}>
            <ModalHeader onClose={() => setDupWarning(null)} />
            <div style={{textAlign:"center", padding:"1rem 0"}}>
              <div style={{fontSize:"32px", marginBottom:"1rem"}}>⚠️</div>
              {dupWarning.level === 2 ? (
                <>
                  <p style={{fontSize:"15px", fontWeight:600, marginBottom:"0.5rem", color:"#A32D2D"}}>全く同じ求人がすでに登録されています</p>
                  <p style={{fontSize:"13px", color:"var(--color-text-secondary)", lineHeight:1.7, marginBottom:"2rem"}}>
                    社名・職種・勤務地・年収が一致する求人が見つかりました。<br/>
                    {dupWarning.phase === "extract" ? "内容を確認してから登録してください。" : "それでも登録しますか？"}
                  </p>
                </>
              ) : (
                <>
                  <p style={{fontSize:"15px", fontWeight:600, marginBottom:"0.5rem", color:"#B45309"}}>同じ社名・職種の求人がすでに登録されています</p>
                  <p style={{fontSize:"13px", color:"var(--color-text-secondary)", lineHeight:1.7, marginBottom:"2rem"}}>
                    同じ社名と職種の求人が見つかりました。<br/>
                    {dupWarning.phase === "extract" ? "内容を確認してから登録してください。" : "それでも登録しますか？"}
                  </p>
                </>
              )}
              <div style={{display:"flex", gap:"12px", justifyContent:"center"}}>
                {dupWarning.phase === "extract" ? (
                  <button onClick={() => setDupWarning(null)} style={{padding:"10px 28px", borderRadius:"6px", border:"none", background:"#E8610A", color:"white", fontSize:"13px", fontWeight:600, cursor:"pointer"}}>確認しました</button>
                ) : (
                  <>
                    <button onClick={() => setDupWarning(null)} style={{padding:"10px 28px", borderRadius:"6px", background:"white", border:"1px solid #D8D5D0", color:"var(--color-text-secondary)", fontSize:"13px", cursor:"pointer"}}>キャンセル</button>
                    <button onClick={dupWarning.onProceed} style={{padding:"10px 28px", borderRadius:"6px", border:"none", background:"#E8610A", color:"white", fontSize:"13px", fontWeight:600, cursor:"pointer"}}>登録する</button>
                  </>
                )}
              </div>
            </div>
          </ModalWrap>
        )}

        {showDeleteAllConfirm && (
          <ModalWrap onClose={()=>setShowDeleteAllConfirm(false)}>
            <ModalHeader onClose={()=>setShowDeleteAllConfirm(false)} />
            <div style={{textAlign:"center", padding:"1rem 0"}}>
              <div style={{fontSize:"32px", marginBottom:"1rem"}}>⚠️</div>
              <p style={{fontSize:"15px", fontWeight:500, marginBottom:"0.5rem", color:"#A32D2D"}}>全データを削除します</p>
              <p style={{fontSize:"13px", color:"var(--color-text-secondary)", lineHeight:1.7, marginBottom:"2rem"}}>
                AI判定済みも含め、すべてのデータが消えます。<br/>本当に実行しますか？
              </p>
              <div style={{display:"flex", gap:"12px", justifyContent:"center"}}>
                <button onClick={()=>setShowDeleteAllConfirm(false)} style={{padding:"10px 28px", borderRadius:"6px", background:"white", border:"1px solid #D8D5D0", color:"var(--color-text-secondary)", fontSize:"13px", cursor:"pointer"}}>キャンセル</button>
                <button onClick={deleteAllData} style={{padding:"10px 28px", borderRadius:"6px", border:"none", background:"#A32D2D", color:"white", fontSize:"13px", fontWeight:600, cursor:"pointer"}}>実行する</button>
              </div>
            </div>
          </ModalWrap>
        )}

        {/* Section heading */}
        <div style={{marginBottom:"18px"}}>
          <h2 style={{fontSize:"24px", fontWeight:500, margin:0, color:"var(--color-text-primary)"}}>応募中の求人一覧</h2>
        </div>

        {/* Filter */}
        <div className="filter-tabs" style={{display:"flex", flexDirection:"column", gap:"8px", marginBottom:"0.75rem"}}>
          {/* 1行目：タブ＋検索バー（右端） */}
          <div style={{display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center"}}>
            {[
              ["active","進行中", jobCounts.active],
              ["interview","📋 面接中", jobCounts.interview],
              ["all","すべて", jobCounts.all],
              ["offer","内定", jobCounts.offer],
              ["closed","終了", jobCounts.closed]
            ].map(([v,l,count])=>(
              <Btn key={v} onClick={()=>setFilter(v)} variant={filter===v?"active":"default"} style={{fontSize:"12px", padding:"4px 10px"}}>
                {l} ({count})
              </Btn>
            ))}
            <Btn onClick={()=>setFilter("ai")} variant={filter==="ai"?"active":"default"} style={{fontSize:"12px", padding:"4px 10px"}}>
              🤖 AI判定済み ({aiJudgedJobs.length})
            </Btn>
            {/* 検索バー：margin-left:autoでタブ行の右端に配置 */}
            <div style={{position:"relative", display:"flex", alignItems:"center", marginLeft:"auto", width:"220px", flexShrink:0}}>
              <span style={{position:"absolute", left:"10px", color:"#9CA3AF", fontSize:"13px", pointerEvents:"none"}}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="会社名・職種・勤務地で検索..."
                style={{
                  fontSize:"12px", padding:"6px 10px 6px 30px",
                  border:"1px solid #D8D5D0", borderRadius:"var(--border-radius-md)",
                  background:"white", color:"var(--color-text-primary)",
                  outline:"none", width:"100%",
                }}
              />
              {searchQuery && (
                <button onClick={()=>setSearchQuery("")} style={{
                  position:"absolute", right:"8px", background:"none", border:"none",
                  cursor:"pointer", color:"#9CA3AF", fontSize:"14px", lineHeight:1, padding:0
                }}>×</button>
              )}
            </div>
          </div>
          {/* 2行目：アクションボタン＋全削除（左寄せ） */}
          <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
            <button onClick={()=>openNewJob("paste")} style={{
              fontSize:"12px", padding:"6px 14px", cursor:"pointer",
              border:"1.5px solid #E8610A", borderRadius:"var(--border-radius-md)",
              background:"#E8610A", color:"white", fontWeight:600,
              display:"flex", alignItems:"center", gap:"6px", whiteSpace:"nowrap"
            }}>＋ 新規登録</button>
            <button onClick={()=>setAiJudgeModal("input")} style={{
              fontSize:"12px", padding:"6px 14px", cursor:"pointer",
              border:"1.5px solid #6366f1", borderRadius:"var(--border-radius-md)",
              background:"#6366f1", color:"white", fontWeight:600,
              display:"flex", alignItems:"center", gap:"6px", whiteSpace:"nowrap"
            }}>🤖 求人を判定する</button>
            {filter === "all" && (
              <button onClick={()=>setShowDeleteAllConfirm(true)} style={{
                fontSize:"12px", padding:"4px 12px", cursor:"pointer",
                border:"1px solid #E2B6B6", borderRadius:"var(--border-radius-md)",
                background:"transparent", color:"#C0392B",
                display:"flex", alignItems:"center", gap:"5px",
              }}>🗑️ 全削除</button>
            )}
          </div>
        </div>

        {/* Jobs table */}
        {filter === "ai" ? (
          <div className="table-scroll" style={{overflowX:"auto", border:"1px solid #D8D5D0", borderRadius:"var(--border-radius-lg)"}}>
            {aiJudgedJobs.length === 0 ? (
              <div style={{textAlign:"center", padding:"3rem", color:"var(--color-text-tertiary)"}}>
                <p style={{marginBottom:"1rem"}}>まだAI判定された求人がありません</p>
                <button onClick={()=>setAiJudgeModal("input")} style={{padding:"8px 20px", background:"#6366f1", color:"white", border:"none", borderRadius:"6px", cursor:"pointer"}}>🤖 求人を判定する</button>
              </div>
            ) : (
              <table style={{width:"100%", borderCollapse:"collapse", fontSize:"12px", minWidth:"900px"}}>
                <thead>
                  <tr style={{background:"#F8F7F5", borderBottom:"1px solid #D8D5D0"}}>
                    {[["判定","60px"],["スコア","70px"],["会社名","130px"],["職種","110px"],["勤務地","100px"],["副業","70px"],["働き方","90px"],["懸念","60px"],["判定日","80px"],["操作","140px"]].map(([h,w])=>(
                      <th key={h} style={{padding:"8px 10px", textAlign:"left", fontSize:"11px", color:"var(--color-text-tertiary)", fontWeight:500, width:w, whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...aiJudgedJobs].sort((a,b)=>b.score-a.score).map((job,i)=>{
                    const jColor = {"◎":"#22c55e","○":"#60a5fa","△":"#fbbf24","×":"#f87171"}[job.judgment]||"#64748b";
                    const sColor = job.score>=80?"#22c55e":job.score>=65?"#60a5fa":job.score>=50?"#fbbf24":"#f87171";
                    const workStyleLabel = job.work_style==="hybrid"?"ハイブリッド":job.work_style==="remote"?"フルリモート":"出社";
                    const sideJobLabel = job.side_job_ok===true?"OK":job.side_job_ok===false?"NG":"不明";
                    const judgedDate = job.judgedAt ? new Date(job.judgedAt).toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"}) : "-";
                    const cellStyle = {padding:"10px", borderBottom:"1px solid #F0EDE8", verticalAlign:"middle"};
                    return (
                      <tr key={job.id} style={{opacity: job.applied ? 0.5 : 1}}>
                        <td style={cellStyle}>
                          <span style={{width:26,height:26,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",background:jColor+"18",color:jColor,fontWeight:700,fontSize:13,border:`1.5px solid ${jColor}40`}}>{job.judgment}</span>
                        </td>
                        <td style={cellStyle}><span style={{fontWeight:700,color:sColor,fontFamily:"monospace"}}>{job.score}</span></td>
                        <td style={{...cellStyle, fontWeight:500}}>{job.company_name||"—"}</td>
                        <td style={{...cellStyle, color:"var(--color-text-secondary)"}}>{job.position||"—"}</td>
                        <td style={{...cellStyle, color:"var(--color-text-secondary)"}}>{job.location||"—"}</td>
                        <td style={{...cellStyle, color: job.side_job_ok===true?"#22c55e":job.side_job_ok===false?"#f87171":"var(--color-text-tertiary)"}}>{sideJobLabel}</td>
                        <td style={{...cellStyle, color:"var(--color-text-secondary)"}}>{workStyleLabel}</td>
                        <td style={{...cellStyle, color:job.concerns?.length?"#fbbf24":"#22c55e"}}>{job.concerns?.length?`${job.concerns.length}件`:"なし"}</td>
                        <td style={{...cellStyle, color:"var(--color-text-tertiary)"}}>{judgedDate}</td>
                        <td style={cellStyle}>
                          <div style={{display:"flex", gap:"6px", flexWrap:"nowrap"}}>
                            <button
                              onClick={()=>setAiDetailJob(job)}
                              style={{padding:"4px 8px", fontSize:"11px", borderRadius:"5px", border:"1px solid #6366f1", background:"rgba(99,102,241,0.08)", color:"#6366f1", cursor:"pointer", whiteSpace:"nowrap"}}
                            >結果を見る</button>
                            <button
                              onClick={()=>{ if(!job.applied) openAiJobForm(job); }}
                              disabled={job.applied}
                              style={{padding:"4px 8px", fontSize:"11px", borderRadius:"5px", border:"1px solid #4D4D4D", background: job.applied?"#eee":"#4D4D4D", color:job.applied?"#999":"white", cursor:job.applied?"default":"pointer", fontWeight:600, whiteSpace:"nowrap"}}
                            >{job.applied?"登録済":"DBに保存"}</button>
                            <button
                              onClick={async ()=>{ await dbDeleteAiJudgment(job.id); setAiJudgedJobs(prev=>prev.filter(j=>j.id!==job.id)); }}
                              style={{padding:"4px 8px", fontSize:"11px", borderRadius:"5px", border:"1px solid #E2B6B6", background:"white", color:"#A32D2D", cursor:"pointer"}}
                            >×</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
        <div className="table-scroll" style={{overflowX:"auto", overflowY:"auto", maxHeight:"520px", border:"1px solid #D8D5D0", borderRadius:"var(--border-radius-lg)"}}>
          <table style={{width:"100%", borderCollapse:"separate", borderSpacing:0, fontSize:"12px", minWidth:filter==="closed"?"1280px":filter==="offer"?"1180px":showDeclineReasonColumn?"1710px":"1590px"}}>
            <thead style={{position:"sticky", top:0, zIndex:20}}>
              <tr style={{background:"#F8F7F5"}}>
                {/* ── sticky列 3本 ── */}
                {[
                  {key:"date", label:"応募日",  sortKey:"date"},
                  {key:"board",label:"求人媒体",sortKey:"board"},
                  {key:"name", label:"社名",    sortKey:"name"},
                ].map(({key,label,sortKey},i)=>{
                  const isActive =
                    (sortKey==="date"  && (sortOrder==="date_desc"||sortOrder==="date_asc")) ||
                    (sortKey==="name"  && sortOrder==="name_asc") ||
                    (sortKey==="board" && sortOrder==="board_asc");
                  const isLast = i === 2;
                  const isAsc  = sortOrder==="date_asc";
                  const chevron = sortKey==="date" ? (isAsc?"▲":"▼") : "▼";
                  const handleSortClick = () => {
                    if (sortKey==="date")  setSortOrder(prev => prev==="date_desc"?"date_asc":"date_desc");
                    if (sortKey==="name")  setSortOrder(prev => prev==="name_asc"?"date_desc":"name_asc");
                    if (sortKey==="board") setSortOrder(prev => prev==="board_asc"?"date_desc":"board_asc");
                  };
                  return (
                    <th key={key} onClick={handleSortClick} style={{
                      ...stickyThStyle(key, isLast, isActive),
                      color: isActive ? "#111" : "var(--color-text-secondary)",
                      cursor:"pointer", userSelect:"none",
                    }}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:"3px"}}>
                        {label}
                        <span style={{fontSize:"9px", color:isActive?"#111":"#999", fontWeight:isActive?700:400}}>
                          {isActive ? chevron : "▼"}
                        </span>
                      </span>
                    </th>
                  );
                })}
                {/* ── 非sticky列 ── */}
                {[
                  ["勤務地","90px","location"],["雇用形態","80px",null],["職種","150px",null],["年収","100px",null],["月給","160px",null],["就業時間","90px",null],["想定残業","120px",null],["リモート","120px",null],["副業","90px",null],["ステータス","145px",null],
                  ...(showDeclineReasonColumn ? [["辞退理由",filter==="closed"?"420px":"120px",null]] : []),
                  ...(showInterviewColumns ? [["面接日","150px",null],["時間","95px",null],["形式","115px",null]] : [])
                ].map(([h,w,sk])=>{
                  const isActive = sk==="location" && sortOrder==="location_asc";
                  const handleSortClick = sk==="location"
                    ? ()=>setSortOrder(prev=>prev==="location_asc"?"date_desc":"location_asc")
                    : undefined;
                  return (
                    <th key={h} onClick={handleSortClick} style={{
                      ...thBase, width:w,
                      color: isActive ? "#111" : "var(--color-text-secondary)",
                      background: isActive ? "#E8E5E0" : "#F8F7F5",
                      cursor: sk ? "pointer" : "default", userSelect:"none",
                    }}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:"3px"}}>
                        {h}
                        {sk && <span style={{fontSize:"9px",color:isActive?"#111":"#999",fontWeight:isActive?700:400}}>{isActive?"▼":"▼"}</span>}
                      </span>
                    </th>
                  );
                })}
                <th style={{...thBase, width:"132px", background:"#F8F7F5"}} />
              </tr>
            </thead>
            <tbody>
              {jobs.length===0 && filteredJobs.length > 0 && (
                <tr><td colSpan={(showDeclineReasonColumn ? 14 : 13) + (showInterviewColumns ? 3 : 0)} style={{padding:"0.5rem 10px", textAlign:"center", background:"#FFF8E7", borderBottom:"1px solid #D8D5D0"}}>
                  <span style={{fontSize:"11px", color:"#8B7355"}}>※ サンプルデータを表示中です。求人を登録すると切り替わります。</span>
                </td></tr>
              )}
              {filteredJobs.map(job=>{
                const isRej = job.status==="不採用";
                const isEnded = job.status==="不採用" || job.status==="内定辞退";
                const isOffer = job.status==="内定";
                const rowBg = isOffer ? "#EAF3DE" : "white";
                // sticky td 用スタイル生成（幅・左位置を定数と完全一致させる）
                const stickyTd = (key, isLast=false) => ({
                  position:"sticky",
                  left: SC[key].left,
                  width: SC[key].width, minWidth: SC[key].width, maxWidth: SC[key].width,
                  zIndex:10,
                  backgroundColor: rowBg,
                  borderRight: TBL_BORDER, borderBottom: TBL_BORDER, borderLeft:"none", borderTop:"none",
                  boxShadow: isLast ? "3px 0 6px -2px rgba(0,0,0,0.15)" : "none",
                });
                const cellStyle = {borderRight: TBL_BORDER, borderBottom: TBL_BORDER, borderLeft:"none", borderTop:"none", backgroundColor: rowBg};
                const tableControlStyle = {
                  display:"block", width:"100%", maxWidth:"100%", height:"28px", minHeight:"28px",
                  borderRadius:"6px", border:"1px solid #BDB8B0", background:"white",
                  boxSizing:"border-box", fontSize:"12px", lineHeight:"26px", textAlign:"left",
                };
                const boardName = getJobBoardName(job);
                const boardLink = getJobBoardLink(job);
                return (
                  <tr key={job.id} style={{opacity:isRej?0.55:1}}>
                    <td style={{...stickyTd("date"),      padding:"8px 10px 8px 16px", color:"var(--color-text-secondary)", whiteSpace:"nowrap"}}>{job.appliedDate ? `${Number(job.appliedDate.slice(5,7))}/${Number(job.appliedDate.slice(8))}` : ""}</td>
                    <td style={{...stickyTd("board"),     padding:"8px 10px 8px 9px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                      {boardLink
                        ? <a href={boardLink} target="_blank" rel="noreferrer" style={{color:"#185FA5", textDecoration:"underline"}} title={`${boardName}を開く`}>{boardName}</a>
                        : <span style={{color:"var(--color-text-secondary)"}}>{boardName}</span>}
                    </td>
                    <td style={{...stickyTd("name", true), padding:"8px 10px", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis"}}>
                      {job.companyWebsiteUrl
                        ? <a href={job.companyWebsiteUrl} target="_blank" rel="noreferrer" title={`${job.company}の企業HPを開く`} style={{color:"#185FA5", textDecoration:"underline"}}>{job.company}</a>
                        : job.company}
                    </td>
                    <td style={{...cellStyle, padding:"8px 10px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                      {getCleanLocation(job)
                        ? <a href={getMapUrl(job.location, job.company)} target="_blank" rel="noreferrer" title={getCleanLocation(job)} style={{color:"#185FA5", textDecoration:"underline"}}>{formatLocationForTable(getCleanLocation(job))}</a>
                        : <span style={{color:"var(--color-text-secondary)"}} />}
                    </td>
                    <td style={{...cellStyle, padding:"8px 10px", color:"var(--color-text-secondary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{formatEmploymentType(job.employmentType)}</td>
                    <td style={{...cellStyle, padding:"8px 10px", overflow:"hidden", textOverflow:"ellipsis", minWidth:"150px"}}>{formatJobType(job.jobType)}</td>
                    <td style={{...cellStyle, padding:"8px 10px", color:"var(--color-text-secondary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{getDisplaySalaryRange(job)}</td>
                    <td style={{...cellStyle, padding:"8px 10px", minWidth:"160px", color:"var(--color-text-secondary)", overflow:"hidden", textOverflow:"ellipsis"}}>
                      {formatMonthlyPay(job.monthlyPay)}{extractFixedOvertimePay(job.overtime) && <span style={{fontSize:"0.85em", color:"var(--color-text-tertiary, #999)"}}> {extractFixedOvertimePay(job.overtime)}</span>}
                    </td>
                    <td style={{...cellStyle, padding:"8px 10px", color:"var(--color-text-secondary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{formatWorkHours(job.workHours)}</td>
                    <td style={{...cellStyle, padding:"8px 10px", color:"var(--color-text-secondary)", overflow:"hidden", textOverflow:"ellipsis", minWidth:"120px"}}>{formatOvertime(job.overtime)}</td>
                    <td style={{...cellStyle, padding:"8px 10px", color:"var(--color-text-secondary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{formatRemoteCondition(job.remoteCondition)}</td>
                    <td style={{...cellStyle, padding:"8px 10px", color: job.sideJob && job.sideJob!=="記載なし" ? "var(--color-text-primary)" : "var(--color-text-tertiary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{job.sideJob || "記載なし"}</td>
                    <td style={{...cellStyle, padding:"8px 10px", verticalAlign:"middle"}}>
                      <select value={job.status} onChange={e=>updateJobStatus(job.id, e.target.value)}
                        style={{...tableControlStyle, padding:"0 2.2ch 0 1ch", minWidth:"12ch", color:isEnded?"#A32D2D":isOffer?"#3B6D11":"var(--color-text-primary)"}}>
                        {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    {showDeclineReasonColumn && (
                      <td style={{...cellStyle, padding:"8px 10px", color:filter==="closed"?"var(--color-text-primary)":"var(--color-text-secondary)", fontWeight:filter==="closed"?500:400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:filter==="closed"?"420px":"120px"}} title={job.declineReason || ""}>
                        {job.status === "内定辞退" ? (job.declineReason || "") : ""}
                      </td>
                    )}
                    {showInterviewColumns && <>
                      <td style={{...cellStyle, padding:"6px 8px", verticalAlign:"middle"}}>
                        {isInterviewStatus(job.status) && <SundayDatePicker value={job.interviewDate||""} onChange={e=>updateJobField(job.id,{interviewDate:e.target.value})} style={{...tableControlStyle, padding:"0 1ch", minWidth:"12ch", cursor:"pointer"}} />}
                      </td>
                      <td style={{...cellStyle, padding:"6px 8px", verticalAlign:"middle"}}>
                        {isInterviewStatus(job.status) && <input type="text" inputMode="numeric" placeholder="1300" value={job.interviewTime||""} onChange={e=>updateJobField(job.id,{interviewTime:normalizeInterviewTimeInput(e.target.value)})} onBlur={e=>updateJobField(job.id,{interviewTime:normalizeInterviewTimeInput(e.target.value, true)})} style={{...tableControlStyle, padding:"0 1ch", minWidth:"6.5ch"}} />}
                      </td>
                      <td style={{...cellStyle, padding:"6px 8px", verticalAlign:"middle"}}>
                        {isInterviewStatus(job.status) && (
                          <select
                            value={job.interviewMethod||"オンライン"}
                            onChange={e=>updateJobField(job.id, e.target.value === "オンライン"
                              ? {interviewMethod:e.target.value}
                              : {interviewMethod:e.target.value, interviewUrl:""})}
                            style={{...tableControlStyle, padding:"0 2.2ch 0 1ch", minWidth:"8.5ch"}}
                          >
                            <option>オンライン</option><option>対面</option>
                          </select>
                        )}
                      </td>
                    </>}
                    <td style={{...cellStyle, padding:"6px 8px", minWidth:"132px"}}>
                      <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", flexWrap:"nowrap", whiteSpace:"nowrap"}}>
                        <button
                          className="table-action-button"
                          onClick={()=>openEditJob(job)}
                          aria-label={`${job.company}を編集`}
                          title="編集"
                          style={{
                            height:"28px",
                            minWidth:"58px",
                            padding:"0 12px",
                            border:"1px solid #D8D5D0",
                            borderRadius:"6px",
                            boxSizing:"border-box",
                            color:"var(--color-text-primary)",
                            background:"white",
                            cursor:"pointer",
                            lineHeight:1,
                            fontSize:"11px",
                            flexShrink:0,
                            whiteSpace:"nowrap"
                          }}
                        >
                          編集
                        </button>
                      <button
                        className="table-action-button"
                        onClick={()=>deleteJob(job.id)}
                        aria-label={`${job.company}を削除`}
                        title="削除"
                        style={{
                          width:"42px",
                          height:"28px",
                          borderRadius:"6px",
                          boxSizing:"border-box",
                          padding:0,
                          border:"1px solid #E2B6B6",
                          color:"#A32D2D",
                          background:"white",
                          cursor:"pointer",
                          lineHeight:1,
                          fontSize:"15px",
                          flexShrink:0
                        }}
                      >
                        ×
                      </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {/* Buttons below table */}
        <div className="bottom-actions" style={{marginTop:"2rem", display:"flex", flexDirection:"column", alignItems:"center", gap:"1.5rem"}}>
          <button onClick={exportCSV} style={{
            fontSize:"13px", padding:"10px 24px", cursor:"pointer",
            border:"1.5px solid #D8D5D0", borderRadius:"var(--border-radius-md)",
            background:"white", color:"#555",
            display:"flex", alignItems:"center", gap:"8px"
          }}>
            <span style={{fontSize:"16px"}}>⬇</span> CSV ダウンロード
          </button>
        </div>

        <div style={{paddingBottom:"3rem"}} />

      </div>

      </>

  </div>
  );
}
