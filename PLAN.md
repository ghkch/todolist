# TodoList 구현 계획 (PLAN.md)

## 1. 목표 및 설계 원칙
- `DESIGN.md`를 단일 디자인 기준으로 삼아, 파스텔톤의 미니멀하고 직관적인 한국어 TodoList 웹앱을 구현한다.
- 아이들과 노인도 쉽게 사용할 수 있도록 넉넉한 터치 영역(44~48px), 명확한 한글 레이블, 높은 텍스트 대비(4.5:1 이상), 단순한 단일 컬럼 레이아웃을 적용한다.
- 백엔드·외부 폰트·외부 이미지 없이 로컬 브라우저(`localStorage`)만으로 완전히 동작한다.

## 2. 디렉터리 구조
```
todolist/
├── DESIGN.md                        # 디자인 시스템 명세
├── PLAN.md                          # 구현 계획서
├── README.md                        # 실행·빌드·테스트·저장 제한사항 문서
├── .agent/skills/
│   ├── todolist-dev/SKILL.md        # TodoList 개발 규칙 및 구현 체크리스트 스킬
│   └── todolist-qa/SKILL.md         # TodoList 기능·접근성·반응형 QA 검증 스킬
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types/todo.ts                # 데이터 모델 및 상태 타입
    ├── lib/
    │   ├── storage.ts               # localStorage 직렬화/검증/오류 복구
    │   └── todoUtils.ts             # 순수 로직(정렬, 필터, 검색, 통계, 날짜)
    ├── hooks/useTodos.ts            # 할 일 상태, 실행 취소, 저장 동기화 훅
    ├── components/
    │   ├── Icons.tsx                # 선형 SVG 아이콘
    │   ├── Header.tsx               # 제목, 로컬 날짜, 진행률 바
    │   ├── TodoForm.tsx             # 할 일 입력, IME 처리, 오류·숨김 안내
    │   ├── FilterBar.tsx            # 상태 필터(aria-pressed) + 검색
    │   ├── TodoItem.tsx             # 항목 표시, 체크박스, 인라인 수정/삭제
    │   ├── TodoList.tsx             # 목록 및 상태별 빈 화면
    │   ├── FooterSummary.tsx        # 남은 수, 완료 일괄 삭제, 저장 상태
    │   ├── UndoToast.tsx            # 개별 삭제 실행 취소 알림
    │   ├── ConfirmClearDialog.tsx   # 완료 항목 일괄 삭제 native dialog
    │   └── StorageCorruptBanner.tsx # 저장 데이터 손상/상위 버전 보호 배너
    ├── styles/
    │   ├── tokens.css               # DESIGN.md CSS custom properties
    │   ├── global.css               # 리셋, 기본 타이포, 포커스, 모션 감소
    │   └── app.css                  # 반응형 레이아웃 및 컴포넌트 스타일
    └── test/
        ├── setup.ts
        ├── storage.test.ts          # 저장/복원/파싱오류/버전/권한실패 단위 테스트
        └── App.test.tsx             # 전체 사용자 시나리오 통합 테스트
```

## 3. 단계별 실행 순서
1. 프로젝트 초기화 (`package.json`, TypeScript, Vite, Vitest, ESLint 설치 및 설정)
2. 스타일 토큰(`tokens.css`) 및 반응형 CSS(`global.css`, `app.css`) 구현
3. 데이터 모델(`todo.ts`), 유틸리티(`todoUtils.ts`), 안전 저장소(`storage.ts`) 구현
4. 상태 훅(`useTodos.ts`) 및 전체 UI 컴포넌트 구현
5. 단위·통합 테스트 작성 및 `typecheck`, `lint`, `test`, `build` 실행
6. 실제 브라우저에서 360px / 768px / 1440px 반응형, 키보드 탐색, 콘솔 오류, 대비 검증 및 스크린샷 확인
7. 발견된 이슈 수정 후 `README.md` 및 `DESIGN.md` 동기화
