/**
 * メインのWebhookハンドラー
 */

/**
 * LINEからのWebhookを受信
 * @param {Object} e - イベントオブジェクト
 * @return {Object} レスポンス
 */
function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const events = contents.events;

    for (const event of events) {
      handleEvent(event);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('doPostエラー: ' + error);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * イベントを処理
 * @param {Object} event - LINEイベント
 */
function handleEvent(event) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;

  try {
    if (event.type === 'message') {
      handleMessageEvent(event, userId, replyToken);
    } else if (event.type === 'postback') {
      handlePostbackEvent(event, userId, replyToken);
    }
  } catch (error) {
    Logger.log('イベント処理エラー: ' + error);
    replyMessage(replyToken, createTextMessage(getErrorMessage('communication_error')));
  }
}

/**
 * メッセージイベントを処理
 * @param {Object} event - イベント
 * @param {string} userId - ユーザーID
 * @param {string} replyToken - リプライトークン
 */
function handleMessageEvent(event, userId, replyToken) {
  const messageType = event.message.type;

  if (messageType === 'text') {
    const text = event.message.text.trim();
    handleTextMessage(userId, text, replyToken);
  } else if (messageType === 'location') {
    handleLocationMessage(userId, event.message, replyToken);
  }
}

/**
 * テキストメッセージを処理
 * @param {string} userId - ユーザーID
 * @param {string} text - テキスト
 * @param {string} replyToken - リプライトークン
 */
function handleTextMessage(userId, text, replyToken) {
  const userInfo = getUserInfo(userId);

  // タイムアウトチェック
  if (userInfo && isTimedOut(userId)) {
    const message = createTimeoutConfirmMessage(userInfo.state);
    replyMessage(replyToken, message);
    return;
  }

  const currentState = userInfo ? userInfo.state : USER_STATES.IDLE;

  // コマンド処理
  if (text === '新規' || text === '新規登録') {
    startNewRecord(userId, replyToken);
    return;
  }

  if (text === '取消' || text === 'キャンセル') {
    resetUserState(userId);
    replyMessage(replyToken, createTextMessage('操作をキャンセルしました。'));
    return;
  }

  // 状態に応じた処理
  if (currentState === USER_STATES.IDLE) {
    replyMessage(replyToken, createTextMessage('「新規」と入力して新規登録を開始してください。'));
  } else if (isNewRecordState(currentState)) {
    handleNewRecordInput(userId, text, replyToken, userInfo);
  } else {
    replyMessage(replyToken, createTextMessage('不明な操作です。'));
  }
}

/**
 * 位置情報メッセージを処理
 * @param {string} userId - ユーザーID
 * @param {Object} location - 位置情報
 * @param {string} replyToken - リプライトークン
 */
function handleLocationMessage(userId, location, replyToken) {
  const userInfo = getUserInfo(userId);
  if (!userInfo) {
    replyMessage(replyToken, createTextMessage('エラーが発生しました。'));
    return;
  }

  const state = userInfo.state;

  // 出発地点、経由地、目的地のみ位置情報を受け付ける
  const validStates = [
    USER_STATES.NEW_DEPARTURE_POINT,
    USER_STATES.NEW_VIA_POINT,
    USER_STATES.NEW_DESTINATION
  ];

  if (!validStates.includes(state)) {
    replyMessage(replyToken, createTextMessage('この項目では位置情報を使用できません。'));
    return;
  }

  // 座標から住所を取得
  const address = getAddressFromCoordinates(location.latitude, location.longitude);

  // 住所として処理
  handleNewRecordInput(userId, address, replyToken, userInfo);
}

/**
 * ポストバックイベントを処理
 * @param {Object} event - イベント
 * @param {string} userId - ユーザーID
 * @param {string} replyToken - リプライトークン
 */
function handlePostbackEvent(event, userId, replyToken) {
  const data = event.postback.data;
  const userInfo = getUserInfo(userId);

  switch (data) {
    case ACTIONS.CONFIRM_REGISTER:
      confirmRegister(userId, replyToken);
      break;

    case ACTIONS.CONFIRM_MODIFY:
      modifyRecord(userId, replyToken);
      break;

    case ACTIONS.BACK:
      if (userInfo && isNewRecordState(userInfo.state)) {
        handleBack(userId, replyToken, userInfo);
      }
      break;

    case ACTIONS.FORWARD:
      if (userInfo && isNewRecordState(userInfo.state)) {
        handleForward(userId, replyToken, userInfo);
      }
      break;

    case ACTIONS.ARRIVED:
      if (userInfo) {
        handleArrived(userId, replyToken, userInfo);
      }
      break;

    case ACTIONS.CANCEL:
      resetUserState(userId);
      replyMessage(replyToken, createTextMessage('操作をキャンセルしました。'));
      break;

    case ACTIONS.TIMEOUT_CONTINUE:
      if (userInfo) {
        sendPrompt(replyToken, userInfo.state, userInfo.tempData);
      }
      break;

    case ACTIONS.TIMEOUT_RESET:
      resetUserState(userId);
      replyMessage(replyToken, createTextMessage('状態をリセットしました。'));
      break;

    default:
      replyMessage(replyToken, createTextMessage('不明な操作です。'));
      break;
  }
}

/**
 * 新規登録の状態かどうかをチェック
 * @param {string} state - 状態
 * @return {boolean} 新規登録の状態ならtrue
 */
function isNewRecordState(state) {
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

  return newStates.includes(state);
}

/**
 * デバッグ用：doGetでテスト
 */
function doGet() {
  return ContentService.createTextOutput('LINE Bot is running');
}
