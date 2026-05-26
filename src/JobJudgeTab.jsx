import { useState, useEffect } from "react";


const SAMPLE = `【会社名】株式会社クリエイティブワークス
【職種】Webディレクター／コンテンツプランナー
【勤務地】東京都新宿区西新宿（新宿駅徒歩5分）
【給与】400〜600万円
【社員数】45名
【仕事内容】
コーポレートサイト・採用サイト・ブランドサイトのディレクション業務をお任せします。クライアントのヒアリングから情報設計、ワイヤーフレーム制作、ライター・デザイナーへの指示出し、進行管理、品質チェックまで一貫して担当いただきます。コピーライティングや編集経験がある方は、コンテンツ設計にも積極的に関わっていただけます。
【求める人物像】
ユーザー視点でコンテンツを考えられる方。編集・ライティング・企画のいずれかの経験がある方。Figmaを使った設計経験。
【待遇】
みなし残業なし（残業代は全額別途支給）。副業可。フレックスタイム制。リモートワーク週2〜3日可。`;

const calculateScore = (data, empOverride) => {
  let score = 0;
  const empNum = empOverride != null ? parseInt(empOverride) : parseInt(data.employee_count);

  if (data.has_web_production) score += 20;
  if (data.has_direction_or_planning) score += 20;
  if (data.is_production_company) score += 20;
  if (!isNaN(empNum) && empNum >= 30) score += 10;
  if (data.side_job_ok === true) score += 10;

  const loc = String(data.location || "");
  if (["中野", "大久保", "代々木", "千駄ヶ谷"].some(x => loc.includes(x))) score += 10;
  else if (["高円寺", "阿佐ヶ谷", "新宿"].some(x => loc.includes(x))) score += 8;
  else if (loc.includes("吉祥寺")) score += 5;
  else if (loc.includes("四谷")) score += 4;

  if (data.work_style === "hybrid" || data.work_style === "remote") score += 10;

  return Math.min(score, 100);
};

const getJudgment = (score) => score >= 80 ? "◎" : score >= 65 ? "○" : score >= 50 ? "△" : "×";
const getPriority = (score) => score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D";

const gc = j => ({"◎":"#22c55e","○":"#60a5fa","△":"#fbbf24","×":"#f87171"}[j]||"#64748b");
const sc = s => s>=80?"#22c55e":s>=65?"#60a5fa":s>=50?"#fbbf24":"#f87171";

