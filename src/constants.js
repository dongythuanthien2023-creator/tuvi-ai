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

export const STEPS = ['info','verify','analyzing','result']
export const STEP_LABELS = ['Thông tin','Lá số','Phân tích','Kết quả']

export const SECTIONS = [
  { k: 'phan1', l: 'Cốt cách & Nội tâm',      i: '🧠' },
  { k: 'phan2', l: 'Sự nghiệp & Tài lộc',      i: '💼' },
  { k: 'phan3', l: 'Tình duyên & Gia đạo',      i: '❤️' },
  { k: 'phan4', l: 'Sức khỏe & Vận hạn',        i: '⚕️' },
  { k: 'phan5', l: 'Định hướng & Hành động',    i: '🎯' },
]


// ── Context dùng chung cho mọi phần ─────────────────────────────────────────
const fmt12Cung = (ls) => {
  const order = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi']
  return order.map(chi => {
    const c = ls.cacCung[chi]
    if (!c) return ''
    let flags = []
    if (c.than) flags.push('Thân cư đây')
    if (c.tuan) flags.push('Tuần')
    if (c.triet) flags.push('Triệt')
    const dv = c.daiVan ? ` [Đại vận ${c.daiVan[0]}-${c.daiVan[1]} tuổi]` : ''
    const fl = flags.length ? ` (${flags.join(', ')})` : ''
    return `- ${c.cung} tại ${chi}${fl}${dv}: ${c.sao.join(', ')}`
  }).filter(Boolean).join('\n')
}

const LASO_CONTEXT = (info, ls) => `THÔNG TIN KHÁCH: ${info.hoTen} | Giới tính: ${info.gioiTinh} | Năm xem: ${info.namXem||new Date().getFullYear()}
Âm lịch: ${ls.amLich.ngay}/${ls.amLich.thang}/${ls.amLich.nam} | Can Chi: ${ls.canChiNam}
Âm dương: ${ls.amDuong} | Bản mệnh: ${ls.banMenh} | Cục: ${ls.cuc}
Mệnh tại ${ls.menhCung} | Thân cư cung ${ls.thanCu} (${ls.thanCung})

CHÚ GIẢI TRẠNG THÁI CHÍNH TINH — ký hiệu trong ngoặc ngay sau tên sao:
(M) = Miếu: sao ở vị trí mạnh nhất, phát huy tối đa, rất tốt.
(V) = Vượng: sao mạnh, tốt.
(Đ) = Đắc địa: sao khá, phát huy được.
(B) = Bình hòa: trung bình.
(H) = Hãm địa: sao yếu, kém phát huy, dễ lộ mặt xấu.
Sao KHÔNG có ký hiệu là sao phụ — không xét miếu/vượng/hãm.
BẮT BUỘC luận giải đúng theo ký hiệu này. Đây là dữ liệu chính xác từ engine lá số. TUYỆT ĐỐI KHÔNG tự suy diễn hay áp đặt trạng thái sao theo trí nhớ hoặc kiến thức nền — chỉ dùng đúng ký hiệu đã cho. Ví dụ: nếu ghi 'Thái Dương (M)' thì phải luận là Thái Dương Miếu (tốt), KHÔNG được viết là hãm.

CHI TIẾT 12 CUNG (kèm sao và đại vận):
${fmt12Cung(ls)}`

const PHONG_CACH = `YÊU CẦU PHONG CÁCH:
- BẮT BUỘC viết HOÀN TOÀN bằng tiếng Việt thuần. TUYỆT ĐỐI KHÔNG chèn từ tiếng Anh hay bất kỳ ngoại ngữ nào vào nội dung. Mọi khái niệm phải dùng từ tiếng Việt (ví dụ: 'phục hồi' không 'heal', 'chuyển hóa' không 'transform', 'tiến về phía trước' không 'moving forward'). Nếu một thuật ngữ chuyên môn bắt buộc phải có, ghi tiếng Việt trước rồi mở ngoặc tiếng Anh.
- Ngôn ngữ gần gũi, dễ hiểu, phù hợp người trẻ 20-35 tuổi — KHÔNG dùng văn phong cổ điển khô khan
- Mỗi mục: luận giải từ SAO + CUNG cụ thể → liên hệ thực tế cuộc sống người trẻ hôm nay
- Lời khuyên PHẢI cụ thể, thực hiện được ngay — không chung chung
- Khi liên quan sức khỏe: tích hợp góc nhìn Y học cổ truyền (ngũ hành, tạng phủ, thực dưỡng)
- Điểm mạnh nói thẳng để tự tin; điểm yếu nói thật nhưng kèm hướng khắc phục
- Mỗi mục viết 3-4 đoạn có chiều sâu, có ví dụ thực tế`

