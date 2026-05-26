const instructions = [
  'あなたは日本語・英語の求人票から転職活動管理用の項目を抽出するアシスタントです。',
  '求人票に明記されている情報だけを抽出してください。推測で補完しないでください。',
  '不明な項目は null にしてください。',
  'company は求人票内で応募先・募集企業・問い合わせ先として明記されている会社名を優先してください。親会社、グループ名、運営会社、会社概要だけに載っている会社名は、応募先として明記されていない限り company に入れないでください。',
  '給与は年収を salaryRange、月給を monthlyPay に分けてください。salaryRange には「年収」「想定年収」などのラベルを入れず、必ず 432万円〜、350万円〜450万円 のように数字と万円だけの表記にしてください。年収が円の場合は100万円単位の 万円 表記に整えてください。例: 3,500,000円 - 4,500,000円 は 350万円〜450万円。英語のサイトで¥5000〜6000K、と書かれている場合は500万円〜600万円と入れてください。',
  '公式HPの募集要項で「給与」「報酬」「待遇」などの総合項目に 応相談、当社規定、経験・能力を考慮、スキルに応じて決定 のような金額ではない給与条件だけが書かれている場合は、salaryRange にその短い条件を入れてください。年収・月給の区別ができない場合でも空欄にしないでください。',
  'monthlyPay には金額だけを入れ、35万円〜70万円のような万円表記ではなく、必ず350,000円〜700,000円のように円表記にしてください。先頭の「月給」「月収」というラベルは入れないでください。',
  '月給欄がないが、給与条件が「応相談」「当社規定」「経験・能力を考慮」などだけの場合は monthlyPay にも同じ短い条件を入れてください。年俸・年収だけが明記されている場合は monthlyPay は null にしてください。',
  '雇用形態は employmentType に入れ、原文が英語でも正社員、派遣社員、契約社員、業務委託、パートなど日本語に統一してください。Permanent employee、Full-Time、Full time は正社員にしてください。',
  '職種 jobType には雇用形態を入れず、日本語で短く統一してください。例: Web Director は Webディレクター、Web Producer は Webプロデューサー、UI/UX Designer は UI/UXデザイナー、Contents Planning や Planning は プランナー、Editing は 編集。重複する職種名は1つにまとめてください。',
  '就業時間 workHours は、Working Hours、Working Time、Work Hours、Work Schedule、Business Hours、勤務時間、就業時間など、英語・日本語の関連項目から必ず探してください。AM/PM表記は24時間表記に変換し、9:15 AM – 6:15 PM は 9:15〜18:15 のように半角数字とコロンで入れてください。フレックス、フレックスタイム制、Flextime、flex がある場合は、標準勤務時間に加えて開始可能時間などの特記事項も短く含めてください。例: Standard working hours: 9:15 AM – 6:15 PM / Flextime available: Start work anytime between 7:00 AM - 10:00 AM は 9:15〜18:15（7:00から就業可能） としてください。コアタイムがあれば コアタイム 10:00〜15:00 のように入れてください。時間情報がないフレックス表記だけの場合は null にしてください。',
  '想定残業時間 overtime には、残業20時間、みなし残業30時間、固定残業45時間、時間外労働：有り など、残業に関する情報を必ず抽出してください。みなし残業・固定残業がある場合は、みなし残業●時間 の表記に統一してください。',
  '想定残業時間が募集要項内に書かれていない場合は overtime を null ではなく 不明 にしてください。ただし、固定残業やみなし残業の時間が給与欄に含まれている場合は必ずその時間を優先してください。',
  'リモート条件は リモート可、リモート可（最大週2日）、リモート可（週3日程度）、リモート可（フルリモート）、リモート不可、不明 のように日本語で短く統一してください。On-site work や Remote Work not available は リモート不可 にしてください。',
  '副業・兼業に関する記載を sideJob に入れてください。副業・兼業OKと書かれているだけの場合は「可」、条件付きの場合は「可（要申請）」「可（ただし競業は不可）」のように条件を括弧内に短く記載してください。副業・兼業不可の場合は「不可」、記載が一切ない場合は「記載なし」にしてください。',
  '求人媒体名は jobBoard に必ず入れてください。例: ビズリーチ、Daijob、マイナビ転職、リクナビNEXT、マスメディアン、ミドルの転職、エン転職、doda、doda X、マイナビスカウティング、Direct Type、Michael Page、レバテック、Geekly、RECRUIT DIRECT。企業公式サイトや採用サイトなど上記以外のURLの場合は 自社サイト にしてください。URLや画像から判別できない場合だけ null にしてください。',
  '募集要項URLが明記されている場合だけ jobPostUrl に入れてください。URLが見えない場合は null にしてください。',
  '企業公式サイト、会社HP、企業ホームページ、ホームページ、URLなどとして明記されている企業HPのURLは companyWebsiteUrl に入れてください。求人媒体のURLや募集要項URLは companyWebsiteUrl に入れないでください。',
  'companyWebsiteUrl は求人票・募集要項内にURL文字列が明記されている場合だけ入れてください。会社名やドメインを推測して公式URLを作らないでください。URLが見つからない場合は必ず null にしてください。',
  '勤務地 location は原文が英語でも日本語にしてください。求人票の項目名が Location だけでなく、Nearest Station、Work location、Office、Head Office、Office attendance required、勤務地、勤務先、配属先、就業場所などに分かれていても、実際に通勤・勤務する場所を意味から判断してください。',
  '求人票に 面接地 が明記され、勤務地・勤務先・就業場所が別に見えない場合は、面接地の住所を location として扱ってください。',
  '勤務地 location は保存用には番地・ビル名・階数まで可能な限り詳しく入れてください。表では都道府県と市または区と町名のみを表示しますが、Google Map検索では詳細住所を使います。例: Tokyo, Shibuya, Dogenzaka は 東京都渋谷区道玄坂、Head Office (1-7-7 Iwamachi, Chuo-ku, Osaka City, Osaka Sakaisuji L Tower) は 大阪府大阪市中央区岩町1-7-7 Osaka Sakaisuji L Tower。',
  'location には必ず住所・地域・駅名・建物名など場所を表す情報だけを入れ、会社名・ブランド名・求人媒体名は絶対に含めないでください。例: ABC Technologies 東京都新宿区 は 東京都新宿区、ZenGroup INC Osaka Sakaisuji L Tower 1-7-7 Iwamachi... は Osaka Sakaisuji L Tower 1-7-7 Iwamachi... としてください。',
  '「マイナビ転職の勤務地区分では... 東京都」「Asia」のような分類・地域表示よりも、勤務先住所として書かれている具体的な住所を優先してください。',
  '会社概要・企業情報だけに載っている本社所在地は勤務地として扱わないでください。ただし、Nearest Station や Office attendance required と一緒に Head Office が通勤先として書かれている場合は、その Head Office の住所を番地・ビル名まで含めて勤務地 location として扱ってください。',
  '勤務先として使える住所や駅情報が見えない場合だけ、location は null にしてください。',
  '勤務時間欄に「時間外労働：有」「時間外労働：有り」がある場合は、overtime に「※時間外労働：有り」を必ず含めてください。',
  '勤務時間欄に変形労働時間制、裁量労働制、事業場外みなし労働、シフト制、休日出勤、固定残業、みなし残業、フレックスタイム制など通常勤務と異なる条件があれば、workHours だけでなく overtime にも注意書きとして短く含めてください。',
].join('\n')

