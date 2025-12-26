/**
 * 新規登録機能のハンドラー
 */

/**
 * 新規登録を開始
 * @param {string} userId - LINE User ID
 * @param {string} replyToken - リプライトークン
 */
function startNewRecord(userId, replyToken) {
  // 出発日時を現在時刻で初期化
  const tempData = {
    departureTime: getCurrentDateTime()
  };

  saveUserInfo(userId, USER_STATES.NEW_DEPARTURE_POINT, tempData);

  const message = createTextMessage(
    '新規登録を開始します。\n\n' + getPromptMessage(USER_STATES.NEW_DEPARTURE_POINT)
  );

  replyMessage(replyToken, message);
}

/**
 * 新規登録の入力を処理
 * @param {string} userId - LINE User ID
 * @param {string} text - 入力テキスト
 * @param {string} replyToken - リプライトークン
 * @param {Object} userInfo - ユーザー情報
 */
function handleNewRecordInput(userId, text, replyToken, userInfo) {
  const state = userInfo.state;
  const tempData = userInfo.tempData || {};

  try {
    switch (state) {
      case USER_STATES.NEW_DEPARTURE_POINT:
        tempData.departurePoint = text;
        const nextState1 = getNextNewState(state);
        saveUserInfo(userId, nextState1, tempData);
        sendPrompt(replyToken, nextState1, tempData);
        break;

      case USER_STATES.NEW_STORE_NAME:
        tempData.storeName = text;
        const nextState2 = getNextNewState(state);
        saveUserInfo(userId, nextState2, tempData);
        sendPrompt(replyToken, nextState2, tempData);
        break;

      case USER_STATES.NEW_VIA_POINT:
        tempData.viaPoint = text;
        const nextState3 = getNextNewState(state);
        saveUserInfo(userId, nextState3, tempData);
        sendPrompt(replyToken, nextState3, tempData);
        break;

      case USER_STATES.NEW_ARRIVAL_TIME:
        // 日時検証
        if (!validateDateTime(text)) {
          replyMessage(replyToken, createTextMessage(getErrorMessage('invalid_format')));
          return;
        }
        tempData.arrivalTime = normalizeDateTimeString(text);
        const nextState4 = getNextNewState(state);
        saveUserInfo(userId, nextState4, tempData);
        sendPrompt(replyToken, nextState4, tempData);
        break;

      case USER_STATES.NEW_DESTINATION:
        tempData.destination = text;
        const nextState5 = getNextNewState(state);
        saveUserInfo(userId, nextState5, tempData);
        sendPrompt(replyToken, nextState5, tempData);
        break;

      case USER_STATES.NEW_DISTANCE:
        // 数値検証
        if (!validateNumber(text)) {
          replyMessage(replyToken, createTextMessage(getErrorMessage('invalid_format')));
          return;
        }
        tempData.distance = toHalfWidth(text);
        const nextState6 = getNextNewState(state);
        saveUserInfo(userId, nextState6, tempData);
        sendPrompt(replyToken, nextState6, tempData);
        break;

      case USER_STATES.NEW_AMOUNT:
        // 数値検証
        if (!validateNumber(text)) {
          replyMessage(replyToken, createTextMessage(getErrorMessage('invalid_format')));
          return;
        }
        tempData.amount = toHalfWidth(text);
        const nextState7 = getNextNewState(state);
        saveUserInfo(userId, nextState7, tempData);
        sendPrompt(replyToken, nextState7, tempData);
        break;

      case USER_STATES.NEW_VEHICLE_NUMBER:
        tempData.vehicleNumber = text;
        const nextState8 = getNextNewState(state);
        saveUserInfo(userId, nextState8, tempData);
        sendPrompt(replyToken, nextState8, tempData);
        break;

      case USER_STATES.NEW_NOTE:
        tempData.note = text;
        // 確認画面へ
        saveUserInfo(userId, USER_STATES.NEW_CONFIRM, tempData);
        showConfirmation(replyToken, tempData);
        break;

      default:
        resetUserState(userId);
        replyMessage(replyToken, createTextMessage('エラーが発生しました。最初からやり直してください。'));
        break;
    }
  } catch (e) {
    Logger.log('新規登録入力処理エラー: ' + e);
    replyMessage(replyToken, createTextMessage(e.message || getErrorMessage('communication_error')));
  }
}

/**
 * プロンプトメッセージを送信
 * @param {string} replyToken - リプライトークン
 * @param {string} state - 状態
 * @param {Object} tempData - 一時データ
 */
function sendPrompt(replyToken, state, tempData) {
  let message;

  if (state === USER_STATES.NEW_STORE_NAME) {
    // 店舗選択ボタンを表示
    const stores = getStores();
    if (stores.length > 0) {
      const actions = createStoreSelectActions();
      message = createButtonTemplate(getPromptMessage(state), actions);
    } else {
      message = createTextMessage(getPromptMessage(state));
    }
  } else if (state === USER_STATES.NEW_VEHICLE_NUMBER) {
    // 車両選択ボタンを表示
    const vehicles = getVehicles();
    if (vehicles.length > 0) {
      const actions = createVehicleSelectActions();
      message = createButtonTemplate(getPromptMessage(state), actions);
    } else {
      message = createTextMessage(getPromptMessage(state));
    }
  } else {
    message = createTextMessage(getPromptMessage(state));
  }

  replyMessage(replyToken, message);
}

