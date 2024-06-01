document.addEventListener('DOMContentLoaded', function() {
  const regularWorkingTimeInput = document.getElementById('setWorkingTimePerDay');
  const workingTimeTitleInput = document.getElementById('setWorkingTimeTitle');

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

  // KingOfTimeのページを開く
  document.getElementById('openPageButton').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://s2.ta.kingoftime.jp/admin' });
  });

  // 設定を保存
  document.getElementById('changeSettings').addEventListener('click', () => {
    chrome.storage.sync.set({ regularWorkTime: regularWorkingTimeInput.value });
    chrome.storage.sync.set({ WorkTimeTitle: workingTimeTitleInput.value });
  });
});
