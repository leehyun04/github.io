// 로컬 스토리지 데이터 및 통계 매니저
class StorageManager {
  constructor() {
    this.KEY_STATS = 'webcleaner_stats_v1';
    this.KEY_HISTORY = 'webcleaner_history_v1';
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.KEY_STATS)) {
      const defaultStats = {
        totalGames: 0,
        totalClears: 0,
        totalFails: 0,
        totalButtonsCleaned: 0,
        maxCombo: 0,
        bestTimes: {
          easy: null,
          normal: null,
          hard: null,
          infinite: null
        },
        highestInfiniteFloor: 0
      };
      this.saveStats(defaultStats);
    }

    if (!localStorage.getItem(this.KEY_HISTORY)) {
      this.saveHistory([]);
    }
  }

  getStats() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY_STATS));
    } catch(e) {
      return null;
    }
  }

  saveStats(stats) {
    localStorage.setItem(this.KEY_STATS, JSON.stringify(stats));
  }

  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY_HISTORY)) || [];
    } catch(e) {
      return [];
    }
  }

  saveHistory(history) {
    localStorage.setItem(this.KEY_HISTORY, JSON.stringify(history.slice(0, 30))); // 최근 30개만
  }

  recordGame(mode, isClear, cleanedCount, totalButtons, timeSeconds, combo, extraInfo = '') {
    const stats = this.getStats() || {};
    stats.totalGames = (stats.totalGames || 0) + 1;
    stats.totalButtonsCleaned = (stats.totalButtonsCleaned || 0) + cleanedCount;
    stats.maxCombo = Math.max(stats.maxCombo || 0, combo);

    if (isClear) {
      stats.totalClears = (stats.totalClears || 0) + 1;
      if (!stats.bestTimes) stats.bestTimes = {};
      if (!stats.bestTimes[mode] || timeSeconds < stats.bestTimes[mode]) {
        stats.bestTimes[mode] = timeSeconds;
      }
    } else {
      stats.totalFails = (stats.totalFails || 0) + 1;
    }

    this.saveStats(stats);

    const history = this.getHistory();
    history.unshift({
      date: new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      mode: mode,
      isClear: isClear,
      cleanedCount: cleanedCount,
      totalButtons: totalButtons,
      progressRate: Math.round((cleanedCount / totalButtons) * 100),
      time: timeSeconds.toFixed(1) + '초',
      combo: combo,
      reason: extraInfo
    });
    this.saveHistory(history);
  }

  resetAll() {
    localStorage.removeItem(this.KEY_STATS);
    localStorage.removeItem(this.KEY_HISTORY);
    this.init();
  }
}

window.storageManager = new StorageManager();
