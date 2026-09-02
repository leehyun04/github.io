// 웹 클리너 게임 엔진 (Web Cleaner Game Engine)
class GameEngine {
  constructor() {
    this.state = 'READY'; // READY, PLAYING, GAMEOVER, CLEAR
    this.mode = 'normal'; // easy, normal, hard, infinite
    this.infiniteFloor = 1;

    this.activeButtons = [];
    this.trapIndexes = new Set();
    this.magnifierIndexes = new Set();
    this.vaccineIndexes = new Set();

    this.cleanedCount = 0;
    this.totalSafeButtons = 0;
    this.combo = 0;
    this.hasShield = false;

    this.startTime = null;
    this.elapsedTimer = null;
    this.elapsedSeconds = 0;

    this.failReasons = [
      "🚨 [긴급 알림] 축하합니다! 당신은 9,999,999번째 방문자입니다!\n(바이러스 5조 5억 개 다운로드 중...)",
      "🚨 [시스템 오류] 부장님이 화면 원격 제어를 시작했습니다.\n'김대리, 내일 아침 7시 출근인 거 알지?'",
      "🚨 [경고] 님의 마우스가 과도한 광클로 인해 섭씨 800도까지 과열되었습니다.",
      "🚨 [통신 두절] 옆집 고양이가 공유기 랜선을 생선인 줄 알고 씹어 끊었습니다.",
      "🚨 [블루스크린] ERROR_404_CLEANER : 청소 도중 마우스 패드가 가출했습니다.",
      "🚨 [광고 폭탄] '단 3초 만에 키 10cm 크는 기적의 깔창' 팝업 100개가 열렸습니다.",
      "🚨 [치명적 실수] 방금 누르신 버튼은 사실 '회사 메인 서버 전원 차단' 버튼이었습니다.",
      "🚨 [보안 위협] 어둠의 다크 해커가 당신의 라면 황금 레시피를 탈취했습니다.",
      "🚨 [대참사] 인터넷 창 닫기 대신 브라우저 즐겨찾기 500개가 전부 삭제되었습니다.",
      "🚨 [경보 발령] 방바닥 청소를 안 해서 모니터 뒤에서 먼지 괴물이 부활했습니다."
    ];

    this.initEvents();
  }

  // 이벤트 위임(Event Delegation)으로 클릭 100% 보장
  initEvents() {
    const portalArea = document.getElementById('portal-content');
    if (!portalArea) return;

    portalArea.addEventListener('click', (e) => {
      const btn = e.target.closest('.clean-target');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const index = this.activeButtons.indexOf(btn);
      if (index === -1) return;

      this.handleButtonClick(btn, index, e);
    });
  }

  setMode(newMode) {
    this.mode = newMode;
    if (newMode !== 'infinite') {
      this.infiniteFloor = 1;
    }
    this.restart();
  }

  // 게임 시작/재시작
  restart() {
    clearInterval(this.elapsedTimer);
    this.state = 'READY';
    this.cleanedCount = 0;
    this.combo = 0;
    this.hasShield = false;
    this.elapsedSeconds = 0;
    this.startTime = null;

    // UI 업데이트
    const timerEl = document.getElementById('timer-text');
    const comboEl = document.getElementById('combo-text');
    const shieldBadge = document.getElementById('shield-badge');
    const alertToast = document.getElementById('alert-toast');

    if (timerEl) timerEl.textContent = '0.0s';
    if (comboEl) comboEl.textContent = '0';
    if (shieldBadge) shieldBadge.style.display = 'none';
    if (alertToast) alertToast.classList.remove('show');
    document.body.classList.remove('shake', 'screen-danger', 'bluescreen');

    // 팝업/모달 닫기
    const gameOverModal = document.getElementById('game-over-modal');
    const clearModal = document.getElementById('clear-modal');
    if (gameOverModal) gameOverModal.classList.add('hidden');
    if (clearModal) clearModal.classList.add('hidden');

    this.setupButtons();
  }

