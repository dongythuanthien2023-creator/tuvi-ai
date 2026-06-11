// laso-engine.js — Engine lập lá số Tử Vi (dịch từ engine Python đã kiểm chứng đúng)
// Quy ước cung: 0..11 = Tý Sửu Dần Mão Thìn Tỵ Ngọ Mùi Thân Dậu Tuất Hợi

const CAN = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý']
const CHI = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi']
const CHI_NAMES = CHI
const DAN = 2
const TEN_12_CUNG = ['Mệnh','Phụ Mẫu','Phúc Đức','Điền Trạch','Quan Lộc','Nô Bộc',
                     'Thiên Di','Tật Ách','Tài Bạch','Tử Tức','Phu Thê','Huynh Đệ']
const NGU_HANH_CUC = {'Thủy nhị cục':2,'Mộc tam cục':3,'Kim tứ cục':4,'Thổ ngũ cục':5,'Hỏa lục cục':6}

const GIO_INFO = [
  ['Tý','23h–1h'],['Sửu','1h–3h'],['Dần','3h–5h'],['Mão','5h–7h'],
  ['Thìn','7h–9h'],['Tỵ','9h–11h'],['Ngọ','11h–13h'],['Mùi','13h–15h'],
  ['Thân','15h–17h'],['Dậu','17h–19h'],['Tuất','19h–21h'],['Hợi','21h–23h'],
]

const NAP_AM = {
  'Giáp Tý':'Kim','Ất Sửu':'Kim','Bính Dần':'Hỏa','Đinh Mão':'Hỏa','Mậu Thìn':'Mộc','Kỷ Tỵ':'Mộc',
  'Canh Ngọ':'Thổ','Tân Mùi':'Thổ','Nhâm Thân':'Kim','Quý Dậu':'Kim','Giáp Tuất':'Hỏa','Ất Hợi':'Hỏa',
  'Bính Tý':'Thủy','Đinh Sửu':'Thủy','Mậu Dần':'Thổ','Kỷ Mão':'Thổ','Canh Thìn':'Kim','Tân Tỵ':'Kim',
  'Nhâm Ngọ':'Mộc','Quý Mùi':'Mộc','Giáp Thân':'Thủy','Ất Dậu':'Thủy','Bính Tuất':'Thổ','Đinh Hợi':'Thổ',
  'Mậu Tý':'Hỏa','Kỷ Sửu':'Hỏa','Canh Dần':'Mộc','Tân Mão':'Mộc','Nhâm Thìn':'Thủy','Quý Tỵ':'Thủy',
  'Giáp Ngọ':'Kim','Ất Mùi':'Kim','Bính Thân':'Hỏa','Đinh Dậu':'Hỏa','Mậu Tuất':'Mộc','Kỷ Hợi':'Mộc',
  'Canh Tý':'Thổ','Tân Sửu':'Thổ','Nhâm Dần':'Kim','Quý Mão':'Kim','Giáp Thìn':'Hỏa','Ất Tỵ':'Hỏa',
  'Bính Ngọ':'Thủy','Đinh Mùi':'Thủy','Mậu Thân':'Thổ','Kỷ Dậu':'Thổ','Canh Tuất':'Kim','Tân Hợi':'Kim',
  'Nhâm Tý':'Mộc','Quý Sửu':'Mộc','Giáp Dần':'Thủy','Ất Mão':'Thủy','Bính Thìn':'Thổ','Đinh Tỵ':'Thổ',
  'Mậu Ngọ':'Hỏa','Kỷ Mùi':'Hỏa','Canh Thân':'Mộc','Tân Dậu':'Mộc','Nhâm Tuất':'Thủy','Quý Hợi':'Thủy',
}

const mod12 = x => ((x % 12) + 12) % 12

