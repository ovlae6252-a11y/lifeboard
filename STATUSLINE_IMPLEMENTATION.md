# Status-Line PowerShell 구현 완료 (2026-02-08)

## 📋 개요

Bash 스크립트의 Windows 호환성 문제를 해결하기 위해 **Windows PowerShell 네이티브 스크립트로 재작성**했습니다.

## ✅ 구현 완료 항목

### Phase 1: 기본 기능 (완료)

#### 파일
- **`C:\Users\lucko\.claude\statusline.ps1`** (신규 생성)
  - 224 줄의 PowerShell 스크립트
  - UTF-8 인코딩 (BOM 없음)

#### 기능
- ✅ stdin에서 JSON 입력 받기
- ✅ JSON 파싱 및 에러 처리
- ✅ 필수 필드 검증
- ✅ 프로젝트명 추출 (경로의 마지막 폴더)
- ✅ 모델명 추출 (`$data.model.display_name`)
- ✅ Git 브랜치 감지
  - `git -C` 옵션으로 경로 지정
  - Detached HEAD 상태 폴백 (짧은 커밋 해시)
- ✅ ANSI 컬러 코드 적용
  - Cyan: 📁 프로젝트명
  - Magenta: 🤖 모델명
  - Yellow: 🌿 Git 브랜치

#### 출력 형식 (예시)
```
📁 claude-nextjs-starterkit  🤖 Opus  🌿 main
```

### Phase 2: 프로그레스 바 (완료)

#### 기능
- ✅ 컨텍스트 사용률 시각화 (0-100%)
- ✅ Box drawing 문자 활용
- ✅ 사용률 기반 색상 코딩
  - 0-69%: 녹색 `[char]27 + "[1;32m"`
  - 70-89%: 노랑 `[char]27 + "[1;33m"`
  - 90-100%: 빨강 `[char]27 + "[1;31m"`

#### 출력 형식 (예시)
```
📁 claude-nextjs-starterkit  🤖 Opus  🌿 main
█████░░░░░ 45%
```

### 설정 업데이트

#### 파일: `C:\Users\lucko\.claude\settings.json`
```json
{
  "statusLine": {
    "type": "command",
    "command": "powershell.exe -ExecutionPolicy Bypass -File C:/Users/lucko/.claude/statusline.ps1"
  }
}
```

**변경사항**:
- `statusline-command.sh` → `statusline.ps1` 경로 변경
- `powershell.exe -ExecutionPolicy Bypass -File` 접두사 추가

## 🔧 기술 상세

### 입력 JSON 스키마

```json
{
  "model": {
    "id": "claude-opus-4-6",
    "display_name": "Opus"
  },
  "workspace": {
    "current_dir": "C:\\path\\to\\project"
  },
  "cwd": "C:\\path\\to\\project",
  "context_window": {
    "used_percentage": 45.7,
    "remaining_percentage": 54.3
  }
}
```

### 에러 처리 전략

| 에러 상황 | 처리 방법 | 결과 |
|---------|---------|------|
| 빈 입력 | `IsNullOrWhiteSpace` 확인 | 조용히 종료 (상태바 공백) |
| JSON 파싱 실패 | try-catch | 조용히 종료 |
| 필수 필드 없음 | 검증 로직 | 조용히 종료 |
| Git 명령 실패 | try-catch + `$LASTEXITCODE` | "no git" 표시 |

### 핵심 구현 패턴

#### 1. JSON 파싱 (프로젝트 hook 스크립트 패턴 재사용)
```powershell
try {
    $data = $inputJson | ConvertFrom-Json
} catch {
    exit 0
}
```

#### 2. 필드 추출 (null-safe)
```powershell
if ($data.workspace -and $data.workspace.current_dir) {
    $projectDir = $data.workspace.current_dir
} elseif ($data.cwd) {
    $projectDir = $data.cwd
}
```

#### 3. Git 명령 (경로 지정)
```powershell
$branch = git -C $projectDir branch --show-current 2>$null
if ($LASTEXITCODE -eq 0 -and $branch) {
    $gitBranch = $branch.Trim()
}
```

#### 4. ANSI 컬러 + 이모지
```powershell
$folderEmoji = [char]0x1F4C1     # 📁
$colorCyan = [char]27 + "[1;36m"
$output = "$colorCyan$folderEmoji $projectName$colorReset"
```

