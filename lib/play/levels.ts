export const LEVELS = [
  { name: "Người mới", hint: "Chơi vui, không áp lực" },
  { name: "Dễ", hint: "Tập đọc nước đi" },
  { name: "Trung bình", hint: "Đối thủ cân bằng" },
  { name: "Khó", hint: "Phải tính trước" },
  { name: "Cao thủ", hint: "Không tha thứ" },
] as const;

export type Level = 0 | 1 | 2 | 3 | 4;
