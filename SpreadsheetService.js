/**
 * スプレッドシート操作関連の関数
 */

/**
 * スプレッドシートを取得
 * @return {Spreadsheet} スプレッドシート
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    Logger.log('スプレッドシート取得エラー: ' + e);
    throw new Error(getErrorMessage('read_error'));
  }
}

/**
 * シートを取得
 * @param {string} sheetName - シート名
 * @return {Sheet} シート
 */
function getSheet(sheetName) {
  try {
    const ss = getSpreadsheet();
    return ss.getSheetByName(sheetName);
  } catch (e) {
    Logger.log('シート取得エラー: ' + e);
    throw new Error(getErrorMessage('read_error'));
  }
}

/**
 * 次のNo番号を取得（最大No + 1）
 * @param {string} sheetName - シート名
 * @return {number} 次のNo番号
 */
function getNextNo(sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return 1; // ヘッダーのみの場合は1
    }

    let maxNo = 0;
    for (let i = 1; i < data.length; i++) {
      const no = parseInt(data[i][0]);
      if (!isNaN(no) && no > maxNo) {
        maxNo = no;
      }
    }

    return maxNo + 1;
  } catch (e) {
    Logger.log('No取得エラー: ' + e);
    return 1;
  }
}

/**
 * 運転記録を追加
 * @param {Object} record - レコードオブジェクト
 */
function addRecord(record) {
  try {
    const sheet = getSheet(SHEET_NAMES.RECORDS);
    const no = getNextNo(SHEET_NAMES.RECORDS);

    const row = [
      no,
      record.departureTime || '',
      record.departurePoint || '',
      record.storeName || '',
      record.viaPoint || '',
      record.arrivalTime || '',
      record.destination || '',
      record.distance || '',
      record.amount || '',
      record.vehicleNumber || '',
      record.note || ''
    ];

    sheet.appendRow(row);
  } catch (e) {
    Logger.log('レコード追加エラー: ' + e);
    throw new Error(getErrorMessage('write_error'));
  }
}

/**
 * 運転記録を更新
 * @param {number} rowIndex - 行インデックス（1始まり、ヘッダー含む）
 * @param {Object} record - レコードオブジェクト
 */
function updateRecord(rowIndex, record) {
  try {
    const sheet = getSheet(SHEET_NAMES.RECORDS);

    const row = [
      record.no,
      record.departureTime || '',
      record.departurePoint || '',
      record.storeName || '',
      record.viaPoint || '',
      record.arrivalTime || '',
      record.destination || '',
      record.distance || '',
      record.amount || '',
      record.vehicleNumber || '',
      record.note || ''
    ];

    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } catch (e) {
    Logger.log('レコード更新エラー: ' + e);
    throw new Error(getErrorMessage('write_error'));
  }
}

/**
 * 運転記録を削除
 * @param {number} rowIndex - 行インデックス（1始まり、ヘッダー含む）
 */
function deleteRecord(rowIndex) {
  try {
    const sheet = getSheet(SHEET_NAMES.RECORDS);
    sheet.deleteRow(rowIndex);
  } catch (e) {
    Logger.log('レコード削除エラー: ' + e);
    throw new Error(getErrorMessage('write_error'));
  }
}

/**
 * 運転記録を検索
 * @param {string} date - 日付（yyyy/MM/dd）
 * @param {string} vehicleNumber - 車両番号（オプション）
 * @param {string} filterType - フィルタータイプ（'hour' or 'store'）
 * @param {string} filterValue - フィルター値
 * @return {Array} レコード配列（各レコードは{rowIndex, data}の形式）
 */
