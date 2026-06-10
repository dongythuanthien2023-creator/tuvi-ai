import { useState, useRef, useCallback } from 'react'
import { callClaude, parseJSON } from './api'
import { GIO_SINH, CUNGS, STEPS, STEP_LABELS, SECTIONS, EXTRACT_PROMPT, ANALYZE_PROMPT } from './constants'
import styles from './App.module.css'

// ── Helpers ────────────────────────────────────────────────────────────────
function tagCls(t) {
  if (/La|Kỵ|Hình|Hao|Phá|Kiếp|Không/.test(t)) return styles.tagR
  if (/Miếu|Vượng|chủ|Đắc/.test(t)) return styles.tagT
  return styles.tagG
}

function saoItemCls(sao) {
  if (/\(M\)/.test(sao) || /miếu/i.test(sao)) return `${styles.cungSaoItem} ${styles.cungSaoItemMieu}`
  if (/\(H\)/.test(sao) || /hãm/i.test(sao)) return `${styles.cungSaoItem} ${styles.cungSaoItemHam}`
  return styles.cungSaoItem
}

// ── StepBar ────────────────────────────────────────────────────────────────
function StepBar({ step }) {
  const idx = STEPS.indexOf(step)
  return (
    <div className={styles.steps}>
      {STEPS.map((s, i) => {
        const cls = i === idx ? styles.stepA : i < idx ? styles.stepD : styles.stepN
        return (
          <div key={s} className={styles.stepWrap}>
            <div className={`${styles.step} ${cls}`}>
              <div className={styles.stepDot} />{STEP_LABELS[i]}
            </div>
            {i < 4 && <div className={styles.stepSep} />}
          </div>
        )
      })}
    </div>
  )
}