export const sendJson = (res, status, data) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

export const readJson = (req) => {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(req.body ? JSON.parse(req.body) : {})
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

const extractJson = (text) => {
  const cleaned = String(text || '').replace(/```json|```/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  return JSON.parse(match ? match[0] : cleaned || '{}')
}

const judgeInstructions = `あなたは転職支援AIです。以下の求人票から情報を抽出してJSONで返してください。スコア計算は不要です。

## ユーザープロフィール
- 職種経験: Director / Planner / Editor / Writer / Copywriter（出版・広告・TV）
- Web技術: HTML/CSS/JavaScript / React学習中 / Figma / UI/UX設計
- 強み: 情報設計・構成力・コピーライティング・編集視点・UX思考・AI活用・英語力・レイアウト作成・デザインのディレクション
- 転職目的: Web業界に入り、Webサイト制作を実務で学ぶ。数年後にフリーランス・副業として個人案件をこなせるスキルを身につける

## 抽出項目

### 基本情報
- company_name: 会社名
- position: 職種名
- location: 勤務地（都道府県・市区町村・最寄り駅まで）
- salary: 給与（記載がなければnull）
- employee_count: 社員数（数値のみ。記載がなければnull）
- fixed_overtime: 平均残業時間・月平均残業時間（数字＋時間の形式。みなし残業代の時間数は含めない。記載がなければnull）
- company_type: 会社種別（制作会社・事業会社・広告代理店・コンサル等）

### 判定フラグ（boolean）
- has_web_production: Webサイト制作（コーポレート・採用・EC・コンテンツ系）に関わる記述があるか
- has_direction_or_planning: ディレクション・企画・プランニング・コピーライティング・構成・編集・UXライティング・情報設計のいずれかの記述があるか
- is_production_company: 多様なジャンル・業種の案件を扱う受託型の制作会社かどうか
- has_ai_usage: AI活用・ChatGPT・Claude等の具体的AIツール言及があるか
- side_job_ok: 副業可の記載あり→true、副業不可・兼業不可の明記あり→false、記載なし→null
- work_style: ハイブリッド勤務（週数日リモート・在宅勤務可・リモート可）→"hybrid"、フルリモート・完全在宅→"remote"、出勤のみ・リモート記載なし→"office"

### NG条件
- ng_triggered: 渋谷駅・池袋駅が勤務地、または副業NG明記の場合true
- ng_reasons: NG理由の配列（例：["渋谷駅", "副業NG"]）

### 分析コメント
- strengths: この求人の良い点（配列・3件以内・各20字以内で端的に）
- concerns: 懸念点（配列・3件以内・各20字以内で端的に）
- unknowns: 求人票から読み取れなかった重要項目（配列・各15字以内）
- missing_info_priority: 面接前に確認すべき最優先事項（配列・2件以内・各20字以内）
- comment: AIによる総評（50字以内）
- job_category: 関連する職種カテゴリ（配列）

## 出力形式
JSONのみ。コードブロック不要。
{"company_name":"","position":"","location":"","salary":null,"employee_count":null,"fixed_overtime":null,"company_type":"","has_web_production":false,"has_direction_or_planning":false,"is_production_company":false,"has_ai_usage":false,"side_job_ok":null,"work_style":"office","ng_triggered":false,"ng_reasons":[],"strengths":[],"concerns":[],"unknowns":[],"missing_info_priority":[],"comment":"","job_category":[]}`

const toHalfWidth = (value = '') => String(value || '').replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))

