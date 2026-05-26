# WWE(When We MEET) — 친구들과 약속 잡기

링크 공유 기반의 일정 조율 앱. 각자 가능한 날짜/시간을 체크하면 서버가 겹치는 시간을 집계해서 보여줌.

---

## 📐 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| **Frontend** | SolidJS + Vite + Bun | Tailwind v4 (`@theme` 토큰) |
| **Backend** | FastAPI (Python) | 미구현 — 디렉토리만 존재 |
| **Database** | Neon (Postgres SaaS) | 무료 tier (0.5GB) |
| **Frontend 호스팅** | Vercel | 무료 (CDN 포함) |
| **Backend 호스팅** | Render 무료 tier | 15분 미사용 시 슬립 감수 |

**총 비용: $0/월** (소규모 친구용 — 실 사용자 10명 이하 가정)

---

## 🏗️ 아키텍처 결정

### 1. 프론트/백엔드 분리 배포 (통합 X)

```
[브라우저] → Vercel (정적 SolidJS) → fetch → Render (FastAPI) → Neon (Postgres)
```

**왜 통합 안 함?**
- FastAPI가 `StaticFiles`로 프론트 서빙해도 되지만 → 프론트가 백엔드 슬립의 영향 받음
- 분리하면 Vercel CDN 덕에 프론트는 항상 즉시 로딩
- 단점: CORS 설정 필요 (FastAPI `CORSMiddleware`)

### 2. Render vs Railway → **Render 무료** 선택

| | Railway | Render |
|---|---|---|
| 무료 tier | ❌ | ✅ |
| 슬립 | 없음 | 15분 미사용 시 슬립 (첫 요청 30~50초 지연) |
| 최소 비용 | $5/월 | $0 (Starter는 $7) |

친구끼리 가끔 쓰는 앱이라 **슬립 감수하고 무료**로 시작. 자주 쓰게 되면 Railway $5로 이전.

### 3. DB는 호스팅과 분리 → **Neon**

- Render Postgres 무료 tier는 **90일 후 자동 삭제** → 못 씀
- Railway DB는 유료 ($5+)
- Neon은 항상 켜져 있는 무료 Postgres + Postgres 표준 → 종속성 낮음

### 4. 인증 없음 — 룸 기반 링크 공유

- 친구끼리만 쓸 거라 로그인 불필요
- 룸 URL이 곧 접근 키 (UUID)
- 각 참여자는 이름 + 자기만의 수정 토큰만 가짐 (쿠키/localStorage)

---

## 🗂️ 데이터 모델 (예정)

```
rooms          : id (uuid), name, created_at, date_range_start, date_range_end
participants   : id, room_id, name, color, edit_token
availabilities : participant_id, date, hour
```

---

## 🚀 개발 환경

### Frontend

```bash
cd frontend
bun install
bun dev          # http://localhost:5173
bun run build
```

### Backend (예정)

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary
uvicorn main:app --reload --port 8000
```

### Neon DB 셋업

CLI 대신 [console.neon.tech](https://console.neon.tech) 대시보드에서:
1. "Create Project" → `wwe`
2. Connection string 복사
3. `backend/.env`에 `DATABASE_URL=postgresql://...`

---

## 📌 현재 진행 상태

- [x] 와이어프레임 (Claude Design)
- [x] 프론트엔드 프로토타입 (7개 화면, 화면 전환만 작동)
- [ ] 백엔드 API
- [ ] DB 스키마 + 마이그레이션
- [ ] 룸 생성/참여 플로우 실제 연결
- [ ] 가능한 시간 집계 로직
- [ ] 배포

---

## 📂 디렉토리 구조

```
WWE/
├── frontend/          # SolidJS 프로토타입
│   ├── src/
│   │   ├── components/  # Screen, Button, Card, Calendar, etc.
│   │   ├── screens/     # 7개 화면 컴포넌트
│   │   ├── store.ts     # 전역 signals
│   │   └── App.tsx      # 화면 라우팅
│   └── ...
├── backend/           # FastAPI (예정)
└── README.md
```
