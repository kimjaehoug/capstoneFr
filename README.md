# Frontend `src` 디렉토리 가이드

## `src/` 공통 개요

`src`는 크게 앱 조립(`app`), 페이지(`pages`), 기능(`features`), 도메인 상태(`entities`), 재사용 UI(`components`)로 나뉩니다.

## `src/app/`

앱 전역 조립/오케스트레이션 레이어.

- `AppShell.jsx`
  - 실제 앱 메인 컨테이너.
  - 라우트 분기, 전역 상태 연결, 페이지 컴포넌트 조립 담당.
- `providers/`
  - 전역 컨텍스트 제공자.
  - `AuthProvider.jsx`: 로그인 상태/세션 관리.
  - `WorkspaceProvider.jsx`: 워크스페이스 선택 상태(step, active ids) 관리.
- `hooks/`
  - 앱 공통 제어 훅.
  - `useDeleteConfirm.js`: 삭제 확인 모달 + 삭제 플로우 관리.
- `components/AppModals.jsx`
  - 앱 전역 모달 렌더링.

## `src/pages/`

라우트 단위 페이지 조립 레이어.

- `home/HomePage.jsx`
  - 시작(홈) 화면.
- `workspace/WorkspacePage.jsx`
  - 워크스페이스 페이지(상태패널/컨텍스트바/실행뷰 조립).
- `workspace/model/`
  - 워크스페이스 페이지 전용 조립 로직.
- `shared-hub/SharedHubPage.jsx`
  - 공유 허브 페이지.
- `ops-console/OpsConsolePage.jsx`
  - 운영 콘솔(조회/상태 모니터링/관리 UI).
- `login/LoginPageContainer.jsx`
  - 로그인 페이지 컨테이너.

## `src/features/`

기능 모듈별 구현 레이어(주로 API/도메인 로직).

- `data-sources/api/`
  - 데이터소스 CRUD API 호출 함수.
- `pipelines/api/`
  - 파이프라인 CRUD/모듈 조작 API 호출 함수.
- `module-snapshots/api/`
  - 모듈 스냅샷 저장/조회 API 함수.
- `auth-gate/model/`
  - 로그인 필요 액션 게이트 로직.
- `conflict-recovery/model/`
  - 409 충돌/에러 처리 로직.

## `src/entities/`

도메인 상태 모델/컨텍스트 레이어.

- `workspace/model/`
  - 워크스페이스 step, URL sync, context hook 등 상태 모델.
- `user/model/`
  - 사용자 인증 상태 모델.

## `src/components/`

재사용 UI 컴포넌트(페이지/모듈 조립에 사용).

- `Workspace.jsx`
  - 워크스페이스 본문 렌더(데이터/구성/실행/리포트 분기).
- `StepExecutionBoard.jsx`, `StepExecutionCard.jsx`
  - 단계 실행 Wizard UI.
- `WorkspaceContextBar.jsx`, `WorkspaceStatusPanel.jsx`
  - 상단 단계 전환/상태 표시 UI.
- `PipelineComposerBar.jsx`, `PipelineFlowCanvas.jsx`, `PipelineTimelineColumns.jsx`
  - 파이프라인 구성/시각화 UI.
- `MainHubDataView.jsx`, `MainHubModuleView.jsx`
  - 데이터/모듈 허브 뷰.
- `Sidebar.jsx`, `ChatPanel.jsx`
  - 좌측 내비/보조 패널.

## `src/modules/`

도메인 작업 단계 단위의 실제 작업 화면 컴포넌트.

- `DiagnosisModule.jsx`
- `DomainModule.jsx`
- `SearchModule.jsx`
- `MatchingModule.jsx`
- `SynthesisModule.jsx`
- `ResultsModule.jsx`
- `SpecialtyModule.jsx`
- `PipelineHub.jsx`

즉, `components`가 공용 UI라면 `modules`는 단계별 업무 화면에 가깝습니다.

## `src/data/`

프론트 목업/정적 데이터.

- `pipelines.js`
  - 기본 파이프라인 템플릿 데이터.
- `domainModules.js`
  - 단계별 부가기능(후보 작업) 정의.
- `dataSources.js`
  - 데이터소스 초기/로컬 데이터.
- `executionDummyModules.js`
  - 단계 실행 더미 데이터(입력/근거/예상결과/세부작업).

## `src/api/`

공통 API 유틸.

- `client.js`
  - 공통 request wrapper(에러/timeout/인증 헤더 처리).
- `auth.js`
  - 인증 API 유틸.

## `src/shared/`

공통 상수/헬퍼.

- `constants/`
  - 라우트, 스토리지 키 상수.
- `hooks/`
  - 범용 훅(`useAppCache` 등).
- `lib/time/`
  - 시간 포맷 유틸.

## `src/utils/`

도메인 보조 유틸(순수 함수).

- `pipelineConnections.js`, `pipelineLayout.js`, `pipelineSuggest.js`
  - 파이프라인 관계/배치/추천 계산.
- `analytics.js`
  - 이벤트 로깅.
- `auth.js`
  - 인증 보조 함수.