// ── InfoForm ───────────────────────────────────────────────────────────────
function InfoForm({ onNext }) {
  const [hoTen, setHoTen]       = useState('')
  const [ngaySinh, setNgaySinh] = useState('')
  const [gioSinh, setGioSinh]   = useState('')
  const [gioiTinh, setGioiTinh] = useState('Nam')
  const [email, setEmail]       = useState('')

  const submit = () => {
    if (!hoTen.trim() || !ngaySinh || !gioSinh) {
      alert('Vui lòng điền đầy đủ họ tên, ngày sinh và giờ sinh'); return
    }
    onNext({ hoTen: hoTen.trim(), ngaySinh, gioSinh, gioiTinh, email })
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>✦ Thông tin cơ bản</div>
      <div className={styles.cardSub}>Nhập thông tin khách hàng. Sau đó upload ảnh chụp lá số từ luangiai.vn để Claude tự đọc và phân tích 100 mục.</div>
      <div className={styles.formGrid}>
        <div className={`${styles.fg} ${styles.full}`}>
          <label className={styles.label}>Họ và tên *</label>
          <input className={styles.input} value={hoTen} onChange={e => setHoTen(e.target.value)} placeholder="Nguyễn Văn A" />
        </div>
        <div className={styles.fg}>
          <label className={styles.label}>Ngày sinh dương lịch *</label>
          <input className={styles.input} type="date" value={ngaySinh} onChange={e => setNgaySinh(e.target.value)} />
        </div>
        <div className={styles.fg}>
          <label className={styles.label}>Giờ sinh *</label>
          <select className={styles.select} value={gioSinh} onChange={e => setGioSinh(e.target.value)}>
            <option value="">— Chọn giờ sinh —</option>
            {GIO_SINH.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className={styles.fg}>
          <label className={styles.label}>Giới tính *</label>
          <select className={styles.select} value={gioiTinh} onChange={e => setGioiTinh(e.target.value)}>
            <option>Nam</option><option>Nữ</option>
          </select>
        </div>
        <div className={styles.fg}>
          <label className={styles.label}>Email (tuỳ chọn)</label>
          <input className={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
        </div>
      </div>
      <div className={styles.btnRow}>
        <button className={styles.btnP} disabled={!hoTen||!ngaySinh||!gioSinh} onClick={submit}>Tiếp theo →</button>
      </div>
    </div>
  )
}

// ── UploadScreen ───────────────────────────────────────────────────────────
function UploadScreen({ onBack, onDone, info }) {
  const [file, setFile]       = useState(null)
  const [b64, setB64]         = useState(null)
  const [mime, setMime]       = useState(null)
  const [drag, setDrag]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const fileRef = useRef()

  const handleFile = useCallback((f) => {
    if (!f) return
    if (!['image/png','image/jpeg','image/webp','application/pdf'].includes(f.type)) { alert('Chỉ hỗ trợ PNG, JPG, WEBP, PDF'); return }
    setFile(f)
    const r = new FileReader()
    r.onload = e => { setB64(e.target.result.split(',')[1]); setMime(f.type) }
    r.readAsDataURL(f)
  }, [])

  const doExtract = async () => {
    setLoading(true); setError('')
    try {
      const cType = mime === 'application/pdf' ? 'document' : 'image'
      const text = await callClaude([{ role:'user', content:[
        { type:cType, source:{ type:'base64', media_type:mime, data:b64 } },
        { type:'text', text: EXTRACT_PROMPT(info) }
      ]}])
      onDone(parseJSON(text))
    } catch { setError('Không đọc được lá số. Thử ảnh rõ hơn hoặc chụp lại toàn bộ trang lá số.') }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>☁ Upload lá số Tử Vi</div>
      <div className={styles.cardSub}>Vào <strong style={{color:'#c9a84c'}}>luangiai.vn</strong> lập lá số → chụp màn hình hoặc xuất PDF → upload vào đây. Claude sẽ tự đọc và trích xuất toàn bộ thông tin 12 cung.</div>
      <div className={`${styles.uploadZone}${drag?' '+styles.drag:''}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0])}}>
        <div className={styles.uploadIcon}>{file?'✅':'📄'}</div>
        <div className={styles.uploadText}>{file?file.name:'Kéo thả hoặc click để chọn file'}</div>
        <div className={styles.uploadSub}>PNG · JPG · WEBP · PDF &nbsp;|&nbsp; Tối đa 10MB</div>
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])} />
      </div>
      {file && (
        <div className={styles.filePreview}>
          <span style={{fontSize:20}}>{mime?.includes('pdf')?'📕':'🖼️'}</span>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>{file.name}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{(file.size/1024).toFixed(0)} KB</div>
          </div>
        </div>
      )}
      {error && <div className={styles.errorBox}>⚠ {error}</div>}
      <div className={styles.btnRow}>
        <button className={styles.btnS} onClick={onBack}>← Quay lại</button>
        <button className={styles.btnP} disabled={!b64||loading} onClick={doExtract}>
          {loading?'⏳ Đang đọc lá số...':'Đọc lá số →'}
        </button>
      </div>
    </div>
  )
}

// ── VerifyScreen ───────────────────────────────────────────────────────────
function VerifyScreen({ laSo, onBack, onAnalyze, error }) {
  const cc = laSo?.cacCung || {}
  const rows = [
    ['Âm lịch', `${laSo?.amLich?.ngay||'?'}/${laSo?.amLich?.thang||'?'}/${laSo?.amLich?.nam||'?'}`],
    ['Can Chi năm', laSo?.canChi?.nam||'—'], ['Giờ Can Chi', laSo?.canChi?.gio||'—'],
    ['Cục', laSo?.cuc||'—'], ['Bản mệnh', laSo?.banMenh||'—'], ['Âm dương', laSo?.amDuong||'—'],
    ['Mệnh chủ', laSo?.menhChu||'—'], ['Thân chủ', laSo?.thanChu||'—'],
    ['Mệnh cung', `${laSo?.menhCung?.cung||'—'} – ${laSo?.menhCung?.chi||''}`],
    ['Thân cung', `${laSo?.thanCung?.cung||'—'} – ${laSo?.thanCung?.chi||''}`],
    ['Tuổi / Năm', `${laSo?.tuoi||'?'}t / ${laSo?.namXem||'?'}`],
  ]
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>✓ Xác nhận thông tin lá số</div>
      <div className={styles.cardSub}>Claude đã đọc xong. Kiểm tra lại trước khi phân tích 100 mục.</div>
      <div className={styles.infoGrid}>
        {rows.map(([k,v]) => <div key={k} className={styles.infoItem}><div className={styles.infoKey}>{k}</div><div className={styles.infoVal}>{v}</div></div>)}
      </div>
      <div className={styles.sectionLabel}>12 Cung Mệnh</div>
      <div className={styles.cungGrid}>
        {CUNGS.map(n => {
          const c = cc[n]||{}; const isMenh = n==='Mệnh'
          return (
            <div key={n} className={`${styles.cungCard}${isMenh?' '+styles.cungMenh:''}`}>
              <div className={styles.cungName}>{isMenh?'⭐ ':''}{n}</div>
              <div className={styles.cungChi}>{c.chi||'—'}{c.hanh?' – '+c.hanh:''}</div>
              <div className={styles.cungSaoWrap}>
                {(c.sao||[]).slice(0,8).map((s,i) => <span key={i} className={saoItemCls(s)}>{s}</span>)}
              </div>
            </div>
          )
        })}
      </div>
      {error && <div className={styles.errorBox}>⚠ {error}</div>}
      <div className={styles.btnRow}>
        <button className={styles.btnS} onClick={onBack}>← Upload lại</button>
        <button className={`${styles.btnP} ${styles.btnLarge}`} onClick={onAnalyze}>✦ Phân tích 100 mục</button>
      </div>
    </div>
  )
}

// ── AnalyzingScreen ────────────────────────────────────────────────────────
function AnalyzingScreen({ name }) {
  return (
    <div className={styles.card}>
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <div style={{fontSize:30,marginBottom:12}}>☯</div>
        <div className={styles.loadingText}>Đang luận giải lá số <strong style={{color:'#c9a84c'}}>{name}</strong></div>
        <div className={styles.loadingSub}>Claude đang phân tích chi tiết 100 mục...<br/>Quá trình mất khoảng 40–90 giây</div>
        <div className={styles.loadingTags}>
          {['Cốt cách','Sự nghiệp','Tài lộc','Tình duyên','Sức khỏe','Vận hạn','Cải mệnh'].map(t => (
            <span key={t} className={`${styles.tag} ${styles.tagG} ${styles.tagPulse}`}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── NgũHành Chart ──────────────────────────────────────────────────────────
function NguHanhChart({ laSo }) {
  // Tính điểm ngũ hành từ các sao trong 12 cung
  const scores = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 }
  const hanhMap = { 'Kim': 'Kim', 'Mộc': 'Mộc', 'Thủy': 'Thủy', 'Hỏa': 'Hỏa', 'Thổ': 'Thổ' }
  Object.values(laSo?.cacCung||{}).forEach(c => {
    if (hanhMap[c.hanh]) scores[hanhMap[c.hanh]] += 20
  })
  // Normalize về 100
  const max = Math.max(...Object.values(scores), 1)
  const norm = Object.fromEntries(Object.entries(scores).map(([k,v]) => [k, Math.round(v/max*100)]))

  const items = [
    { label:'Kim', score: norm.Kim||45, color:'#a8a8b8' },
    { label:'Mộc', score: norm.Mộc||75, color:'#5a9a5a' },
    { label:'Thủy', score: norm.Thủy||60, color:'#5878b8' },
    { label:'Hỏa', score: norm.Hỏa||70, color:'#b85858' },
    { label:'Thổ', score: norm.Thổ||50, color:'#9a7840' },
  ]

  // SVG radar
  const cx=80, cy=80, r=60
  const angles = items.map((_,i) => (i*72 - 90) * Math.PI/180)
  const points = items.map((item,i) => {
    const pct = item.score/100
    return { x: cx + r*pct*Math.cos(angles[i]), y: cy + r*pct*Math.sin(angles[i]) }
  })
  const polyPts = points.map(p=>`${p.x},${p.y}`).join(' ')
  const gridPts = (pct) => angles.map(a => `${cx+r*pct*Math.cos(a)},${cy+r*pct*Math.sin(a)}`).join(' ')

  return (
    <div className={styles.nguHanhWrap}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {[.25,.5,.75,1].map(p => <polygon key={p} points={gridPts(p)} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>)}
        {angles.map((a,i) => <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke="rgba(255,255,255,.05)" strokeWidth="1"/>)}
        <polygon points={polyPts} fill="rgba(201,168,76,.15)" stroke="rgba(201,168,76,.6)" strokeWidth="1.5"/>
        {points.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={items[i].color}/>)}
        {items.map((item,i) => {
          const lx = cx + (r+14)*Math.cos(angles[i]), ly = cy + (r+14)*Math.sin(angles[i])
          return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="rgba(255,255,255,.5)">{item.label}</text>
        })}
      </svg>
      <div className={styles.nguHanhBars}>
        {items.map(item => (
          <div key={item.label} className={styles.nguHanhRow}>
            <div className={styles.nguHanhLabel}>{item.label}</div>
            <div className={styles.nguHanhTrack}>
              <div className={styles.nguHanhFill} style={{width:`${item.score}%`, background:item.color}}/>
            </div>
            <div className={styles.nguHanhScore}>{item.score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Đại Vận Timeline ───────────────────────────────────────────────────────
function DaiVanTimeline({ result }) {
  const vanData = [
    { age:'3–12',   canChi:'Mậu Tý',   theme:'Học vấn nền tảng',   level:60,  color:'#5a7a5a', current:false },
    { age:'13–22',  canChi:'Kỷ Sửu',   theme:'Trưởng thành định hướng', level:65, color:'#5a7a6a', current:false },
    { age:'23–32',  canChi:'Canh Dần',  theme:'Lập nghiệp – Hiện tại', level:75, color:'#8a6a20', current:true  },
    { age:'33–42',  canChi:'Tân Mão',   theme:'Tăng tốc bản lề',    level:85,  color:'#7a5a10', current:false },
    { age:'43–52',  canChi:'Nhâm Thìn', theme:'Đỉnh cao sự nghiệp', level:95,  color:'#2a6a4a', current:false },
    { age:'53–62',  canChi:'Quý Tỵ',   theme:'Củng cố ổn định',    level:78,  color:'#4a6a7a', current:false },
    { age:'63–72',  canChi:'Giáp Ngọ',  theme:'Hậu vận an lạc',    level:65,  color:'#5a4a7a', current:false },
  ]

  const levelLabel = (l) => l>=90?'Xuất sắc':l>=80?'Rất tốt':l>=70?'Tốt':l>=60?'Khá':'Bình thuận'

  return (
    <div className={styles.vanTimeline}>
      {vanData.map((v,i) => (
        <div key={i} className={styles.vanItem}>
          <div className={styles.vanLeft}>
            <div className={styles.vanAge}>{v.age}</div>
            <div className={styles.vanCanChi}>{v.canChi}</div>
          </div>
          <div className={styles.vanCenter}>
            <div className={`${styles.vanDot}${v.current?' '+styles.vanDotCurrent:''}`}
              style={{borderColor:v.color, color:v.color, background:v.current?v.color:'transparent'}}/>
            {i<vanData.length-1 && <div className={styles.vanLine} style={{background:`linear-gradient(${v.color},${vanData[i+1].color})`}}/>}
          </div>
          <div className={styles.vanRight}>
            <div className={styles.vanCard} style={{borderColor:v.color+'44', background:v.color+'11'}}>
              <div className={styles.vanCardTitle} style={{color:v.current?'#e8c97a':'rgba(255,255,255,.75)'}}>
                {v.current?'★ ':''}{v.theme}
              </div>
              <div className={styles.vanCardTheme} style={{color:'rgba(255,255,255,.45)'}}>
                {v.canChi}
              </div>
              <div className={styles.vanCardBadge} style={{background:v.color+'22', color:v.color, border:`1px solid ${v.color}44`}}>
                {levelLabel(v.level)} · {v.level}/100
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── ResultScreen ───────────────────────────────────────────────────────────
function ResultScreen({ result, info, laSo, onNew }) {
  const [section, setSection] = useState('tongquan')
  const tq = result?.tongQuan || {}
  const ls = laSo || {}

  const statItems = [
    {l:'Sự nghiệp', v:tq.sucNghiep},
    {l:'Tài lộc',   v:tq.taiLoc},
    {l:'Tình duyên',v:tq.tinhDuyen},
    {l:'Gia đạo',   v:tq.giaDao},
    {l:'Sức khỏe',  v:tq.sucKhoe},
  ]

  const allTabs = [
    {k:'tongquan', l:'Tổng quan', i:'☯'},
    ...SECTIONS
  ]

  return (
    <div>
      {/* Header */}
      <div className={styles.resultHeader}>
        <div className={styles.resultName}>✦ {info.hoTen}</div>
        <div className={styles.resultMeta}>
          {info.ngaySinh} · Giờ {info.gioSinh} · {info.gioiTinh} · {ls.cuc||''} · {ls.banMenh||''}
          {ls.menhChu ? ` · Mệnh chủ: ${ls.menhChu}` : ''}
        </div>
        {tq.tomluat && <div className={styles.resultQuote}>"{tq.tomluat}"</div>}
        {/* Chỉ số */}
        <div className={styles.statGrid}>
          {statItems.map(({l,v}) => (
            <div key={l} className={styles.statCard}>
              <div className={styles.statVal}>{v||'—'}</div>
              <div className={styles.statBar}><div className={styles.statBarFill} style={{width:`${(v||0)*10}%`}}/></div>
              <div className={styles.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Highlights */}
      {(tq.giaiDoanVang||tq.diemManhNhat||tq.diemYeuNhat) && (
        <div className={styles.hlGrid}>
          {tq.giaiDoanVang  && <div className={`${styles.hlItem} ${styles.hlGold}`}><div className={styles.hlKey} style={{color:'#c9a84c'}}>⭐ Giai đoạn vàng</div><div className={styles.hlVal}>{tq.giaiDoanVang}</div></div>}
          {tq.diemManhNhat  && <div className={`${styles.hlItem} ${styles.hlTeal}`}><div className={styles.hlKey} style={{color:'#58a8a8'}}>✓ Điểm mạnh nhất</div><div className={styles.hlVal}>{tq.diemManhNhat}</div></div>}
          {tq.diemYeuNhat   && <div className={`${styles.hlItem} ${styles.hlRed}`}> <div className={styles.hlKey} style={{color:'#c07070'}}>⚠ Cần lưu ý</div>   <div className={styles.hlVal}>{tq.diemYeuNhat}</div></div>}
        </div>
      )}

      {/* Tabs */}
      <div className={`${styles.tabs} no-print`}>
        {allTabs.map(s => (
          <button key={s.k} className={`${styles.tab} ${section===s.k?styles.tabA:styles.tabN}`} onClick={()=>setSection(s.k)}>
            {s.i} {s.l}
          </button>
        ))}
      </div>

      {/* Tổng quan tab */}
      {section === 'tongquan' && (
        <div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>⬡ Biểu đồ Ngũ Hành</div>
            <NguHanhChart laSo={ls} />
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>◈ Đại Vận Trọn Đời</div>
            <div style={{marginBottom:8,fontSize:12,color:'rgba(255,255,255,.35)'}}>★ = Giai đoạn hiện tại</div>
            <DaiVanTimeline result={result} />
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>◉ Bản đồ 12 Cung Mệnh</div>
            <div className={styles.cungGrid}>
              {CUNGS.map(n => {
                const c = ls.cacCung?.[n]||{}; const isMenh = n==='Mệnh'
                return (
                  <div key={n} className={`${styles.cungCard}${isMenh?' '+styles.cungMenh:''}`}>
                    <div className={styles.cungName}>{isMenh?'⭐ ':''}{n}</div>
                    <div className={styles.cungChi}>{c.chi||'—'}{c.hanh?` – ${c.hanh}`:''}</div>
                    <div className={styles.cungSaoWrap}>
                      {(c.sao||[]).map((s,i) => <span key={i} className={saoItemCls(s)}>{s}</span>)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Phân tích tabs */}
      {SECTIONS.map(sec => section===sec.k && (
        <div key={sec.k}>
          <div className={styles.secHeader}>
            <div className={styles.secIcon}>{sec.i}</div>
            <div>
              <div className={styles.secTitle}>{result[sec.k]?.title||sec.l}</div>
              <div className={styles.secCount}>{(result[sec.k]?.muc||[]).length} mục phân tích</div>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.mucList}>
              {(result[sec.k]?.muc||[]).map(m => {
                const sc=m.diem||0; const rc=sc>=8?styles.scoreHi:sc<=5?styles.scoreLo:''
                return (
                  <div key={m.so} className={styles.mucItem}>
                    <div className={styles.mucHeader}>
                      <div className={styles.mucContent}>
                        <div className={styles.mucNum}>MỤC {String(m.so).padStart(2,'0')}</div>
                        <div className={styles.mucTitle}>{m.ten}</div>
                        <div>{(m.tags||[]).map((t,i)=><span key={i} className={`${styles.tag} ${tagCls(t)}`}>{t}</span>)}</div>
                        <div className={styles.mucBody}>{m.noidung||''}</div>
                        {m.loiKhuyen && <div className={styles.mucAdvice}><strong style={{color:'#c9a84c'}}>Lời khuyên: </strong>{m.loiKhuyen}</div>}
                      </div>
                      <div className={`${styles.scoreRing} ${rc}`}>{m.diem||'?'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}

      <div className={`${styles.btnRow} no-print`} style={{marginTop:14}}>
        <button className={styles.btnS} onClick={onNew}>＋ Khách mới</button>
        <button className={styles.btnP} onClick={()=>window.print()}>⬇ In / Lưu PDF</button>
      </div>
    </div>
  )
}

// ── Root App ───────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]             = useState('info')
  const [info, setInfo]             = useState(null)
  const [laSo, setLaSo]             = useState(null)
  const [result, setResult]         = useState(null)
  const [analyzeErr, setAnalyzeErr] = useState('')

  const handleInfoNext   = useCallback((d) => { setInfo(d); setStep('upload') }, [])
  const handleExtracted  = useCallback((d) => { setLaSo(d); setStep('verify') }, [])

  const handleAnalyze = useCallback(async () => {
    setStep('analyzing'); setAnalyzeErr('')
    try {
      const text = await callClaude([{ role:'user', content: ANALYZE_PROMPT(info, laSo) }], 8000)
      setResult(parseJSON(text)); setStep('result')
    } catch { setAnalyzeErr('Phân tích thất bại. Vui lòng thử lại.'); setStep('verify') }
  }, [info, laSo])

  const handleNew = useCallback(() => {
    setStep('info'); setInfo(null); setLaSo(null); setResult(null); setAnalyzeErr('')
  }, [])

  return (
    <div>
      <div className={`${styles.header} no-print`}>
        <div style={{fontSize:22}}>☯</div>
        <div>
          <div className={styles.headerTitle}>Tử Vi AI · Công cụ Luận Giải Chuyên Nghiệp</div>
          <div className={styles.headerSub}>Phân tích 100 mục · Upload lá số → Claude tự đọc & phân tích</div>
        </div>
      </div>
      <div className={styles.main}>
        <StepBar step={step} />
        {step==='info'      && <InfoForm onNext={handleInfoNext} />}
        {step==='upload'    && <UploadScreen onBack={()=>setStep('info')} onDone={handleExtracted} info={info} />}
        {step==='verify'    && laSo && <VerifyScreen laSo={laSo} onBack={()=>setStep('upload')} onAnalyze={handleAnalyze} error={analyzeErr} />}
        {step==='analyzing' && <AnalyzingScreen name={info?.hoTen||''} />}
        {step==='result'    && result && <ResultScreen result={result} info={info} laSo={laSo} onNew={handleNew} />}
      </div>
    </div>
  )
}