const MUC_FORMAT = `QUAN TRỌNG VỀ JSON: Toàn bộ output PHẢI là JSON hợp lệ. Trong nội dung các chuỗi, TUYỆT ĐỐI KHÔNG dùng dấu ngoặc kép " — nếu cần nhấn mạnh hãy dùng dấu ngoặc đơn '. KHÔNG xuống dòng thật bên trong chuỗi, viết liền mạch. KHÔNG thêm dấu phẩy thừa sau phần tử cuối của mảng.

Mỗi mục có cấu trúc: {"so":<số>,"ten":"<tên mục>","diem":<1-10>,"tags":["sao liên quan"],"noidung":"<3-4 đoạn phân tích chi tiết>","loiKhuyen":"<lời khuyên cụ thể>","canhBao":"<rủi ro cần tránh, để trống nếu không có>"}`

// ── PHẦN 1: Mục 1-20 ────────────────────────────────────────────────────────
export const PROMPT_PHAN1 = (info, ls) => `Bạn là chuyên gia Tử Vi kết hợp Y học cổ truyền. Phân tích PHẦN 1 (Cốt Cách & Nội Tâm) cho lá số sau.

${LASO_CONTEXT(info, ls)}

${PHONG_CACH}

Trả về JSON thuần (KHÔNG markdown):
{"title":"Cốt Cách & Nội Tâm","muc":[ ... 20 mục ... ]}
${MUC_FORMAT}

DANH SÁCH 20 MỤC:
1. Tổng quan Cục diện — Bạn là kiểu người như thế nào?
2. Ngoại hình & Khí chất — Ấn tượng đầu tiên bạn tạo ra
3. Điểm mạnh tính cách — Những gì bạn làm tốt hơn 90% người khác
4. Điểm yếu tính cách — Những gì đang âm thầm kéo bạn lại
5. Trí tuệ & Tư duy — Bạn học và xử lý thông tin kiểu nào
6. Năng khiếu bẩm sinh — Tài năng tiềm ẩn chưa được khai thác
7. Thế giới nội tâm — Cảm xúc và nỗi sợ sâu nhất của bạn
8. Động lực sống — Điều gì thực sự thôi thúc bạn mỗi ngày
9. Giá trị cốt lõi — Bạn coi trọng điều gì nhất trong cuộc đời
10. Chỉ số AQ — Khả năng vượt khó và phục hồi sau thất bại
11. Thói quen tư duy — Bẫy suy nghĩ thường gặp của bạn
12. Mối quan hệ với bản thân — Bạn yêu thương hay khắt khe với chính mình?
13. Trực giác & Linh cảm — Bạn có nên tin vào "cảm giác ruột"?
14. Khả năng thích nghi — Bạn xử lý thay đổi và bất ngờ thế nào?
15. Bản sắc cá nhân — Điều gì làm bạn khác biệt với đám đông
16. Vận mệnh Ngũ hành — Năng lượng chủ đạo và những gì cần bổ sung
17. Mệnh chủ & Thân chủ — Hai sức mạnh định hình cuộc đời bạn
18. Tương quan Mệnh – Cục — Thuận hay nghịch, và ý nghĩa với cuộc sống
19. Phúc đức tiền định — Nền tảng tâm linh và nghiệp quả
20. Hình mẫu lý tưởng — Phiên bản tốt nhất của chính bạn`