const normalizeSalaryText = (value = '') => {
  const text = toHalfWidth(value)
    .replace(/\s+/g, ' ')
    .replace(/^[：:\s]+/, '')
    .replace(/^(給与|給料|賃金|報酬|年収|想定年収|月給|月収|基本給|待遇)\s*[：:]?\s*/, '')
    .trim()
  if (!text) return ''
  return text
    .replace(/\s*[-~～]\s*/g, '〜')
    .replace(/万円\s*〜\s*/g, '万円〜')
}

const getLabeledValue = (text, labels) => {
  const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const labelPattern = labels.join('|')
    const inline = line.match(new RegExp(`^(?:${labelPattern})\\s*[：:\\t ]+(.+)$`))
    if (inline?.[1]) return inline[1].trim()
    if (labels.some(label => line === label || line.replace(/[＊*]/g, '').trim() === label)) {
      const next = lines.slice(i + 1).find(candidate => !labels.some(label => candidate === label))
      if (next) return next.trim()
    }
  }

  return ''
}

const inferSalaryFields = (text) => {
  const result = {}
  const salary = normalizeSalaryText(getLabeledValue(text, ['給与', '給料', '賃金', '報酬', '待遇']))
  const annual = normalizeSalaryText(getLabeledValue(text, ['年収', '想定年収', '年俸']))
  const monthly = normalizeSalaryText(getLabeledValue(text, ['月給', '月収', '基本給']))
  const genericNegotiable = /(応相談|当社規定|経験.*能力|能力.*経験|スキル.*考慮|個別に定め|決定)/.test(salary)

  if (annual) result.salaryRange = annual
  if (monthly) result.monthlyPay = monthly

  if (!result.salaryRange && salary) {
    const annualInSalary = salary.match(/(?:年収|想定年収|年俸)[：:\s]*([^。/\n]+(?:万円|円|応相談|当社規定)[^。/\n]*)/)
    result.salaryRange = annualInSalary ? normalizeSalaryText(annualInSalary[1]) : salary
  }

  if (!result.monthlyPay && salary) {
    const monthlyInSalary = salary.match(/(?:月給|月収|基本給)[：:\s]*([^。/\n]+(?:万円|円|応相談|当社規定)[^。/\n]*)/)
    if (monthlyInSalary) result.monthlyPay = normalizeSalaryText(monthlyInSalary[1])
    else if (genericNegotiable) result.monthlyPay = salary
  }

  return result
}

