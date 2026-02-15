# Lifeboard 워커

Supabase `summarize_jobs` 큐를 감시하고, Ollama를 사용하여 뉴스 그룹의 팩트 요약을 자동 생성하는 상주 워커 스크립트입니다.

## 동작 방식

1. Supabase Realtime 구독으로 새 요약 작업을 즉시 감지
2. 30초 폴링으로 누락된 작업을 보충 처리
3. Ollama에 팩트 추출 프롬프트를 전송하여 요약 생성
4. 결과를 `news_article_groups.fact_summary`에 저장

## 사전 요구사항

- **Node.js 18+** ([다운로드](https://nodejs.org/))
- **Ollama** ([다운로드](https://ollama.com/download))
- **qwen2.5:14b 모델** (아래 명령어로 다운로드)

```bash
ollama pull qwen2.5:14b
```

## 설치

```bash
# 1. scripts/ 폴더로 이동
cd scripts/

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 Supabase URL과 Service Role Key를 입력
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | (필수) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (RLS 우회) | (필수) |
| `OLLAMA_BASE_URL` | Ollama API 주소 | `http://localhost:11434` |
| `OLLAMA_MODEL` | 사용할 Ollama 모델 | `qwen2.5:14b` |

> **주의**: `SUPABASE_SERVICE_ROLE_KEY`는 모든 RLS 정책을 우회하는 관리자 키입니다. 절대 외부에 노출하지 마세요.

## 실행

```bash
# 프로덕션 실행
npm start

# 개발 모드 (파일 변경 시 자동 재시작)
npm run dev
```

`Ctrl+C`로 워커를 안전하게 종료할 수 있습니다.

## Windows 자동 시작 설정 (선택)

### 방법 1: 작업 스케줄러 (Task Scheduler)

1. 작업 스케줄러 실행 (`taskschd.msc`)
2. "기본 작업 만들기" 선택
3. 트리거: "컴퓨터 시작 시"
4. 동작: "프로그램 시작"
   - 프로그램: `node`
   - 인수: `node_modules/.bin/tsx worker.ts`
   - 시작 위치: `C:\경로\scripts`
5. "마침"

### 방법 2: NSSM (Non-Sucking Service Manager)

```bash
# NSSM 설치 (https://nssm.cc/download)
nssm install lifeboard-worker "C:\Program Files\nodejs\node.exe"
nssm set lifeboard-worker AppParameters "node_modules/.bin/tsx worker.ts"
nssm set lifeboard-worker AppDirectory "C:\경로\scripts"
nssm start lifeboard-worker
```

## 문제 해결

### Ollama 연결 실패
- Ollama가 실행 중인지 확인: `ollama list`
- 기본 포트(11434)가 사용 중인지 확인
- 다른 PC에서 Ollama를 실행하는 경우 `OLLAMA_HOST=0.0.0.0` 환경변수 설정 필요

### 모델을 찾을 수 없음
- 모델 다운로드 확인: `ollama pull qwen2.5:14b`
- 다른 모델 사용 시 `.env`의 `OLLAMA_MODEL` 변경

### Supabase 연결 실패
- `.env` 파일의 `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 올바른지 확인
- Supabase 프로젝트가 활성 상태인지 확인 (무료 플랜은 일정 기간 미사용 시 일시정지됨)

### 요약이 생성되지 않음
- `summarize_jobs` 테이블에 pending 상태의 작업이 있는지 확인
- Supabase 대시보드에서 Realtime이 `summarize_jobs` 테이블에 활성화되어 있는지 확인