// ── PHẦN 2: Mục 21-50 ───────────────────────────────────────────────────────
export const PROMPT_PHAN2 = (info, ls) => `Bạn là chuyên gia Tử Vi kết hợp Y học cổ truyền. Phân tích PHẦN 2 (Sự Nghiệp & Tài Lộc) cho lá số sau.

${LASO_CONTEXT(info, ls)}

${PHONG_CACH}

Trả về JSON thuần (KHÔNG markdown):
{"title":"Sự Nghiệp & Tài Lộc","muc":[ ... 30 mục ... ]}
${MUC_FORMAT}

DANH SÁCH 30 MỤC:
21. Lĩnh vực phù hợp nhất — Bạn sinh ra để làm gì?
22. Phong cách làm việc — Bạn hiệu quả nhất trong môi trường nào?
23. Năng lực lãnh đạo — Bạn có khả năng dẫn dắt người khác không?
24. Khả năng sáng tạo — Tư duy đột phá hay thực thi xuất sắc?
25. Kỹ năng giao tiếp & thuyết phục — Sức mạnh ngôn ngữ của bạn
26. Năng lực học hỏi & phát triển — Bạn tiến bộ nhanh ở lĩnh vực nào?
27. Quan hệ với cấp trên — Bạn nên chọn sếp như thế nào?
28. Quan hệ với đồng nghiệp — Ai là đồng minh, ai là rủi ro?
29. Môi trường làm việc lý tưởng — Công ty lớn, startup hay tự kinh doanh?
30. Thời điểm bứt phá sự nghiệp — Khi nào nên đẩy mạnh?
31. Rủi ro nghề nghiệp — Những cạm bẫy sự nghiệp cần tránh
32. Tiềm năng khởi nghiệp — Bạn có phù hợp làm chủ không?
33. Nguồn thu nhập chính — Tiền đến từ đâu trong cuộc đời bạn?
34. Tốc độ tích lũy tài chính — Bạn giàu nhanh hay chậm?
35. Thói quen chi tiêu — Bạn tiêu tiền thông minh hay bốc đồng?
36. Khả năng đầu tư — Bạn nên đầu tư vào kênh nào?
37. Vận may tài chính — Hoạnh tài, thừa kế, may mắn bất ngờ
38. Điền sản & Bất động sản — Thời điểm và khả năng sở hữu nhà đất
39. Rủi ro tài chính — Những cạm bẫy tiền bạc cần phòng ngừa
40. Tài lộc năm ${info.namXem||new Date().getFullYear()} — Dự báo tài chính năm nay cụ thể
41. Sự nghiệp năm ${info.namXem||new Date().getFullYear()} — Cơ hội và thách thức công việc năm nay
42. Quý nhân phù trợ — Ai sẽ giúp bạn tiến lên trong sự nghiệp?
43. Tiểu nhân & kẻ thù — Ai cần đề phòng trong môi trường làm việc?
44. Xuất ngoại & cơ hội xa nhà — Bạn có lợi khi đi xa không?
45. Danh tiếng & Thương hiệu cá nhân — Người khác nhìn bạn như thế nào?
46. Khả năng thăng tiến — Bạn sẽ lên đến vị trí nào?
47. Hợp tác kinh doanh — Bạn nên hùn vốn với ai và khi nào?
48. Đại vận hiện tại — Giai đoạn này đang ở đâu trên hành trình?
49. Giai đoạn vàng sự nghiệp — Khi nào bạn đạt đỉnh cao nhất?
50. Chiến lược tài chính 5 năm — Bạn nên ưu tiên gì từ bây giờ?`

// ── PHẦN 3: Mục 51-70 ───────────────────────────────────────────────────────
export const PROMPT_PHAN3 = (info, ls) => `Bạn là chuyên gia Tử Vi kết hợp Y học cổ truyền. Phân tích PHẦN 3 (Tình Duyên & Gia Đạo) cho lá số sau.

${LASO_CONTEXT(info, ls)}

${PHONG_CACH}

Trả về JSON thuần (KHÔNG markdown):
{"title":"Tình Duyên & Gia Đạo","muc":[ ... 20 mục ... ]}
${MUC_FORMAT}

DANH SÁCH 20 MỤC:
51. Tổng quan duyên phận — Bạn có duyên hay nợ với tình cảm?
52. Kiểu người bạn hút vào cuộc đời — Đối tượng thường tìm đến bạn
53. Kiểu người phù hợp nhất — Người như thế nào mới là "đúng người"?
54. Phong cách yêu — Bạn yêu như thế nào, cần gì trong tình yêu?
55. Điểm thu hút — Bạn hấp dẫn người khác ở điểm nào?
56. Điểm gây khó khăn trong tình yêu — Thói quen vô thức làm hỏng mối quan hệ
57. Thời điểm gặp "đúng người" — Khi nào duyên chính thức đến?
58. Hôn nhân — Chất lượng cuộc sống hôn nhân của bạn
59. Người bạn đời — Người đó trông như thế nào về tính cách và cuộc sống?
60. Thách thức hôn nhân — Những giai đoạn sóng gió cần chuẩn bị
61. Tình duyên năm ${info.namXem||new Date().getFullYear()} — Dự báo cụ thể về tình cảm năm nay
62. Con cái — Duyên phận và mối quan hệ với con
63. Tính cách & tương lai con cái — Con bạn sẽ là người như thế nào?
64. Quan hệ cha mẹ — Bạn và cha mẹ có mối dây như thế nào?
65. Quan hệ anh chị em — Sự trợ lực hay gánh nặng?
66. Gia đình gốc — Ảnh hưởng của gia đình đến cuộc đời bạn
67. Gia đình riêng — Mô hình gia đình bạn sẽ xây dựng
68. Mối quan hệ xã hội — Bạn bè, mạng lưới và chất lượng các mối quan hệ
69. Kẻ thù & Mâu thuẫn — Những xung đột tiềm ẩn trong cuộc đời
70. Tình cảm & Hạnh phúc tổng thể — Bạn có được yêu thương đúng nghĩa không?`

