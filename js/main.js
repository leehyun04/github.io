// UI 컨트롤러 및 탭/이벤트 관리 (main.js)
// Kakao SDK 초기화 (사용자 카카오 JS 키 교체 가능, 기본 fallback 지원)
const KAKAO_APP_KEY = '8a61479860471b02ea9a5dfc37cf339e'; // 기본 공유용 데모 키

function initKakao() {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    try {
      window.Kakao.init(KAKAO_APP_KEY);
    } catch(e) {
      console.log('Kakao init error:', e);
    }
  }
}

function initApp() {
  initKakao();

  if (window.gameEngine) {
    window.gameEngine.initEvents();
    window.gameEngine.restart();
  }
  updateStatsDisplay();

  // 1. 난이도 모드 변경 버튼
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      window.gameEngine.setMode(mode);
    });
  });

  // 2. 재시작 버튼들
  document.querySelectorAll('.restart-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      window.gameEngine.restart();
    });
  });

  // 다음 층 버튼 (무한 모드)
  const nextFloorBtn = document.getElementById('next-floor-btn');
  if (nextFloorBtn) {
    nextFloorBtn.addEventListener('click', () => {
      window.gameEngine.nextFloor();
    });
  }

  // 3. 음소거 토글
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isMuted = window.soundManager.toggleMute();
      muteBtn.textContent = isMuted ? '🔇 소리 켜기' : '🔊 소리 끄기';
      muteBtn.classList.toggle('muted', isMuted);
    });
  }

  // 4. 상단 네비게이션 탭 전환 (SPA 방식)
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = tab.dataset.target;

      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.page-view').forEach(view => {
        view.classList.remove('active');
      });

      const targetView = document.getElementById(targetId);
      if (targetView) {
        targetView.classList.add('active');
      }

      if (targetId === 'view-stats') {
        updateStatsDisplay();
      }
    });
  });

  // 5. 스크린샷 캡처 및 클립보드 복사 (Ctrl + V로 카톡 전송 가능!)
  document.querySelectorAll('.screenshot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.targetModal;
      const modalContent = document.querySelector(`#${modalId} .capture-card`);
      if (!modalContent) return;

      btn.textContent = '📸 캡처 중...';
      btn.disabled = true;

      html2canvas(modalContent, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      }).then(canvas => {
        canvas.toBlob(blob => {
          if (navigator.clipboard && window.ClipboardItem) {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
              btn.textContent = '✅ 스크린샷 복사완료!';
              alert('🎉 결과 스크린샷이 클립보드에 복사되었습니다!\n카카오톡 채팅창에 [Ctrl + V]를 눌러 바로 붙여넣어 공유하세요!');
              setTimeout(() => {
                btn.textContent = '📸 스크린샷 복사 (Ctrl+V용)';
                btn.disabled = false;
              }, 2500);
            }).catch(err => {
              fallbackDownloadImage(canvas, btn);
            });
          } else {
            fallbackDownloadImage(canvas, btn);
          }
        }, 'image/png');
      }).catch(err => {
        alert('캡처 생성 중 오류가 발생했습니다.');
        btn.textContent = '📸 스크린샷 복사 (Ctrl+V용)';
        btn.disabled = false;
      });
    });
  });

  // 이미지 다운로드 Fallback
  function fallbackDownloadImage(canvas, btn) {
    const link = document.createElement('a');
    link.download = `웹클리너_결과_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    btn.textContent = '💾 이미지 다운로드됨!';
    alert('결과 이미지가 다운로드되었습니다! 카카오톡에 사진을 첨부하여 공유하세요.');
    setTimeout(() => {
      btn.textContent = '📸 스크린샷 복사 (Ctrl+V용)';
      btn.disabled = false;
    }, 2500);
  }

  // 6. 카카오톡 공유하기 버튼
  document.querySelectorAll('.kakao-share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = window.gameEngine.mode.toUpperCase();
      const isClear = window.gameEngine.state === 'CLEAR';
      const time = window.gameEngine.elapsedSeconds.toFixed(1);
      const percent = Math.round((window.gameEngine.cleanedCount / window.gameEngine.totalSafeButtons) * 100);

      const title = isClear 
        ? `👑 [웹 클리너] ${mode} 모드 100% 올클리어 성공!` 
        : `💥 [웹 클리너] ${mode} 모드 청소율 ${percent}% 달성 중 꽝 폭망!`;

      const desc = isClear
        ? `⏱️ 클리어 타임: ${time}초 | 최고 콤보: ${window.gameEngine.combo}회\n당신도 꽝을 피해 인터넷 창을 청소해보세요!`
        : `⏱️ 버틴 시간: ${time}초 | 청소: ${window.gameEngine.cleanedCount}개\n당신은 과연 꽝을 피해 100% 클리어할 수 있을까요?`;

      const currentUrl = window.location.href.startsWith('file:') 
        ? 'https://github.com' // 로컬 테스트용
        : window.location.href;

      // 1) Kakao SDK 공유 시도
      if (window.Kakao && window.Kakao.isInitialized()) {
        try {
          window.Kakao.Share.sendDefault({
            objectType: 'text',
            text: `${title}\n\n${desc}\n\n👉 지금 바로 도전하기:`,
            link: {
              mobileWebUrl: currentUrl,
              webUrl: currentUrl
            }
          });
          return;
        } catch(e) {
          console.log('Kakao share fallback:', e);
        }
      }

      // 2) Native Web Share API (모바일 카카오톡/SNS 공유)
      if (navigator.share) {
        navigator.share({
          title: title,
          text: desc,
          url: currentUrl
        }).catch(() => {});
        return;
      }

      // 3) 클립보드 텍스트 복사 Fallback
      const textToCopy = `${title}\n${desc}\n${currentUrl}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          alert('카카오톡 공유 텍스트가 복사되었습니다! 카톡 채팅방에 붙여넣기하세요.');
        });
      }
    });
  });

  // 7. 통계 초기화 버튼
  const resetStatsBtn = document.getElementById('reset-stats-btn');
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => {
      if (confirm('모든 플레이 기록과 최고 기록을 초기화하시겠습니까?')) {
        window.storageManager.resetAll();
        updateStatsDisplay();
        alert('기록이 초기화되었습니다.');
      }
    });
  }

  // 8. 문의하기 폼 전송 시뮬레이션
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('소중한 의견이 정상적으로 접수되었습니다. 감사합니다!');
      contactForm.reset();
    });
  }
}

