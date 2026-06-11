import { useState, useRef, useCallback } from 'react'
import { callClaude, parseJSON } from './api'
import { STEPS, STEP_LABELS, SECTIONS, PROMPT_PHAN1, PROMPT_PHAN2, PROMPT_PHAN3, PROMPT_PHAN4, PROMPT_PHAN5 } from './constants'
import { lapLaSoAm, GIO_INFO, CHI_NAMES, loaiSao } from './laso-engine'
import styles from './App.module.css'

// ── Helpers ────────────────────────────────────────────────────────────────
function tagCls(t) {
  if (/La|Kỵ|Hình|Hao|Phá|Kiếp|Không/.test(t)) return styles.tagR
  if (/Miếu|Vượng|chủ|Đắc/.test(t)) return styles.tagT
  return styles.tagG
}

function saoItemCls(sao) {
  const loai = loaiSao(sao)
  const map = {
    chinh: styles.saoChinh,
    hoa:   styles.saoHoa,
    sat:   styles.saoSat,
    tot:   styles.saoTot,
    xau:   styles.saoXau,
    phu:   styles.saoPhu,
  }
  let cls = `${styles.cungSaoItem} ${map[loai]||styles.saoPhu}`
  // Đắc/hãm địa: hậu tố (M)(Đ)(V)(H)
  if (/\(M\)/.test(sao)) cls += ` ${styles.saoMieu}`
  else if (/\(H\)/.test(sao)) cls += ` ${styles.saoHam}`
  return cls
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
            {i < STEPS.length - 1 && <div className={styles.stepSep} />}
          </div>
        )
      })}
    </div>
  )
}

