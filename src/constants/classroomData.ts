// 教室関連の共通定数定義
// 全コンポーネントで一貫した選択肢を使用するため

export const AGE_GROUPS = [
  { id: "toddler", label: "幼児（0-6歳）" },
  { id: "elementary", label: "小学生" },
  { id: "junior_high", label: "中学生" },
  { id: "high_school", label: "高校生" },
  { id: "adult", label: "大人" },
  { id: "senior", label: "シニア" }
] as const;

export const LESSON_TYPES = [
  { id: "piano", label: "ピアノ" },
  { id: "eurythmics", label: "リトミック" },
  { id: "solfege", label: "ソルフェージュ" },
  { id: "ensemble", label: "アンサンブル" },
  { id: "composition", label: "作曲" }
] as const;

export const FEATURES = [
  { id: "beginner", label: "初心者歓迎" },
  { id: "advanced", label: "上級者向け" },
  { id: "online", label: "オンラインレッスン" },
  { id: "recital", label: "発表会あり" },
  { id: "group", label: "グループレッスン" },
  { id: "individual", label: "個人レッスン" }
] as const;

export const WEEKDAYS = [
  { id: "monday", label: "月曜日" },
  { id: "tuesday", label: "火曜日" },
  { id: "wednesday", label: "水曜日" },
  { id: "thursday", label: "木曜日" },
  { id: "friday", label: "金曜日" },
  { id: "saturday", label: "土曜日" },
  { id: "sunday", label: "日曜日" }
] as const;

// 日本語変換用のマップ
export const AGE_GROUPS_MAP = Object.fromEntries(
  AGE_GROUPS.map(age => [age.id, age.label])
) as Record<string, string>;

export const LESSON_TYPES_MAP = Object.fromEntries(
  LESSON_TYPES.map(type => [type.id, type.label])
) as Record<string, string>;

export const WEEKDAYS_MAP = Object.fromEntries(
  WEEKDAYS.map(day => [day.id, day.label])
) as Record<string, string>;

// 翻訳関数
export const translateAgeRange = (ageRange: string): string => {
  return ageRange.split(',').map(age => AGE_GROUPS_MAP[age.trim()] || age.trim()).join(', ');
};

export const translateLessonType = (type: string): string => {
  return LESSON_TYPES_MAP[type] || type;
};

export const translateDay = (day: string): string => {
  return WEEKDAYS_MAP[day] || day;
}; 