/**
 * 設定ファイル
 * LINE Channel Access TokenとスプレッドシートIDを設定してください
 */

// ScriptPropertyの取得
const scriptProperties = PropertiesService.getScriptProperties();

// LINE設定
const LINE_CHANNEL_ACCESS_TOKEN = scriptProperties.getProperty('LINE_ACCESS_TOKEN');

// スプレッドシート設定
const SPREADSHEET_ID = scriptProperties.getProperty('SPREADSHEET_ID');

// シート名
const SHEET_NAMES = {
  RECORDS: '運転記録',
  USER_MANAGEMENT: 'ユーザー管理',
  VEHICLE_SETTINGS: '車両設定',
  STORE_REGISTRATION: '店舗登録',
  DAILY_RANGE_SETTINGS: '日報範囲設定'
};

// タイムアウト設定（ミリ秒）
const TIMEOUT_MINUTES = 30;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

// 日時フォーマット
const DATE_FORMAT = 'yyyy/MM/dd';
const DATETIME_FORMAT = 'yyyy/MM/dd HHmm';

// ユーザー状態
const USER_STATES = {
  IDLE: 'アイドル',
  // 新規登録
  NEW_DEPARTURE_POINT: '出発地点入力中',
  NEW_STORE_NAME: '店舗名入力中',
  NEW_VIA_POINT: '経由地入力中',
  NEW_ARRIVAL_TIME: '到着日時入力中',
  NEW_DESTINATION: '目的地入力中',
  NEW_DISTANCE: '走行距離入力中',
  NEW_AMOUNT: '金額入力中',
  NEW_VEHICLE_NUMBER: '車両番号入力中',
  NEW_NOTE: '備考入力中',
  NEW_CONFIRM: '新規登録確認中',
  // 日報
  REPORT_DATE_SELECT: '日報_日付選択中',
  REPORT_VEHICLE_SELECT: '日報_車両選択中',
  // 削除
  DELETE_DATE_SELECT: '削除_日付選択中',
  DELETE_FILTER_SELECT: '削除_絞り込み選択中',
  DELETE_RECORD_SELECT: '削除_レコード選択中',
  DELETE_CONFIRM: '削除_確認中',
  // 編集
  EDIT_DATE_SELECT: '編集_日付選択中',
  EDIT_FILTER_SELECT: '編集_絞り込み選択中',
  EDIT_RECORD_SELECT: '編集_レコード選択中',
  EDIT_FIELD_SELECT: '編集_項目選択中',
  EDIT_INPUT: '編集_入力中',
  EDIT_CONTINUE: '編集_継続確認中',
  EDIT_CONFIRM: '編集_確認中'
};

// ボタンアクション
const ACTIONS = {
  NEW: 'action_new',
  REPORT: 'action_report',
  DELETE: 'action_delete',
  EDIT: 'action_edit',
  CANCEL: 'action_cancel',
  BACK: 'action_back',
  FORWARD: 'action_forward',
  LOCATION: 'action_location',
  ARRIVED: 'action_arrived',
  CONFIRM_REGISTER: 'action_confirm_register',
  CONFIRM_MODIFY: 'action_confirm_modify',
  DELETE_EXECUTE: 'action_delete_execute',
  DELETE_CANCEL: 'action_delete_cancel',
  EDIT_CONTINUE: 'action_edit_continue',
  EDIT_COMPLETE: 'action_edit_complete',
  TIMEOUT_CONTINUE: 'action_timeout_continue',
  TIMEOUT_RESET: 'action_timeout_reset'
};
