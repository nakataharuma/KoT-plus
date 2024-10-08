// シェルから関数やクラスを検証する
// ```
// $ node
// > .load content.js  エラーが発生するが、Timeなどはロードできている
// ```
// ======================================== クラス ========================================

// 時間を扱うクラス
class Time {
  // 時間と分を指定してTimeを作成
  constructor(minute = 0) {
    // intではない時にはエラーを投げる
    if (!Number.isInteger(minute)) {
      throw new Error('hourとminuteは整数で指定してください');
    }
    this.minute = minute;
  }

  // 文字列(ex 9.01)を指定してTimeを作成
  static fromString(timeString = '-0.00') {
    const match = timeString.trim().match(/^([-+]?)(\d+)\.(\d+)$/);
    if (!match) {
      throw new Error('Invalid time format. Expected format is "+/-H.MM"' + timeString);
    }
    const [_, sign, hour, minute] = match;
    const result = parseInt(hour) * 60 + parseInt(minute);
    if(sign === '-') return new Time(-1 * result);
    else return new Time(result);
  }

  // Time同士の引き算
  minus(other = new Time(0)) {
    return new Time(this.minute - other.minute);
  }

  // Time同士の足し算
  plus(other = new Time(0)) {
    return new Time(this.minute + other.minute);
  }

  // 整数による除算
  divide(divisor = 1) {
    return new Time(Math.floor(this.minute / divisor));
  }

  // 文字列に変換
  toString() {
    const sign = this.minute < 0 ? '-' : '';
    const absMinute = Math.abs(this.minute);
    return `${sign}${Math.floor(absMinute / 60)}.${String(absMinute % 60).padStart(2, '0')}`;
  }
}

// 日数を扱うクラス(基本的に[10や10.0や0.5]などの形式を扱うため文字列で扱う)
// 小数点第1桁までを扱う
class Days{
  // 日数を指定してDayを作成
  constructor(day = '0.0') {
    // 小数点が含まれていない場合、.0を追加
    if (!day.includes('.')) day += '.0';
    this.day = day;
  }

  // 整数部分を取得
  getIntegerPart() {
    return parseInt(this.day.split('.')[0]);
  }

  // 小数部分を取得
  getDecimalPart() {
    return parseInt(this.day.split('.')[1]);
  }

  // 日数を整数で取得
  getDays() {
    if(this.getDecimalPart() !== 0) throw new Error('小数部分があるため整数に変換できません');
    return this.getIntegerPart();
  }

  // 足し算
  plus(other = new Days('0.0')) {
    let integerPart = this.getIntegerPart() + other.getIntegerPart();
    let decimalPart = this.getDecimalPart() + other.getDecimalPart();
    if (decimalPart >= 10) {
      decimalPart -= 10;
      integerPart += 1;
    }
    return new Days(`${integerPart}.${decimalPart}`);
  }
}

// ======================================== メイン処理 ========================================

async function main() {
  // テーブルを取得
  const table = document.querySelector('.specific-table_800');

  // テーブルが存在する場合のみ実行
  if (table) {
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody tr');

    // 新しいヘッダセルを作成
    const newHeaderCell = document.createElement('th');
    newHeaderCell.className = 'custom9';
    newHeaderCell.innerHTML = '<p>残業貯金</p>';
    thead.appendChild(newHeaderCell);

    // 新しいボディセルを作成
    const newBodyCell = document.createElement('td');
    newBodyCell.className = 'custom9';
    newBodyCell.innerHTML = '&nbsp;'; // 初期値として空白を設定
    tbody.appendChild(newBodyCell);

    // 残業貯金の計算
    try {
      const regularWorkTimePerDay = await getRegularWorkTimePerDay(); // 日の基本労働時間
      const amountOfOvertime = await getOverWorkTime(regularWorkTimePerDay); // 残業時間

      // 新しいボディセルに残業貯金を表示
      newBodyCell.textContent = amountOfOvertime.toString();
    } catch (error) {
      console.error('Error calculating overtime:', error);
      newBodyCell.textContent = '計算エラー';
    }
  }
}

// 非同期処理の開始
main().catch(error => console.error('Error in main function:', error));

// ======================================== 関数 ========================================

// 1日の基本労働時間を取得
async function getRegularWorkTimePerDay() {
  try {
    const value = await chrome.storage.sync.get(['regularWorkTime']);
    if (value.regularWorkTime === '' || value.regularWorkTime == null) {
      return Time.fromString('8.00');
    }
    return Time.fromString(value.regularWorkTime);
  } catch (error) {
    return Time.fromString('8.00');
  }
}

// 残業時間を取得
async function getOverWorkTime(regularWorkTimePerDay = new Time(0)){
  let amountOfOvertime = new Time(0); // 残業時間
  const workTimes = await getWorkTime();
  if(workTimes.length > 0){
    workTimes.forEach((workTime) => {
      amountOfOvertime = amountOfOvertime.plus(workTime.minus(regularWorkTimePerDay));
    });
  }
  return amountOfOvertime;
}

// ======================================== 要素を取得する関数 ========================================

// NOTE 基本基準時間を取得（現在は未使用）
function getRegularWorkTime(){
  const regularWorkTimeElement = document.querySelector('.specific-table_800 tbody td.custom1');
  if (regularWorkTimeElement) {
    const regularWorkTimeText = regularWorkTimeElement.textContent.trim();
    if(regularWorkTimeText === ''){
      console.log('基本労働時間が見つかりませんでした。')
      return null;
    }
    return Time.fromString(regularWorkTimeText);
  } else {
    console.log('基本労働時間が見つかりませんでした。')
    return null;
  }
}