function searchRecords(date, vehicleNumber = null, filterType = null, filterValue = null) {
  try {
    const sheet = getSheet(SHEET_NAMES.RECORDS);
    const data = sheet.getDataRange().getValues();
    const results = [];

    // 日報範囲設定を取得
    const rangeSettings = getDailyRangeSettings();
    const startHour = rangeSettings.start;
    const endHour = rangeSettings.end;

    // 検索範囲の開始・終了日時を計算
    const searchDate = new Date(date);
    const startDateTime = new Date(searchDate);
    startDateTime.setHours(startHour, 0, 0, 0);

    let endDateTime = new Date(searchDate);
    if (endHour < startHour) {
      // 翌日
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
    endDateTime.setHours(endHour, 0, 0, 0);

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const departureTimeStr = row[1]; // B列：出発日時

      if (!departureTimeStr) continue;

      // 出発日時をDateオブジェクトに変換
      const depTime = parseDateTimeString(departureTimeStr);
      if (!depTime) continue;

      // 日時範囲チェック
      if (depTime < startDateTime || depTime >= endDateTime) continue;

      // 車両番号フィルター
      if (vehicleNumber && row[9] !== vehicleNumber) continue;

      // 追加フィルター
      if (filterType === 'hour' && filterValue) {
        const hour = depTime.getHours();
        if (hour !== parseInt(filterValue)) continue;
      }

      if (filterType === 'store' && filterValue) {
        if (row[3] !== filterValue) continue; // D列：店舗名
      }

      results.push({
        rowIndex: i + 1, // 1始まりの行番号
        data: {
          no: row[0],
          departureTime: row[1],
          departurePoint: row[2],
          storeName: row[3],
          viaPoint: row[4],
          arrivalTime: row[5],
          destination: row[6],
          distance: row[7],
          amount: row[8],
          vehicleNumber: row[9],
          note: row[10]
        }
      });
    }

    return results;
  } catch (e) {
    Logger.log('レコード検索エラー: ' + e);
    throw new Error(getErrorMessage('read_error'));
  }
}

/**
 * 日時文字列をDateオブジェクトに変換
 * @param {string} dateTimeStr - 日時文字列（yyyy/MM/dd HHmm）
 * @return {Date|null} Dateオブジェクト
 */
function parseDateTimeString(dateTimeStr) {
  if (!dateTimeStr) return null;

  const pattern = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2})(\d{2})$/;
  const match = String(dateTimeStr).match(pattern);

  if (!match) return null;

  const year = parseInt(match[1]);
  const month = parseInt(match[2]) - 1; // 月は0始まり
  const day = parseInt(match[3]);
  const hour = parseInt(match[4]);
  const minute = parseInt(match[5]);

  return new Date(year, month, day, hour, minute);
}

/**
 * 車両設定を取得
 * @return {Array} 車両配列
 */
function getVehicles() {
  try {
    const sheet = getSheet(SHEET_NAMES.VEHICLE_SETTINGS);
    const data = sheet.getDataRange().getValues();
    const vehicles = [];

    for (let i = 1; i < data.length; i++) {
      vehicles.push({
        no: data[i][0],
        vehicleNumber: data[i][1],
        vehicleInfo: data[i][2]
      });
    }

    return vehicles;
  } catch (e) {
    Logger.log('車両設定取得エラー: ' + e);
    throw new Error(getErrorMessage('read_error'));
  }
}

/**
 * 店舗登録を取得
 * @return {Array} 店舗配列
 */
function getStores() {
  try {
    const sheet = getSheet(SHEET_NAMES.STORE_REGISTRATION);
    const data = sheet.getDataRange().getValues();
    const stores = [];

    for (let i = 1; i < data.length; i++) {
      stores.push({
        no: data[i][0],
        storeName: data[i][1],
        address: data[i][2]
      });
    }

    return stores;
  } catch (e) {
    Logger.log('店舗登録取得エラー: ' + e);
    throw new Error(getErrorMessage('read_error'));
  }
}

/**
 * 日報範囲設定を取得
 * @return {Object} {start: 開始時刻, end: 終了時刻}
 */
function getDailyRangeSettings() {
  try {
    const sheet = getSheet(SHEET_NAMES.DAILY_RANGE_SETTINGS);
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      // デフォルト値
      return { start: 19, end: 28 };
    }

    return {
      start: parseInt(data[1][1]) || 19, // B2セル
      end: parseInt(data[1][2]) || 28    // C2セル
    };
  } catch (e) {
    Logger.log('日報範囲設定取得エラー: ' + e);
    return { start: 19, end: 28 };
  }
}