const inferOvertime = (text) => {
  const source = toHalfWidth(text)
  const fixed = source.match(/(?:みなし残業|固定残業)[^0-9]{0,20}(\d+(?:\.\d+)?)\s*時間/)
  if (fixed) return `みなし残業${fixed[1]}時間`
  const monthly = source.match(/(?:想定残業時間|平均残業時間|月平均残業|残業時間|時間外労働)[^0-9]{0,20}(\d+(?:\.\d+)?)\s*時間/)
  if (monthly) return `${monthly[1]}時間`
  if (/時間外労働\s*[：:]?\s*(有り|有|あり)/.test(source)) return '時間外労働：有り'
  if (/(残業|時間外労働|みなし残業|固定残業)/.test(source)) return '不明'
  return ''
}

const supplementTextExtraction = (result, text) => {
  const supplemental = inferSalaryFields(text)
  const overtime = inferOvertime(text)
  const pick = (...values) => values.find(value => value !== undefined && value !== null && value !== '') ?? null
  return sanitizeSourceBoundUrls({
    ...result,
    salaryRange: pick(result.salaryRange, supplemental.salaryRange),
    monthlyPay: pick(result.monthlyPay, supplemental.monthlyPay),
    overtime: pick(result.overtime, overtime, '不明'),
  }, text)
}

