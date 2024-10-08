document.addEventListener('DOMContentLoaded', function() {
  const regularWorkingTimeInput = document.getElementById('setWorkingTimePerDay');
  const workingTimeTitleInput = document.getElementById('setWorkingTimeTitle');
  const ignoreWorkingTimeDatesInput = document.getElementById('setIgnoreWorkingTimeDates');

  // 保存された値を取得して入力フィールドに設定
  chrome.storage.sync.get(['regularWorkTime'], function(result) {
    if (result.regularWorkTime) {
        regularWorkingTimeInput.value = result.regularWorkTime;
    }
  });
  chrome.storage.sync.get(['WorkTimeTitle'], function(result) {
    if (result.WorkTimeTitle) {
        workingTimeTitleInput.value = result.WorkTimeTitle;
    }
  });
  chrome.storage.sync.get(['ignoreWorkingTimeDates'], function(result) {
    if (result.ignoreWorkingTimeDates) {
        ignoreWorkingTimeDatesInput.value = result.ignoreWorkingTimeDates;
    }
  });

  // KingOfTimeのページを開く
  document.getElementById('openPageButton').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://s2.ta.kingoftime.jp/admin' });
  });

  // 設定を保存
  document.getElementById('changeSettings').addEventListener('click', () => {
    if(regularWorkingTimeInput.value != null && regularWorkingTimeInput.value !== ''){
      const match = regularWorkingTimeInput.value.trim().match(/^([-+]?)(\d+)\.(\d\d)$/);
      if (!match) {
        alert('労働時間は「8.00」や「8.30」のような形式で入力してください。');
        return;
      }
    }
    chrome.storage.sync.set({ regularWorkTime: regularWorkingTimeInput.value });
    chrome.storage.sync.set({ WorkTimeTitle: workingTimeTitleInput.value });
    chrome.storage.sync.set({ ignoreWorkingTimeDates: ignoreWorkingTimeDatesInput.value });
  });
});
