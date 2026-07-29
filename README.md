# AI 스프라이트 스튜디오

AI로 캐릭터 스프라이트 시트를 생성하거나, 이미 가지고 있는 스프라이트 시트 이미지를 업로드해서 격자(grid) 기반 애니메이션과 Phaser 호환 아틀라스 JSON을 만들어주는 웹 앱입니다.

## 주요 기능

- **가이드 프롬프트**: 캐릭터 설명 + 동작(walk, run, jump 등) + 행/열/프레임 수를 입력하면, API 키 없이도 셀 경계·배경 크로마키 등 요구사항이 반영된 완성 프롬프트를 즉시 보여줍니다. 복사해서 원하는 외부 AI 이미지 플랫폼에 바로 붙여넣을 수 있습니다.
- **AI 생성 모드**: API 키를 입력하면 앱 안에서 직접 (1) 캐릭터 이미지 1장 미리보기, (2) 전체 시트 이미지 생성까지 할 수 있습니다. 시트 이미지가 만들어지면 바로 이어서 애니메이션 설정(행/열/프레임 수/크로마키/ping-pong)으로 넘어갑니다.
- **이미지 업로드 모드**: AI 호출 없이, 가지고 있는 스프라이트 시트 이미지를 업로드해서 행/열/프레임 수만 지정하면 브라우저에서 직접 잘라 애니메이션으로 재생합니다.
- **배경 투명화 (크로마키)**: 지정한 색상에 가까운 픽셀을 투명 처리합니다.
- **프레임 자동 정렬**: 셀마다 캐릭터가 조금씩 다른 위치에 그려져도, 불투명 픽셀의 바운딩 박스를 기준으로 모든 프레임의 발(anchor) 위치를 맞춰 애니메이션이 흔들리지 않게 합니다.
- **자연스러운 루프 (Ping-pong)**: 정방향 재생 후 역방향으로 이어붙여 마지막 프레임에서 첫 프레임으로 뚝 끊기지 않고 자연스럽게 왕복 재생되도록 합니다. 미리보기와 다운로드 결과(PNG/JSON) 모두에 동일하게 적용됩니다.
- **원본 시트 + 격자선 보기**: 생성/업로드된 시트를 격자선과 함께 확인해서 그리드가 잘 맞았는지 눈으로 검증할 수 있습니다.
- **PNG / Phaser 아틀라스 JSON 다운로드**: 게임 엔진(Phaser 등)에서 바로 사용할 수 있는 형식으로 내보냅니다.
- **적용 가이드**: 결과 화면에 Phaser 3 / 순수 Canvas 예제 코드를 포함한 "내 프로젝트에 적용하는 법" 섹션을 제공합니다.

## 시작하기

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

AI 생성 모드를 사용하려면 화면의 "API 설정"에서 Gemini 또는 OpenAI API 키를 입력해야 합니다. 이미지 업로드 모드는 API 키 없이 바로 사용할 수 있습니다.

## API 키 저장 방식

- API 키는 브라우저 `localStorage`에만 저장됩니다. 서버 데이터베이스나 파일에 저장되지 않으며, 우리 쪽 로그에도 남지 않습니다.
- 요청 시에는 브라우저 → 우리 앱의 API 라우트(`/api/expand-prompt`, `/api/generate-sprite`) → 해당 AI 제공자(Gemini/OpenAI)로만 전달되는 프록시 패턴을 사용합니다. 키를 클라이언트 번들이나 소스코드에 하드코딩하지 않습니다.
- 브라우저를 바꾸거나 `localStorage`를 지우면 키도 함께 사라집니다.

## 기술 스택

- Next.js 16 (App Router, Turbopack) + React 19
- Tailwind CSS v4
- Canvas API (그리드 분할, 크로마키, 프레임 정렬을 모두 브라우저에서 처리)
- Gemini / OpenAI 이미지 생성 API

## 프로젝트 구조

```
app/
  api/expand-prompt/route.ts    # 사용자 입력 → AI에게 이미지 생성용 프롬프트 확장 요청
  api/generate-image/route.ts   # AI로 이미지 1장 생성 (슬라이싱 없이 원본만 반환)
  page.tsx                      # 메인 화면 (AI 생성 / 이미지 업로드 탭)
components/
  GenerationForm.tsx            # AI 생성 모드 입력 폼 + 무료 가이드 프롬프트 표시
  UploadForm.tsx                # 이미지 업로드 모드 (파일 선택 + SliceForm)
  PromptPreview.tsx             # 생성된 프롬프트 확인/수정 + 이미지 미리보기 생성
  SliceForm.tsx                 # 행/열/프레임수/크로마키/ping-pong 설정 → 애니메이션 생성 (업로드·AI 시트 공용)
  SpriteResult.tsx              # 결과 화면 (애니메이션 미리보기 / 원본 시트 토글 / 다운로드 / 적용 가이드)
  IntegrationGuide.tsx          # 다운로드 결과를 다른 프로젝트에 적용하는 방법 안내
  AnimationPreview.tsx          # 캔버스 기반 애니메이션 재생
  SheetGridPreview.tsx          # 원본 시트 + 격자선 미리보기
lib/
  promptTemplates.ts            # AI 확장용 지시문 + 무료 가이드 프롬프트 템플릿
  spriteGrid.ts                 # 그리드 좌표 계산 + 아틀라스(JSON) 조립
  clientSpriteSlicer.ts         # 브라우저에서 이미지를 그리드로 자르고 정렬하는 로직 (업로드·AI 생성 공용)
  download.ts                   # dataURL → Blob 다운로드 공용 헬퍼
  providers/                    # Gemini / OpenAI 클라이언트
```
