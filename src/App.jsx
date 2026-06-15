import { useState, useRef, useCallback, useEffect } from 'react'
import { callClaude, parseJSON, settings } from './api'
import { STEPS, STEP_LABELS, SECTIONS, PROMPT_PHAN1, PROMPT_PHAN2, PROMPT_PHAN3, PROMPT_PHAN4, PROMPT_PHAN5 } from './constants'
import { lapLaSoAm, GIO_INFO, CHI_NAMES, loaiSao, VONG_TRANG_SINH, VONG_BAC_SY, VONG_THAI_TUE, CHINH_TINH, TU_HOA, SAT_TINH, PHU_TINH_TOT } from './laso-engine'
import { buildDemoResult } from './demo-data'
import styles from './App.module.css'

// ── Theme động: từ 1 màu chủ đạo sinh toàn bộ palette đơn sắc ───────────────
function hexToHsl(hex) {
  hex = (hex || '#b8942a').replace('#','')
  const r = parseInt(hex.slice(0,2),16)/255
  const g = parseInt(hex.slice(2,4),16)/255
  const b = parseInt(hex.slice(4,6),16)/255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  let h=0, s=0, l=(max+min)/2
  if (max!==min) {
    const d = max-min
    s = l>0.5 ? d/(2-max-min) : d/(max+min)
    if (max===r) h=(g-b)/d+(g<b?6:0)
    else if (max===g) h=(b-r)/d+2
    else h=(r-g)/d+4
    h*=60
  }
  return [h, s*100, l*100]
}
const hsl = (h,s,l) => `hsl(${Math.round(h)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`