// ── PHẦN 4: Mục 71-90 ───────────────────────────────────────────────────────
export const PROMPT_PHAN4 = (info, ls) => `Bạn là chuyên gia Tử Vi kết hợp Y học cổ truyền. Phân tích PHẦN 4 (Sức Khỏe & Vận Hạn) cho lá số sau.

${LASO_CONTEXT(info, ls)}

${PHONG_CACH}

Trả về JSON thuần (KHÔNG markdown):
{"title":"Sức Khỏe & Vận Hạn","muc":[ ... 20 mục ... ]}
${MUC_FORMAT}

DANH SÁCH 20 MỤC:
71. Thể chất tổng thể — Sức khỏe bẩm sinh và nội lực cơ thể
72. Hệ tạng yếu nhất — Theo ngũ hành YHCT, tạng nào cần chú ý?
73. Bệnh mãn tính tiềm ẩn — Nguy cơ sức khỏe dài hạn cần phòng ngừa
74. Sức khỏe tâm thần — Căng thẳng, lo âu và sức khỏe tinh thần
75. Chế độ ăn theo ngũ hành — Thực phẩm nên ăn và nên tránh cho lá số này
76. Vận động & Luyện tập — Hình thức tập luyện phù hợp nhất
77. Giấc ngủ & Phục hồi — Nhịp sinh học và cách nạp năng lượng
78. Cảnh báo tai nạn & Rủi ro ngoại cảnh — Thời điểm và hoàn cảnh cần cẩn thận
79. Phương pháp YHCT phù hợp — Châm cứu, thảo dược, dưỡng sinh nào hiệu quả nhất?
80. Sức khỏe năm ${info.namXem||new Date().getFullYear()} — Dự báo sức khỏe cụ thể năm nay
81. Tiền vận (đến nay) — Nhìn lại hành trình từ nhỏ đến hiện tại
82. Đại vận hiện tại — Đang ở đâu, cơ hội và thách thức chính
83. Vận hạn 3 năm tới — Dự báo ${parseInt(info.namXem||new Date().getFullYear())||2026}–${(parseInt(info.namXem||new Date().getFullYear())||2026)+2}
84. Năm ${info.namXem||new Date().getFullYear()} chi tiết — Tháng nào tốt, tháng nào cần cẩn thận?
85. Tam tai & Xung hạn — Những năm cần đặc biệt thận trọng
86. Năm hoàng kim gần nhất — Khi nào vận khí đạt đỉnh?
87. Hậu vận — Cuộc sống sau 50 tuổi sẽ như thế nào?
88. Tuổi thọ & Chất lượng sống — Triển vọng sức khỏe dài hạn
89. Phong thủy & Không gian sống — Hướng nhà, màu sắc, số phù hợp
90. Màu sắc & Con số may mắn — Ứng dụng thực tế trong cuộc sống hàng ngày`

// ── PHẦN 5: Mục 91-100 + Tổng Quan ──────────────────────────────────────────
export const PROMPT_PHAN5 = (info, ls) => `Bạn là chuyên gia Tử Vi kết hợp Y học cổ truyền. Phân tích PHẦN 5 (Định Hướng & Hành Động) + TỔNG QUAN cho lá số sau.

${LASO_CONTEXT(info, ls)}

${PHONG_CACH}

Trả về JSON thuần (KHÔNG markdown), gồm 10 mục VÀ phần tongQuan:
{"title":"Định Hướng & Hành Động","muc":[ ... 10 mục ... ],"tongQuan":{"sucNghiep":<1-10>,"taiLoc":<1-10>,"tinhDuyen":<1-10>,"giaDao":<1-10>,"sucKhoe":<1-10>,"giaiDoanVang":"<mô tả ngắn>","diemManhNhat":"<1 câu>","diemYeuNhat":"<1 câu>","tomluat":"<1 câu tổng kết đặc trưng nhất>","thongDiepNam":"<thông điệp quan trọng nhất cho năm ${info.namXem||new Date().getFullYear()}>"}}
${MUC_FORMAT}

DANH SÁCH 10 MỤC:
91. Sứ mệnh cuộc đời — Bạn đến thế gian này để làm gì?
92. Bài học nghiệp quả — Bạn cần học gì trong kiếp này?
93. Điểm mạnh tối thượng — Vũ khí mạnh nhất của bạn là gì?
94. Điểm yếu chí mạng — Điều gì có thể phá hủy tất cả nếu không khắc phục?
95. Lộ trình 1 năm — Việc quan trọng nhất cần làm trong 12 tháng tới
96. Lộ trình 3 năm — Các cột mốc cần đạt trong 3 năm tới
97. Lộ trình 5 năm — Bức tranh lớn và chiến lược dài hạn
98. Quý nhân cần tìm — Kiểu người nào sẽ thay đổi cuộc đời bạn?
99. Cải mệnh & Tu dưỡng — Thực hành cụ thể để cải thiện vận khí
100. Thông điệp quan trọng nhất — Một điều bạn nhất định phải nhớ từ lần đọc này`