/**
 * 確認画面を表示
 * @param {string} replyToken - リプライトークン
 * @param {Object} data - レコードデータ
 */
function showConfirmation(replyToken, data) {
  const message = createTransitFlexMessage(data);
  replyMessage(replyToken, message);
}

/**
 * 登録を確定
 * @param {string} userId - LINE User ID
 * @param {string} replyToken - リプライトークン
 */
function confirmRegister(userId, replyToken) {
  try {
    const userInfo = getUserInfo(userId);
    if (!userInfo || !userInfo.tempData) {
      replyMessage(replyToken, createTextMessage('エラーが発生しました。'));
      return;
    }

    // 必須項目チェック
    const tempData = userInfo.tempData;
    const required = ['storeName', 'arrivalTime', 'destination', 'distance', 'amount', 'vehicleNumber'];
    for (const field of required) {
      if (!tempData[field]) {
        replyMessage(replyToken, createTextMessage(`必須項目（${field}）が入力されていません。`));
        return;
      }
    }

    // レコードを追加
    addRecord(tempData);

    // 状態をリセット
    resetUserState(userId);

    replyMessage(replyToken, createTextMessage('登録が完了しました。'));
  } catch (e) {
    Logger.log('登録確定エラー: ' + e);
    replyMessage(replyToken, createTextMessage(e.message || getErrorMessage('write_error')));
  }
}

/**
 * 修正モードに戻る
 * @param {string} userId - LINE User ID
 * @param {string} replyToken - リプライトークン
 */
function modifyRecord(userId, replyToken) {
  const userInfo = getUserInfo(userId);
  if (!userInfo) {
    replyMessage(replyToken, createTextMessage('エラーが発生しました。'));
    return;
  }

  // 備考入力に戻る
  saveUserInfo(userId, USER_STATES.NEW_NOTE, userInfo.tempData);
  sendPrompt(replyToken, USER_STATES.NEW_NOTE, userInfo.tempData);
}

/**
 * 「戻る」処理
 * @param {string} userId - LINE User ID
 * @param {string} replyToken - リプライトークン
 * @param {Object} userInfo - ユーザー情報
 */
function handleBack(userId, replyToken, userInfo) {
  const currentState = userInfo.state;
  const previousState = getPreviousNewState(currentState);

  if (previousState === USER_STATES.IDLE) {
    resetUserState(userId);
    replyMessage(replyToken, createTextMessage('新規登録をキャンセルしました。'));
    return;
  }

  // 一時データから該当項目を削除
  const tempData = userInfo.tempData || {};
  const stateToField = {
    [USER_STATES.NEW_STORE_NAME]: 'departurePoint',
    [USER_STATES.NEW_VIA_POINT]: 'storeName',
    [USER_STATES.NEW_ARRIVAL_TIME]: 'viaPoint',
    [USER_STATES.NEW_DESTINATION]: 'arrivalTime',
    [USER_STATES.NEW_DISTANCE]: 'destination',
    [USER_STATES.NEW_AMOUNT]: 'distance',
    [USER_STATES.NEW_VEHICLE_NUMBER]: 'amount',
    [USER_STATES.NEW_NOTE]: 'vehicleNumber',
    [USER_STATES.NEW_CONFIRM]: 'note'
  };

  const fieldToDelete = stateToField[currentState];
  if (fieldToDelete && tempData[fieldToDelete]) {
    delete tempData[fieldToDelete];
  }

  saveUserInfo(userId, previousState, tempData);
  sendPrompt(replyToken, previousState, tempData);
}

/**
 * 「進む」処理
 * @param {string} userId - LINE User ID
 * @param {string} replyToken - リプライトークン
 * @param {Object} userInfo - ユーザー情報
 */
function handleForward(userId, replyToken, userInfo) {
  const currentState = userInfo.state;
  const tempData = userInfo.tempData || {};

  // 経由地と備考のみスキップ可能
  if (currentState === USER_STATES.NEW_VIA_POINT) {
    tempData.viaPoint = '';
    const nextState = getNextNewState(currentState);
    saveUserInfo(userId, nextState, tempData);
    sendPrompt(replyToken, nextState, tempData);
  } else if (currentState === USER_STATES.NEW_NOTE) {
    tempData.note = '';
    saveUserInfo(userId, USER_STATES.NEW_CONFIRM, tempData);
    showConfirmation(replyToken, tempData);
  } else {
    replyMessage(replyToken, createTextMessage('この項目はスキップできません。'));
  }
}

/**
 * 「目的地に到着」処理
 * @param {string} userId - LINE User ID
 * @param {string} replyToken - リプライトークン
 * @param {Object} userInfo - ユーザー情報
 */
function handleArrived(userId, replyToken, userInfo) {
  if (userInfo.state !== USER_STATES.NEW_ARRIVAL_TIME) {
    replyMessage(replyToken, createTextMessage('この操作は到着日時入力時のみ有効です。'));
    return;
  }

  const tempData = userInfo.tempData || {};
  tempData.arrivalTime = getCurrentDateTime();

  const nextState = getNextNewState(userInfo.state);
  saveUserInfo(userId, nextState, tempData);
  sendPrompt(replyToken, nextState, tempData);
}