// 労働日数を取得(平日から取得)
function getWorkCount(){
  const workCountElement = document.querySelector('.specific-daysCount_1 li > div.work_count');
  if (workCountElement) {
    const workCountDays = new Days(workCountElement.textContent);
    return workCountDays;
  } else {
    console.log('労働日数が見つかりませんでした。');
    return new Days('0.0');
  }
}

// 有給休暇日数を取得(小数)
function getPaidHolidayCount(){
  // "有休"のラベルを持つli要素を選択
  const listItem = Array.from(document.querySelectorAll('.specific-daysCount_1 li')).find(item => {
    const label = item.querySelector('label.holiday_count');
    return label && label.textContent.trim() === '有休';
  });

  // "有休"の値を持つdiv要素を取得
  if (listItem) {
    const valueDiv = listItem.querySelector('div.holiday_count');
    const valueText = valueDiv ? valueDiv.textContent.trim() : '';
    const valueMatch = valueText.match(/^\d+(\.\d+)?/);
    const value = valueMatch ? new Days(valueMatch[0]) : '値が見つかりません';
    if(value === '値が見つかりません') console.log('有給休暇日数が見つかりませんでした。');
    return value;
  } else {
    console.log('有給休暇日数が見つかりませんでした。');
    return new Days('0.0');
  }
}


class TableRecordByDate {
  constructor(trElement) {
    this.trElement = trElement;
  }

  getDateTd() {
    return this.trElement.querySelector("td.htBlock-scrollTable_day");
  }

  getTdFromClassName(className) {
    return this.trElement.querySelector(`td.${className}`);
  }
}

// 働いた日の労働時間を取得
async function getWorkTime(){
  // 設定値を取得
  let workTimeTitle = '労働合計';
  try{
    // MEMO: 労働合計のラベルを取得する？
    value = await chrome.storage.sync.get(['WorkTimeTitle']);
    workTimeTitle = value.WorkTimeTitle;
    if(workTimeTitle === '' || workTimeTitle == null){
      workTimeTitle = '労働合計';
    }
  } catch (error) {
    console.log('労働時間のタイトルを取得できませんでした。');
  }

  // タイトルが一致するclass名を取得
  // MEMO: テーブルヘッダーの中で、労働時間というラベルを探している
  const possibleHeaderElements = Array.from(document.querySelectorAll('.htBlock-adjastableTableF thead th'));
  const workTimeHeaderElement = possibleHeaderElements.find((possibleHeader) => {
    const lebel = possibleHeader.querySelector('p').textContent;
    // <br />タグを削除する
    // MEMO: `労働<br />合計`となっているから
    const lebelWithoutBr = lebel.replace(/\s*<br\s*\/?>\s*/gi, '').trim();
    if(lebelWithoutBr === workTimeTitle) return true;
  });
  if(!workTimeHeaderElement){
    console.log(`列が見つかりませんでした。タイトル:${workTimeTitle}`);
    return null;
  }

  // 列が見つかった状態
  const workTimeClass = workTimeHeaderElement.className.split(' ')[0];  // custom5
  if(!workTimeClass){
    console.log('労働時間の列が見つかりませんでした。');
    return null;
  }

  // MEMO: 日付ヘッダーを見つける
  // const dateHeader = document.querySelector('.htBlock-adjastableTableF thead th.specific_date p');

  // すべての日付レコードをTableRecordByDateへ変換する
  const TableRecordByDateArray = Array.from(
    document.querySelectorAll('.htBlock-adjastableTableF tbody tr'),
    td => new TableRecordByDate(td)
  );

  // 労働時間を取得
  const arrayOfWorkTime = []; // 労働時間の配列

  // // 労働時間ヘッダーのクラス名から労働時間の値の配列を取得している
  // const workTimeElements = document.querySelectorAll(`.htBlock-adjastableTableF tbody td.${workTimeClass} > p`);
  // if(workTimeElements.length > 0){
  //   workTimeElements.forEach((workTimeElement) => {
  //     const workTimeText = workTimeElement.textContent;

  //     // 労働時間の値が書き込まれていなかったら（明日に勤怠打刻はない）、労働時間をリストに挿入するのやめる
  //     try{
  //       let workTimeTextString = Time.fromString(workTimeText);
  //       // console.log(`workTimeTextString: ${workTimeTextString}`);
  //       arrayOfWorkTime.push(workTimeTextString);
  //     } catch (e) {
  //       return;
  //     }
  //   });
  // }

  // TEST: 無視する日付
  const testIgnoreDate = '10/03（木）';

  // 日付レコードそれぞれに対して、日付と労働合計（1日分）を取得し、合計する
  TableRecordByDateArray.forEach((TableRecordByDate) => {
    const dateTd = TableRecordByDate.getDateTd();
    const dateText = dateTd.querySelector('p').textContent.trim();  // 改行と空白を取り除く

    console.log(`testIgnoreDate: ${testIgnoreDate}, dateText: ${dateText}`);
    // 除外指定された日付は無視する
    if (dateText === testIgnoreDate) {
      console.log("ignore!");
      return;
    }

    const workTimeTd = TableRecordByDate.getTdFromClassName(workTimeClass);
    const workTimeRawText = workTimeTd.querySelector('p').textContent;

    // Timeへの変換が失敗した場合、労働合計の値が入っていないとみなす
    try {
      const workTimeText = Time.fromString(workTimeRawText);
      arrayOfWorkTime.push(workTimeText);
      console.log(`dateText: ${dateText}, workTimeText: ${workTimeText}`);
    } catch (e) {
      return;
    }
  })

  return arrayOfWorkTime;
}
