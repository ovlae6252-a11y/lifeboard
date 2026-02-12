# PreToolUse Hook - Slack alert for non-allowed tools
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false

# stdin UTF-8 read
$inputJson = ''
try {
  $stdinStream = [System.Console]::OpenStandardInput()
  $reader = New-Object System.IO.StreamReader($stdinStream, [System.Text.Encoding]::UTF8)
  $inputJson = $reader.ReadToEnd()
  $reader.Dispose()
} catch {
  Write-Output '{}'
  exit 0
}

# JSON parse
$toolName = $null
try {
  $hookData = $inputJson | ConvertFrom-Json
  $toolName = $hookData.tool_name
} catch {
  Write-Output '{}'
  exit 0
}

if (-not $toolName) {
  Write-Output '{}'
  exit 0
}

# allowed tool prefixes
$allowedPrefixes = @(
  "Read","Write","Edit","Glob","Grep","WebFetch","WebSearch",
  "NotebookEdit","AskUserQuestion","EnterPlanMode","ExitPlanMode",
  "TaskCreate","TaskUpdate","TaskList","TaskGet","TaskOutput","TaskStop",
  "Skill","ListMcpResourcesTool","ReadMcpResourceTool","ToolSearch",
  "Bash","Task",
  "mcp__sequential-thinking",
  "mcp__plugin_context7_context7",
  "mcp__shrimp-task-manager",
  "mcp__plugin_playwright_playwright",
  "mcp__shadcn",
  "mcp__plugin_supabase_supabase",
  "mcp__ide"
)

$isAllowed = $false
foreach ($prefix in $allowedPrefixes) {
  if ($toolName -eq $prefix -or $toolName.StartsWith("${prefix}__")) {
    $isAllowed = $true
    break
  }
}

if ($isAllowed) {
  Write-Output '{}'
  exit 0
}

# load webhook URL from .env.local
$webhookUrl = $null
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envFile = Join-Path $projectRoot ".env.local"
if (Test-Path $envFile) {
  foreach ($line in (Get-Content $envFile -Encoding UTF8)) {
    if ($line -match '^SLACK_WEBHOOK_URL=(.+)$') {
      $webhookUrl = $matches[1].Trim('"').Trim("'")
      break
    }
  }
}

if ($webhookUrl) {
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    # Korean messages via Unicode escapes (avoids file encoding issues on PS 5.1 CP949)
    # "도구 실행 승인 필요"
    $msgText = "Claude Code: " + [char]0xB3C4 + [char]0xAD6C + " " + [char]0xC2E4 + [char]0xD589 + " " + [char]0xC2B9 + [char]0xC778 + " " + [char]0xD544 + [char]0xC694
    # "도구 실행 승인 요청"
    $msgTitle = [char]0xB3C4 + [char]0xAD6C + " " + [char]0xC2E4 + [char]0xD589 + " " + [char]0xC2B9 + [char]0xC778 + " " + [char]0xC694 + [char]0xCCAD
    # "도구"
    $msgToolLabel = [char]0xB3C4 + [char]0xAD6C
    $payload = @{
      text = $msgText
      attachments = @(@{
        color = "warning"
        title = $msgTitle
        text = "${msgToolLabel}: $toolName"
        footer = "Claude Code | $ts"
      })
    } | ConvertTo-Json -Depth 5 -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $bodyBytes -ContentType 'application/json; charset=utf-8' -TimeoutSec 5 | Out-Null
  } catch {}
}

Write-Output '{}'
exit 0