  // 버튼 대상 수집 및 꽝/아이템 배치
  setupButtons() {
    const portalArea = document.getElementById('portal-content');
    if (!portalArea) return;

    const elements = Array.from(portalArea.querySelectorAll('.clean-target'));

    // 버튼 초기화 (청소된 상태 해제)
    elements.forEach(el => {
      el.classList.remove('cleaned', 'revealed-safe', 'trap-revealed');
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      el.style.transform = 'none';
      el.style.visibility = 'visible';
    });

    let targetCount = elements.length;
    let trapCount = 2;
    let magnifierCount = 1;
    let vaccineCount = 1;

    if (this.mode === 'easy') {
      targetCount = Math.min(20, elements.length);
      trapCount = 1;
      magnifierCount = 1;
      vaccineCount = 1;
    } else if (this.mode === 'normal') {
      targetCount = Math.min(32, elements.length);
      trapCount = 2;
      magnifierCount = 1;
      vaccineCount = 1;
    } else if (this.mode === 'hard') {
      targetCount = elements.length; // 전부
      trapCount = 3;
      magnifierCount = 1;
      vaccineCount = 1;
    } else if (this.mode === 'infinite') {
      targetCount = Math.min(12 + (this.infiniteFloor - 1) * 4, elements.length);
      trapCount = Math.min(1 + Math.floor((this.infiniteFloor - 1) / 2), 4);
      magnifierCount = 1;
      vaccineCount = (this.infiniteFloor % 2 === 0) ? 1 : 0;
    }

    // 셔플하여 활성화할 버튼 선택
    const shuffledElements = [...elements].sort(() => 0.5 - Math.random());
    this.activeButtons = shuffledElements.slice(0, targetCount);

    // 제외된 버튼은 클릭 불가능하고 투명하게 숨김
    elements.forEach(el => {
      if (!this.activeButtons.includes(el)) {
        el.style.opacity = '0.2';
        el.style.pointerEvents = 'none';
        el.classList.add('cleaned');
      }
    });

    // 꽝(지뢰) 랜덤 배치
    this.trapIndexes.clear();
    this.magnifierIndexes.clear();
    this.vaccineIndexes.clear();

    const availableIndices = this.activeButtons.map((_, i) => i).sort(() => 0.5 - Math.random());

    // 1. 꽝 배정
    for (let i = 0; i < trapCount && availableIndices.length > 0; i++) {
      this.trapIndexes.add(availableIndices.pop());
    }

    // 2. 돋보기 배정
    for (let i = 0; i < magnifierCount && availableIndices.length > 0; i++) {
      this.magnifierIndexes.add(availableIndices.pop());
    }

    // 3. 백신 배정
    for (let i = 0; i < vaccineCount && availableIndices.length > 0; i++) {
      this.vaccineIndexes.add(availableIndices.pop());
    }

    this.totalSafeButtons = this.activeButtons.length - this.trapIndexes.size;
    this.updateHUD();
  }

