# 🧹 인터넷 클리너 : 꽝을 피해라! (Web Cleaner)

> **"인터넷 포털 창의 모든 버튼을 뽁뽁이 터뜨리듯 청소하세요! 숨겨진 꽝을 피해 100% 올클리어에 도전!"**

---

## 🚀 1. 로컬에서 바로 실행하기
1. `index.html` 파일을 더블 클릭하여 크롬(Chrome), 엣지(Edge), 사파리(Safari) 등 웹 브라우저에서 바로 실행합니다.
2. (선택/권장) VS Code의 **Live Server** 확장 프로그램을 사용하여 실행하면 더욱 쾌적합니다.

---

## 🌐 2. 웹사이트 무료 배포 방법 (3분 완성)

구글 애드센스 심사를 신청하려면 사이트가 인터넷에 공개된 URL(HTTPS)로 배포되어 있어야 합니다.

### 방법 A: Vercel 배포 (가장 추천 ⭐)
1. [Vercel](https://vercel.com)에 로그인 (GitHub 계정 연동)
2. `Add New...` ➡️ `Project` 클릭 후 본 프로젝트 폴더를 업로드 또는 GitHub 레포지토리 연결
3. 빌드 설정 없이 `Deploy` 클릭 ➡️ **30초 만에 무료 https 도메인 생성 완료!**

### 방법 B: GitHub Pages 배포
1. GitHub에 새 저장소(Repository) 생성 후 파일 전체 푸시
2. 저장소 `Settings` ➡️ `Pages` ➡️ `Branch`를 `main`으로 설정 후 Save
3. `https://<내아이디>.github.io/<저장소이름>` 주소로 무료 배포 완료!

---

## 💰 3. 구글 애드센스(Google AdSense) 승인 및 광고 삽입 가이드

### 1단계: 애드센스 사이트 신청
1. [Google AdSense](https://www.google.com/adsense)에 로그인 후 **[사이트 추가]** 클릭
2. 배포된 사이트 URL(예: `https://my-cleaner-game.vercel.app` 또는 개인 도메인)을 입력합니다.

### 2단계: 광고 코드(AdSense Script) 삽입
1. 애드센스에서 발급된 `<script async src="..."></script>` 코드를 복사합니다.
2. `index.html` 파일 상단의 `<head>` 안 `[구글 애드센스 코드 삽입 위치]` 주석 부분에 코드를 붙여넣습니다.

### 3단계: 광고 단위 배치
- 상단/하단 배너: `index.html` 내 `<aside class="ad-slot-wrapper">` 영역의 플레이스홀더를 애드센스 디스플레이 광고 코드로 교체합니다.
- 게임오버 모달: 모달 내 광고 영역에 인피드/디스플레이 광고를 배치할 수 있습니다.

---

## 📁 프로젝트 파일 구성
```
├── index.html            # 메인 포털 UI 및 게임 SPA 컨테이너
├── README.md             # 프로젝트 소개, 배포 및 애드센스 가이드
├── css/
│   └── style.css         # 다크 브라우저 프레임, 네이버 포털 패러디 디자인, 파티클/애니메이션
├── js/
│   ├── audio.js          # Web Audio API 내장 신스 효과음 (클릭음, 콤보 상승, 사이렌, 승리 팡파레)
│   ├── storage.js        # LocalStorage 기반 최고 기록, 플레이 통계, 히스토리 저장소
│   ├── game-engine.js    # 버튼 수집, 꽝/아이템 배치, 클릭 판정, 콤보 및 게임 오버/클리어 로직
│   └── main.js           # 탭 전환, 난이도 선택, 클립보드 공유, 통계 뷰어
└── pages/
    ├── guide.html        # 완벽 공략 가이드 (SEO 및 애드센스용 텍스트)
    ├── privacy.html      # 개인정보처리방침 (애드센스 승인 필수)
    ├── terms.html        # 서비스 이용약관 (애드센스 승인 필수)
    └── contact.html      # 문의하기 & 공식 연락처 안내
```
