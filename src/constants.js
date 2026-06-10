export const GIO_SINH = [
  ['Tý',   'Giờ Tý   (23h – 0h59)'],
  ['Sửu',  'Giờ Sửu  (1h  – 2h59)'],
  ['Dần',  'Giờ Dần  (3h  – 4h59)'],
  ['Mão',  'Giờ Mão  (5h  – 6h59)'],
  ['Thìn', 'Giờ Thìn (7h  – 8h59)'],
  ['Tỵ',   'Giờ Tỵ   (9h  – 10h59)'],
  ['Ngọ',  'Giờ Ngọ  (11h – 12h59)'],
  ['Mùi',  'Giờ Mùi  (13h – 14h59)'],
  ['Thân', 'Giờ Thân (15h – 16h59)'],
  ['Dậu',  'Giờ Dậu  (17h – 18h59)'],
  ['Tuất', 'Giờ Tuất (19h – 20h59)'],
  ['Hợi',  'Giờ Hợi  (21h – 22h59)'],
]

export const CUNGS = [
  'Mệnh','Huynh Đệ','Phu Thê','Tử Tức',
  'Tài Bạch','Tật Ách','Thiên Di','Nô Bộc',
  'Quan Lộc','Điền Trạch','Phúc Đức','Phụ Mẫu',
]

export const STEPS = ['info','upload','verify','analyzing','result']
export const STEP_LABELS = ['Thông tin','Lá số','Xác nhận','Phân tích','Kết quả']

export const SECTIONS = [
  { k: 'phan1', l: 'Cốt cách nội tâm',    i: '🧠' },
  { k: 'phan2', l: 'Sự nghiệp tài lộc',   i: '💼' },
  { k: 'phan3', l: 'Gia đạo hôn nhân',    i: '👨‍👩‍👧' },
  { k: 'phan4', l: 'Sức khỏe vận hạn',    i: '⚕️' },
  { k: 'phan5', l: 'Chiến lược cải mệnh', i: '🎯' },
]

export const EXTRACT_PROMPT = (info) => `Đọc lá số Tử Vi trong ảnh/file này. Trả về JSON thuần (không markdown, không giải thích thêm):
{
  "amLich":{"nam":"","thang":"","ngay":"","gio":""},
  "canChi":{"nam":"","thang":"","ngay":"","gio":""},
  "menhCung":{"cung":"","chi":""},
  "thanCung":{"cung":"","chi":""},
  "cuc":"","banMenh":"","menhChu":"","thanChu":"","amDuong":"","tuoi":"","namXem":"",
  "cacCung":{
    "Mệnh":{"chi":"","hanh":"","sao":[]},"Huynh Đệ":{"chi":"","hanh":"","sao":[]},
    "Phu Thê":{"chi":"","hanh":"","sao":[]},"Tử Tức":{"chi":"","hanh":"","sao":[]},
    "Tài Bạch":{"chi":"","hanh":"","sao":[]},"Tật Ách":{"chi":"","hanh":"","sao":[]},
    "Thiên Di":{"chi":"","hanh":"","sao":[]},"Nô Bộc":{"chi":"","hanh":"","sao":[]},
    "Quan Lộc":{"chi":"","hanh":"","sao":[]},"Điền Trạch":{"chi":"","hanh":"","sao":[]},
    "Phúc Đức":{"chi":"","hanh":"","sao":[]},"Phụ Mẫu":{"chi":"","hanh":"","sao":[]}
  }
}
Thông tin đã biết: ${info.hoTen}, ${info.ngaySinh}, giờ ${info.gioSinh}, ${info.gioiTinh}.`

export const ANALYZE_PROMPT = (info, ls) => `Bạn là chuyên gia Tử Vi Việt Nam. Phân tích lá số và trả về JSON 100 mục (KHÔNG markdown, chỉ JSON thuần):

THÔNG TIN: ${info.hoTen} | ${info.ngaySinh} | Giờ ${info.gioSinh} | ${info.gioiTinh}
Âm lịch: ${ls.amLich?.ngay}/${ls.amLich?.thang}/${ls.amLich?.nam} | Cục: ${ls.cuc} | Bản mệnh: ${ls.banMenh}
Mệnh chủ: ${ls.menhChu} | Thân chủ: ${ls.thanChu} | Âm dương: ${ls.amDuong}
Mệnh: ${ls.menhCung?.cung} tại ${ls.menhCung?.chi} | Thân: ${ls.thanCung?.cung} tại ${ls.thanCung?.chi}
Tuổi: ${ls.tuoi} | Năm xem: ${ls.namXem}
12 CUNG: ${JSON.stringify(ls.cacCung)}

JSON BẮT BUỘC:
{
  "phan1":{"title":"Chân Dung Cốt Cách & Nội Tâm","muc":[
    {"so":1,"ten":"Hé lộ Cục diện Mệnh bàn","diem":8,"tags":["sao liên quan"],
     "noidung":"Phân tích 2-3 đoạn chi tiết, thẳng thắn, dựa hoàn toàn vào sao và cung. Có quan điểm rõ ràng.",
     "loiKhuyen":"Lời khuyên hành động cụ thể, thực tế"}
    ...mục 2-20
  ]},
  "phan2":{"title":"Sự Nghiệp, Tài Lộc & Vị Thế Xã Hội","muc":[...mục 21-50]},
  "phan3":{"title":"Hệ Thống Gia Đạo & Huyết Thống","muc":[...mục 51-70]},
  "phan4":{"title":"Sức Khỏe & Dòng Thời Gian Vận Hạn","muc":[...mục 71-90]},
  "phan5":{"title":"Tổng Luận & Chiến Lược Cải Mệnh","muc":[...mục 91-100]},
  "tongQuan":{
    "sucNghiep":8,"taiLoc":7,"tinhDuyen":6,"giaDao":7,"sucKhoe":7,
    "giaiDoanVang":"43-52 tuổi","diemManhNhat":"...","diemYeuNhat":"...","tomluat":"Câu tổng kết ngắn gọn"
  }
}

QUAN TRỌNG: Thẳng thắn, có quan điểm rõ ràng, lời khuyên thực tế, dựa hoàn toàn vào lá số.`
