/**
 * デバッグ用関数
 */

/**
 * 設定をテスト
 */
function testConfig() {
  Logger.log('=== 設定テスト ===');
  Logger.log('LINE_CHANNEL_ACCESS_TOKEN: ' + (LINE_CHANNEL_ACCESS_TOKEN ? '設定済み' : '未設定'));
  Logger.log('SPREADSHEET_ID: ' + (SPREADSHEET_ID ? SPREADSHEET_ID : '未設定'));

  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    Logger.log('エラー: LINE_CHANNEL_ACCESS_TOKENが設定されていません');
    Logger.log('スクリプトプロパティに LINE_ACCESS_TOKEN を設定してください');
  }

  if (!SPREADSHEET_ID) {
    Logger.log('エラー: SPREADSHEET_IDが設定されていません');
    Logger.log('スクリプトプロパティに SPREADSHEET_ID を設定してください');
  }
}

/**
 * スプレッドシート接続をテスト
 */
function testSpreadsheet() {
  Logger.log('=== スプレッドシート接続テスト ===');

  try {
    const ss = getSpreadsheet();
    Logger.log('スプレッドシート取得: OK');
    Logger.log('スプレッドシート名: ' + ss.getName());

    // 各シートの存在確認
    for (const key in SHEET_NAMES) {
      const sheetName = SHEET_NAMES[key];
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        Logger.log(`シート「${sheetName}」: 存在 (${sheet.getLastRow()}行)`);
      } else {
        Logger.log(`シート「${sheetName}」: 存在しません（作成してください）`);
      }
    }
  } catch (e) {
    Logger.log('エラー: ' + e);
  }
}

/**
 * ユーティリティ関数をテスト
 */
function testUtils() {
  Logger.log('=== ユーティリティ関数テスト ===');

  // 日時検証
  Logger.log('日時検証 "2025/12/26 1430": ' + validateDateTime('2025/12/26 1430'));
  Logger.log('日時検証 "2025/12/26": ' + validateDateTime('2025/12/26'));
  Logger.log('日時検証 "invalid": ' + validateDateTime('invalid'));

  // 数値検証
  Logger.log('数値検証 "123": ' + validateNumber('123'));
  Logger.log('数値検証 "123.45": ' + validateNumber('123.45'));
  Logger.log('数値検証 "１２３": ' + validateNumber('１２３'));
  Logger.log('数値検証 "abc": ' + validateNumber('abc'));

  // 全角→半角変換
  Logger.log('全角→半角 "１２３４５": ' + toHalfWidth('１２３４５'));

  // 現在日時
  Logger.log('現在日時: ' + getCurrentDateTime());
  Logger.log('現在日付: ' + getCurrentDate());
}

/**
 * 車両設定を取得テスト
 */
function testGetVehicles() {
  Logger.log('=== 車両設定取得テスト ===');

  try {
    const vehicles = getVehicles();
    Logger.log('車両数: ' + vehicles.length);
    vehicles.forEach(v => {
      Logger.log(`No${v.no}: ${v.vehicleNumber} - ${v.vehicleInfo}`);
    });
  } catch (e) {
    Logger.log('エラー: ' + e);
  }
}

/**
 * 店舗登録を取得テスト
 */
function testGetStores() {
  Logger.log('=== 店舗登録取得テスト ===');

  try {
    const stores = getStores();
    Logger.log('店舗数: ' + stores.length);
    stores.forEach(s => {
      Logger.log(`No${s.no}: ${s.storeName} - ${s.address}`);
    });
  } catch (e) {
    Logger.log('エラー: ' + e);
  }
}

/**
 * 日報範囲設定を取得テスト
 */
function testGetDailyRangeSettings() {
  Logger.log('=== 日報範囲設定取得テスト ===');

  try {
    const settings = getDailyRangeSettings();
    Logger.log('開始: ' + settings.start);
    Logger.log('終了: ' + settings.end);
  } catch (e) {
    Logger.log('エラー: ' + e);
  }
}

/**
 * ユーザー管理テスト
 */
function testUserManagement() {
  Logger.log('=== ユーザー管理テスト ===');

  const testUserId = 'test_user_12345';

  try {
    // ユーザー情報取得（存在しない）
    let userInfo = getUserInfo(testUserId);
    Logger.log('初回取得: ' + (userInfo ? 'あり' : 'なし'));

    // ユーザー情報保存
    saveUserInfo(testUserId, USER_STATES.NEW_DEPARTURE_POINT, { test: 'data' });
    Logger.log('保存: OK');

    // ユーザー情報取得（存在する）
    userInfo = getUserInfo(testUserId);
    Logger.log('2回目取得: ' + (userInfo ? 'あり' : 'なし'));
    if (userInfo) {
      Logger.log('状態: ' + userInfo.state);
      Logger.log('一時データ: ' + JSON.stringify(userInfo.tempData));
    }

    // リセット
    resetUserState(testUserId);
    Logger.log('リセット: OK');

  } catch (e) {
    Logger.log('エラー: ' + e);
  }
}

/**
 * 全テストを実行
 */
function runAllTests() {
  Logger.log('========================================');
  Logger.log('デバッグテスト開始');
  Logger.log('========================================');

  testConfig();
  Logger.log('');

  testSpreadsheet();
  Logger.log('');

  testUtils();
  Logger.log('');

  testGetVehicles();
  Logger.log('');

  testGetStores();
  Logger.log('');

  testGetDailyRangeSettings();
  Logger.log('');

  testUserManagement();

  Logger.log('========================================');
  Logger.log('デバッグテスト終了');
  Logger.log('========================================');
}

/**
 * doPostの動作をシミュレート
 */
function testDoPost() {
  Logger.log('=== doPost シミュレーションテスト ===');

  // LINEからのWebhookをシミュレート
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        events: [
          {
            type: 'message',
            replyToken: 'test_reply_token',
            source: {
              userId: 'test_user_67890'
            },
            message: {
              type: 'text',
              text: '新規'
            }
          }
        ]
      })
    }
  };

  try {
    const result = doPost(mockEvent);
    Logger.log('結果: ' + result.getContent());
  } catch (e) {
    Logger.log('エラー: ' + e);
    Logger.log('スタックトレース: ' + e.stack);
  }
}