function lapCuc(canIdx, menhIdx) {
  const nhomCan = canIdx % 5
  const c = menhIdx
  let bang
  if (c===0||c===1) bang=['Thủy nhị cục','Hỏa lục cục','Thổ ngũ cục','Mộc tam cục','Kim tứ cục']
  else if ([2,3,10,11].includes(c)) bang=['Hỏa lục cục','Thổ ngũ cục','Mộc tam cục','Kim tứ cục','Thủy nhị cục']
  else if (c===4||c===5) bang=['Mộc tam cục','Kim tứ cục','Thủy nhị cục','Hỏa lục cục','Thổ ngũ cục']
  else if (c===6||c===7) bang=['Thổ ngũ cục','Mộc tam cục','Kim tứ cục','Thủy nhị cục','Hỏa lục cục']
  else bang=['Kim tứ cục','Thủy nhị cục','Hỏa lục cục','Thổ ngũ cục','Mộc tam cục']
  return bang[nhomCan]
}

function anTuVi(cucSo, ngay) {
  const boi = Math.ceil(ngay/cucSo)*cucSo
  const hieu = boi - ngay
  const base = mod12(DAN + (boi/cucSo - 1))
  return (hieu % 2 === 0) ? mod12(base + hieu) : mod12(base - hieu)
}

const anThienPhu = tuviIdx => mod12((4 - tuviIdx) % 12 + 12)

function anLocTon(canIdx) {
  return {0:2,1:3,2:5,3:6,4:5,5:6,6:8,7:9,8:11,9:0}[canIdx]
}

function anHoaLinhStart(chiIdx) {
  if ([2,6,10].includes(chiIdx)) return [1,3]
  if ([8,0,4].includes(chiIdx)) return [2,10]
  if ([5,9,1].includes(chiIdx)) return [3,10]
  return [9,10]
}

function anKhoiViet(canIdx) {
  const b={0:[1,7],4:[1,7],1:[0,8],5:[0,8],6:[6,2],7:[6,2],2:[11,9],3:[11,9],8:[3,5],9:[3,5]}
  return b[canIdx]
}

function anTuHoa(canIdx) {
  const b={
    0:['Liêm Trinh','Phá Quân','Vũ Khúc','Thái Dương'],
    1:['Thiên Cơ','Thiên Lương','Tử Vi','Thái Âm'],
    2:['Thiên Đồng','Thiên Cơ','Văn Xương','Liêm Trinh'],
    3:['Thái Âm','Thiên Đồng','Thiên Cơ','Cự Môn'],
    4:['Tham Lang','Thái Âm','Hữu Bật','Thiên Cơ'],
    5:['Vũ Khúc','Tham Lang','Thiên Lương','Văn Khúc'],
    6:['Thái Dương','Vũ Khúc','Thái Âm','Thiên Đồng'],
    7:['Cự Môn','Thiên Lương','Văn Khúc','Văn Xương'],
    8:['Thiên Lương','Tử Vi','Tả Phụ','Vũ Khúc'],
    9:['Phá Quân','Cự Môn','Thái Âm','Tham Lang'],
  }
  const [loc,quyen,khoa,ky]=b[canIdx]
  return {'Hóa Lộc':loc,'Hóa Quyền':quyen,'Hóa Khoa':khoa,'Hóa Kỵ':ky}
}

function anCoQua(chiIdx){
  if([11,0,1].includes(chiIdx))return[2,10]
  if([2,3,4].includes(chiIdx))return[5,1]
  if([5,6,7].includes(chiIdx))return[8,4]
  return[11,7]
}
const anDaoHoa=c=>([5,9,1].includes(c)?6:[11,3,7].includes(c)?0:[8,0,4].includes(c)?9:3)
const anThienMa=c=>([5,9,1].includes(c)?11:[11,3,7].includes(c)?5:[8,0,4].includes(c)?2:8)
const anKiepSat=c=>([5,9,1].includes(c)?2:[11,3,7].includes(c)?8:[2,6,10].includes(c)?11:5)
const anPhaToai=c=>([0,6,3,9].includes(c)?5:[2,8,5,11].includes(c)?9:1)
const anHoaCai=c=>([5,9,1].includes(c)?1:[11,3,7].includes(c)?7:[2,6,10].includes(c)?10:4)
const anLuuHa=c=>[9,10,7,4,5,6,8,3,11,2][c]
const anThienTru=c=>[5,6,0,5,6,8,2,6,9,10][c]

