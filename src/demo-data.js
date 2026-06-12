// demo-data.js — Dữ liệu mẫu để test giao diện nhanh, không gọi API
import { SECTIONS } from './constants'

function fakeMuc(so) {
  return {
    so,
    ten: `Mục mẫu số ${so} — Tiêu đề luận giải`,
    diem: ((so * 7) % 10) + 1,
    tags: ['Tử Vi', 'Thiên Phủ', 'Hóa Lộc'],
    noidung: `Đây là nội dung luận giải mẫu cho mục ${so}. Dùng để kiểm tra hiển thị giao diện, bố cục, và xuất PDF mà không cần gọi API thật. Nội dung này đủ dài để mô phỏng một đoạn phân tích thực tế, giúp căn chỉnh khoảng cách dòng, lề, và cách xuống dòng trong thẻ hiển thị kết quả.`,
    loiKhuyen: `Lời khuyên mẫu cho mục ${so}: giữ tinh thần tích cực và hành động cụ thể.`,
    canhBao: so % 3 === 0 ? `Cảnh báo mẫu cho mục ${so}.` : '',
  }
}

const RANGES = {
  phan1: [1, 20],
  phan2: [21, 50],
  phan3: [51, 70],
  phan4: [71, 90],
  phan5: [91, 100],
}

export function buildDemoResult() {
  const result = {}
  for (const sec of SECTIONS) {
    const [from, to] = RANGES[sec.k]
    const muc = []
    for (let i = from; i <= to; i++) muc.push(fakeMuc(i))
    result[sec.k] = { title: sec.l, muc }
  }
  result.tongQuan = {
    sucNghiep: 8, taiLoc: 7, tinhDuyen: 6, giaDao: 7, sucKhoe: 8,
    giaiDoanVang: 'Giai đoạn 30–39 tuổi là thời kỳ phát triển mạnh nhất.',
    diemManhNhat: 'Tư duy chiến lược và khả năng xây dựng nền tảng bền vững.',
    diemYeuNhat: 'Xu hướng suy nghĩ quá nhiều dẫn đến chậm quyết định.',
    tomluat: 'Người có nội lực sâu, cần học cách hành động dứt khoát hơn.',
    thongDiepNam: 'Năm nay là thời điểm tốt để củng cố và mở rộng.',
  }
  return result
}