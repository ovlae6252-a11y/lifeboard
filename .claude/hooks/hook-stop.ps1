# Stop Hook - Slack notification on session end
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false

# stdin UTF-8 read
$inputJson = ''
try {
  $stdinStream = [System.Console]::OpenStandardInput()
  $reader = New-Object System.IO.StreamReader($stdinStream, [System.Text.Encoding]::UTF8)
  $inputJson = $reader.ReadToEnd()
  $reader.Dispose()
} catch {}

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
    # Korean message via Unicode escapes (avoids file encoding issues)
    $msgText = "Claude Code: " + [char]0xC138 + [char]0xC158 + " " + [char]0xC885 + [char]0xB8CC
    $msgTitle = [char]0xC791 + [char]0xC5C5 + " " + [char]0xC644 + [char]0xB8CC
    $payload = @{
      text = $msgText
      attachments = @(@{
        color = "good"
        title = $msgTitle
        footer = "Claude Code | $ts"
      })
    } | ConvertTo-Json -Depth 5 -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $bodyBytes -ContentType 'application/json; charset=utf-8' -TimeoutSec 5 | Out-Null
  } catch {}
}

Write-Output '{}'
exit 0