const normalizeUrlForCompare = (value = '') => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/^https?:\/\//, '')
  .replace(/^www\./, '')
  .replace(/[?#].*$/, '')
  .replace(/\/+$/, '')

const sanitizeSourceBoundUrls = (result, sourceText) => {
  const source = String(sourceText || '').toLowerCase()
  const candidate = String(result.companyWebsiteUrl || '').trim()
  if (!candidate) return result

  const normalizedCandidate = normalizeUrlForCompare(candidate)
  const normalizedSource = normalizeUrlForCompare(source)
  const appearsInSource = normalizedCandidate && normalizedSource.includes(normalizedCandidate)
  const sameAsJobPost = normalizeUrlForCompare(result.jobPostUrl) === normalizedCandidate

  return {
    ...result,
    companyWebsiteUrl: appearsInSource && !sameAsJobPost ? candidate : null,
  }
}

const getGeminiConfig = () => ({
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  geminiKey: process.env.GEMINI_API_KEY || '',
})

const requireGemini = (res) => {
  const { geminiKey } = getGeminiConfig()
  if (geminiKey) return true
  sendJson(res, 500, {
    error: 'GEMINI_API_KEY が未設定です。VercelのEnvironment Variables、またはローカルの.env.localにAPIキーを追加してください。',
  })
  return false
}

const geminiRequest = async (parts) => {
  const { model, geminiKey } = getGeminiConfig()
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini API error: ${response.status}`)
  }
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '{}'
  return extractJson(text)
}

export const handleHealth = (_req, res) => {
  const { model, geminiKey } = getGeminiConfig()
  sendJson(res, 200, { ok: true, gemini: Boolean(geminiKey), model })
}

export const handleExtractText = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'POST only' })
    return
  }
  if (!requireGemini(res)) return

  try {
    const body = await readJson(req)
    const text = String(body.text || '').trim()
    if (!text) {
      sendJson(res, 400, { error: '求人本文が空です。' })
      return
    }

    const result = supplementTextExtraction(await geminiRequest([
      { text: `${instructions}\n\n以下のJSON形式だけで返してください。キーは必ず company, companyWebsiteUrl, jobBoard, jobPostUrl, location, employmentType, jobType, salaryRange, monthlyPay, workHours, overtime, remoteCondition を使い、不明な値は null にしてください。\n\n求人本文:\n${text}` },
    ]), text)

    sendJson(res, 200, result)
  } catch (error) {
    console.error(error)
    sendJson(res, 500, { error: error?.message || 'Geminiでのテキスト抽出に失敗しました。' })
  }
}

export const handleExtractImage = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'POST only' })
    return
  }
  if (!requireGemini(res)) return

  try {
    const body = await readJson(req)
    const image = String(body.image || '')
    if (!image.startsWith('data:image/')) {
      sendJson(res, 400, { error: '画像データが見つかりません。' })
      return
    }

    const [header, data] = image.split(',')
    const mimeType = header.match(/^data:(image\/[^;]+);base64$/)?.[1] || 'image/png'
    const result = await geminiRequest([
      { text: `${instructions}\n\n添付画像の求人票から項目を抽出し、以下のJSON形式だけで返してください。キーは必ず company, companyWebsiteUrl, jobBoard, jobPostUrl, location, employmentType, jobType, salaryRange, monthlyPay, workHours, overtime, remoteCondition を使い、不明な値は null にしてください。` },
      { inlineData: { mimeType, data } },
    ])

    sendJson(res, 200, result)
  } catch (error) {
    console.error(error)
    sendJson(res, 500, { error: error?.message || 'Geminiでの画像抽出に失敗しました。' })
  }
}

export const handleJudge = async (req, res) => {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'POST only' })
    return
  }
  if (!requireGemini(res)) return

  try {
    const body = await readJson(req)
    const mode = body.mode === 'image' ? 'image' : 'text'

    if (mode === 'text') {
      const text = String(body.text || '').trim()
      if (text.length < 50) {
        sendJson(res, 400, { error: '求人票を貼り付けてください（50文字以上）' })
        return
      }

      const result = await geminiRequest([
        { text: `${judgeInstructions}\n\n以下の求人票を分析してください。JSONのみで返答してください。\n\n---\n${text}\n---` },
      ])
      sendJson(res, 200, result)
      return
    }

    const images = Array.isArray(body.images) ? body.images : []
    const parts = images
      .filter(image => image?.base64)
      .map(image => ({
        inlineData: {
          mimeType: image.type || 'image/jpeg',
          data: String(image.base64),
        },
      }))

    if (parts.length === 0) {
      sendJson(res, 400, { error: '求人票画像を添付してください。' })
      return
    }

    const result = await geminiRequest([
      { text: `${judgeInstructions}\n\n以下の求人票画像を分析してください。JSONのみで返答してください。` },
      ...parts,
    ])
    sendJson(res, 200, result)
  } catch (error) {
    console.error(error)
    sendJson(res, 500, { error: error?.message || 'Geminiでの求人判定に失敗しました。' })
  }
}
