/**
 * LINE Messaging API関連の関数
 */

/**
 * LINEにメッセージを送信
 * @param {string} replyToken - リプライトークン
 * @param {Array|Object} messages - メッセージオブジェクト（配列または単一）
 */
function replyMessage(replyToken, messages) {
  const url = 'https://api.line.me/v2/bot/message/reply';

  // 単一メッセージの場合は配列に変換
  const messageArray = Array.isArray(messages) ? messages : [messages];

  const payload = {
    replyToken: replyToken,
    messages: messageArray
  };

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify(payload)
  };

  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log('LINE送信エラー: ' + e);
    throw new Error(getErrorMessage('communication_error'));
  }
}

/**
 * テキストメッセージを作成
 * @param {string} text - テキスト
 * @return {Object} メッセージオブジェクト
 */
function createTextMessage(text) {
  return {
    type: 'text',
    text: text
  };
}

/**
 * ボタンテンプレートメッセージを作成
 * @param {string} text - テキスト
 * @param {Array} actions - アクション配列
 * @return {Object} メッセージオブジェクト
 */
function createButtonTemplate(text, actions) {
  return {
    type: 'template',
    altText: text,
    template: {
      type: 'buttons',
      text: text,
      actions: actions
    }
  };
}

/**
 * 確認テンプレートメッセージを作成
 * @param {string} text - テキスト
 * @param {Object} yesAction - はいアクション
 * @param {Object} noAction - いいえアクション
 * @return {Object} メッセージオブジェクト
 */
function createConfirmTemplate(text, yesAction, noAction) {
  return {
    type: 'template',
    altText: text,
    template: {
      type: 'confirm',
      text: text,
      actions: [yesAction, noAction]
    }
  };
}

/**
 * 日付選択ボタンを作成
 * @return {Array} アクション配列
 */
function createDateSelectActions() {
  const dates = getDateList7Days();
  const actions = [];

  for (let i = 0; i < Math.min(dates.length, 4); i++) {
    actions.push({
      type: 'message',
      label: dates[i],
      text: dates[i]
    });
  }

  return actions;
}

/**
 * 車両選択ボタンを作成
 * @return {Array} アクション配列
 */
function createVehicleSelectActions() {
  const vehicles = getVehicles();
  const actions = [];

  for (let i = 0; i < Math.min(vehicles.length, 4); i++) {
    actions.push({
      type: 'message',
      label: vehicles[i].vehicleNumber,
      text: vehicles[i].vehicleNumber
    });
  }

  return actions;
}

/**
 * 店舗選択ボタンを作成
 * @return {Array} アクション配列
 */
function createStoreSelectActions() {
  const stores = getStores();
  const actions = [];

  for (let i = 0; i < Math.min(stores.length, 4); i++) {
    actions.push({
      type: 'message',
      label: stores[i].storeName,
      text: stores[i].storeName
    });
  }

  return actions;
}

/**
 * Transit形式のFlex Messageを作成（新規登録確認用）
 * @param {Object} data - レコードデータ
 * @return {Object} Flex Message
 */
function createTransitFlexMessage(data) {
  return {
    type: 'flex',
    altText: '登録内容の確認',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '登録内容の確認',
            weight: 'bold',
            size: 'xl',
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              createInfoRow('出発日時', data.departureTime || ''),
              createInfoRow('出発地点', data.departurePoint || ''),
              createInfoRow('店舗名', data.storeName || ''),
              createInfoRow('経由地', data.viaPoint || ''),
              createInfoRow('到着日時', data.arrivalTime || ''),
              createInfoRow('目的地', data.destination || ''),
              createInfoRow('走行距離', data.distance || ''),
              createInfoRow('金額', data.amount || ''),
              createInfoRow('車両番号', data.vehicleNumber || ''),
              createInfoRow('備考', data.note || '')
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#17c950',
            action: {
              type: 'postback',
              label: '登録する',
              data: ACTIONS.CONFIRM_REGISTER
            }
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: '修正する',
              data: ACTIONS.CONFIRM_MODIFY
            }
          }
        ]
      }
    }
  };
}

/**
 * 情報行を作成（Flex Message用）
 * @param {string} label - ラベル
 * @param {string} value - 値
 * @return {Object} ボックス
 */
function createInfoRow(label, value) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: label,
        size: 'sm',
        color: '#555555',
        flex: 0,
        wrap: true
      },
      {
        type: 'text',
        text: value || '-',
        size: 'sm',
        color: '#111111',
        align: 'end',
        wrap: true
      }
    ]
  };
}

/**
 * タイムアウト確認メッセージを作成
 * @param {string} stateName - 状態名
 * @return {Object} メッセージオブジェクト
 */
function createTimeoutConfirmMessage(stateName) {
  return createConfirmTemplate(
    `前回の入力（${stateName}）が残っています。\n続きから入力しますか？`,
    {
      type: 'postback',
      label: '続きから入力',
      data: ACTIONS.TIMEOUT_CONTINUE
    },
    {
      type: 'postback',
      label: '最初から',
      data: ACTIONS.TIMEOUT_RESET
    }
  );
}