## 📊 비교: Bash vs PowerShell

| 항목 | Bash 스크립트 | PowerShell 스크립트 |
|------|-------------|-----------------|
| JSON 파싱 | sed 정규식 (불안정) | `ConvertFrom-Json` cmdlet (안정) |
| 경로 처리 | Git Bash 의존 (경로 변환 복잡) | Windows 네이티브 경로 |
| Git 명령 | `cd` 후 실행 (임시 변경) | `git -C` 옵션 (우아함) |
| 에러 처리 | 제한적 | try-catch + 코드 확인 |
| 인코딩 | UTF-8 (BOM 문제 가능) | PowerShell 표준 |

## 🧪 테스트 가이드

### Mock 테스트 1: 기본 기능
```powershell
$json = @"
{
  "model": { "display_name": "Opus" },
  "workspace": { "current_dir": "C:\\ovlae\\workspace\\courses\\claude-nextjs-starterkit" },
  "context_window": { "used_percentage": null }
}
"@

$json | & 'C:\Users\lucko\.claude\statusline.ps1'
```

**예상 출력**:
```
📁 claude-nextjs-starterkit  🤖 Opus  🌿 main
```

### Mock 테스트 2: 프로그레스 바
```powershell
$json = @"
{
  "model": { "display_name": "Haiku" },
  "workspace": { "current_dir": "C:\\test\\project" },
  "context_window": { "used_percentage": 92 }
}
"@

$json | & 'C:\Users\lucko\.claude\statusline.ps1'
```

**예상 출력**:
```
📁 project  🤖 Haiku  🌿 no git
█████████░ 92%
```

(92% = 9/10 칸 채워짐, 빨강)

### Claude Code 실제 테스트

1. **Claude Code 재시작**
   - 설정 적용 위해 필수

2. **status-line 확인**
   - Claude Code 하단에 다음과 같이 표시되어야 함:
   ```
   📁 claude-nextjs-starterkit  🤖 Opus  🌿 main
   ```

3. **Git 브랜치 변경 테스트**
   ```bash
   git checkout -b feature/test
   ```
   - status-line에 "feature/test"로 업데이트되어야 함

4. **긴 대화로 컨텍스트 사용률 증가 테스트**
   - 여러 번 대화 후 프로그레스 바가 증가해야 함

## ⚠️ 주의사항 및 문제 해결

### 1. ExecutionPolicy 에러
```
파일을 로드할 수 없습니다. 실행 정책에 위배됩니다.
```

**해결책**:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. status-line이 표시되지 않음
- Claude Code 재시작 필요
- `settings.json` 파일 형식 확인 (JSON 유효성)
- Windows Terminal 또는 최신 PowerShell 사용

### 3. Git 브랜치가 "no git"으로 표시됨
- Git이 설치되지 않았거나 PATH에 없음
- `.git` 폴더가 없는 프로젝트

### 4. 이모지가 표시되지 않음
- Windows Terminal 권장 (PowerShell ISE는 미지원)
- 폰트가 이모지 지원해야 함 (Cascadia Code 등)

## 📁 파일 목록

### 생성된 파일
- ✅ `C:\Users\lucko\.claude\statusline.ps1` (PowerShell 스크립트)

### 수정된 파일
- ✅ `C:\Users\lucko\.claude\settings.json` (statusLine.command 변경)

### 백업 권장
- `C:\Users\lucko\.claude\statusline-command.sh` (기존 Bash 스크립트, 필요시 참고용)

## 🚀 다음 단계

### Phase 3: 추가 기능 (선택적)
- 세션 비용: `💰 $0.12`
- 세션 시간: `⏱️ 5m 23s`
- Agent 모드: `👤 Agent: security-reviewer`
- Vim 모드 지시자: `[VIM: NORMAL]`

이러한 기능은 Claude Code에서 추가 필드를 제공할 때 구현 가능합니다.

## 📚 참고 자료

- [Claude Code Status Line Documentation](https://code.claude.com/docs/en/statusline)
- [PowerShell ConvertFrom-Json Cmdlet](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/convertfrom-json)
- 프로젝트 Hook 스크립트: `.claude/scripts/hook-*.ps1`

---

**구현 완료**: 2026-02-08
**작성자**: Claude Code AI Assistant
**상태**: ✅ Phase 1 & 2 완료, Phase 3 준비 중
