import type { GameId } from "@/lib/games/registry";
import type { PieceType } from "@/components/board/ChessPieces";

/** icon quân để render trong phần cách đi */
export type RuleIcon =
  | { kind: "chess"; t: PieceType; c: "w" | "b" }
  | { kind: "xq"; ch: string; red: boolean }
  | { kind: "caro"; mark: "x" | "o" }
  | { kind: "go"; color: "b" | "w" };

export interface RuleLine {
  icon: RuleIcon;
  name: string;
  move: string;
}
export interface RuleStep {
  title: string;
  text?: string;
  /** liệt kê quân + cách đi (nếu có) */
  pieces?: RuleLine[];
  bullets?: string[];
}

export const RULES: Record<GameId, RuleStep[]> = {
  caro: [
    {
      title: "Mục tiêu",
      text: "Xếp đủ năm quân liền nhau trên một đường ngang, dọc hoặc chéo — trước khi đối thủ làm được.",
    },
    {
      title: "Cách chơi",
      text: "X đi trước, hai bên luân phiên đặt một quân vào ô trống. Chơi trên bàn 15×15.",
      pieces: [
        { icon: { kind: "caro", mark: "x" }, name: "X", move: "Đi trước" },
        { icon: { kind: "caro", mark: "o" }, name: "O", move: "Đi sau" },
      ],
      bullets: [
        "Luật Việt Nam: phải đúng năm quân — sáu quân trở lên không thắng.",
        "Dãy năm bị chặn cả hai đầu cũng không tính thắng.",
      ],
    },
    {
      title: "Mẹo cho người mới",
      bullets: [
        "Chặn dãy ba mở của đối thủ ngay — chờ thêm một nước là mất ván.",
        "Tạo 'nước đôi': một nước mở hai hướng đe dọa, đối thủ không chặn xuể.",
        "Đánh quanh trung tâm, đừng rải quân rời rạc ra góc.",
      ],
    },
  ],
  chess: [
    {
      title: "Mục tiêu",
      text: "Chiếu hết vua đối phương — đe dọa bắt vua mà đối thủ không còn cách thoát.",
    },
    {
      title: "Cách đi quân",
      pieces: [
        { icon: { kind: "chess", t: "k", c: "w" }, name: "Vua", move: "Một ô mọi hướng" },
        { icon: { kind: "chess", t: "q", c: "w" }, name: "Hậu", move: "Ngang, dọc, chéo không giới hạn" },
        { icon: { kind: "chess", t: "r", c: "w" }, name: "Xe", move: "Ngang và dọc" },
        { icon: { kind: "chess", t: "b", c: "w" }, name: "Tượng", move: "Đường chéo" },
        { icon: { kind: "chess", t: "n", c: "w" }, name: "Mã", move: "Chữ L — nhảy qua quân khác" },
        { icon: { kind: "chess", t: "p", c: "w" }, name: "Tốt", move: "Tiến một ô, ăn chéo; tới cuối bàn phong cấp" },
      ],
      bullets: ["Nhập thành đưa vua vào góc an toàn.", "Tốt tới hàng cuối được đổi thành quân khác (thường là hậu)."],
    },
    {
      title: "Mẹo cho người mới",
      bullets: [
        "Chiếm trung tâm sớm bằng tốt và mã.",
        "Đừng đưa hậu ra quá sớm — dễ bị rượt.",
        "Nhập thành trong mười nước đầu để vua an toàn.",
      ],
    },
  ],
  xiangqi: [
    {
      title: "Mục tiêu",
      text: "Chiếu hết tướng đối phương. Hai tướng không bao giờ được nhìn mặt nhau trên một cột trống.",
    },
    {
      title: "Quân và cách đi",
      pieces: [
        { icon: { kind: "xq", ch: "帥", red: true }, name: "Tướng", move: "Một ô trong cung 3×3, không ra ngoài" },
        { icon: { kind: "xq", ch: "仕", red: true }, name: "Sĩ", move: "Một ô chéo, chỉ trong cung" },
        { icon: { kind: "xq", ch: "相", red: true }, name: "Tượng", move: "Hai ô chéo, không qua sông, bị chặn nếu có quân giữa" },
        { icon: { kind: "xq", ch: "車", red: true }, name: "Xe", move: "Ngang và dọc — quân mạnh nhất" },
        { icon: { kind: "xq", ch: "馬", red: true }, name: "Mã", move: "Chữ Nhật (2-1), bị chặn nếu chân mã có quân" },
        { icon: { kind: "xq", ch: "炮", red: true }, name: "Pháo", move: "Đi như xe; ăn quân phải nhảy qua đúng một ngòi" },
        { icon: { kind: "xq", ch: "兵", red: true }, name: "Tốt", move: "Tiến một ô; qua sông được đi ngang" },
      ],
    },
    {
      title: "Mẹo cho người mới",
      bullets: [
        "Đưa xe ra ngoài sớm — xe kẹt trong nhà là xe chết.",
        "Pháo cần 'ngòi': giữ quân trung gian để pháo uy hiếp cột giữa.",
        "Đẩy tốt qua sông để nó đi được ngang và gây áp lực.",
      ],
    },
  ],
  go: [
    {
      title: "Mục tiêu",
      text: "Bao vây nhiều đất hơn đối thủ. Đen đi trước, trắng được cộng 6.5 điểm (komi) bù lượt sau.",
    },
    {
      title: "Khí và bắt quân",
      pieces: [
        { icon: { kind: "go", color: "b" }, name: "Đen", move: "Đi trước" },
        { icon: { kind: "go", color: "w" }, name: "Trắng", move: "Đi sau, +6.5 điểm komi" },
      ],
      bullets: [
        "Mỗi quân (hoặc nhóm liền nhau) cần ít nhất một 'khí' — ô trống kề cạnh.",
        "Hết khí là bị bắt, quân bị nhấc khỏi bàn.",
        "Cấm đặt vào ô tự hết khí (tự sát), trừ khi nước đó bắt quân.",
        "Luật ko: không được lặp lại thế bàn vừa rồi — phải đi chỗ khác trước.",
      ],
    },
    {
      title: "Chấm điểm",
      text: "Ván kết thúc khi cả hai bên liên tiếp bỏ lượt. Điểm = đất bao quanh + quân bắt được (+ komi cho trắng). Ai nhiều hơn thắng.",
    },
    {
      title: "Mẹo cho người mới",
      bullets: [
        "Bắt đầu với bàn 9×9 — nhanh đọc được khí và nhóm.",
        "Chơi gần góc trước: góc ít cạnh cần giữ hơn trung tâm.",
        "Đừng lấp 'mắt' của chính mình — nhóm cần hai mắt để sống.",
      ],
    },
  ],
};
