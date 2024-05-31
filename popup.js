document.addEventListener('DOMContentLoaded', function() {
  const regularWorkingTimeInput = document.getElementById('setWorkingTimePerDay');

  // 保存された値を取得して入力フィールドに設定
  chrome.storage.sync.get(['regularWorkTime'], function(result) {
    if (result.regularWorkTime) {
        regularWorkingTimeInput.value = result.regularWorkTime;
        console.log('保存された1日の勤務時間を設定:', result.regularWorkTime);
    }
  });

  // KingOfTimeのページを開く
  document.getElementById('openPageButton').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://s2.ta.kingoftime.jp/admin' });
  });

  // 設定を保存
  document.getElementById('changeSettings').addEventListener('click', () => {
    chrome.storage.sync.set({ regularWorkTime: regularWorkingTimeInput.value }, function() {
      console.log('1日の勤務時間を保存:', regularWorkingTimeInput.value);
    });
  });
});
