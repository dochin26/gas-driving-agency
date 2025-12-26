/**
 * 共通ユーティリティ関数
 */

/**
 * 全角数字を半角数字に変換
 * @param {string} str - 変換する文字列
 * @return {string} 変換後の文字列
 */
function toHalfWidth(str) {
  if (!str) return str;
  return str.replace(/[０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
}

/**
 * 日時文字列を検証
 * @param {string} dateStr - 検証する日時文字列
 * @param {boolean} requireTime - 時刻が必須かどうか
 * @return {boolean} 有効な場合true
 */
function validateDateTime(dateStr, requireTime = false) {
  if (!dateStr) return false;

  // 全角を半角に変換
  const normalized = toHalfWidth(dateStr.trim());

  // yyyy/MM/dd HHmm 形式
  const datetimePattern = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2})(\d{2})$/;
  // yyyy/MM/dd 形式
  const datePattern = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;

  let match;
  if (requireTime) {
    match = normalized.match(datetimePattern);
    if (!match) return false;

    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    const day = parseInt(match[3]);
    const hour = parseInt(match[4]);
    const minute = parseInt(match[5]);

    // 妥当性チェック
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (hour < 0 || hour > 23) return false;
    if (minute < 0 || minute > 59) return false;

    return true;
  } else {
    // 日付のみ、または日時両方を許可
    match = normalized.match(datetimePattern) || normalized.match(datePattern);
    if (!match) return false;

    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    const day = parseInt(match[3]);

    // 妥当性チェック
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    if (match.length > 4) {
      const hour = parseInt(match[4]);
      const minute = parseInt(match[5]);
      if (hour < 0 || hour > 23) return false;
      if (minute < 0 || minute > 59) return false;
    }

    return true;
  }
}

/**
 * 数値を検証
 * @param {string} numStr - 検証する数値文字列
 * @return {boolean} 有効な場合true
 */
function validateNumber(numStr) {
  if (!numStr) return false;

  // 全角を半角に変換
  const normalized = toHalfWidth(numStr.trim());

  // 数値チェック（整数または小数）
  return /^[0-9]+(\.[0-9]+)?$/.test(normalized);
}

/**
 * 日時文字列を yyyy/MM/dd HH:mm 形式に正規化
 * @param {string} dateStr - 日時文字列
 * @return {string} 正規化された日時文字列
 */
function normalizeDateTimeString(dateStr) {
  if (!dateStr) return '';

  const normalized = toHalfWidth(dateStr.trim());

  // yyyy/MM/dd HHmm 形式
  const datetimePattern = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2})(\d{2})$/;
  const match = normalized.match(datetimePattern);

  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    const hour = match[4].padStart(2, '0');
    const minute = match[5].padStart(2, '0');
    return `${year}/${month}/${day} ${hour}:${minute}`;
  }

  return normalized;
}

/**
 * 日時文字列を yyyy/MM/dd 形式に正規化
 * @param {string} dateStr - 日付文字列
 * @return {string} 正規化された日付文字列
 */
function normalizeDateString(dateStr) {
  if (!dateStr) return '';

  const normalized = toHalfWidth(dateStr.trim());
  const datePattern = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
  const match = normalized.match(datePattern);

  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  return normalized;
}

/**
 * 現在時刻を yyyy/MM/dd HH:mm 形式で取得
 * @return {string} 現在時刻
 */
function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

/**
 * 現在日付を yyyy/MM/dd 形式で取得
 * @return {string} 現在日付
 */
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

/**
 * 指定日数前の日付を取得
 * @param {number} days - 日数
 * @return {string} yyyy/MM/dd 形式の日付
 */
function getDateBeforeDays(days) {
  const now = new Date();
  now.setDate(now.getDate() - days);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

/**
 * 過去7日分の日付配列を取得
 * @return {Array<string>} 日付配列（今日から7日前まで）
 */
function getDateList7Days() {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(getDateBeforeDays(i));
  }
  return dates;
}

/**
 * 座標から住所を取得
 * @param {number} latitude - 緯度
 * @param {number} longitude - 経度
 * @return {string} 住所（取得失敗時は座標の文字列を返す）
 */
function getAddressFromCoordinates(latitude, longitude) {
  try {
    const response = Maps.newGeocoder()
      .setLanguage('ja')
      .reverseGeocode(latitude, longitude);

    if (response.status === 'OK' && response.results.length > 0) {
      return response.results[0].formatted_address;
    }
  } catch (e) {
    Logger.log('Maps API Error: ' + e);
  }

  // 失敗時は座標をそのまま返す
  return `(${latitude}, ${longitude})`;
}

/**
 * エラーメッセージを返す
 * @param {string} type - エラーの種類
 * @return {string} エラーメッセージ
 */
function getErrorMessage(type) {
  const messages = {
    invalid_format: '入力形式が正しくありません。もう一度入力してください。',
    communication_error: '通信エラーが発生しました。もう一度お試しください。',
    read_error: 'データの読み取りに失敗しました。しばらく経ってからお試しください。',
    write_error: 'データの保存に失敗しました。もう一度お試しください。',
    no_data: '本日のデータはありません'
  };

  return messages[type] || 'エラーが発生しました。';
}
