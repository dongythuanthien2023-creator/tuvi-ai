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
              <div className={styles.stepDot} />
              {STEP_LABELS[i]}
            </div>
            {i < 4 && <div className={styles.stepSep} />}
          </div>
        )
      })}
    </div>
  )
}

// ── InfoForm — own state, no flicker ──────────────────────────────────────
function InfoForm({ onNext }) {
  const [hoTen, setHoTen]       = useState('')
  const [ngaySinh, setNgaySinh] = useState('')
  const [gioSinh, setGioSinh]   = useState('')
  const [gioiTinh, setGioiTinh] = useState('Nam')
  const [email, setEmail]       = useState('')

  const submit = () => {
    if (!hoTen.trim() || !ngaySinh || !gioSinh) {
      alert('Vui lòng điền đầy đủ họ tên, ngày sinh và giờ sinh')
      return
    }
    onNext({ hoTen: hoTen.trim(), ngaySinh, gioSinh, gioiTinh, email })
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>✦ Thông tin cơ bản</div>
      <div className={styles.cardSub}>
        Nhập thông tin khách hàng. Sau đó upload ảnh chụp lá số từ luangiai.vn để Claude tự đọc và phân tích 100 mục.
      </div>
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
            {GIO_SINH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className={styles.fg}>
          <label className={styles.label}>Giới tính *</label>
          <select className={styles.select} value={gioiTinh} onChange={e => setGioiTinh(e.target.value)}>
            <option>Nam</option>
            <option>Nữ</option>
          </select>
        </div>
        <div className={styles.fg}>
          <label className={styles.label}>Email (tuỳ chọn)</label>
          <input className={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
        </div>
      </div>
      <div className={styles.btnRow}>
        <button className={styles.btnP} disabled={!hoTen || !ngaySinh || !gioSinh} onClick={submit}>
          Tiếp theo →
        </button>
      </div>
    </div>
  )
}

// ── UploadScreen ───────────────────────────────────────────────────────────
function UploadScreen({ onBack, onDone }) {
  const [file, setFile]       = useState(null)
  const [b64, setB64]         = useState(null)
  const [mime, setMime]       = useState(null)
  const [drag, setDrag]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const fileRef = useRef()

  const handleFile = useCallback((f) => {
    if (!f) return
    const allowed = ['image/png','image/jpeg','image/webp','application/pdf']
    if (!allowed.includes(f.type)) { alert('Chỉ hỗ trợ PNG, JPG, WEBP, PDF'); return }
    setFile(f)
    const r = new FileReader()
    r.onload = e => { setB64(e.target.result.split(',')[1]); setMime(f.type) }
    r.readAsDataURL(f)
  }, [])

  const doExtract = async (info) => {
    setLoading(true); setError('')
    const cType = mime === 'application/pdf' ? 'document' : 'image'
    try {
      const text = await callClaude([{ role: 'user', content: [
        { type: cType, source: { type: 'base64', media_type: mime, data: b64 } },
        { type: 'text', text: EXTRACT_PROMPT(info) },
      ]}])
      onDone(parseJSON(text))
    } catch {
      setError('Không đọc được lá số. Thử ảnh rõ hơn hoặc chụp lại toàn bộ trang lá số.')
    } finally { setLoading(false) }
  }

  // info được pass từ parent qua prop
  return (
    <UploadScreenInner
      file={file} b64={b64} mime={mime} drag={drag} loading={loading} error={error}
      fileRef={fileRef} handleFile={handleFile} setDrag={setDrag}
      doExtract={doExtract} onBack={onBack}
    />
  )
}

function UploadScreenInner({ file, b64, mime, drag, loading, error, fileRef, handleFile, setDrag, doExtract, onBack, info }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>☁ Upload lá số Tử Vi</div>
      <div className={styles.cardSub}>
        Vào <strong style={{color:'#c9a84c'}}>luangiai.vn</strong> lập lá số → chụp màn hình hoặc xuất PDF → upload vào đây.
        Claude sẽ tự đọc và trích xuất toàn bộ thông tin 12 cung.
      </div>
      <div
        className={`${styles.uploadZone} ${drag ? styles.drag : ''}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}>
        <div className={styles.uploadIcon}>{file ? '✅' : '📄'}</div>
        <div className={styles.uploadText}>{file ? file.name : 'Kéo thả hoặc click để chọn file'}</div>
        <div className={styles.uploadSub}>PNG · JPG · WEBP · PDF &nbsp;|&nbsp; Tối đa 10MB</div>
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{display:'none'}} onChange={e => handleFile(e.target.files[0])} />
      </div>
      {file && (
        <div className={styles.filePreview}>
          <span style={{fontSize:20}}>{mime?.includes('pdf') ? '📕' : '🖼️'}</span>
          <div>
            <div style={{fontSize:13, fontWeight:600}}>{file.name}</div>
            <div style={{fontSize:11, color:'rgba(255,255,255,.3)'}}>{(file.size/1024).toFixed(0)} KB</div>
          </div>
        </div>
      )}
      {error && <div className={styles.errorBox}>⚠ {error}</div>}
      <div className={styles.btnRow}>
        <button className={styles.btnS} onClick={onBack}>← Quay lại</button>
        <button className={styles.btnP} disabled={!b64 || loading} onClick={doExtract}>
          {loading ? '⏳ Đang đọc lá số...' : 'Đọc lá số →'}
        </button>
      </div>
    </div>
  )
}

// ── VerifyScreen ───────────────────────────────────────────────────────────
function VerifyScreen({ laSo, onBack, onAnalyze, error }) {
  const cc = laSo?.cacCung || {}
  const rows = [
    ['Âm lịch',    `${laSo?.amLich?.ngay||'?'}/${laSo?.amLich?.thang||'?'}/${laSo?.amLich?.nam||'?'}`],
    ['Can Chi năm', laSo?.canChi?.nam||'—'],
    ['Giờ Can Chi', laSo?.canChi?.gio||'—'],
    ['Cục',         laSo?.cuc||'—'],
    ['Bản mệnh',    laSo?.banMenh||'—'],
    ['Âm dương',    laSo?.amDuong||'—'],
    ['Mệnh chủ',    laSo?.menhChu||'—'],
    ['Thân chủ',    laSo?.thanChu||'—'],
    ['Mệnh cung',   `${laSo?.menhCung?.cung||'—'} – ${laSo?.menhCung?.chi||''}`],
    ['Thân cung',   `${laSo?.thanCung?.cung||'—'} – ${laSo?.thanCung?.chi||''}`],
    ['Tuổi / Năm',  `${laSo?.tuoi||'?'}t / ${laSo?.namXem||'?'}`],
  ]
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>✓ Xác nhận thông tin lá số</div>
      <div className={styles.cardSub}>Claude đã đọc xong. Kiểm tra lại — nếu sai hãy upload ảnh rõ hơn. Khi đúng thì nhấn phân tích.</div>
      <div className={styles.infoGrid}>
        {rows.map(([k,v]) => (
          <div key={k} className={styles.infoItem}>
            <div className={styles.infoKey}>{k}</div>
            <div className={styles.infoVal}>{v}</div>
          </div>
        ))}
      </div>
      <div className={styles.sectionLabel}>12 Cung Mệnh</div>
      <div className={styles.cungGrid}>
        {CUNGS.map(n => {
          const c = cc[n] || {}
          const isMenh = n === 'Mệnh'
          return (
            <div key={n} className={`${styles.cungCard} ${isMenh ? styles.cungMenh : ''}`}>
              <div className={styles.cungName}>{isMenh ? '⭐ ' : ''}{n}</div>
              <div className={styles.cungChi}>{c.chi||'—'}{c.hanh ? ' – '+c.hanh : ''}</div>
              <div className={styles.cungSao}>{(c.sao||[]).slice(0,7).join(' · ')||'—'}</div>
            </div>
          )
        })}
      </div>
      {error && <div className={styles.errorBox}>⚠ {error}</div>}
      <div className={styles.btnRow}>
        <button className={styles.btnS} onClick={onBack}>← Upload lại</button>
        <button className={`${styles.btnP} ${styles.btnLarge}`} onClick={onAnalyze}>
          ✦ Phân tích 100 mục
        </button>
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
        <div style={{fontSize:30, marginBottom:12}}>☯</div>
        <div className={styles.loadingText}>
          Đang luận giải lá số <strong style={{color:'#c9a84c'}}>{name}</strong>
        </div>
        <div className={styles.loadingSub}>
          Claude đang phân tích chi tiết 100 mục...<br />Quá trình mất khoảng 40–90 giây
        </div>
        <div className={styles.loadingTags}>
          {['Cốt cách','Sự nghiệp','Tài lộc','Tình duyên','Sức khỏe','Vận hạn','Cải mệnh'].map(t => (
            <span key={t} className={`${styles.tag} ${styles.tagG} ${styles.tagPulse}`}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── ResultScreen ───────────────────────────────────────────────────────────
function ResultScreen({ result, info, laSo, onNew }) {
  const [section, setSection] = useState('phan1')
  const tq = result?.tongQuan || {}
  const ls = laSo || {}
  const ap = result?.[section]

  return (
    <div>
      {/* Header */}
      <div className={styles.resultHeader}>
        <div>
          <div className={styles.resultName}>✦ {info.hoTen}</div>
          <div className={styles.resultMeta}>
            {info.ngaySinh} · Giờ {info.gioSinh} · {info.gioiTinh} · {ls.cuc||''} · {ls.banMenh||''}
          </div>
          {tq.tomluat && <div className={styles.resultQuote}>"{tq.tomluat}"</div>}
        </div>
        <div className={styles.statGrid}>
          {[['Sự nghiệp',tq.sucNghiep],['Tài lộc',tq.taiLoc],['Tình duyên',tq.tinhDuyen],['Gia đạo',tq.giaDao],['Sức khỏe',tq.sucKhoe]].map(([l,v]) => (
            <div key={l}>
              <div className={styles.statVal}>{v||'—'}</div>
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
          {tq.diemYeuNhat   && <div className={`${styles.hlItem} ${styles.hlRed}`}><div className={styles.hlKey} style={{color:'#c07070'}}>⚠ Cần lưu ý</div><div className={styles.hlVal}>{tq.diemYeuNhat}</div></div>}
        </div>
      )}

      {/* Tabs */}
      <div className={`${styles.tabs} no-print`}>
        {SECTIONS.map(s => (
          <button key={s.k} className={`${styles.tab} ${section===s.k ? styles.tabA : styles.tabN}`} onClick={() => setSection(s.k)}>
            {s.i} {s.l}
          </button>
        ))}
      </div>

      {/* Mục list */}
      <div className={styles.card}>
        <div className={styles.secTitle}>{ap?.title||''}</div>
        {(ap?.muc||[]).map(m => {
          const sc = m.diem||0
          const rc = sc>=8 ? styles.scoreHi : sc<=5 ? styles.scoreLo : ''
          return (
            <div key={m.so} className={styles.mucItem}>
              <div className={styles.mucHeader}>
                <div className={styles.mucContent}>
                  <div className={styles.mucNum}>MỤC {String(m.so).padStart(2,'0')}</div>
                  <div className={styles.mucTitle}>{m.ten}</div>
                  <div>{(m.tags||[]).map((t,i) => <span key={i} className={`${styles.tag} ${tagCls(t)}`}>{t}</span>)}</div>
                  <div className={styles.mucBody}>{m.noidung||''}</div>
                  {m.loiKhuyen && (
                    <div className={styles.mucAdvice}>
                      <strong style={{color:'#c9a84c'}}>Lời khuyên: </strong>{m.loiKhuyen}
                    </div>
                  )}
                </div>
                <div className={`${styles.scoreRing} ${rc}`}>{m.diem||'?'}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className={`${styles.btnRow} no-print`} style={{marginTop:14}}>
        <button className={styles.btnS} onClick={onNew}>＋ Khách mới</button>
        <button className={styles.btnP} onClick={() => window.print()}>⬇ In / Lưu PDF</button>
      </div>
    </div>
  )
}

// ── Root App ───────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]           = useState('info')
  const [info, setInfo]           = useState(null)
  const [laSo, setLaSo]           = useState(null)
  const [result, setResult]       = useState(null)
  const [analyzeErr, setAnalyzeErr] = useState('')

  const handleInfoNext = useCallback((data) => {
    setInfo(data); setStep('upload')
  }, [])

  const handleExtracted = useCallback((data) => {
    setLaSo(data); setStep('verify')
  }, [])

  const handleAnalyze = useCallback(async () => {
    setStep('analyzing'); setAnalyzeErr('')
    try {
      const text = await callClaude([{ role: 'user', content: ANALYZE_PROMPT(info, laSo) }], 8000)
      setResult(parseJSON(text))
      setStep('result')
    } catch {
      setAnalyzeErr('Phân tích thất bại. Vui lòng thử lại.')
      setStep('verify')
    }
  }, [info, laSo])

  const handleNew = useCallback(() => {
    setStep('info'); setInfo(null); setLaSo(null); setResult(null); setAnalyzeErr('')
  }, [])

  return (
    <div>
      {/* Header */}
      <div className={`${styles.header} no-print`}>
        <div style={{fontSize:22}}>☯</div>
        <div>
          <div className={styles.headerTitle}>Tử Vi AI · Công cụ Luận Giải Chuyên Nghiệp</div>
          <div className={styles.headerSub}>Phân tích 100 mục · Upload lá số → Claude tự đọc & phân tích</div>
        </div>
      </div>

      <div className={styles.main}>
        <StepBar step={step} />

        {step === 'info'      && <InfoForm onNext={handleInfoNext} />}
        {step === 'upload'    && <UploadScreen onBack={() => setStep('info')} onDone={handleExtracted} info={info} />}
        {step === 'verify'    && laSo && <VerifyScreen laSo={laSo} onBack={() => setStep('upload')} onAnalyze={handleAnalyze} error={analyzeErr} />}
        {step === 'analyzing' && <AnalyzingScreen name={info?.hoTen||''} />}
        {step === 'result'    && result && <ResultScreen result={result} info={info} laSo={laSo} onNew={handleNew} />}
      </div>
    </div>
  )
}