function ScoreBar({score}){
  const [w,setW]=useState(0);
  useEffect(()=>{setTimeout(()=>setW(score),100);},[score]);
  return(
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{flex:1,height:8,background:"rgba(255,255,255,0.07)",borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${w}%`,background:sc(score),borderRadius:99,transition:"width 0.9s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:`0 0 10px ${sc(score)}50`}}/>
      </div>
      <span style={{fontSize:21,fontWeight:800,color:sc(score),minWidth:48,fontFamily:"monospace"}}>{score}</span>
    </div>
  );
}

function Chip({icon,label,val,alert,hi}){
  return(
    <div style={{padding:"8px 11px",borderRadius:8,background:alert?"rgba(248,113,113,0.06)":hi?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.03)",border:`1px solid ${alert?"rgba(248,113,113,0.18)":hi?"rgba(34,197,94,0.18)":"rgba(255,255,255,0.06)"}`}}>
      <div style={{fontSize:11,color:"#94a3b8",marginBottom:2}}>{icon} {label}</div>
      <div style={{fontSize:13,fontWeight:500,color:val?"#e2e8f0":"#94a3b8"}}>{val||"不明"}</div>
    </div>
  );
}

function Sec({title,items,color}){
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

function Card({r,onApply,onSave,onUpdateEmployeeCount}){
  const [open,setOpen]=useState(false);
  const [editingEmp,setEditingEmp]=useState(false);
  const [empVal,setEmpVal]=useState(r.employee_count||"");
  const jc=gc(r.judgment);
  return(
    <div style={{background:"rgba(15,23,42,0.85)",borderRadius:16,border:"1px solid rgba(255,255,255,0.06)",borderLeft:`4px solid ${jc}`,padding:24,boxShadow:"0 4px 40px rgba(0,0,0,0.5)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,borderRadius:"50%",background:jc+"18",border:`2px solid ${jc}45`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:jc,boxShadow:`0 0 18px ${jc}35`}}>{r.judgment}</div>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:"#f1f5f9",letterSpacing:"-0.02em"}}>{r.company_name||"会社名不明"}</div>
            <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{r.position||"職種不明"}</div>
          </div>
        </div>
        <span style={{padding:"3px 11px",borderRadius:99,fontSize:11,fontWeight:700,background:`${sc(r.score)}15`,color:sc(r.score),border:`1px solid ${sc(r.score)}30`}}>優先度 {r.priority}</span>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#64748b",marginBottom:5,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase"}}>適性スコア / 100</div>
        <ScoreBar score={r.score}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:4,marginTop:8,marginBottom:14}}>
          {(()=>{
            const loc = String(r.location||"");
            const locPts = ["中野","大久保","代々木","千駄ヶ谷"].some(x=>loc.includes(x))?10:["高円寺","阿佐ヶ谷","新宿"].some(x=>loc.includes(x))?8:loc.includes("吉祥寺")?5:loc.includes("四谷")?4:0;
            const workPts = (r.work_style==="hybrid"||r.work_style==="remote")?10:0;
            return [
              {label:"Web制作に関われる", val:r.has_web_production, pts:20},
              {label:"企画・ディレクション", val:r.has_direction_or_planning, pts:20},
              {label:"制作会社・多案件環境", val:r.is_production_company, pts:20},
              {label:"社員数30名以上", val:!isNaN(parseInt(r.employee_count))&&parseInt(r.employee_count)>=30, pts:10},
              {label:"副業OK", val:r.side_job_ok===true, pts:10},
              {label:"勤務地相性", val:locPts>0, pts:locPts, sub:locPts>0?`+${locPts}点`:"-"},
              {label:"働き方の柔軟性", val:workPts>0, pts:workPts},
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
      {r.ng_triggered&&(
        <div style={{padding:"10px 14px",borderRadius:8,marginBottom:14,background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.22)",fontSize:13,color:"#fca5a5"}}>
          <strong>⚠️ NG条件：</strong>{r.ng_reasons?.join("、")}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))",gap:8,marginBottom:14}}>
        <Chip icon="📍" label="勤務地" val={r.location}/>
        <div style={{padding:"8px 11px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:4}}>👥 社員数</div>
          {editingEmp?(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <input value={empVal} onChange={e=>setEmpVal(e.target.value)}
                placeholder="例: 50名"
                style={{width:"80px",padding:"3px 6px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(99,102,241,0.5)",borderRadius:5,color:"#e2e8f0",fontSize:12,outline:"none"}}
                onKeyDown={e=>{if(e.key==="Enter"){setEditingEmp(false);if(onUpdateEmployeeCount)onUpdateEmployeeCount(empVal);}if(e.key==="Escape")setEditingEmp(false);}}
                autoFocus
              />
              <button onClick={()=>{setEditingEmp(false);if(onUpdateEmployeeCount)onUpdateEmployeeCount(empVal);}} style={{background:"#6366f1",border:"none",borderRadius:4,color:"white",fontSize:10,padding:"3px 7px",cursor:"pointer"}}>保存</button>
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:13,fontWeight:500,color:empVal?"#e2e8f0":"#94a3b8"}}>{empVal||"不明"}</span>
              <button onClick={()=>setEditingEmp(true)} style={{background:"none",border:"none",color:"#94a3b8",fontSize:10,cursor:"pointer",padding:"1px 4px",borderRadius:3,lineHeight:1}} title="編集">✏️</button>
            </div>
          )}
        </div>
        <Chip icon="💰" label="給与" val={r.salary}/>
        <Chip icon="⏰" label="固定残業" val={r.fixed_overtime} alert={r.fixed_overtime&&parseInt(r.fixed_overtime)>=40}/>
        <Chip icon="🏠" label="副業" val={r.side_job_ok===true?"OK ✓":r.side_job_ok===false?"NG":"不明"} hi={r.side_job_ok===true} alert={r.side_job_ok===false}/>
        <Chip icon="🏢" label="会社種別" val={r.company_type}/>
      </div>
      <div style={{marginBottom:14}}>
        {r.job_category?.map((c,i)=><span key={i} style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:"rgba(99,102,241,0.1)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,0.22)",marginRight:5,display:"inline-block",marginBottom:3}}>{c}</span>)}
      </div>
      <button onClick={()=>setOpen(!open)} style={{background:"none",border:"none",color:"#64748b",fontSize:12,cursor:"pointer",padding:"3px 0",marginBottom:open?14:0,display:"block"}}>
        {open?"▲ 詳細を閉じる":"▼ 詳細を見る"}
      </button>
      {open&&(
        <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:14,marginBottom:14}}>
          <Sec title="✅ 合っている点" items={r.strengths} color="#22c55e"/>
          <Sec title="⚠️ 懸念点" items={r.concerns} color="#fbbf24"/>
          <Sec title="❓ 確認が必要" items={r.unknowns} color="#64748b"/>
          {r.missing_info_priority?.length>0&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:"#a5b4fc",marginBottom:5}}>🔍 優先確認事項</div>
              <ol style={{margin:0,paddingLeft:16}}>{r.missing_info_priority.map((x,i)=><li key={i} style={{fontSize:13,color:"#94a3b8",lineHeight:1.8}}>{x}</li>)}</ol>
            </div>
          )}
        </div>
      )}
      <div style={{display:"flex",gap:10,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <button onClick={()=>onApply(r)} disabled={r.ng_triggered} style={{padding:"9px 20px",borderRadius:8,border:"none",background:r.ng_triggered?"rgba(34,197,94,0.1)":"#22c55e",color:r.ng_triggered?"#22c55e50":"white",fontSize:13,fontWeight:600,cursor:r.ng_triggered?"not-allowed":"pointer"}}>応募する →</button>
        <button onClick={onSave} style={{padding:"9px 20px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8",fontSize:13,cursor:"pointer"}}>💾 保存</button>
      </div>
    </div>
  );
}

function List({jobs,onSelect,onApply}){
  const [f,setF]=useState("all");
  const shown=f==="all"?jobs:jobs.filter(j=>j.judgment===f);
  return(
    <div>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["all","◎","○","△","×"].map(x=>{
          const cnt=x==="all"?jobs.length:jobs.filter(j=>j.judgment===x).length;
          return <button key={x} onClick={()=>setF(x)} style={{padding:"5px 13px",borderRadius:99,border:"none",background:f===x?"#6366f1":"rgba(255,255,255,0.04)",color:f===x?"white":"#94a3b8",fontSize:12,cursor:"pointer",fontWeight:f===x?600:400}}>{x==="all"?"すべて":x} ({cnt})</button>;
        })}
      </div>
      {shown.length===0?<p style={{textAlign:"center",padding:40,color:"#64748b"}}>該当なし</p>:(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr>{["判定","会社名","職種","勤務地","スコア","優先度","懸念",""].map((h,i)=><th key={i} style={{textAlign:"left",padding:"8px 10px",fontSize:11,color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((job,i)=>(
                <tr key={i} onClick={()=>onSelect(job)} style={{cursor:"pointer",opacity:job.ng_triggered?0.5:1}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                    <span style={{width:26,height:26,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",background:gc(job.judgment)+"18",color:gc(job.judgment),fontWeight:700,fontSize:13,border:`1.5px solid ${gc(job.judgment)}40`}}>{job.judgment}</span>
                  </td>
                  <td style={{padding:"10px",color:"#e2e8f0",fontWeight:500,borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{job.company_name||"—"}</td>
                  <td style={{padding:"10px",color:"#64748b",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{job.position||"—"}</td>
                  <td style={{padding:"10px",color:"#64748b",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>{job.location||"—"}</td>
                  <td style={{padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{fontWeight:700,color:sc(job.score),fontFamily:"monospace"}}>{job.score}</span></td>
                  <td style={{padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:4,background:`${sc(job.score)}15`,color:sc(job.score)}}>{job.priority}</span></td>
                  <td style={{padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}><span style={{fontSize:12,color:job.concerns?.length?"#fbbf24":"#22c55e"}}>{job.concerns?.length?`${job.concerns.length}件`:"なし"}</span></td>
                  <td style={{padding:"10px",borderBottom:"1px solid rgba(255,255,255,0.03)"}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>onApply(job)} disabled={job.ng_triggered||job.applied} style={{padding:"4px 11px",fontSize:11,borderRadius:6,background:"rgba(34,197,94,0.12)",color:job.applied?"#22c55e60":"#22c55e",border:"1px solid rgba(34,197,94,0.22)",cursor:(job.ng_triggered||job.applied)?"default":"pointer",fontWeight:600}}>{job.applied?"応募済":"応募"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function JobJudgeTab() {
  const [view,setView]=useState("input");
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState(null);
  const [result,setResult]=useState(null);
  const [saved,setSaved]=useState([]);

  const judgeWithGemini = async (text) => {
    const response = await fetch("/api/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({mode: "text", text}),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Gemini API error: ${response.status}`);
    return data;
  };

  const judge = async () => {
    if (text.trim().length < 50) { setErr("求人票を貼り付けてください（50文字以上）"); return; }
    setLoading(true); setErr(null);
    try {
      const parsed = await judgeWithGemini(text);
      const score = calculateScore(parsed, null);
      const judgment = getJudgment(score);
      const priority = getPriority(score);
      setResult({ ...parsed, score, judgment, priority, jobText: text, judgedAt: new Date().toISOString(), id: Date.now(), applied: false });
      setView("result");
    } catch (e) {
      setErr(e.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const recalcWithEmployeeCount = (currentResult, empVal) => {
    const newScore = calculateScore(currentResult, empVal);
    return {
      ...currentResult,
      employee_count: empVal,
      score: newScore,
      judgment: getJudgment(newScore),
      priority: getPriority(newScore),
    };
  };

  const save=()=>{
    if(!result)return;
    setSaved(prev=>{
      const idx=prev.findIndex(j=>j.company_name===result.company_name&&j.position===result.position);
      if(idx>=0){const u=[...prev];u[idx]=result;return u;}
      return[result,...prev];
    });
    setView("list");
  };

  const apply=(job)=>{
    setSaved(prev=>prev.map(j=>j.id===job.id?{...j,applied:true}:j));
    if(result?.id===job.id)setResult(r=>({...r,applied:true}));
  };

  const tabs=[
    {id:"input",label:"求人票を判定"},
    {id:"list",label:"判定済み一覧",count:saved.length},
    ...(result?[{id:"result",label:"最新の判定結果"}]:[]),
  ];

  return(
    <div style={{minHeight:"60vh",background:"linear-gradient(135deg,#070d1a 0%,#0f172a 60%,#070d1a 100%)",fontFamily:"'DM Sans','Noto Sans JP',system-ui,sans-serif",color:"#e2e8f0",borderRadius:"12px",overflow:"hidden"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Inner nav */}
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 24px 0",background:"rgba(10,15,30,0.7)"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:14}}>
          <span style={{fontSize:14,fontWeight:700,color:"#f1f5f9",letterSpacing:"-0.03em"}}>求人適性判定</span>
          <span style={{fontSize:11,color:"#64748b"}}>Powered by Gemini AI</span>
        </div>
        <div style={{display:"flex",gap:2}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setView(t.id)} style={{padding:"8px 16px",background:"none",border:"none",borderBottom:view===t.id?"2px solid #6366f1":"2px solid transparent",color:view===t.id?"#e2e8f0":"#94a3b8",fontSize:13,fontWeight:view===t.id?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:6,marginBottom:-1,transition:"all 0.15s"}}>
              {t.label}
              {t.count>0&&<span style={{background:"#6366f1",color:"white",fontSize:10,borderRadius:99,padding:"1px 6px",fontWeight:700}}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"28px 24px"}}>

        {view==="input"&&(
          <div>
            <div style={{marginBottom:18}}>
              <h2 style={{fontSize:17,fontWeight:700,color:"#f1f5f9",margin:"0 0 7px",letterSpacing:"-0.02em"}}>求人票をコピペして判定</h2>
              <p style={{fontSize:13,color:"#94a3b8",margin:0,lineHeight:1.7}}>求人サイトから求人票を全文コピーして貼り付けてください。転職条件に合っているかAIが自動判定します。</p>
            </div>
            <div style={{position:"relative",marginBottom:10}}>
              <textarea value={text} onChange={e=>{setText(e.target.value);setErr(null);}}
                placeholder={"ここに求人票を貼り付けてください。\n\n会社名・職種・勤務地・給与・仕事内容・福利厚生など、できるだけ多くの情報を含めると判定精度が上がります。\n\n「サンプルを使う」ボタンでデモ用データが入ります。"}
                style={{width:"100%",minHeight:280,padding:16,background:"rgba(15,23,42,0.8)",border:`1px solid ${err?"rgba(248,113,113,0.4)":"rgba(255,255,255,0.07)"}`,borderRadius:12,color:"#e2e8f0",fontSize:13,lineHeight:1.7,resize:"vertical",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}
              />
              <div style={{position:"absolute",bottom:10,right:14,fontSize:11,color:"#64748b"}}>{text.length} 文字</div>
            </div>
            {err&&<div style={{padding:"9px 14px",borderRadius:8,marginBottom:10,background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.2)",fontSize:13,color:"#fca5a5"}}>⚠️ {err}</div>}
            <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
              <button onClick={judge} disabled={loading||text.trim().length<50} style={{padding:"11px 26px",borderRadius:10,border:"none",background:loading||text.trim().length<50?"rgba(99,102,241,0.25)":"#6366f1",color:loading||text.trim().length<50?"rgba(255,255,255,0.35)":"white",fontSize:14,fontWeight:600,cursor:loading||text.trim().length<50?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:8}}>
                {loading?<><span style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.25)",borderTopColor:"white",borderRadius:"50%",animation:"spin 0.6s linear infinite",display:"inline-block"}}/>判定中...</>:"🔍 AIで判定する"}
              </button>
              <button onClick={()=>setText(SAMPLE)} style={{padding:"11px 18px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"#94a3b8",fontSize:13,cursor:"pointer"}}>サンプルを使う</button>
              {text&&<button onClick={()=>{setText("");setErr(null);}} style={{padding:"11px 14px",borderRadius:10,background:"transparent",border:"1px solid rgba(255,255,255,0.05)",color:"#94a3b8",fontSize:13,cursor:"pointer"}}>クリア</button>}
            </div>
          </div>
        )}

        {view==="result"&&result&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:9}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"#f1f5f9",margin:0,letterSpacing:"-0.02em"}}>判定結果</h2>
              <div style={{display:"flex",gap:8}}>
                <button onClick={save} style={{padding:"8px 18px",borderRadius:8,border:"none",background:"#6366f1",color:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}>💾 保存して一覧へ</button>
                <button onClick={()=>{setView("input");setText("");}} style={{padding:"8px 16px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"#94a3b8",fontSize:13,cursor:"pointer"}}>← 別の求人を判定</button>
              </div>
            </div>
            <Card r={result} onApply={apply} onSave={save} onUpdateEmployeeCount={val=>setResult(r=>recalcWithEmployeeCount(r,val))}/>
          </div>
        )}

        {view==="list"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:9}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"#f1f5f9",margin:0,letterSpacing:"-0.02em"}}>判定済み求人一覧</h2>
              <button onClick={()=>{setView("input");setText("");}} style={{padding:"8px 18px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"#64748b",fontSize:13,cursor:"pointer"}}>＋ 新しい求人を判定</button>
            </div>
            {saved.length===0?(
              <div style={{textAlign:"center",padding:"60px 20px",color:"#64748b"}}>
                <div style={{fontSize:34,marginBottom:10}}>📋</div>
                <p style={{marginBottom:16}}>まだ保存された求人がありません</p>
                <button onClick={()=>setView("input")} style={{padding:"10px 24px",borderRadius:8,border:"none",background:"#6366f1",color:"white",fontSize:13,cursor:"pointer"}}>求人票を判定する</button>
              </div>
            ):<List jobs={saved} onSelect={j=>{setResult(j);setView("result");}} onApply={apply}/>}
          </div>
        )}
      </div>
    </div>
  );
}