function anTuan(canIdx,chiIdx){
  const giapPos=mod12(chiIdx-canIdx)
  return new Set([mod12(giapPos-2),mod12(giapPos-1)])
}
function anTriet(canIdx){
  const b={0:[8,9],5:[8,9],1:[6,7],6:[6,7],2:[4,5],7:[4,5],3:[2,3],8:[2,3],4:[0,1],9:[0,1]}
  return new Set(b[canIdx])
}

// Hàm chính: nhập ÂM LỊCH
export function lapLaSoAm(amD, amM, amY, gioIndex, gioiTinh) {
  const canNamIdx = (amY + 6) % 10
  const chiNamIdx = (amY + 8) % 12
  const canNam = CAN[canNamIdx], chiNam = CHI[chiNamIdx]
  const amDuong = canNamIdx % 2 === 0 ? 'Dương' : 'Âm'
  const banMenh = NAP_AM[`${canNam} ${chiNam}`] || '?'

  const cungThang = mod12(DAN + (amM - 1))
  const menhIdx = mod12(cungThang - gioIndex)
  const thanIdx = mod12(cungThang + gioIndex)

  const cungTen = {}
  TEN_12_CUNG.forEach((ten,i)=>{ cungTen[mod12(menhIdx+i)]=ten })

  const cuc = lapCuc(canNamIdx, menhIdx)
  const cucSo = NGU_HANH_CUC[cuc]
  const cung = Array.from({length:12},()=>[])

  // Tử Vi hệ (nghịch)
  const tuvi = anTuVi(cucSo, amD)
  cung[tuvi].push('Tử Vi')
  cung[mod12(tuvi-1)].push('Thiên Cơ')
  cung[mod12(tuvi-3)].push('Thái Dương')
  cung[mod12(tuvi-4)].push('Vũ Khúc')
  cung[mod12(tuvi-5)].push('Thiên Đồng')
  cung[mod12(tuvi-8)].push('Liêm Trinh')

  // Thiên Phủ hệ (thuận)
  const tp = anThienPhu(tuvi)
  cung[tp].push('Thiên Phủ')
  cung[mod12(tp+1)].push('Thái Âm')
  cung[mod12(tp+2)].push('Tham Lang')
  cung[mod12(tp+3)].push('Cự Môn')
  cung[mod12(tp+4)].push('Thiên Tướng')
  cung[mod12(tp+5)].push('Thiên Lương')
  cung[mod12(tp+6)].push('Thất Sát')
  cung[mod12(tp+10)].push('Phá Quân')

  // Thái Tuế hệ
  const ttSao=['Thái Tuế','Thiếu Dương','Tang Môn','Thiếu Âm','Quan Phù','Tử Phù',
               'Tuế Phá','Long Đức','Bạch Hổ','Phúc Đức','Điếu Khách','Trực Phù']
  ttSao.forEach((s,i)=>cung[mod12(chiNamIdx+i)].push(s))

  // Lộc Tồn hệ
  const loct=anLocTon(canNamIdx)
  cung[loct].push('Lộc Tồn'); cung[loct].push('Bác Sỹ')
  const duongNamAmNu=(amDuong==='Dương'&&gioiTinh==='Nam')||(amDuong==='Âm'&&gioiTinh==='Nữ')
  const chieu=duongNamAmNu?1:-1
  const ltSao=['Lực Sỹ','Thanh Long','Tiểu Hao','Tướng Quân','Tấu Thư','Phi Liêm',
               'Hỷ Thần','Bệnh Phù','Đại Hao','Phục Binh','Quan Phủ']
  ltSao.forEach((s,i)=>cung[mod12(loct+chieu*(i+1))].push(s))

  // Tràng Sinh hệ
  const tsStart={2:8,3:11,4:5,5:8,6:2}[cucSo]
  const tsFull=['Tràng Sinh','Mộc Dục','Quan Đới','Lâm Quan','Đế Vượng','Suy',
                'Bệnh','Tử','Mộ','Tuyệt','Thai','Dưỡng']
  tsFull.forEach((s,i)=>cung[mod12(tsStart+chieu*i)].push(s))

  // Lục sát
  cung[mod12(loct+1)].push('Kình Dương')
  cung[mod12(loct-1)].push('Đà La')
  const HOI=11
  cung[mod12(HOI+gioIndex)].push('Địa Kiếp')
  cung[mod12(HOI-gioIndex)].push('Địa Không')
  const [hoaS,linhS]=anHoaLinhStart(chiNamIdx)
  if(duongNamAmNu){
    cung[mod12(hoaS+gioIndex)].push('Hỏa Tinh')
    cung[mod12(linhS-gioIndex)].push('Linh Tinh')
  }else{
    cung[mod12(hoaS-gioIndex)].push('Hỏa Tinh')
    cung[mod12(linhS+gioIndex)].push('Linh Tinh')
  }

  // Tả Hữu, Xương Khúc
  const THIN=4,TUAT=10
  const taPhu=mod12(THIN+(amM-1)), huuBat=mod12(TUAT-(amM-1))
  cung[taPhu].push('Tả Phụ'); cung[huuBat].push('Hữu Bật')
  const vanXuong=mod12(TUAT-gioIndex), vanKhuc=mod12(THIN+gioIndex)
  cung[vanXuong].push('Văn Xương'); cung[vanKhuc].push('Văn Khúc')

  // Long Phượng
  cung[mod12(THIN+chiNamIdx)].push('Long Trì')
  const phuongCac=mod12(TUAT-chiNamIdx)
  cung[phuongCac].push('Phượng Các')

  // Khôi Việt
  const [khoi,viet]=anKhoiViet(canNamIdx)
  cung[khoi].push('Thiên Khôi'); cung[viet].push('Thiên Việt')

  // Khốc Hư
  const NGO=6
  cung[mod12(NGO-chiNamIdx)].push('Thiên Khốc')
  cung[mod12(NGO+chiNamIdx)].push('Thiên Hư')

  // Thai Tọa
  cung[mod12(taPhu+(amD-1))].push('Tam Thai')
  cung[mod12(huuBat-(amD-1))].push('Bát Tọa')

  // Quang Quý
  cung[mod12(vanXuong+(amD-1)-1)].push('Ân Quang')
  cung[mod12(vanKhuc-(amD-1)+1)].push('Thiên Quý')

  // Thiên Nguyệt Đức
  const DAU=9,TY_CUNG=5
  cung[mod12(DAU+chiNamIdx)].push('Thiên Đức')
  cung[mod12(TY_CUNG+chiNamIdx)].push('Nguyệt Đức')

  // Hình Riêu Y
  const SUU=1
  cung[mod12(DAU+(amM-1))].push('Thiên Hình')
  const thienRieu=mod12(SUU+(amM-1))
  cung[thienRieu].push('Thiên Riêu'); cung[thienRieu].push('Thiên Y')

  // Hồng Hỷ
  const MAO=3
  const hongLoan=mod12(MAO-chiNamIdx)
  cung[hongLoan].push('Hồng Loan')
  cung[mod12(hongLoan+6)].push('Thiên Hỷ')

  // Ấn Phù
  cung[mod12(loct+8)].push('Quốc Ấn')
  cung[mod12(loct-7)].push('Đường Phù')

  // Giải Thần nhóm
  const THAN_CUNG=8,MUI=7
  cung[mod12(THAN_CUNG+(amM-1))].push('Thiên Giải')
  cung[mod12(MUI+(amM-1))].push('Địa Giải')
  cung[phuongCac].push('Giải Thần')

  // Thai Cáo
  cung[mod12(vanKhuc+2)].push('Thai Phụ')
  cung[mod12(vanKhuc-2)].push('Phong Cáo')

  // Tài Thọ
  cung[mod12(menhIdx+chiNamIdx)].push('Thiên Tài')
  cung[mod12(thanIdx+chiNamIdx)].push('Thiên Thọ')

  // Thương Sứ
  const noBocIdx=Object.keys(cungTen).find(k=>cungTen[k]==='Nô Bộc')|0
  const tatAchIdx=Object.keys(cungTen).find(k=>cungTen[k]==='Tật Ách')|0
  cung[noBocIdx].push('Thiên Thương')
  cung[tatAchIdx].push('Thiên Sứ')

  // La Võng
  cung[THIN].push('Thiên La'); cung[TUAT].push('Địa Võng')

  // Tứ Hóa
  const tuHoa=anTuHoa(canNamIdx)
  Object.entries(tuHoa).forEach(([hoa,saoGoc])=>{
    for(let ci=0;ci<12;ci++){ if(cung[ci].includes(saoGoc)){cung[ci].push(hoa);break} }
  })

  // Cô Quả, Đào Hoa...
  const [coThan,quaTu]=anCoQua(chiNamIdx)
  cung[coThan].push('Cô Thần'); cung[quaTu].push('Quả Tú')
  cung[anDaoHoa(chiNamIdx)].push('Đào Hoa')
  cung[anThienMa(chiNamIdx)].push('Thiên Mã')
  cung[anKiepSat(chiNamIdx)].push('Kiếp Sát')
  cung[anPhaToai(chiNamIdx)].push('Phá Toái')
  cung[anHoaCai(chiNamIdx)].push('Hoa Cái')
  cung[anLuuHa(canNamIdx)].push('Lưu Hà')
  cung[anThienTru(canNamIdx)].push('Thiên Trù')
  cung[mod12(chiNamIdx+1)].push('Thiên Không')

  // Tuần Triệt
  const tuan=anTuan(canNamIdx,chiNamIdx)
  const triet=anTriet(canNamIdx)

  // Đại vận
  const daiVan={}
  for(let i=0;i<12;i++){
    const idx=mod12(menhIdx+chieu*i)
    const tu=cucSo+i*10
    daiVan[idx]=[tu,tu+9]
  }

  const cacCung={}
  for(let idx=0;idx<12;idx++){
    const ten=cungTen[idx]||''
    const isThan=idx===thanIdx
    cacCung[CHI_NAMES[idx]]={
      cung:ten, than:isThan, chi:CHI_NAMES[idx],
      sao:cung[idx], daiVan:daiVan[idx],
      tuan:tuan.has(idx), triet:triet.has(idx),
    }
  }

  return {
    amLich:{ngay:amD,thang:amM,nam:amY},
    canChiNam:`${canNam} ${chiNam}`,
    amDuong:`${amDuong} ${gioiTinh}`,
    banMenh, cuc,
    menhCung:CHI_NAMES[menhIdx],
    thanCung:CHI_NAMES[thanIdx],
    thanCu:cungTen[thanIdx]||'',
    gioiTinh,
    cacCung, menhIdx, thanIdx,
  }
}

// Quy đổi giờ đồng hồ (0-23) → index giờ âm lịch
export function gioToIndex(hour) {
  // Tý: 23-1, Sửu 1-3, ... mỗi 2h
  if (hour === 23 || hour === 0) return 0
  return Math.floor((hour + 1) / 2) % 12
}

export { GIO_INFO, CHI_NAMES }
