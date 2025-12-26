/**
 * ユーザー管理関連の関数
 */

/**
 * ユーザー情報を取得
 * @param {string} userId - LINE User ID
 * @return {Object|null} ユーザー情報
 */
function getUserInfo(userId) {
  try {
    const sheet = getSheet(SHEET_NAMES.USER_MANAGEMENT);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userId) {
        return {
          rowIndex: i + 1,
          no: data[i][0],
          userId: data[i][1],
          state: data[i][2] || USER_STATES.IDLE,
          tempData: data[i][3] ? JSON.parse(data[i][3]) : {},
          lastUpdate: data[i][4] || ''
        };
      }
    }

    return null;
  } catch (e) {
    Logger.log('ユーザー情報取得エラー: ' + e);
    return null;
  }
}

/**
 * ユーザー情報を保存/更新
 * @param {string} userId - LINE User ID
 * @param {string} state - 状態
 * @param {Object} tempData - 一時データ
 */
function saveUserInfo(userId, state, tempData = {}) {
  try {
    const sheet = getSheet(SHEET_NAMES.USER_MANAGEMENT);
    const userInfo = getUserInfo(userId);
    const now = getCurrentDateTime();

    if (userInfo) {
      // 既存ユーザーを更新
      const row = [
        userInfo.no,
        userId,
        state,
        JSON.stringify(tempData),
        now
      ];
      sheet.getRange(userInfo.rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      // 新規ユーザーを追加
      const no = getNextNo(SHEET_NAMES.USER_MANAGEMENT);
      const row = [
        no,
        userId,
        state,
        JSON.stringify(tempData),
        now
      ];
      sheet.appendRow(row);
    }
  } catch (e) {
    Logger.log('ユーザー情報保存エラー: ' + e);
    throw new Error(getErrorMessage('write_error'));
  }
}

/**
 * ユーザーの状態をリセット
 * @param {string} userId - LINE User ID
 */
function resetUserState(userId) {
  saveUserInfo(userId, USER_STATES.IDLE, {});
}

/**
 * ユーザーの一時データを更新
 * @param {string} userId - LINE User ID
 * @param {string} key - キー
 * @param {any} value - 値
 */
function updateTempData(userId, key, value) {
  const userInfo = getUserInfo(userId);
  if (!userInfo) {
    userInfo = { tempData: {} };
  }

  const tempData = userInfo.tempData || {};
  tempData[key] = value;

  saveUserInfo(userId, userInfo.state || USER_STATES.IDLE, tempData);
}

/**
 * タイムアウトチェック
 * @param {string} userId - LINE User ID
 * @return {boolean} タイムアウトしている場合true
 */
function isTimedOut(userId) {
  const userInfo = getUserInfo(userId);
  if (!userInfo || !userInfo.lastUpdate) {
    return false;
  }

  // 新規登録中のみタイムアウトチェック
  const newStates = [
    USER_STATES.NEW_DEPARTURE_POINT,
    USER_STATES.NEW_STORE_NAME,
    USER_STATES.NEW_VIA_POINT,
    USER_STATES.NEW_ARRIVAL_TIME,
    USER_STATES.NEW_DESTINATION,
    USER_STATES.NEW_DISTANCE,
    USER_STATES.NEW_AMOUNT,
    USER_STATES.NEW_VEHICLE_NUMBER,
    USER_STATES.NEW_NOTE,
    USER_STATES.NEW_CONFIRM
  ];

  if (!newStates.includes(userInfo.state)) {
    return false;
  }

  try {
    const lastUpdate = parseDateTimeString(userInfo.lastUpdate);
    if (!lastUpdate) return false;

    const now = new Date();
    const diff = now - lastUpdate;

    return diff >= TIMEOUT_MS;
  } catch (e) {
    Logger.log('タイムアウトチェックエラー: ' + e);
    return false;
  }
}

/**
 * 新規登録の次の状態を取得
 * @param {string} currentState - 現在の状態
 * @return {string} 次の状態
 */
function getNextNewState(currentState) {
  const stateFlow = [
    USER_STATES.NEW_DEPARTURE_POINT,
    USER_STATES.NEW_STORE_NAME,
    USER_STATES.NEW_VIA_POINT,
    USER_STATES.NEW_ARRIVAL_TIME,
    USER_STATES.NEW_DESTINATION,
    USER_STATES.NEW_DISTANCE,
    USER_STATES.NEW_AMOUNT,
    USER_STATES.NEW_VEHICLE_NUMBER,
    USER_STATES.NEW_NOTE,
    USER_STATES.NEW_CONFIRM
  ];

  const currentIndex = stateFlow.indexOf(currentState);
  if (currentIndex >= 0 && currentIndex < stateFlow.length - 1) {
    return stateFlow[currentIndex + 1];
  }

  return USER_STATES.IDLE;
}

/**
 * 新規登録の前の状態を取得
 * @param {string} currentState - 現在の状態
 * @return {string} 前の状態
 */
function getPreviousNewState(currentState) {
  const stateFlow = [
    USER_STATES.NEW_DEPARTURE_POINT,
    USER_STATES.NEW_STORE_NAME,
    USER_STATES.NEW_VIA_POINT,
    USER_STATES.NEW_ARRIVAL_TIME,
    USER_STATES.NEW_DESTINATION,
    USER_STATES.NEW_DISTANCE,
    USER_STATES.NEW_AMOUNT,
    USER_STATES.NEW_VEHICLE_NUMBER,
    USER_STATES.NEW_NOTE,
    USER_STATES.NEW_CONFIRM
  ];

  const currentIndex = stateFlow.indexOf(currentState);
  if (currentIndex > 0) {
    return stateFlow[currentIndex - 1];
  }

  return USER_STATES.IDLE;
}

/**
 * 状態に応じたプロンプトメッセージを取得
 * @param {string} state - 状態
 * @return {string} プロンプトメッセージ
 */
function getPromptMessage(state) {
  const messages = {
    [USER_STATES.NEW_DEPARTURE_POINT]: '出発地点を入力してください。\n現在地ボタンまたは住所を手入力できます。',
    [USER_STATES.NEW_STORE_NAME]: '店舗名を入力してください。',
    [USER_STATES.NEW_VIA_POINT]: '経由地を入力してください。\n現在地ボタンまたは住所を手入力できます。\nスキップする場合は「進む」ボタンを押してください。',
    [USER_STATES.NEW_ARRIVAL_TIME]: '「目的地に到着」ボタンを押すか、到着日時を入力してください。\n（形式：yyyy/MM/dd HHmm）',
    [USER_STATES.NEW_DESTINATION]: '目的地を入力してください。\n現在地ボタンまたは住所を手入力できます。',
    [USER_STATES.NEW_DISTANCE]: '走行距離を入力してください。（数値のみ）',
    [USER_STATES.NEW_AMOUNT]: '金額を入力してください。（数値のみ）',
    [USER_STATES.NEW_VEHICLE_NUMBER]: '車両番号を選択または入力してください。',
    [USER_STATES.NEW_NOTE]: '備考を入力してください。\nスキップする場合は「進む」ボタンを押してください。',
    [USER_STATES.REPORT_DATE_SELECT]: '日報を表示する日付を選択してください。',
    [USER_STATES.REPORT_VEHICLE_SELECT]: '車両番号を選択してください。',
    [USER_STATES.DELETE_DATE_SELECT]: '削除するレコードの日付を選択してください。',
    [USER_STATES.DELETE_FILTER_SELECT]: '絞り込み条件を入力してください。\n時間（HH）または店舗名を入力してください。',
    [USER_STATES.EDIT_DATE_SELECT]: '編集するレコードの日付を選択してください。',
    [USER_STATES.EDIT_FILTER_SELECT]: '絞り込み条件を入力してください。\n時間（HH）または店舗名を入力してください。',
    [USER_STATES.EDIT_FIELD_SELECT]: '編集する項目を選択してください。'
  };

  return messages[state] || '';
}