function applyTheme({ accentColor }) {
  const root = document.documentElement
  const [h, s] = hexToHsl(accentColor || '#b8942a')
  root.style.setProperty('--accent',       hsl(h, Math.min(s,70), 42))
  root.style.setProperty('--accent-soft',  hsl(h, Math.min(s,60), 55))
  root.style.setProperty('--bg-main',      hsl(h, Math.min(s*0.25,12), 96))
  root.style.setProperty('--header-bg',    hsl(h, Math.min(s*0.3,15), 91))
  root.style.setProperty('--card-bg',      '#ffffff')
  root.style.setProperty('--card-border',  hsl(h, Math.min(s*0.4,25), 80))
  root.style.setProperty('--text-main',    hsl(h, 15, 15))
  root.style.setProperty('--text-soft',    hsl(h, 10, 35))
  root.style.setProperty('--text-faint',   hsl(h, 8, 55))
  root.style.setProperty('--input-bg',     '#ffffff')
  root.style.setProperty('--input-border', hsl(h, Math.min(s*0.3,18), 78))
}

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
  if (/\((M|V|Đ)\)/.test(sao)) cls += ` ${styles.saoMieu}`
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
// ── HistoryList — lịch sử 5 người gần nhất ──────────────────────────────────
function HistoryList({ onOpen, refreshKey }) {
  const [list, setList] = useState([])

  useEffect(() => {
    if (window.tuviAPI?.getHistory) {
      window.tuviAPI.getHistory().then(h => setList(Array.isArray(h) ? h : []))
    }
  }, [refreshKey])

  const handleDelete = async (e, savedAt) => {
    e.stopPropagation()
    if (window.tuviAPI?.deleteHistory) {
      const next = await window.tuviAPI.deleteHistory(savedAt)
      setList(Array.isArray(next) ? next : [])
    }
  }

  if (!window.tuviAPI?.getHistory || list.length === 0) return null

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>◷ Lịch sử gần đây</div>
      <div className={styles.cardSub}>Mở lại lá số đã lập (tối đa 5 người gần nhất).</div>
      <div className={styles.histList}>
        {list.map(rec => (
          <div key={rec.savedAt} className={styles.histItem} onClick={() => onOpen(rec)}>
            <div className={styles.histInfo}>
              <div className={styles.histName}>{rec.info?.hoTen || '—'}</div>
              <div className={styles.histMeta}>
                {rec.info?.ngayAL}/{rec.info?.thangAL}/{rec.info?.namAL} ÂL · {rec.info?.gioiTinh}
                {rec.laSo?.cuc ? ` · ${rec.laSo.cuc}` : ''}
              </div>
            </div>
            <button className={styles.histDel} title="Xoá" onClick={(e) => handleDelete(e, rec.savedAt)}>×</button>
          </div>
        ))}
      </div>
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

// ── Render 1 ô cung ────────────────────────────────────────────────────────
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

// ── Overlay đường nối Tam hợp / Xung chiếu ──────────────────────────────────
const CHI_ORDER = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi']
const mod12 = x => ((x % 12) + 12) % 12

const ANCHOR = {
  'Tỵ':   { x:1,     y:1     },
  'Ngọ':  { x:1.667, y:1     },
  'Mùi':  { x:2.333, y:1     },
  'Thân': { x:3,     y:1     },
  'Dậu':  { x:3,     y:1.667 },
  'Tuất': { x:3,     y:2.333 },
  'Hợi':  { x:3,     y:3     },
  'Tý':   { x:2.333, y:3     },
  'Sửu':  { x:1.667, y:3     },
  'Dần':  { x:1,     y:3     },
  'Mão':  { x:1,     y:2.333 },
  'Thìn': { x:1,     y:1.667 },
}

function NoiCungOverlay({ activeChi }) {
  if (!activeChi) return null
  const idx = CHI_ORDER.indexOf(activeChi)
  if (idx < 0) return null

  const o = ANCHOR[activeChi]
  if (!o) return null

  const tamHop = [mod12(idx + 4), mod12(idx - 4)].map(i => ANCHOR[CHI_ORDER[i]]).filter(Boolean)
  const xung = ANCHOR[CHI_ORDER[mod12(idx + 6)]]

  return (
    <svg className={styles.noiOverlay} viewBox="0 0 4 4" preserveAspectRatio="none">
      {tamHop.length === 2 && (
        <polygon points={`${o.x},${o.y} ${tamHop[0].x},${tamHop[0].y} ${tamHop[1].x},${tamHop[1].y}`}
          fill="rgba(201,168,76,.06)" stroke="none" />
      )}
      {tamHop.map((p, i) => (
        <line key={i} x1={o.x} y1={o.y} x2={p.x} y2={p.y}
          stroke="#c9a84c" strokeWidth="0.012" strokeLinecap="round" />
      ))}
      {xung && (
        <line x1={o.x} y1={o.y} x2={xung.x} y2={xung.y}
          stroke="#c85858" strokeWidth="0.01" strokeDasharray="0.05 0.04" strokeLinecap="round" />
      )}
      <circle cx={o.x} cy={o.y} r="0.025" fill="#c9a84c" />
    </svg>
  )
}

// ── Bàn cờ lá số A4 dọc ────────────────────────────────────────────────────
function LaSoBanCo({ laSo, info }) {
  const cc = laSo?.cacCung || {}
  const [activeChi, setActiveChi] = useState(null)
  const layout = {
    'Tỵ':   { r:1, c:1 }, 'Ngọ': { r:1, c:2 }, 'Mùi': { r:1, c:3 }, 'Thân': { r:1, c:4 },
    'Thìn': { r:2, c:1 },                                            'Dậu':  { r:2, c:4 },
    'Mão':  { r:3, c:1 },                                            'Tuất': { r:3, c:4 },
    'Dần':  { r:4, c:1 }, 'Sửu': { r:4, c:2 }, 'Tý':  { r:4, c:3 }, 'Hợi':  { r:4, c:4 },
  }

  const phanLoai = (s) => {
    const t = s.replace(/\s*\([MĐHVB]\)\s*$/, '').trim()
    if (CHINH_TINH.includes(t)) return 'chinh'
    if (TU_HOA.includes(t)) return 'hoa'
    if (VONG_TRANG_SINH.includes(t)) return 'trangsinh'
    if (VONG_BAC_SY.includes(t)) return 'bacsy'
    if (VONG_THAI_TUE.includes(t)) return 'thartue'
    if (SAT_TINH.includes(t)) return 'sat'
    if (PHU_TINH_TOT.includes(t)) return 'cat'
    return 'hung'
  }

  const renderO = (chi) => {
    const c = cc[chi] || {}
    const sao = c.sao || []
    const isMenh = c.cung === 'Mệnh'
    const pos = layout[chi]
    const isActive = activeChi === chi

    const chinh = sao.filter(s => phanLoai(s) === 'chinh')
    const hoa   = sao.filter(s => phanLoai(s) === 'hoa')
    const cat   = sao.filter(s => phanLoai(s) === 'cat')
    const sat   = sao.filter(s => phanLoai(s) === 'sat')
    const hung  = sao.filter(s => phanLoai(s) === 'hung')
    const trangsinh = sao.filter(s => phanLoai(s) === 'trangsinh')
    const bacsy = sao.filter(s => phanLoai(s) === 'bacsy')

    const flags = []
    if (c.tuan) flags.push('Tuần')
    if (c.triet) flags.push('Triệt')

    return (
      <div key={chi}
        className={`${styles.banCoO}${isMenh?' '+styles.menh:''}${isActive?' '+styles.banCoOActive:''}`}
        style={{ gridColumn: pos.c, gridRow: pos.r }}
        onMouseEnter={() => setActiveChi(chi)}
        onMouseLeave={() => setActiveChi(null)}
        onClick={() => setActiveChi(prev => prev === chi ? null : chi)}>
        <div className={styles.bcTop}>
          <span className={styles.bcCanChi}>{c.can} {chi}</span>
          <span className={styles.bcTuoi}>{c.daiVan ? `${c.daiVan[0]}-${c.daiVan[1]}` : ''}</span>
        </div>
        <div className={styles.bcCung}>{isMenh?'★ ':''}{c.cung||'—'}</div>

        {chinh.length>0
          ? <div className={styles.bcChinhWrap}>
              {chinh.map((s,i)=><span key={i} className={styles.bcChinh}>{s}</span>)}
              {hoa.map((s,i)=><span key={i} className={styles.bcHoa}>{s.replace('Hóa ','')}</span>)}
            </div>
          : <div className={styles.bcVoChinh}>Vô chính diệu</div>}

        <div className={styles.bcCols}>
          <div className={styles.bcCol}>
            {cat.map((s,i)=><div key={i} className={styles.bcCat}>{s}</div>)}
          </div>
          <div className={styles.bcCol}>
            {sat.map((s,i)=><div key={i} className={styles.bcSat}>{s}</div>)}
            {hung.map((s,i)=><div key={i} className={styles.bcHung}>{s}</div>)}
          </div>
        </div>

        {bacsy.length>0 && <div className={styles.bcBacsy}>{bacsy.join(' · ')}</div>}

        <div className={styles.bcBottom}>
          <span className={styles.bcTrangSinh}>{trangsinh.join(' ')}</span>
          {flags.length>0 && <span className={styles.bcFlag}>{flags.join('/')}</span>}
        </div>
        {c.than && <span className={styles.bcThan}>Thân</span>}
      </div>
    )
  }

  return (
    <div className={styles.banCoWrap}>
      <div className={styles.banCo}>
        {Object.keys(layout).map(chi => renderO(chi))}
        <NoiCungOverlay activeChi={activeChi} />
        <div className={styles.banCoGiua}>
          <div className={styles.banCoTitle}>LÁ SỐ TỬ VI</div>
          <div className={styles.banCoName}>{info?.hoTen || ''}</div>
          <div className={styles.bcGiuaRow}><span className={styles.bcGiuaKey}>Sinh </span>{laSo?.amLich?.ngay}/{laSo?.amLich?.thang}/{laSo?.amLich?.nam} ÂL</div>
          <div className={styles.bcGiuaRow}>{laSo?.canChiNam}</div>
          <div className={styles.bcGiuaRow}><span className={styles.bcGiuaKey}>Giờ </span>{GIO_INFO[info?.gioIndex]?.[0]||''} · {info?.gioiTinh}</div>
          <div className={styles.bcGiuaRow}><span className={styles.bcGiuaKey}>Âm dương </span>{laSo?.amDuong}</div>
          <div className={styles.bcGiuaRow}><span className={styles.bcGiuaKey}>Bản mệnh </span>{laSo?.banMenh}</div>
          <div className={styles.bcGiuaRow}><span className={styles.bcGiuaKey}>Cục </span>{laSo?.cuc}</div>
          <div className={styles.bcGiuaRow}><span className={styles.bcGiuaKey}>Mệnh tại </span>{laSo?.menhCung}</div>
          <div className={styles.bcGiuaRow}><span className={styles.bcGiuaKey}>Thân cư </span>{laSo?.thanCu}</div>
        </div>
      </div>
    </div>
  )
}

// ── Legend ─────────────────────────────────────────────────────────────────
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
function VerifyScreen({ laSo, info, onBack, onAnalyze, error }) {
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
      <div className={styles.sectionLabel}>Lá số Tử Vi</div>
      <LaSoBanCo laSo={laSo} info={info} />
      <SaoLegend />
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
        <div className={styles.loadingText}>Đang luận giải lá số <strong style={{color:'var(--accent)'}}>{name}</strong></div>
        <div className={styles.loadingSub}>Đã hoàn thành {doneCount}/5 phần · Mỗi phần khoảng 15–25 giây</div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:20,maxWidth:340,marginLeft:'auto',marginRight:'auto'}}>
          {parts.map(p => {
            const st = progress?.[p.k] || 'wait'
            const color = st === 'done' ? '#58a8a8' : st === 'running' ? 'var(--accent)' : 'var(--text-faint)'
            const icon = st === 'done' ? '✓' : st === 'running' ? '◌' : '○'
            return (
              <div key={p.k} style={{display:'flex',alignItems:'center',gap:10,fontSize:13}}>
                <span style={{color,fontWeight:700,width:16,
                  animation: st==='running' ? 'spin 1.5s linear infinite' : 'none'}}>{icon}</span>
                <span style={{color: st==='wait'?'var(--text-faint)':'var(--text-soft)',flex:1,textAlign:'left'}}>
                  {p.l}
                </span>
                <span style={{color:'var(--text-faint)',fontSize:11}}>Mục {p.range}</span>
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
  const scores = { Kim: 30, Mộc: 30, Thủy: 30, Hỏa: 30, Thổ: 30 }
  if (scores[laSo?.banMenh] !== undefined) scores[laSo.banMenh] += 40
  const cucHanh = (laSo?.cuc||'').includes('Thủy') ? 'Thủy' : (laSo?.cuc||'').includes('Mộc') ? 'Mộc'
    : (laSo?.cuc||'').includes('Kim') ? 'Kim' : (laSo?.cuc||'').includes('Hỏa') ? 'Hỏa' : 'Thổ'
  scores[cucHanh] += 25
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
        {[.25,.5,.75,1].map(p => <polygon key={p} points={gridPts(p)} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="1"/>)}
        {angles.map((a,i) => <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke="rgba(0,0,0,.06)" strokeWidth="1"/>)}
        <polygon points={polyPts} fill="rgba(201,168,76,.15)" stroke="rgba(201,168,76,.6)" strokeWidth="1.5"/>
        {points.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={items[i].color}/>)}
        {items.map((item,i) => {
          const lx = cx + (r+14)*Math.cos(angles[i]), ly = cy + (r+14)*Math.sin(angles[i])
          return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--text-faint)">{item.label}</text>
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
  const namXem = parseInt(info?.namXem) || new Date().getFullYear()
  const tuoi = namXem - laSo.amLich.nam + 1

  const vans = order.map(chi => {
    const c = laSo.cacCung[chi]
    if (!c?.daiVan) return null
    const CHINH = ['Tử Vi','Thiên Cơ','Thái Dương','Vũ Khúc','Thiên Đồng','Liêm Trinh','Thiên Phủ','Thái Âm','Tham Lang','Cự Môn','Thiên Tướng','Thiên Lương','Thất Sát','Phá Quân']
    const chinhTinh = c.sao.filter(s => CHINH.includes(s.replace(/\s*\([MĐHVB]\)\s*$/, '').trim()))
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
              <div className={styles.vanCardTitle} style={{color:v.current?'#a07810':'var(--text-soft)'}}>
                {v.current?'★ Đại vận hiện tại — ':''}Cung {v.cung}
              </div>
              <div className={styles.vanCardTheme} style={{color:'var(--text-faint)'}}>
                {v.sao}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 1 mục phân tích (tái dùng cho cả màn hình lẫn in) ───────────────────────
function MucItem({ m, isPrint }) {
  const sc = m.diem || 0
  const rc = sc>=8?styles.scoreHi:sc<=5?styles.scoreLo:''
  return (
    <div className={`${styles.mucItem}${isPrint?' '+styles.printMuc:''}`}>
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
      {/* Header — hiện cả màn hình lẫn in */}
      <div className={styles.resultHeader}>
        <div className={styles.resultName}>✦ {info.hoTen}</div>
        <div className={styles.resultMeta}>
          {laSo.amLich.ngay}/{laSo.amLich.thang}/{laSo.amLich.nam} ÂL · Giờ {GIO_INFO[info.gioIndex]?.[0]||''} · {info.gioiTinh} · {ls.cuc||''} · {ls.banMenh||''}
          {ls.menhCung ? ` · Mệnh tại ${ls.menhCung}` : ''}
        </div>
        {tq.tomluat && <div className={styles.resultQuote}>"{tq.tomluat}"</div>}
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

      {(tq.giaiDoanVang||tq.diemManhNhat||tq.diemYeuNhat) && (
        <div className={styles.hlGrid}>
          {tq.giaiDoanVang  && <div className={`${styles.hlItem} ${styles.hlGold}`}><div className={styles.hlKey} style={{color:'#c9a84c'}}>⭐ Giai đoạn vàng</div><div className={styles.hlVal}>{tq.giaiDoanVang}</div></div>}
          {tq.diemManhNhat  && <div className={`${styles.hlItem} ${styles.hlTeal}`}><div className={styles.hlKey} style={{color:'#58a8a8'}}>✓ Điểm mạnh nhất</div><div className={styles.hlVal}>{tq.diemManhNhat}</div></div>}
          {tq.diemYeuNhat   && <div className={`${styles.hlItem} ${styles.hlRed}`}> <div className={styles.hlKey} style={{color:'#c07070'}}>⚠ Cần lưu ý</div>   <div className={styles.hlVal}>{tq.diemYeuNhat}</div></div>}
        </div>
      )}

      {/* Tabs — ẩn khi in */}
      <div className={`${styles.tabs} no-print`}>
        {allTabs.map(s => (
          <button key={s.k} className={`${styles.tab} ${section===s.k?styles.tabA:styles.tabN}`} onClick={()=>setSection(s.k)}>
            {s.i} {s.l}
          </button>
        ))}
      </div>

      {/* ══ XEM TRÊN MÀN HÌNH (theo tab) — ẩn khi in ══ */}
      <div className="no-print">
        {section === 'tongquan' && (
          <div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>⬡ Biểu đồ Ngũ Hành</div>
              <NguHanhChart laSo={ls} />
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>◈ Đại Vận Trọn Đời</div>
              <div style={{marginBottom:8,fontSize:12,color:'var(--text-faint)'}}>★ = Giai đoạn hiện tại</div>
              <DaiVanTimeline laSo={ls} info={info} />
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>◉ Lá số Tử Vi</div>
              <LaSoBanCo laSo={ls} info={info} />
              <SaoLegend />
            </div>
          </div>
        )}

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
                {(result[sec.k]?.muc||[]).map(m => <MucItem key={m.so} m={m} />)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ CHỈ DÙNG KHI IN — render đủ Lá số → Tổng quan → 5 phần ══ */}
      <div className={styles.printOnly}>
        <div className={styles.printBlock}>
          <div className={styles.printSecTitle}>◉ Lá số Tử Vi</div>
          <LaSoBanCo laSo={ls} info={info} />
        </div>

        <div className={styles.printBlock}>
          <div className={styles.printSecTitle}>☯ Tổng quan</div>
          <NguHanhChart laSo={ls} />
          <DaiVanTimeline laSo={ls} info={info} />
        </div>

        {SECTIONS.map(sec => (
          <div key={sec.k} className={styles.printBlock}>
            <div className={styles.printSecTitle}>{sec.i} {result[sec.k]?.title || sec.l}</div>
            {(result[sec.k]?.muc || []).map(m => <MucItem key={m.so} m={m} isPrint />)}
          </div>
        ))}
      </div>

      <div className={`${styles.btnRow} no-print`} style={{marginTop:14}}>
        <button className={styles.btnS} onClick={onNew}>＋ Khách mới</button>
        <button className={styles.btnP} onClick={() => {
          const name = `la-so-${(info.hoTen||'').replace(/\s+/g,'-')}`
          if (window.tuviAPI?.printToPDF) {
            document.body.classList.add('printing')
            setTimeout(() => {
              window.tuviAPI.printToPDF(name).then(r => {
                document.body.classList.remove('printing')
                if (r?.ok) alert('Đã lưu PDF: ' + r.filePath)
                else if (!r?.canceled) alert('Lỗi xuất PDF: ' + (r?.error||''))
              })
            }, 100)
          } else {
            window.print()
          }
        }}>⬇ In / Lưu PDF</button>
      </div>
    </div>
  )
}

// ── SettingsModal ──────────────────────────────────────────────────────────
function SettingsModal({ onClose }) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel]   = useState('claude-sonnet-4-6')
  const [saved, setSaved]   = useState(false)
  const [accentColor, setAccentColor] = useState('#b8942a')

  useState(() => {
    settings.get().then(s => {
      if (s.apiKey) setApiKey(s.apiKey)
      if (s.model) setModel(s.model)
      if (s.accentColor) setAccentColor(s.accentColor)
    })
  })

  const resetTheme = () => setAccentColor('#b8942a')

  const doSave = async () => {
    await settings.save({ apiKey: apiKey.trim(), model, accentColor })
    applyTheme({ accentColor })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  const lblNote = { fontSize:11, color:'var(--text-faint)', marginTop:5 }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()} style={{maxHeight:'85vh',overflowY:'auto'}}>
        <div className={styles.cardTitle}>⚙ Cài đặt</div>
        <div className={styles.cardSub}>Cài đặt được lưu an toàn trên máy này.</div>

        <div className={styles.fg} style={{marginBottom:14}}>
          <label className={styles.label}>Anthropic API Key</label>
          <input className={styles.input} type="password" value={apiKey}
            onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-api03-..." />
          <div style={lblNote}>Lấy tại console.anthropic.com → API Keys</div>
        </div>

        <div className={styles.fg} style={{marginBottom:18}}>
          <label className={styles.label}>Model</label>
          <select className={styles.select} value={model} onChange={e => setModel(e.target.value)}>
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (khuyên dùng)</option>
            <option value="claude-opus-4-8">Claude Opus 4.8 (sâu hơn, chậm hơn)</option>
            <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (nhanh, tiết kiệm)</option>
          </select>
        </div>

        <div style={{borderTop:'1px solid var(--card-border)',paddingTop:16,marginBottom:4}}>
          <div className={styles.label} style={{marginBottom:10}}>🎨 Màu chủ đạo</div>
          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
            <input type="color" value={accentColor} onChange={e=>setAccentColor(e.target.value)}
              style={{width:60,height:42,border:'1px solid var(--input-border)',borderRadius:8,cursor:'pointer',background:'none'}} />
            <div style={{fontSize:12,color:'var(--text-soft)',flex:1}}>
              Chọn 1 màu, toàn bộ giao diện (nền, header, viền, chữ) sẽ tự phối hài hoà theo màu này.
            </div>
          </div>
          <button className={styles.btnS} style={{fontSize:12,padding:'7px 14px'}} onClick={resetTheme}>↺ Khôi phục mặc định</button>
        </div>

        <div className={styles.btnRow} style={{marginTop:18}}>
          <button className={styles.btnS} onClick={onClose}>Đóng</button>
          <button className={styles.btnP} onClick={doSave}>{saved ? '✓ Đã lưu' : 'Lưu cài đặt'}</button>
        </div>
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
  const [showSettings, setShowSettings] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  const handleInfoNext = useCallback((d) => {
    const withYear = { ...d, namXem: new Date().getFullYear() }
    setInfo(withYear)
    const ls = lapLaSoAm(d.ngayAL, d.thangAL, d.namAL, d.gioIndex, d.gioiTinh)
    setLaSo(ls)
    setStep('verify')
  }, [])
  const handleDemo = useCallback(() => {
    const demoInfo = { hoTen: 'Nguyễn Văn Demo', ngayAL: 12, thangAL: 9, namAL: 1996, gioIndex: 6, gioiTinh: 'Nam', namXem: new Date().getFullYear() }
    const ls = lapLaSoAm(demoInfo.ngayAL, demoInfo.thangAL, demoInfo.namAL, demoInfo.gioIndex, demoInfo.gioiTinh)
    setInfo(demoInfo)
    setLaSo(ls)
    setResult(buildDemoResult())
    setStep('result')
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

        let parsed = null
        for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
          try {
            const text = await callClaude([{ role: 'user', content: prompt(info, laSo) }], 64000)
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

  useState(() => {
    settings.get().then(s => applyTheme({ accentColor: s.accentColor }))
  })

  const handleNew = useCallback(() => {
    setStep('info'); setInfo(null); setLaSo(null); setResult(null); setAnalyzeErr(''); setProgress({})
  }, [])
  // Tự lưu vào lịch sử mỗi khi có kết quả mới
  useEffect(() => {
    if (step === 'result' && result && info && laSo && window.tuviAPI?.saveHistory) {
      window.tuviAPI.saveHistory({ info, laSo, result })
        .then(() => setHistoryKey(k => k + 1))
    }
  }, [step, result, info, laSo])

  // Mở lại 1 bản ghi từ lịch sử
  const handleOpenHistory = useCallback((rec) => {
    setInfo(rec.info)
    setLaSo(rec.laSo)
    setResult(rec.result)
    setAnalyzeErr('')
    setProgress({})
    setStep('result')
  }, [])

  return (
    <div>
      <div className={`${styles.header} no-print`}>
        <div style={{fontSize:22}}>☯</div>
        <div style={{flex:1}}>
          <div className={styles.headerTitle}>Tử vi cùng Thôi · Chiêm nghiệm lá số đời bạn</div>
          <div className={styles.headerSub}>100 mục về cuộc đời của bạn · Chiêm nghiệm · Suy ngẫm · Tham khảo · Vận mệnh của bạn, là do bạn</div>
        </div>
        {settings.isDesktop && (
          <button className={styles.settingsBtn} onClick={() => setShowSettings(true)} title="Cài đặt">⚙</button>
        )}
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <div className={styles.main}>
        <StepBar step={step} />
        {step==='info'      && <InfoForm onNext={handleInfoNext} />}
        {step==='info' && (
          <div style={{textAlign:'center',marginTop:12}}>
            <button onClick={handleDemo} style={{background:'transparent',border:'1px dashed var(--accent)',color:'var(--accent)',padding:'8px 16px',borderRadius:6,cursor:'pointer',fontSize:13}}>
              ⚡ Xem Demo (dữ liệu mẫu, không gọi API)
            </button>
          </div>
        )}
        {step==='info' && <HistoryList onOpen={handleOpenHistory} refreshKey={historyKey} />}
        {step==='verify'    && laSo && <VerifyScreen laSo={laSo} info={info} onBack={()=>setStep('info')} onAnalyze={handleAnalyze} error={analyzeErr} />}
        {step==='analyzing' && <AnalyzingScreen name={info?.hoTen||''} progress={progress} />}
        {step==='result'    && result && <ResultScreen result={result} info={info} laSo={laSo} onNew={handleNew} />}
      </div>
    </div>
  )
}