  // 버튼 클릭 처리
  handleButtonClick(btn, index, e) {
    if (this.state === 'GAMEOVER' || this.state === 'CLEAR') return;
    if (btn.classList.contains('cleaned')) return;

    // 첫 클릭 시 오디오 초기화 및 타이머 시작
    if (this.state === 'READY') {
      window.soundManager.initAudio();
      this.state = 'PLAYING';
      this.startTime = performance.now();
      this.elapsedTimer = setInterval(() => {
        this.elapsedSeconds = (performance.now() - this.startTime) / 1000;
        const timerEl = document.getElementById('timer-text');
        if (timerEl) timerEl.textContent = this.elapsedSeconds.toFixed(1) + 's';
      }, 100);
    }

    const clickX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : window.innerWidth / 2);
    const clickY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : window.innerHeight / 2);

    // 1. '꽝'을 밟았을 때!
    if (this.trapIndexes.has(index)) {
      // 쉴드(백신)가 있는 경우 방어!
      if (this.hasShield) {
        this.hasShield = false;
        const shieldBadge = document.getElementById('shield-badge');
        if (shieldBadge) shieldBadge.style.display = 'none';
        window.soundManager.playShield();
        this.showToast('🛡️ 백신 쉴드가 바이러스 꽝을 1회 방어하고 소멸했습니다!', 'shield');

        btn.classList.add('trap-revealed');
        this.createParticles(clickX, clickY, '#3b82f6', 15);
        return;
      }

      // 쉴드가 없으면 즉시 게임 오버!
      this.triggerGameOver(btn, clickX, clickY);
      return;
    }

    // 2. 안전 버튼인 경우: 청소 성공!
    this.cleanedCount++;
    this.combo++;
    window.soundManager.playClick(this.combo);

    // 파티클 및 청소 애니메이션
    this.createParticles(clickX, clickY, '#10b981', 10);
    this.showFloatingText(clickX, clickY, `+1 (${this.combo} Combo!)`);

    btn.classList.add('cleaned');

    // 아이템 효과 체크
    if (this.magnifierIndexes.has(index)) {
      this.triggerMagnifier();
    } else if (this.vaccineIndexes.has(index)) {
      this.triggerVaccine();
    }

    // 남은 버튼 수 체크 및 긴장감 연출
    const remaining = this.totalSafeButtons - this.cleanedCount;
    if (remaining <= 3 && remaining > 0) {
      window.soundManager.playHeartbeat();
      document.body.classList.add('screen-danger');
      this.showToast(`⚠️ 심장 쫄깃! 남은 안전 버튼: ${remaining}개!`, 'danger');
    } else {
      document.body.classList.remove('screen-danger');
    }

    this.updateHUD();

    // 3. 올클리어 체크!
    if (this.cleanedCount >= this.totalSafeButtons) {
      this.triggerClear();
    }
  }

  // 돋보기 아이템 발동
  triggerMagnifier() {
    window.soundManager.playItem();
    this.showToast('🔍 돋보기 획득! 안전한 버튼 1개를 발견했습니다!', 'item');

    const uncleanedSafe = [];
    this.activeButtons.forEach((btn, idx) => {
      if (!btn.classList.contains('cleaned') && !this.trapIndexes.has(idx)) {
        uncleanedSafe.push(btn);
      }
    });

    if (uncleanedSafe.length > 0) {
      const target = uncleanedSafe[Math.floor(Math.random() * uncleanedSafe.length)];
      target.classList.add('revealed-safe');
      setTimeout(() => {
        target.classList.remove('revealed-safe');
      }, 3500);
    }
  }

  // 백신(쉴드) 아이템 발동
  triggerVaccine() {
    this.hasShield = true;
    window.soundManager.playItem();
    const shieldBadge = document.getElementById('shield-badge');
    if (shieldBadge) shieldBadge.style.display = 'inline-flex';
    this.showToast('💉 백신 획득! 꽝(지뢰) 1회 방어 쉴드가 생성되었습니다!', 'item');
  }

  // 게임 오버 트리거
  triggerGameOver(btn, x, y) {
    this.state = 'GAMEOVER';
    clearInterval(this.elapsedTimer);
    window.soundManager.playTrap();

    document.body.classList.add('shake');
    this.createParticles(x, y, '#ef4444', 30);
    btn.classList.add('trap-revealed');

    this.activeButtons.forEach((b, idx) => {
      if (this.trapIndexes.has(idx)) {
        b.classList.add('trap-revealed');
      }
    });

    const reason = this.failReasons[Math.floor(Math.random() * this.failReasons.length)];

    if (window.storageManager) {
      window.storageManager.recordGame(
        this.mode,
        false,
        this.cleanedCount,
        this.totalSafeButtons,
        this.elapsedSeconds,
        this.combo,
        reason.split('\n')[0]
      );
    }

    setTimeout(() => {
      document.body.classList.remove('shake');
      this.showGameOverModal(reason);
    }, 700);
  }

  // 올클리어 승리 트리거
  triggerClear() {
    this.state = 'CLEAR';
    clearInterval(this.elapsedTimer);
    window.soundManager.playVictory();
    document.body.classList.remove('screen-danger');

    this.launchConfetti();

    if (window.storageManager) {
      window.storageManager.recordGame(
        this.mode,
        true,
        this.cleanedCount,
        this.totalSafeButtons,
        this.elapsedSeconds,
        this.combo,
        '완벽 청소 클리어!'
      );
    }

    setTimeout(() => {
      this.showClearModal();
    }, 600);
  }

  // HUD 정보 갱신
  updateHUD() {
    const remaining = Math.max(0, this.totalSafeButtons - this.cleanedCount);
    const percent = this.totalSafeButtons > 0 ? Math.round((this.cleanedCount / this.totalSafeButtons) * 100) : 0;

    const remainEl = document.getElementById('remain-count');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const comboEl = document.getElementById('combo-text');
    const floorBadge = document.getElementById('floor-badge');
    const floorText = document.getElementById('floor-text');

    if (remainEl) remainEl.textContent = remaining;
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressPercent) progressPercent.textContent = percent + '%';
    if (comboEl) comboEl.textContent = this.combo;

    if (floorBadge && floorText) {
      if (this.mode === 'infinite') {
        floorBadge.style.display = 'inline-block';
        floorText.textContent = `${this.infiniteFloor}층`;
      } else {
        floorBadge.style.display = 'none';
      }
    }
  }

  // 파티클 생성 효과
  createParticles(x, y, color = '#10b981', count = 10) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'click-particle';
      p.style.backgroundColor = color;
      p.style.left = x + 'px';
      p.style.top = y + 'px';

      const angle = Math.random() * Math.PI * 2;
      const velocity = 30 + Math.random() * 60;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      document.body.appendChild(p);

      p.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
      ], {
        duration: 400 + Math.random() * 200,
        easing: 'cubic-bezier(0, .9, .57, 1)'
      }).onfinish = () => p.remove();
    }
  }

  // 플로팅 텍스트
  showFloatingText(x, y, text) {
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-score';
    floatEl.textContent = text;
    floatEl.style.left = x + 'px';
    floatEl.style.top = (y - 10) + 'px';
    document.body.appendChild(floatEl);

    floatEl.animate([
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(-30px)', opacity: 0 }
    ], {
      duration: 600,
      easing: 'ease-out'
    }).onfinish = () => floatEl.remove();
  }

  // 토스트 메시지
  showToast(msg, type = 'info') {
    const toast = document.getElementById('alert-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `alert-toast show ${type}`;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // 게임 오버 모달
  showGameOverModal(reason) {
    const modal = document.getElementById('game-over-modal');
    if (!modal) return;
    const reasonEl = document.getElementById('game-over-reason');
    const cleanedEl = document.getElementById('game-over-cleaned');
    const percentEl = document.getElementById('game-over-percent');
    const timeEl = document.getElementById('game-over-time');
    const comboEl = document.getElementById('game-over-combo');

    if (reasonEl) reasonEl.innerText = reason;
    if (cleanedEl) cleanedEl.textContent = `${this.cleanedCount}개 / ${this.totalSafeButtons}개`;
    if (percentEl) percentEl.textContent = `${Math.round((this.cleanedCount / this.totalSafeButtons) * 100)}%`;
    if (timeEl) timeEl.textContent = `${this.elapsedSeconds.toFixed(1)}초`;
    if (comboEl) comboEl.textContent = `${this.combo}회`;
    modal.classList.remove('hidden');
  }

  // 클리어 모달
  showClearModal() {
    const modal = document.getElementById('clear-modal');
    if (!modal) return;
    const timeEl = document.getElementById('clear-time');
    const cleanedEl = document.getElementById('clear-cleaned');
    const comboEl = document.getElementById('clear-combo');
    const nextFloorBtn = document.getElementById('next-floor-btn');

    if (timeEl) timeEl.textContent = `${this.elapsedSeconds.toFixed(1)}초`;
    if (cleanedEl) cleanedEl.textContent = `${this.cleanedCount}개`;
    if (comboEl) comboEl.textContent = `${this.combo}회`;

    if (nextFloorBtn) {
      nextFloorBtn.style.display = (this.mode === 'infinite') ? 'inline-block' : 'none';
    }

    modal.classList.remove('hidden');
  }

  // 다음 층으로 (무한 모드)
  nextFloor() {
    this.infiniteFloor++;
    this.restart();
  }

  // 폭죽 캔버스 연출
  launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#eab308', '#f97316'];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        w: 8 + Math.random() * 6,
        h: 6 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.7) * 18,
        gravity: 0.35,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 15,
        opacity: 1
      });
    }

    let animId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.opacity -= 0.008;

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      });

      if (alive) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    render();
  }
}

window.gameEngine = new GameEngine();
