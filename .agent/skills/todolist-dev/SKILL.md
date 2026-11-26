---
name: todolist-dev
description: 한국어 파스텔 미니멀 TodoList 웹앱 구현 시 준수해야 할 아키텍처, DESIGN.md 토큰, IME 입력, localStorage 안전 저장 및 접근성 구현 규칙
---

# TodoList 개발 스킬

## 핵심 원칙
1. `DESIGN.md`의 CSS custom properties(`src/styles/tokens.css`)를 단일 원천으로 사용한다.
2. 아이들과 노인도 쉽게 사용할 수 있도록 모든 주요 버튼에 명확한 한글 텍스트와 최소 44px(주요 48px) 클릭 영역을 제공한다.
3. Hover에서만 나타나는 숨겨진 액션을 금지한다.

## 데이터 및 저장 규칙
- 모델 필드: `id`, `text`, `completed`, `createdAt`(ISO 8601), `updatedAt`(ISO 8601)
- 정렬 기준: `createdAt` 내림차순 고정 (완료 토글이나 내용 수정 시 재정렬하지 않음)
- 스토리지 키: `todo-app:v1`, 저장 형식: `{ schemaVersion: 1, tasks: TodoItem[] }`
- 손상된 JSON, 잘못된 타입, 중복 ID, 알 수 없는 상위 `schemaVersion` 감지 시 원본 데이터를 덮어쓰지 않고 사용자에게 복구(내보내기/확인 후 초기화) 경로를 제공한다.
- `localStorage` 접근 또는 쓰기 실패 시 메모리 상태로 앱을 계속 사용할 수 있게 유지하고, 성공 문구를 실패 안내로 교체한다.

## 한국어 입력 및 접근성 규칙
- 한글 IME 조합 중(`isComposing`, `compositionstart/end`, `keyCode === 229`)에는 Enter로 등록하거나 수정 저장하지 않는다.
- 수정 모드에서는 체크박스 `<label>`과 편집 `<input>`을 중첩하지 않는다.
- 삭제 시 포커스가 사라지지 않도록 다음 항목 → 이전 항목 → 입력창 순으로 포커스를 이동한다.
- 완료 항목 일괄 삭제는 native `<dialog>`를 사용하며, 열릴 때 "취소"에 포커스하고 Esc·배경 클릭으로 닫는다.
- 사용자 입력은 React 텍스트 노드로만 렌더링하며 `dangerouslySetInnerHTML`을 사용하지 않는다.
