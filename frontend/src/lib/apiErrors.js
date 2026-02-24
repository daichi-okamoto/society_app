const FIELD_LABELS = {
  email: "メールアドレス",
  password: "パスワード",
  password_confirmation: "パスワード確認",
  name: "氏名",
  name_kana: "ふりがな",
  birth_date: "生年月日",
  phone: "電話番号",
  address: "住所",
  admin_invite_code: "管理者招待コード",
};

function translateRuleMessage(message) {
  if (!message) return "入力内容が正しくありません";
  if (message.includes("has already been taken")) return "既に使用されています";
  if (message.includes("can't be blank")) return "入力が必要です";
  if (message.includes("is invalid")) return "形式が正しくありません";
  if (message.includes("is too short")) return "文字数が不足しています";
  if (message.includes("is too long")) return "文字数が長すぎます";
  return message;
}

function buildFieldMessage(field, message) {
  const label = FIELD_LABELS[field] || field;
  return `${label}：${translateRuleMessage(message)}`;
}

export function parseValidationError(err, { fieldMap = {} } = {}) {
  const details = err?.data?.error?.details;
  if (!details || typeof details !== "object") {
    return { fieldErrors: {}, summary: "入力内容を確認してください" };
  }

  const fieldErrors = {};

  Object.entries(details).forEach(([serverKey, value]) => {
    const formKey = fieldMap[serverKey] || serverKey;
    const firstMessage = Array.isArray(value) ? value[0] : value;
    if (!firstMessage) return;
    fieldErrors[formKey] = buildFieldMessage(serverKey, String(firstMessage));
  });

  const summary = Object.values(fieldErrors)[0] || "入力内容を確認してください";
  return { fieldErrors, summary };
}