// 통계 화면 렌더링 함수
function updateStatsDisplay() {
  if (!window.storageManager) return;
  const stats = window.storageManager.getStats() || {};
  const history = window.storageManager.getHistory() || [];

  const totalGames = stats.totalGames || 0;
  const totalClears = stats.totalClears || 0;
  const winRate = totalGames > 0 ? Math.round((totalClears / totalGames) * 100) : 0;

  const totalGamesEl = document.getElementById('stat-total-games');
  const totalClearsEl = document.getElementById('stat-total-clears');
  const winRateEl = document.getElementById('stat-win-rate');
  const totalCleanedEl = document.getElementById('stat-total-cleaned');
  const maxComboEl = document.getElementById('stat-max-combo');

  if (totalGamesEl) totalGamesEl.textContent = totalGames;
  if (totalClearsEl) totalClearsEl.textContent = totalClears;
  if (winRateEl) winRateEl.textContent = winRate + '%';
  if (totalCleanedEl) totalCleanedEl.textContent = (stats.totalButtonsCleaned || 0) + '개';
  if (maxComboEl) maxComboEl.textContent = (stats.maxCombo || 0) + '회';

  const best = stats.bestTimes || {};
  const bestEasy = document.getElementById('best-easy');
  const bestNormal = document.getElementById('best-normal');
  const bestHard = document.getElementById('best-hard');

  if (bestEasy) bestEasy.textContent = best.easy ? best.easy.toFixed(1) + '초' : '-';
  if (bestNormal) bestNormal.textContent = best.normal ? best.normal.toFixed(1) + '초' : '-';
  if (bestHard) bestHard.textContent = best.hard ? best.hard.toFixed(1) + '초' : '-';

  const historyTbody = document.getElementById('history-tbody');
  if (historyTbody) {
    if (history.length === 0) {
      historyTbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">아직 플레이 기록이 없습니다.</td></tr>';
    } else {
      historyTbody.innerHTML = history.map(item => `
        <tr class="border-b border-gray-100 hover:bg-gray-50 text-sm">
          <td class="py-2 px-3">${item.date}</td>
          <td class="py-2 px-3 font-semibold ${item.mode === 'hard' ? 'text-red-500' : (item.mode === 'normal' ? 'text-blue-500' : 'text-green-500')}">${item.mode.toUpperCase()}</td>
          <td class="py-2 px-3">${item.isClear ? '<span class="badge-success">✨ 클리어</span>' : '<span class="badge-fail">💥 꽝</span>'}</td>
          <td class="py-2 px-3">${item.cleanedCount}/${item.totalButtons} (${item.progressRate}%)</td>
          <td class="py-2 px-3">${item.time}</td>
          <td class="py-2 px-3 text-xs text-gray-400">${item.reason || '-'}</td>
        </tr>
      `).join('');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
