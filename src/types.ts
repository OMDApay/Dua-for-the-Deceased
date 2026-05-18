export type Language = 'ar' | 'en';
export type VoiceType = 'child' | 'man';

export interface KinshipOption {
  id: string;
  label: {
    ar: string;
    en: string;
  };
  prefix: {
    ar: string;
    en: string;
  };
}

export const KINSHIP_OPTIONS: KinshipOption[] = [
  { id: 'father', label: { ar: 'الأب', en: 'Father' }, prefix: { ar: 'اللهم ارحم أبي، ', en: 'O Allah, have mercy on my father, ' } },
  { id: 'mother', label: { ar: 'الأم', en: 'Mother' }, prefix: { ar: 'اللهم ارحم أمي، ', en: 'O Allah, have mercy on my mother, ' } },
  { id: 'brother', label: { ar: 'الأخ', en: 'Brother' }, prefix: { ar: 'اللهم ارحم أخي، ', en: 'O Allah, have mercy on my brother, ' } },
  { id: 'sister', label: { ar: 'الأخت', en: 'Sister' }, prefix: { ar: 'اللهم ارحم أختي، ', en: 'O Allah, have mercy on my sister, ' } },
  { id: 'grandfather', label: { ar: 'الجد', en: 'Grandfather' }, prefix: { ar: 'اللهم ارحم جدي، ', en: 'O Allah, have mercy on my grandfather, ' } },
  { id: 'grandmother', label: { ar: 'الجدة', en: 'Grandmother' }, prefix: { ar: 'اللهم ارحم جدتي، ', en: 'O Allah, have mercy on my grandmother, ' } },
  { id: 'relative', label: { ar: 'قريب', en: 'Relative' }, prefix: { ar: 'اللهم ارحم قريبي، ', en: 'O Allah, have mercy on my relative, ' } },
  { id: 'friend', label: { ar: 'صديق', en: 'Friend' }, prefix: { ar: 'اللهم ارحم صديقي، ', en: 'O Allah, have mercy on my friend, ' } },
  { id: 'muslims', label: { ar: 'عامة المسلمين', en: 'All Muslims' }, prefix: { ar: 'اللهم ارحم موتى المسلمين، ', en: 'O Allah, have mercy on the deceased Muslims, ' } },
  { id: 'custom', label: { ar: 'دعاء مخصص', en: 'Custom Dua' }, prefix: { ar: '', en: '' } },
];

export const TRANSLATIONS = {
  ar: {
    title: 'دعاء للمتوفى',
    subtitle: 'صدقة جارية لأرواح موتانا',
    duaPlaceholder: 'اكتب نص الدعاء هنا...',
    kinshipLabel: 'صلة القرابة',
    voiceLabel: 'نوع الصوت',
    voiceChild: 'طفل',
    voiceMan: 'رجل',
    generateBtn: 'تحويل إلى صوت',
    stopBtn: 'توقف',
    downloadBtn: 'تحميل',
    darkMode: 'الوضع الليلي',
    lightMode: 'الوضع النهاري',
    langEn: 'English',
    langAr: 'العربية',
    loading: 'جاري المعالجة...',
    translateBtn: 'ترجمة النص',
    translating: 'جاري الترجمة...',
    diacriticsBtn: 'أضف التشكيل',
    diacritizing: 'جاري التشكيل...',
    aiGenerateBtn: 'توليد دعاء ذكي',
    aiGenerating: 'جاري التوليد...',
    loginBtn: 'تسجيل الدخول بجوجل',
    logoutBtn: 'تسجيل الخروج',
    loginRequired: 'يرجى تسجيل الدخول لتوليد الصوت أو استخدام الذكاء الاصطناعي',
    error: 'حدث خطأ ما، يرجى المحاولة مرة أخرى',
  },
  en: {
    title: 'Dua for the Deceased',
    subtitle: 'Ongoing Charity for our Loved Ones',
    duaPlaceholder: 'Write the Dua text here...',
    kinshipLabel: 'Relationship',
    voiceLabel: 'Voice Type',
    voiceChild: 'Child',
    voiceMan: 'Man',
    generateBtn: 'Generate Audio',
    stopBtn: 'Stop',
    downloadBtn: 'Download',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    langEn: 'English',
    langAr: 'العربية',
    loading: 'Processing...',
    translateBtn: 'Translate Text',
    translating: 'Translating...',
    diacriticsBtn: 'Add Diacritics',
    diacritizing: 'Processing...',
    aiGenerateBtn: 'AI Dua Generator',
    aiGenerating: 'Generating...',
    loginBtn: 'Sign in with Google',
    logoutBtn: 'Sign Out',
    loginRequired: 'Please sign in to generate audio or use AI features',
    error: 'Something went wrong, please try again',
  }
};
