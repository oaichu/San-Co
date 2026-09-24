import type { Lesson } from "./types";

const N = 15; // caro board
const c = (r: number, col: number) => r * N + col; // caro cell
const x = (r: number, col: number) => r * 9 + col; // xiangqi point
const g = (r: number, col: number) => r * 19 + col; // go point

export const LESSONS: Lesson[] = [
  /* ============ CỜ CARO ============ */
  {
    id: "caro-luat", game: "caro", order: 1, title: "Luật chơi & cách thắng", sub: "Đúng 5 quân liên tiếp — không hơn, không kém",
    blocks: [
      { t: "text", md: "Cờ caro chơi trên bàn 15×15 (ở đây dùng ô vuông, ngoài đời hay đánh trên giao điểm giấy kẻ ô). Hai người lần lượt đặt quân X và O vào ô trống. Người đi trước là X.\n\n**Luật phổ thông Việt Nam**: thắng khi tạo được **đúng 5 quân liên tiếp** theo hàng ngang, dọc hoặc chéo. Hai điểm quan trọng:\n\n- **Quá 5 không thắng** — 6 quân liên tiếp không được tính.\n- **Chặn hai đầu** — 5 quân bị đối thủ chặn kín cả hai đầu không thắng." },
      { t: "demo", note: "X thắng bằng hàng ngang đúng 5 quân", setup: { moves: [] }, moves: [c(7, 3), c(0, 0), c(7, 4), c(0, 1), c(7, 5), c(0, 2), c(7, 6), c(0, 3), c(7, 7)] },
      { t: "try", prompt: "Bạn cầm X, đi nước cuối để thắng ngay.", setup: { moves: [c(7, 3), c(0, 0), c(7, 4), c(0, 1), c(7, 5), c(0, 2), c(7, 6), c(0, 3)] }, solution: c(7, 7), hint: "X đang có 4 quân liền nhau ở hàng 8." },
      { t: "text", md: "Cẩn thận: nếu hai đầu của hàng 5 đều bị chặn (bởi quân địch hoặc mép bàn), bạn **không** thắng. Vì vậy khi tấn công, hãy giữ ít nhất một đầu mở." },
    ],
  },
  {
    id: "caro-tan-cong", game: "caro", order: 2, title: "Tấn công: mở 3 và mở 4", sub: "Đòn hai đầu mở — đối thủ không chặn kịp",
    blocks: [
      { t: "text", md: "Sức mạnh của caro nằm ở **đầu mở**. Một hàng 3 quân mở cả hai đầu (gọi là *mở 3 sống*) buộc đối thủ phải chặn ngay — nếu không nước sau bạn có 4 mở hai đầu và không còn cách cứu.\n\nNguyên tắc: **tấn công từ đầu ván, đừng chỉ chặn**. Người mới thường đi theo chặn đối thủ và thua vì không tạo được thế riêng." },
      { t: "demo", note: "X xây hai hướng đe dọa: chéo (5,5)-(7,7) và ngang hàng 8 — O không chặn nổi cả hai", setup: { moves: [c(7, 7), c(6, 7), c(7, 6), c(8, 8)] }, moves: [c(6, 6), c(8, 7), c(5, 5)] },
      { t: "try", prompt: "X đang có 3 quân (7,6) (7,7) (7,5). Đánh đâu để tạo mở 4?", setup: { moves: [c(7, 5), c(0, 0), c(7, 6), c(0, 1), c(7, 7), c(14, 14)] }, solution: c(7, 4), hint: "Nối dài hàng ngang về phía còn trống." },
      { t: "text", md: "**Mở 4 sống** (4 quân hai đầu mở) = thắng chắc chắn nước sau, đối thủ chặn một đầu thì bạn đánh đầu kia. Toàn bộ nghệ thuật tấn công caro là tạo ra mở 4 sống hoặc hai mối đe dọa cùng lúc." },
    ],
  },
  {
    id: "caro-phong-thu", game: "caro", order: 3, title: "Phòng thủ: chặn đúng đầu", sub: "Đọc mối đe dọa trước khi đánh",
    blocks: [
      { t: "text", md: "Trước mỗi nước đi, hỏi: *đối thủ có đe dọa gì không?*\n\n- Địch có **4 quân một đầu mở** → phải chặn đầu mở ngay.\n- Địch có **3 quân hai đầu mở** → phải chặn, chọn đầu nào tùy thế trận.\n- Địch có 3 quân một đầu mở → có thể chờ, ưu tiên tấn công nếu bạn có đòn mạnh hơn." },
      { t: "try", prompt: "Đến lượt O (bạn) — X đang có 4 quân liền ở hàng trên cùng, một đầu là mép bàn. Phải chặn ngay đầu còn lại!", setup: { moves: [c(0, 1), c(7, 7), c(0, 2), c(7, 8), c(0, 3), c(7, 9), c(0, 4), c(7, 6), c(5, 0)] }, solution: c(0, 5), hint: "X có 4 quân (0,1)-(0,4). Đầu mở duy nhất nằm đâu?" },
      { t: "text", md: "Mẹo chọn đầu chặn: chặn phía **ít lợi cho đối thủ hơn** — đầu nào mà sau khi chặn, quân của bạn còn nằm trên đường tấn công của mình hoặc cắt đường phát triển của địch." },
    ],
  },
  {
    id: "caro-don-bay", game: "caro", order: 4, title: "Đòn bẫy: hai mối đe dọa", sub: "Một nước tạo hai hàng 3 — đối thủ không chặn hết",
    blocks: [
      { t: "text", md: "Đòn mạnh nhất trong caro là **nước đôi**: đặt một quân tạo đồng thời hai mối đe dọa (hai mở 3, hoặc mở 3 + mở 4). Đối thủ chỉ chặn được một — nước sau bạn thắng.\n\nĐây là cách người giỏi thắng: không phải đánh nhanh hơn, mà **xây thế đôi** từ sớm." },
      { t: "demo", note: "X vừa đặt quân tạo mở 3 ngang + mở 3 chéo — O không chặn được cả hai", setup: { moves: [c(7, 7), c(0, 0), c(6, 6), c(0, 1), c(8, 8), c(0, 2), c(7, 5)] }, moves: [] },
      { t: "text", md: "Luyện mắt nhìn giao điểm: khi hai hàng quân của bạn sắp cắt nhau ở một ô trống, ô đó thường là nước đôi. Ngược lại, cũng phải đề phòng đối thủ có nước như vậy — đừng để hai hàng địch cùng 'chĩa' vào một ô." },
    ],
  },

  /* ============ CỜ VUA ============ */
  {
    id: "chess-quan-co", game: "chess", order: 1, title: "Quân cờ và cách đi", sub: "6 loại quân, mỗi quân một đường đi riêng",
    blocks: [
      { t: "text", md: "Bàn cờ vua 8×8, mỗi bên 16 quân. **Trắng đi trước.**\n\n- **Tốt (♟)**: đi thẳng 1 ô, nước đầu được đi 2 ô; **ăn chéo** 1 ô. Tới hàng cuối thì phong cấp (thường phong Hậu).\n- **Mã (♞)**: đi hình chữ L (2+1), **nhảy qua quân**.\n- **Tượng (♝)**: đi chéo xa tùy ý, mỗi tượng chỉ đi một màu ô.\n- **Xe (♜)**: đi ngang/dọc xa tùy ý.\n- **Hậu (♛)**: đi ngang, dọc, chéo — mạnh nhất bàn cờ (9 điểm).\n- **Vua (♚)**: đi mọi hướng 1 ô; không được tự đi vào ô bị chiếu." },
      { t: "demo", note: "Mã trắng nhảy chữ L qua hàng quân", setup: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" }, moves: ["Nf3", "e5", "Nd4"] },
      { t: "text", md: "Giá trị tham khảo: Tốt 1 — Mã 3 — Tượng 3 — Xe 5 — Hậu 9. Đổi quân chỉ nên đổi ngang hoặc có lợi. Đổi Mã lấy Xe là lời, đổi Hậu lấy Tượng là lỗ (trừ khi có chiếu hết)." },
    ],
  },
  {
    id: "chess-dac-biet", game: "chess", order: 2, title: "Nhập thành & bắt tốt qua đường", sub: "Hai nước đặc biệt hay bị quên",
    blocks: [
      { t: "text", md: "**Nhập thành** là nước duy nhất đi hai quân: Vua sang ngang 2 ô, Xe nhảy qua đặt cạnh Vua. Điều kiện:\n\n- Vua và Xe chưa từng di chuyển\n- Không có quân cản giữa\n- Vua **không đang bị chiếu**, và không đi qua ô bị địch kiểm soát\n\nNhập thành sớm đưa Vua vào góc an toàn và đưa Xe ra trung tâm — nên làm trong 10 nước đầu." },
      { t: "demo", note: "Trắng nhập thành cánh vua (O-O)", setup: { fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" }, moves: ["O-O"] },
      { t: "text", md: "**Bắt tốt qua đường (en passant)**: khi tốt địch đi 2 ô và dừng ngang hàng tốt của bạn, ngay nước sau bạn được ăn chéo qua ô nó vừa nhảy — như thể nó chỉ đi 1 ô. Chỉ hợp lệ **đúng một nước** sau khi địch đi." },
    ],
  },
  {
    id: "chess-chieu-het", game: "chess", order: 3, title: "Chiếu, chiếu hết, hòa", sub: "Mục tiêu của ván cờ là Vua",
    blocks: [
      { t: "text", md: "- **Chiếu**: Vua đang bị tấn công — bắt buộc phải thoát (chạy Vua, chặn, hoặc ăn quân chiếu).\n- **Chiếu hết**: bị chiếu mà không có nước hợp lệ → **thua**.\n- **Hết nước nhưng không bị chiếu** → hòa (stalemate).\n- Hòa cũng xảy ra khi: thế lặp 3 lần, 50 nước không ăn quân/đi tốt, hoặc không đủ lực chiếu hết." },
      { t: "demo", note: "Chiếu hết hàng cuối kinh điển — hậu e8, vua đen kẹt sau 3 tốt", setup: { fen: "6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1" }, moves: [{ from: "e1", to: "e8" }] },
      { t: "try", prompt: "Trắng đi — chiếu hết trong 1 nước. Hậu trắng ở e1, vua đen g8 kẹt sau hàng tốt.", setup: { fen: "6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1" }, solution: { from: "e1", to: "e8" }, hint: "Đưa Hậu xuống hàng cuối." },
    ],
  },
  {
    id: "chess-chien-thuat", game: "chess", order: 4, title: "Chiến thuật: gaffe, ghim, xiên", sub: "Ba đòn cơ bản hái quân địch",
    blocks: [
      { t: "text", md: "- **Gaffe (nĩa)**: một quân tấn công hai mục tiêu cùng lúc. Mã là vua nĩa — nó nhảy nên không bị chặn.\n- **Ghim (pin)**: quân địch không dám đi vì lộ quân quý phía sau (ghim tuyệt đối: phía sau là Vua → cấm đi luôn).\n- **Xiên (skewer)**: tấn công quân quý, nó chạy thì lộ quân phía sau bị ăn." },
      { t: "demo", note: "Mã trắng nhảy f7 — nĩa hậu d8 và xe f8", setup: { fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1" }, moves: ["Ng5", "O-O", "Nxf7"] },
      { t: "try", prompt: "Trắng đi: tượng f1 có nước ghim mã c6 vào vua e8. Tìm nước đó.", setup: { fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1" }, solution: { from: "f1", to: "b5" }, hint: "Tượng đi chéo — đặt tượng lên đường chéo mã c6, vua e8." },
      { t: "text", md: "Trước mỗi nước, quét nhanh: địch có nước nĩa/ghim/xiên không? Mình có không? Thói quen 5 giây này tránh 80% quân mất oan." },
    ],
  },

  /* ============ CỜ TƯỚNG ============ */
  {
    id: "xq-ban-co", game: "xiangqi", order: 1, title: "Bàn cờ, sông và cung", sub: "90 giao điểm, hai vùng đất, một cung tướng",
    blocks: [
      { t: "text", md: "Cờ tướng đặt quân trên **giao điểm** (không phải ô): 9 cột × 10 hàng = 90 điểm. Giữa bàn là **sông** chia hai vùng; mỗi bên có **cung tướng** 3×3 với hai đường chéo.\n\n**Đỏ đi trước.** Mỗi bên 16 quân: Tướng, 2 Sĩ, 2 Tượng, 2 Xe, 2 Mã, 2 Pháo, 5 Tốt.\n\n- Tướng, Sĩ: **không ra khỏi cung**\n- Tượng: **không qua sông**\n- Tốt: qua sông mới được đi ngang" },
      { t: "demo", note: "Xếp quân đầu ván — chú ý pháo không đứng hàng đầu", setup: { moves: [] }, moves: [] },
      { t: "text", md: "Luật đặc biệt quan trọng nhất: **hai Tướng không được nhìn mặt nhau** — không được để trống cột giữa hai tướng. Nước đi làm lộ mặt tướng là bất hợp lệ, và tướng có thể 'bay' ăn tướng địch nếu cột trống." },
    ],
  },
  {
    id: "xq-cach-di", game: "xiangqi", order: 2, title: "Cách đi từng quân", sub: "Chân mã, mắt tượng, ngòi pháo",
    blocks: [
      { t: "text", md: "- **Xe**: ngang dọc tùy ý — mạnh nhất (9 điểm).\n- **Mã**: chữ L giống cờ vua, NHƯNG bị **chặn chân**: ô kề theo hướng đi có quân thì không nhảy được.\n- **Tượng**: đi chéo đúng 2 điểm, không qua sông; điểm giữa có quân = **bít mắt**.\n- **Pháo**: đi như xe, nhưng **ăn quân phải nhảy qua đúng một ngòi** (bất kỳ quân nào).\n- **Tốt**: tiến 1; qua sông được đi ngang; không bao giờ lùi.\n- **Sĩ**: chéo 1 điểm, trong cung. **Tướng**: thẳng 1 điểm, trong cung." },
      { t: "demo", note: "Pháo đỏ nhảy qua ngòi (pháo đen 2,1) ăn mã đen — đúng 1 ngòi mới được ăn", setup: { moves: [] }, moves: [{ from: x(7, 1), to: x(0, 1) }] },
      { t: "try", prompt: "Đỏ đi: tốt (6,4) muốn tiến lên uy hiếp trung lộ. Đi tốt đỏ.", setup: { moves: [] }, solution: { from: x(6, 4), to: x(5, 4) }, hint: "Tốt đỏ chưa qua sông chỉ đi thẳng lên." },
    ],
  },
  {
    id: "xq-mat-tuong", game: "xiangqi", order: 3, title: "Tướng đối mặt & chiếu hết", sub: "Thắng khi địch không thoát chiếu",
    blocks: [
      { t: "text", md: "Chiếu tướng = tấn công Tướng địch. Địch phải gỡ chiếu ngay. Không gỡ được = **chiếu hết, thắng**.\n\nĐiểm khác cờ vua: **hết nước (bí) cũng thua**, không hòa. Và nhớ quy tắc mặt tướng: nhiều ván thắng nhờ cố tình để trống cột tướng, buộc địch không đi được quân chắn." },
      { t: "text", md: "Các thế chiếu hết kinh điển cần nhớ mặt: **trùng pháo** (hai pháo cùng cột, pháo sau làm ngòi — không chặn được), **mã hậu pháo** (mã chiếu, pháo bảo vệ mã từ sau), **thiên địa pháo** (pháo trung lộ + pháo đáy khóa cung). Khai cuộc nên: phát triển Xe sớm (quân mạnh nhất), đừng đi một quân nhiều lần, giữ Sĩ-Tượng hoàn chỉnh để thủ cung." },
    ],
  },

  /* ============ CỜ VÂY ============ */
  {
    id: "go-khi", game: "go", order: 1, title: "Khí và bắt quân", sub: "Quân sống nhờ khí — hết khí là bị bắt",
    blocks: [
      { t: "text", md: "Cờ vây đặt quân trên giao điểm 19×19. **Đen đi trước**, trắng được cộng 6.5 điểm (komi).\n\n**Khí** = điểm trống kề trực tiếp (ngang/dọc, không chéo). Quân liền nhau cùng màu tính là **một nhóm**, chia sẻ khí. Nhóm hết khí → bị bắt, nhấc khỏi bàn.\n\nKhông được đi nước **tự sát** (đặt vào chỗ hết khí) — trừ khi nước đó bắt được quân địch." },
      { t: "demo", note: "Đen vây 4 phía quân trắng — hết khí, quân trắng bị nhấc khỏi bàn", setup: { moves: [] }, moves: [g(9, 10), g(10, 10), g(10, 9), g(0, 0), g(11, 10), g(0, 1), g(10, 11)] },
      { t: "try", prompt: "Quân trắng (10,10) chỉ còn 1 khí duy nhất. Đen đi đâu để bắt?", setup: { moves: [g(9, 10), g(10, 10), g(10, 9), g(0, 0), g(11, 10), g(0, 1)] }, solution: g(10, 11), hint: "Khí cuối cùng của quân trắng nằm ở đâu?" },
    ],
  },
  {
    id: "go-mat", game: "go", order: 2, title: "Mắt — sự sống của nhóm quân", sub: "Hai mắt thật = bất tử",
    blocks: [
      { t: "text", md: "**Mắt** = điểm trống được bao quanh hoàn toàn bởi một màu (và mép bàn). Địch không thể đánh vào mắt vì đó là tự sát — trừ khi đó là khí cuối.\n\nNhóm có **hai mắt riêng biệt** thì không bao giờ chết: địch chỉ lấp được một mắt mỗi nước, mà lấp một mắt thì nhóm vẫn còn mắt kia.\n\nChiến đấu trong cờ vây, về bản chất, là tranh giành đủ chỗ làm hai mắt." },
      { t: "demo", note: "Nhóm đen góc bàn đã có hai mắt — trắng không thể bắt", setup: { moves: [g(0, 2), g(5, 5), g(1, 2), g(5, 6), g(2, 0), g(5, 7), g(2, 1), g(5, 8), g(2, 2), g(5, 9)] }, moves: [] },
      { t: "text", md: "Cẩn thận **mắt giả**: điểm trông như mắt nhưng địch có thể đánh vào vì quân bao quanh bị cắt/đuối khí. Phân biệt mắt thật-giả là kỹ năng nền của cờ vây." },
    ],
  },
  {
    id: "go-ko", game: "go", order: 3, title: "Ko — luật cấm lặp", sub: "Không được bắt lại ngay quân vừa bắt",
    blocks: [
      { t: "text", md: "Khi bạn bắt đúng 1 quân và quân mới của bạn cũng chỉ có 1 khí → đối thủ **không được ăn lại ngay** (ko). Phải đánh chỗ khác trước (gọi là *ko threat*), rồi mới được quay lại.\n\nKo tạo ra những cuộc tranh chấp nghẹt thở: ai có nhiều 'đạn' ko threat hơn sẽ thắng cuộc chiến." },
      { t: "text", md: "Bài này chưa có demo tương tác — bàn ứng dụng ko đơn giản (cấm lặp ngay một nước) đã được áp trong phần chơi thử. Thực chiến, hãy nhớ: **đừng vội trả ko — trả giá bằng ko threat trước**." },
    ],
  },
  {
    id: "go-ket-thuc", game: "go", order: 4, title: "Mở cục, đất và kết thúc", sub: "Chiếm góc trước, chấm điểm cuối ván",
    blocks: [
      { t: "text", md: "Đầu ván quân thường vào **góc và điểm sao** — góc dễ làm đất nhất (chỉ cần vây 2 phía), sau đó mới ra biên, rồi trung tâm.\n\nVán kết thúc khi **cả hai pass liên tiếp**. Chấm: điểm = quân trên bàn + đất (vùng trống bao hoàn toàn bởi mình). Trắng +6.5 komi. Ai nhiều hơn thắng." },
      { t: "try", prompt: "Đầu ván, bàn trống. Đen nên vào điểm sao góc — đánh (3,3).", setup: { moves: [] }, solution: g(3, 3), hint: "Điểm sao gần góc: hàng 3, cột 3 (đếm từ 0)." },
      { t: "text", md: "Đừng nản nếu AI trên trang này còn yếu — cờ vây là game khó nhất cho máy. Mục tiêu của sân này là cho bạn **quen luật và cảm giác bàn 19×19**, rồi ra sảnh online gặp người thật." },
    ],
  },
];

export function lessonsByGame(game: string) {
  return LESSONS.filter((l) => l.game === game).sort((a, b) => a.order - b.order);
}
export function getLesson(id: string) {
  return LESSONS.find((l) => l.id === id);
}
