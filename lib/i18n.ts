// Widget UI strings. Deliberately a plain typed record rather than an i18n
// library: this ships inside an iframe on customer pages, and the whole surface
// is the couple of dozen strings below. i18n-js earns its ~20KB when you need
// pluralisation, interpolation and date formatting -- none of which the widget
// does. Swap it in the day that stops being true.
export const LOCALES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "zh", label: "中文", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "pt", label: "Português", dir: "ltr" },
  { code: "ko", label: "한국어", dir: "ltr" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(v: string | null | undefined): v is Locale {
  return !!v && LOCALES.some((l) => l.code === v);
}
export function localeDir(code: string): "ltr" | "rtl" {
  return LOCALES.find((l) => l.code === code)?.dir ?? "ltr";
}

export type StringKey =
  | "online" | "minimize" | "typeMessage" | "messageLabel" | "attachFile" | "language"
  | "startChat" | "starting" | "name" | "email" | "phone" | "howCanWeHelp"
  | "leadTitle" | "leadSubtitle" | "consent"
  | "errRequired" | "errCheckDetails" | "errTooMany" | "errRegion" | "errOrigin" | "errGone" | "errGeneric"
  | "noticeExpired" | "noticeCredits" | "noticeTooFastWait" | "noticeTooFast" | "noticeWrong"
  | "fileTooLarge" | "fileTypeNotAllowed";

type Dict = Record<StringKey, string>;

const en: Dict = {
  online: "Online", minimize: "Minimize chat", typeMessage: "Type a message",
  messageLabel: "Message", attachFile: "Attach file", language: "Language",
  startChat: "Start chat", starting: "Starting...",
  name: "Name", email: "Email", phone: "Phone", howCanWeHelp: "How can we help?",
  leadTitle: "Let's get started",
  leadSubtitle: "A few details so we can help you properly.",
  consent: "By continuing, you agree to chat with this assistant.",
  errRequired: "Please fill in your {fields}.",
  errCheckDetails: "Please check the details you entered.",
  errTooMany: "Too many attempts. Please wait a minute and try again.",
  errRegion: "Chat is not available in your region.",
  errOrigin: "This site is not allowed to use this chat.",
  errGone: "This chat is no longer available.",
  errGeneric: "Could not start the chat. Please try again in a moment.",
  noticeExpired: "Your session expired. Please enter your details again.",
  noticeCredits: "This assistant is out of message credits.",
  noticeTooFastWait: "Sending too fast - try again in {s}s.",
  noticeTooFast: "Sending too fast - give it a moment.",
  noticeWrong: "Something went wrong - please try again.",
  fileTooLarge: "File too large (max {mb}MB).",
  fileTypeNotAllowed: "File type not allowed.",
};

const zh: Dict = {
  online: "在线", minimize: "最小化聊天", typeMessage: "输入消息",
  messageLabel: "消息", attachFile: "添加附件", language: "语言",
  startChat: "开始聊天", starting: "正在开始…",
  name: "姓名", email: "邮箱", phone: "电话", howCanWeHelp: "我们能帮您什么？",
  leadTitle: "开始吧",
  leadSubtitle: "留下一些信息，方便我们更好地帮助您。",
  consent: "继续即表示您同意与此助手聊天。",
  errRequired: "请填写您的{fields}。",
  errCheckDetails: "请检查您输入的信息。",
  errTooMany: "尝试次数过多，请等待一分钟后重试。",
  errRegion: "您所在的地区无法使用聊天。",
  errOrigin: "此网站无权使用该聊天。",
  errGone: "此聊天已不可用。",
  errGeneric: "无法开始聊天，请稍后重试。",
  noticeExpired: "会话已过期，请重新填写您的信息。",
  noticeCredits: "此助手的消息额度已用完。",
  noticeTooFastWait: "发送过快，请在 {s} 秒后重试。",
  noticeTooFast: "发送过快，请稍等片刻。",
  noticeWrong: "出了点问题，请重试。",
  fileTooLarge: "文件过大（最大 {mb}MB）。",
  fileTypeNotAllowed: "不支持此文件类型。",
};

const es: Dict = {
  online: "En línea", minimize: "Minimizar chat", typeMessage: "Escribe un mensaje",
  messageLabel: "Mensaje", attachFile: "Adjuntar archivo", language: "Idioma",
  startChat: "Iniciar chat", starting: "Iniciando...",
  name: "Nombre", email: "Correo electrónico", phone: "Teléfono",
  howCanWeHelp: "¿En qué podemos ayudarte?",
  leadTitle: "Empecemos",
  leadSubtitle: "Algunos datos para poder ayudarte mejor.",
  consent: "Al continuar, aceptas chatear con este asistente.",
  errRequired: "Completa tu {fields}.",
  errCheckDetails: "Revisa los datos que ingresaste.",
  errTooMany: "Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
  errRegion: "El chat no está disponible en tu región.",
  errOrigin: "Este sitio no tiene permiso para usar este chat.",
  errGone: "Este chat ya no está disponible.",
  errGeneric: "No se pudo iniciar el chat. Inténtalo de nuevo en un momento.",
  noticeExpired: "Tu sesión expiró. Ingresa tus datos de nuevo.",
  noticeCredits: "Este asistente se quedó sin créditos de mensajes.",
  noticeTooFastWait: "Envías demasiado rápido: inténtalo en {s}s.",
  noticeTooFast: "Envías demasiado rápido: espera un momento.",
  noticeWrong: "Algo salió mal: inténtalo de nuevo.",
  fileTooLarge: "Archivo demasiado grande (máx. {mb} MB).",
  fileTypeNotAllowed: "Tipo de archivo no permitido.",
};

const ja: Dict = {
  online: "オンライン", minimize: "チャットを最小化", typeMessage: "メッセージを入力",
  messageLabel: "メッセージ", attachFile: "ファイルを添付", language: "言語",
  startChat: "チャットを開始", starting: "開始しています…",
  name: "お名前", email: "メールアドレス", phone: "電話番号",
  howCanWeHelp: "ご用件をお聞かせください",
  leadTitle: "はじめましょう",
  leadSubtitle: "より良いサポートのため、いくつかご記入ください。",
  consent: "続行すると、このアシスタントとのチャットに同意したものとみなされます。",
  errRequired: "{fields}をご記入ください。",
  errCheckDetails: "入力内容をご確認ください。",
  errTooMany: "試行回数が多すぎます。1分ほど待って再度お試しください。",
  errRegion: "お住まいの地域ではチャットをご利用いただけません。",
  errOrigin: "このサイトはこのチャットを利用できません。",
  errGone: "このチャットは利用できなくなりました。",
  errGeneric: "チャットを開始できませんでした。しばらくしてからお試しください。",
  noticeExpired: "セッションの有効期限が切れました。もう一度ご入力ください。",
  noticeCredits: "このアシスタントのメッセージ残数がありません。",
  noticeTooFastWait: "送信が速すぎます。{s}秒後にお試しください。",
  noticeTooFast: "送信が速すぎます。少しお待ちください。",
  noticeWrong: "問題が発生しました。もう一度お試しください。",
  fileTooLarge: "ファイルが大きすぎます（最大{mb}MB）。",
  fileTypeNotAllowed: "このファイル形式は許可されていません。",
};

const de: Dict = {
  online: "Online", minimize: "Chat minimieren", typeMessage: "Nachricht schreiben",
  messageLabel: "Nachricht", attachFile: "Datei anhängen", language: "Sprache",
  startChat: "Chat starten", starting: "Wird gestartet...",
  name: "Name", email: "E-Mail", phone: "Telefon", howCanWeHelp: "Wie können wir helfen?",
  leadTitle: "Los geht's",
  leadSubtitle: "Ein paar Angaben, damit wir richtig helfen können.",
  consent: "Wenn Sie fortfahren, stimmen Sie dem Chat mit diesem Assistenten zu.",
  errRequired: "Bitte geben Sie {fields} an.",
  errCheckDetails: "Bitte prüfen Sie Ihre Angaben.",
  errTooMany: "Zu viele Versuche. Bitte warten Sie eine Minute.",
  errRegion: "Der Chat ist in Ihrer Region nicht verfügbar.",
  errOrigin: "Diese Website darf diesen Chat nicht verwenden.",
  errGone: "Dieser Chat ist nicht mehr verfügbar.",
  errGeneric: "Chat konnte nicht gestartet werden. Bitte später erneut versuchen.",
  noticeExpired: "Ihre Sitzung ist abgelaufen. Bitte geben Sie Ihre Daten erneut ein.",
  noticeCredits: "Dieser Assistent hat keine Nachrichten-Credits mehr.",
  noticeTooFastWait: "Zu schnell gesendet - in {s}s erneut versuchen.",
  noticeTooFast: "Zu schnell gesendet - einen Moment bitte.",
  noticeWrong: "Etwas ist schiefgelaufen - bitte erneut versuchen.",
  fileTooLarge: "Datei zu groß (max. {mb} MB).",
  fileTypeNotAllowed: "Dateityp nicht erlaubt.",
};

const ar: Dict = {
  online: "متصل", minimize: "تصغير المحادثة", typeMessage: "اكتب رسالة",
  messageLabel: "رسالة", attachFile: "إرفاق ملف", language: "اللغة",
  startChat: "بدء المحادثة", starting: "جارٍ البدء...",
  name: "الاسم", email: "البريد الإلكتروني", phone: "الهاتف",
  howCanWeHelp: "كيف يمكننا مساعدتك؟",
  leadTitle: "لنبدأ",
  leadSubtitle: "بعض التفاصيل حتى نتمكن من مساعدتك بشكل صحيح.",
  consent: "بالمتابعة، فإنك توافق على الدردشة مع هذا المساعد.",
  errRequired: "يرجى إدخال {fields}.",
  errCheckDetails: "يرجى التحقق من البيانات التي أدخلتها.",
  errTooMany: "محاولات كثيرة. يرجى الانتظار دقيقة ثم المحاولة مرة أخرى.",
  errRegion: "المحادثة غير متاحة في منطقتك.",
  errOrigin: "هذا الموقع غير مسموح له باستخدام هذه المحادثة.",
  errGone: "لم تعد هذه المحادثة متاحة.",
  errGeneric: "تعذر بدء المحادثة. يرجى المحاولة بعد قليل.",
  noticeExpired: "انتهت جلستك. يرجى إدخال بياناتك مرة أخرى.",
  noticeCredits: "لم يتبق لدى هذا المساعد رصيد رسائل.",
  noticeTooFastWait: "الإرسال سريع جدًا - حاول بعد {s} ثانية.",
  noticeTooFast: "الإرسال سريع جدًا - انتظر قليلاً.",
  noticeWrong: "حدث خطأ ما - يرجى المحاولة مرة أخرى.",
  fileTooLarge: "الملف كبير جدًا (الحد الأقصى {mb} ميغابايت).",
  fileTypeNotAllowed: "نوع الملف غير مسموح به.",
};

// Narrow no-break space before ? and : per French typography, written as an
// escape so the source stays ASCII and cannot be eaten by an editor.
const fr: Dict = {
  online: "En ligne", minimize: "Réduire le chat", typeMessage: "Écrivez un message",
  messageLabel: "Message", attachFile: "Joindre un fichier", language: "Langue",
  startChat: "Démarrer le chat", starting: "Démarrage...",
  name: "Nom", email: "E-mail", phone: "Téléphone",
  howCanWeHelp: "Comment pouvons-nous vous aider\u00a0?",
  leadTitle: "Commençons",
  leadSubtitle: "Quelques informations pour mieux vous aider.",
  consent: "En continuant, vous acceptez de discuter avec cet assistant.",
  errRequired: "Veuillez renseigner votre {fields}.",
  errCheckDetails: "Veuillez vérifier les informations saisies.",
  errTooMany: "Trop de tentatives. Veuillez patienter une minute.",
  errRegion: "Le chat n'est pas disponible dans votre région.",
  errOrigin: "Ce site n'est pas autorisé à utiliser ce chat.",
  errGone: "Ce chat n'est plus disponible.",
  errGeneric: "Impossible de démarrer le chat. Réessayez dans un instant.",
  noticeExpired: "Votre session a expiré. Veuillez saisir à nouveau vos informations.",
  noticeCredits: "Cet assistant n'a plus de crédits de messages.",
  noticeTooFastWait: "Envoi trop rapide - réessayez dans {s}\u00a0s.",
  noticeTooFast: "Envoi trop rapide - patientez un instant.",
  noticeWrong: "Une erreur est survenue - veuillez réessayer.",
  fileTooLarge: "Fichier trop volumineux (max {mb}\u00a0Mo).",
  fileTypeNotAllowed: "Type de fichier non autorisé.",
};

const pt: Dict = {
  online: "Online", minimize: "Minimizar chat", typeMessage: "Digite uma mensagem",
  messageLabel: "Mensagem", attachFile: "Anexar arquivo", language: "Idioma",
  startChat: "Iniciar chat", starting: "Iniciando...",
  name: "Nome", email: "E-mail", phone: "Telefone", howCanWeHelp: "Como podemos ajudar?",
  leadTitle: "Vamos começar",
  leadSubtitle: "Alguns dados para podermos ajudar melhor.",
  consent: "Ao continuar, você concorda em conversar com este assistente.",
  errRequired: "Preencha seu {fields}.",
  errCheckDetails: "Verifique os dados informados.",
  errTooMany: "Muitas tentativas. Aguarde um minuto e tente novamente.",
  errRegion: "O chat não está disponível na sua região.",
  errOrigin: "Este site não tem permissão para usar este chat.",
  errGone: "Este chat não está mais disponível.",
  errGeneric: "Não foi possível iniciar o chat. Tente novamente em instantes.",
  noticeExpired: "Sua sessão expirou. Informe seus dados novamente.",
  noticeCredits: "Este assistente está sem créditos de mensagens.",
  noticeTooFastWait: "Envio rápido demais - tente em {s}s.",
  noticeTooFast: "Envio rápido demais - aguarde um momento.",
  noticeWrong: "Algo deu errado - tente novamente.",
  fileTooLarge: "Arquivo muito grande (máx. {mb} MB).",
  fileTypeNotAllowed: "Tipo de arquivo não permitido.",
};

const ko: Dict = {
  online: "온라인", minimize: "채팅 최소화", typeMessage: "메시지를 입력하세요",
  messageLabel: "메시지", attachFile: "파일 첨부", language: "언어",
  startChat: "채팅 시작", starting: "시작하는 중...",
  name: "이름", email: "이메일", phone: "전화번호", howCanWeHelp: "무엇을 도와드릴까요?",
  leadTitle: "시작해 볼까요",
  leadSubtitle: "더 잘 도와드릴 수 있도록 몇 가지만 알려주세요.",
  consent: "계속하면 이 어시스턴트와의 채팅에 동의하게 됩니다.",
  errRequired: "{fields}을(를) 입력해 주세요.",
  errCheckDetails: "입력하신 정보를 확인해 주세요.",
  errTooMany: "시도가 너무 많습니다. 1분 후 다시 시도해 주세요.",
  errRegion: "현재 지역에서는 채팅을 사용할 수 없습니다.",
  errOrigin: "이 사이트에서는 이 채팅을 사용할 수 없습니다.",
  errGone: "이 채팅은 더 이상 사용할 수 없습니다.",
  errGeneric: "채팅을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  noticeExpired: "세션이 만료되었습니다. 정보를 다시 입력해 주세요.",
  noticeCredits: "이 어시스턴트의 메시지 크레딧이 없습니다.",
  noticeTooFastWait: "너무 빠르게 보내고 있습니다. {s}초 후에 다시 시도해 주세요.",
  noticeTooFast: "너무 빠르게 보내고 있습니다. 잠시만 기다려 주세요.",
  noticeWrong: "문제가 발생했습니다. 다시 시도해 주세요.",
  fileTooLarge: "파일이 너무 큽니다(최대 {mb}MB).",
  fileTypeNotAllowed: "허용되지 않는 파일 형식입니다.",
};

const hi: Dict = {
  online: "ऑनलाइन", minimize: "चैट छोटा करें", typeMessage: "संदेश लिखें",
  messageLabel: "संदेश", attachFile: "फ़ाइल जोड़ें", language: "भाषा",
  startChat: "चैट शुरू करें", starting: "शुरू हो रहा है...",
  name: "नाम", email: "ईमेल", phone: "फ़ोन", howCanWeHelp: "हम आपकी कैसे मदद करें?",
  leadTitle: "चलिए शुरू करते हैं",
  leadSubtitle: "कुछ जानकारी ताकि हम आपकी बेहतर मदद कर सकें।",
  consent: "जारी रखने पर आप इस सहायक से चैट करने के लिए सहमत होते हैं।",
  errRequired: "कृपया अपना {fields} भरें।",
  errCheckDetails: "कृपया दर्ज की गई जानकारी जाँचें।",
  errTooMany: "बहुत अधिक प्रयास। कृपया एक मिनट बाद पुनः प्रयास करें।",
  errRegion: "आपके क्षेत्र में चैट उपलब्ध नहीं है।",
  errOrigin: "इस साइट को यह चैट उपयोग करने की अनुमति नहीं है।",
  errGone: "यह चैट अब उपलब्ध नहीं है।",
  errGeneric: "चैट शुरू नहीं हो सकी। कृपया थोड़ी देर बाद प्रयास करें।",
  noticeExpired: "आपका सत्र समाप्त हो गया। कृपया अपनी जानकारी फिर से दर्ज करें।",
  noticeCredits: "इस सहायक के संदेश क्रेडिट समाप्त हो गए हैं।",
  noticeTooFastWait: "बहुत तेज़ भेजा जा रहा है - {s}s बाद प्रयास करें।",
  noticeTooFast: "बहुत तेज़ भेजा जा रहा है - थोड़ा रुकें।",
  noticeWrong: "कुछ गलत हो गया - कृपया पुनः प्रयास करें।",
  fileTooLarge: "फ़ाइल बहुत बड़ी है (अधिकतम {mb}MB)।",
  fileTypeNotAllowed: "यह फ़ाइल प्रकार अनुमत नहीं है।",
};

const DICTS: Record<Locale, Dict> = { en, zh, es, ja, de, ar, fr, pt, ko, hi };

// Falls back to English per key, not per locale, so a half-finished translation
// degrades one string at a time instead of dropping the whole language.
export function t(locale: string, key: StringKey, vars?: Record<string, string | number>): string {
  const dict = isLocale(locale) ? DICTS[locale] : DICTS[DEFAULT_LOCALE];
  let out = dict[key] || DICTS[DEFAULT_LOCALE][key];
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}