// ── InfoForm ───────────────────────────────────────────────────────────────
function InfoForm({ onNext }) {
  const [hoTen, setHoTen]       = useState('')
  const [ngayAL, setNgayAL]     = useState('')
  const [thangAL, setThangAL]   = useState('')
  const [namAL, setNamAL]       = useState('')
  const [gioSinh, setGioSinh]   = useState('')
  const [gioiTinh, setGioiTinh] = useState('Nam')
  const [email, setEmail]       = useState('')

  const submit = () => {
    const d = parseInt(ngayAL), m = parseInt(thangAL), y = parseInt(namAL)
    if (!hoTen.trim() || !d || !m || !y || gioSinh === '') {
      alert('Vui lòng điền đầy đủ họ tên, ngày tháng năm sinh âm lịch và giờ sinh'); return
    }
    if (d<1||d>30||m<1||m>12||y<1900||y>2100) { alert('Ngày tháng năm âm lịch không hợp lệ'); return }
    onNext({ hoTen: hoTen.trim(), ngayAL:d, thangAL:m, namAL:y, gioIndex:parseInt(gioSinh), gioiTinh, email })
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>✦ Thông tin cơ bản</div>
      <div className={styles.cardSub}>Nhập thông tin khách hàng theo lịch âm. Hệ thống sẽ tự động lập lá số chính xác.</div>
      <div className={styles.formGrid}>
        <div className={`${styles.fg} ${styles.full}`}>
          <label className={styles.label}>Họ và tên *</label>
          <input className={styles.input} value={hoTen} onChange={e => setHoTen(e.target.value)} placeholder="Nguyễn Văn A" />
        </div>
        <div className={`${styles.fg} ${styles.full}`}>
          <label className={styles.label}>Ngày sinh âm lịch *</label>
          <div style={{display:'flex',gap:10}}>
            <input className={styles.input} type="number" min="1" max="30" value={ngayAL}
              onChange={e=>setNgayAL(e.target.value)} placeholder="Ngày" style={{flex:1}} />
            <input className={styles.input} type="number" min="1" max="12" value={thangAL}
              onChange={e=>setThangAL(e.target.value)} placeholder="Tháng" style={{flex:1}} />
            <input className={styles.input} type="number" min="1900" max="2100" value={namAL}
              onChange={e=>setNamAL(e.target.value)} placeholder="Năm" style={{flex:1.4}} />
          </div>
        </div>
        <div className={styles.fg}>
          <label className={styles.label}>Giờ sinh *</label>
          <select className={styles.select} value={gioSinh} onChange={e => setGioSinh(e.target.value)}>
            <option value="">— Chọn giờ sinh —</option>
            {GIO_INFO.map(([ten,khung],i) => <option key={i} value={i}>{khung} ({ten})</option>)}
          </select>
        </div>
        <div className={styles.fg}>
          <label className={styles.label}>Giới tính *</label>
          <select className={styles.select} value={gioiTinh} onChange={e => setGioiTinh(e.target.value)}>
            <option>Nam</option><option>Nữ</option>
          </select>
        </div>
        <div className={`${styles.fg} ${styles.full}`}>
          <label className={styles.label}>Email (tuỳ chọn)</label>
          <input className={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
        </div>
      </div>
      <div className={styles.btnRow}>
        <button className={styles.btnP} onClick={submit}>Lập lá số →</button>
      </div>
    </div>
  )
}

// ── Render 1 ô cung (chính tinh nổi bật trên, phụ tinh dưới) ────────────────
function CungCard({ chi, c }) {
  const isMenh = c.cung === 'Mệnh'
  const sao = c.sao || []
  const chinh = sao.filter(s => loaiSao(s) === 'chinh')
  const phu = sao.filter(s => loaiSao(s) !== 'chinh')
  let flags = []
  if (c.than) flags.push('Thân')
  if (c.tuan) flags.push('Tuần')
  if (c.triet) flags.push('Triệt')
  return (
    <div className={`${styles.cungCard}${isMenh?' '+styles.cungMenh:''}`}>
      <div className={styles.cungHead}>
        <span className={styles.cungName}>{isMenh?'⭐ ':''}{c.cung||'—'}</span>
        <span className={styles.cungChiTag}>{chi}</span>
      </div>
      {flags.length>0 && <div className={styles.cungFlags}>{flags.join(' · ')}</div>}
      {c.daiVan && <div className={styles.cungDaiVan}>Đại vận {c.daiVan[0]}–{c.daiVan[1]}t</div>}
      {chinh.length>0 && (
        <div className={styles.cungChinhWrap}>
          {chinh.map((s,i) => <span key={i} className={saoItemCls(s)}>{s}</span>)}
        </div>
      )}
      {chinh.length===0 && <div className={styles.cungVoChinh}>Vô chính diệu</div>}
      <div className={styles.cungSaoWrap}>
        {phu.map((s,i) => <span key={i} className={saoItemCls(s)}>{s}</span>)}
      </div>
    </div>
  )
}

// ── Legend chú thích loại sao ──────────────────────────────────────────────
function SaoLegend() {
  const items = [
    ['saoChinh', 'Chính tinh'],
    ['saoHoa', 'Tứ Hóa'],
    ['saoTot', 'Phụ tinh cát'],
    ['saoXau', 'Phụ tinh hung'],
    ['saoSat', 'Sát tinh'],
    ['saoPhu', 'Sao phụ khác'],
  ]
  return (
    <div className={styles.legend}>
      {items.map(([cls,label]) => (
        <span key={cls} className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles[cls]}`} />{label}
        </span>
      ))}
      <span className={styles.legendItem}><span className={styles.legendUnderline} />Miếu/Vượng (M)</span>
      <span className={styles.legendItem}><em className={styles.legendHam}>nghiêng</em> = Hãm (H)</span>
    </div>
  )
}

// ── VerifyScreen ───────────────────────────────────────────────────────────
function VerifyScreen({ laSo, onBack, onAnalyze, error }) {
  const cc = laSo?.cacCung || {}
  const rows = [
    ['Âm lịch', `${laSo?.amLich?.ngay}/${laSo?.amLich?.thang}/${laSo?.amLich?.nam}`],
    ['Can Chi năm', laSo?.canChiNam||'—'],
    ['Âm dương', laSo?.amDuong||'—'],
    ['Bản mệnh', laSo?.banMenh||'—'],
    ['Cục', laSo?.cuc||'—'],
    ['Giới tính', laSo?.gioiTinh||'—'],
    ['Mệnh tại', laSo?.menhCung||'—'],
    ['Thân cư', `${laSo?.thanCu||'—'} (${laSo?.thanCung||''})`],
  ]
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>✓ Xác nhận lá số</div>
      <div className={styles.cardSub}>Lá số được lập tự động theo thuật toán Tử Vi. Kiểm tra trước khi phân tích 100 mục.</div>
      <div className={styles.infoGrid}>
        {rows.map(([k,v]) => <div key={k} className={styles.infoItem}><div className={styles.infoKey}>{k}</div><div className={styles.infoVal}>{v}</div></div>)}
      </div>
      <div className={styles.sectionLabel}>12 Cung Mệnh</div>
      <SaoLegend />
      <div className={styles.cungGrid}>
        {CHI_NAMES.map(chi => <CungCard key={chi} chi={chi} c={cc[chi]||{}} />)}
      </div>
      {error && <div className={styles.errorBox}>⚠ {error}</div>}
      <div className={styles.btnRow}>
        <button className={styles.btnS} onClick={onBack}>← Sửa thông tin</button>
        <button className={`${styles.btnP} ${styles.btnLarge}`} onClick={onAnalyze}>✦ Phân tích 100 mục</button>
      </div>
    </div>
  )
}

// ── AnalyzingScreen ────────────────────────────────────────────────────────
function AnalyzingScreen({ name, progress }) {
  const parts = [
    { k: 'phan1', l: 'Cốt cách & Nội tâm', range: '1–20' },
    { k: 'phan2', l: 'Sự nghiệp & Tài lộc', range: '21–50' },
    { k: 'phan3', l: 'Tình duyên & Gia đạo', range: '51–70' },
    { k: 'phan4', l: 'Sức khỏe & Vận hạn', range: '71–90' },
    { k: 'phan5', l: 'Định hướng & Hành động', range: '91–100' },
  ]
  const doneCount = Object.values(progress || {}).filter(v => v === 'done').length
  return (
    <div className={styles.card}>
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <div style={{fontSize:30,marginBottom:12}}>☯</div>
        <div className={styles.loadingText}>Đang luận giải lá số <strong style={{color:'#c9a84c'}}>{name}</strong></div>
        <div className={styles.loadingSub}>Đã hoàn thành {doneCount}/5 phần · Mỗi phần khoảng 15–25 giây</div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:20,maxWidth:340,marginLeft:'auto',marginRight:'auto'}}>
          {parts.map(p => {
            const st = progress?.[p.k] || 'wait'
            const color = st === 'done' ? '#58a8a8' : st === 'running' ? '#c9a84c' : 'rgba(255,255,255,.2)'
            const icon = st === 'done' ? '✓' : st === 'running' ? '◌' : '○'
            return (
              <div key={p.k} style={{display:'flex',alignItems:'center',gap:10,fontSize:13}}>
                <span style={{color,fontWeight:700,width:16,
                  animation: st==='running' ? 'spin 1.5s linear infinite' : 'none'}}>{icon}</span>
                <span style={{color: st==='wait'?'rgba(255,255,255,.4)':'rgba(255,255,255,.75)',flex:1,textAlign:'left'}}>
                  {p.l}
                </span>
                <span style={{color:'rgba(255,255,255,.3)',fontSize:11}}>Mục {p.range}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── NgũHành Chart ──────────────────────────────────────────────────────────
function NguHanhChart({ laSo }) {
  // Điểm ngũ hành: dựa trên Bản mệnh (trọng số cao) + Cục + hành của địa chi các cung quan trọng
  const scores = { Kim: 30, Mộc: 30, Thủy: 30, Hỏa: 30, Thổ: 30 }
  // Bản mệnh +40
  if (scores[laSo?.banMenh] !== undefined) scores[laSo.banMenh] += 40
  // Cục +25
  const cucHanh = (laSo?.cuc||'').includes('Thủy') ? 'Thủy' : (laSo?.cuc||'').includes('Mộc') ? 'Mộc'
    : (laSo?.cuc||'').includes('Kim') ? 'Kim' : (laSo?.cuc||'').includes('Hỏa') ? 'Hỏa' : 'Thổ'
  scores[cucHanh] += 25
  // Hành của địa chi cung Mệnh +20
  const chiHanh = { 'Tý':'Thủy','Hợi':'Thủy','Dần':'Mộc','Mão':'Mộc','Tỵ':'Hỏa','Ngọ':'Hỏa',
    'Thân':'Kim','Dậu':'Kim','Thìn':'Thổ','Tuất':'Thổ','Sửu':'Thổ','Mùi':'Thổ' }
  if (chiHanh[laSo?.menhCung]) scores[chiHanh[laSo.menhCung]] += 20

  const max = Math.max(...Object.values(scores), 1)
  const norm = Object.fromEntries(Object.entries(scores).map(([k,v]) => [k, Math.round(v/max*100)]))

  const items = [
    { label:'Kim', score: norm.Kim, color:'#a8a8b8' },
    { label:'Mộc', score: norm.Mộc, color:'#5a9a5a' },
    { label:'Thủy', score: norm.Thủy, color:'#5878b8' },
    { label:'Hỏa', score: norm.Hỏa, color:'#b85858' },
    { label:'Thổ', score: norm.Thổ, color:'#9a7840' },
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
function DaiVanTimeline({ laSo, info }) {
  const order = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi']
  // Tính tuổi hiện tại để đánh dấu đại vận đang ở
  const namXem = parseInt(info?.namXem) || new Date().getFullYear()
  const tuoi = namXem - laSo.amLich.nam + 1

  // Gom các cung có đại vận, sắp theo mốc tuổi bắt đầu
  const vans = order.map(chi => {
    const c = laSo.cacCung[chi]
    if (!c?.daiVan) return null
    const chinhTinh = c.sao.filter(s => ['Tử Vi','Thiên Cơ','Thái Dương','Vũ Khúc','Thiên Đồng','Liêm Trinh','Thiên Phủ','Thái Âm','Tham Lang','Cự Môn','Thiên Tướng','Thiên Lương','Thất Sát','Phá Quân'].includes(s))
    return {
      chi, cung: c.cung,
      tu: c.daiVan[0], den: c.daiVan[1],
      sao: chinhTinh.length ? chinhTinh.join(', ') : 'Vô chính diệu',
      current: tuoi >= c.daiVan[0] && tuoi <= c.daiVan[1],
    }
  }).filter(Boolean).sort((a,b) => a.tu - b.tu)

  const colors = ['#5a7a5a','#5a7a6a','#8a6a20','#7a5a10','#2a6a4a','#4a6a7a','#5a4a7a','#7a4a5a','#4a5a7a','#6a5a3a','#3a6a6a','#5a6a4a']

  return (
    <div className={styles.vanTimeline}>
      {vans.map((v,i) => (
        <div key={i} className={styles.vanItem}>
          <div className={styles.vanLeft}>
            <div className={styles.vanAge}>{v.tu}–{v.den}</div>
            <div className={styles.vanCanChi}>{v.cung} ({v.chi})</div>
          </div>
          <div className={styles.vanCenter}>
            <div className={`${styles.vanDot}${v.current?' '+styles.vanDotCurrent:''}`}
              style={{borderColor:colors[i], color:colors[i], background:v.current?colors[i]:'transparent'}}/>
            {i<vans.length-1 && <div className={styles.vanLine} style={{background:`linear-gradient(${colors[i]},${colors[i+1]})`}}/>}
          </div>
          <div className={styles.vanRight}>
            <div className={styles.vanCard} style={{borderColor:colors[i]+'44', background:colors[i]+'11'}}>
              <div className={styles.vanCardTitle} style={{color:v.current?'#e8c97a':'rgba(255,255,255,.75)'}}>
                {v.current?'★ Đại vận hiện tại — ':''}Cung {v.cung}
              </div>
              <div className={styles.vanCardTheme} style={{color:'rgba(255,255,255,.45)'}}>
                {v.sao}
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
          {laSo.amLich.ngay}/{laSo.amLich.thang}/{laSo.amLich.nam} ÂL · Giờ {GIO_INFO[info.gioIndex]?.[0]||''} · {info.gioiTinh} · {ls.cuc||''} · {ls.banMenh||''}
          {ls.menhCung ? ` · Mệnh tại ${ls.menhCung}` : ''}
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
            <DaiVanTimeline laSo={ls} info={info} />
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>◉ Bản đồ 12 Cung Mệnh</div>
            <SaoLegend />
            <div className={styles.cungGrid}>
              {CHI_NAMES.map(chi => <CungCard key={chi} chi={chi} c={ls.cacCung?.[chi]||{}} />)}
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
  const [progress, setProgress]     = useState({})

  const handleInfoNext = useCallback((d) => {
    const withYear = { ...d, namXem: new Date().getFullYear() }
    setInfo(withYear)
    const ls = lapLaSoAm(d.ngayAL, d.thangAL, d.namAL, d.gioIndex, d.gioiTinh)
    setLaSo(ls)
    setStep('verify')
  }, [])

  const handleAnalyze = useCallback(async () => {
    setStep('analyzing'); setAnalyzeErr('')
    setProgress({ phan1:'running', phan2:'wait', phan3:'wait', phan4:'wait', phan5:'wait' })

    const parts = [
      { key: 'phan1', prompt: PROMPT_PHAN1 },
      { key: 'phan2', prompt: PROMPT_PHAN2 },
      { key: 'phan3', prompt: PROMPT_PHAN3 },
      { key: 'phan4', prompt: PROMPT_PHAN4 },
      { key: 'phan5', prompt: PROMPT_PHAN5 },
    ]

    const combined = {}
    try {
      for (let i = 0; i < parts.length; i++) {
        const { key, prompt } = parts[i]
        setProgress(p => ({ ...p, [key]: 'running' }))

        // Retry tối đa 2 lần nếu lỗi parse/timeout
        let parsed = null
        for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
          try {
            const text = await callClaude([{ role: 'user', content: prompt(info, laSo) }], 8000)
            parsed = parseJSON(text)
          } catch (e) {
            if (attempt === 1) throw e
          }
        }

        combined[key] = { title: parsed.title, muc: parsed.muc || [] }
        if (key === 'phan5' && parsed.tongQuan) combined.tongQuan = parsed.tongQuan

        setProgress(p => ({ ...p, [key]: 'done', [parts[i+1]?.key]: 'running' }))
      }

      setResult(combined)
      setStep('result')
    } catch {
      setAnalyzeErr('Phân tích thất bại ở một phần. Vui lòng thử lại.')
      setStep('verify')
    }
  }, [info, laSo])

  const handleNew = useCallback(() => {
    setStep('info'); setInfo(null); setLaSo(null); setResult(null); setAnalyzeErr(''); setProgress({})
  }, [])

  return (
    <div>
      <div className={`${styles.header} no-print`}>
        <div style={{fontSize:22}}>☯</div>
        <div>
          <div className={styles.headerTitle}>TỬ VI BY THÔI · Luận Giải Chuyên Nghiệp</div>
          <div className={styles.headerSub}>Phân tích 100 mục cho cuộc sống · Tham khảo · Suy ngẫm · Vận mệnh do mình</div>
        </div>
      </div>
      <div className={styles.main}>
        <StepBar step={step} />
        {step==='info'      && <InfoForm onNext={handleInfoNext} />}
        {step==='verify'    && laSo && <VerifyScreen laSo={laSo} onBack={()=>setStep('info')} onAnalyze={handleAnalyze} error={analyzeErr} />}
        {step==='analyzing' && <AnalyzingScreen name={info?.hoTen||''} progress={progress} />}
        {step==='result'    && result && <ResultScreen result={result} info={info} laSo={laSo} onNew={handleNew} />}
      </div>
    </div>
  )
}
