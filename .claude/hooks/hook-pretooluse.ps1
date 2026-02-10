# PreToolUse Hook - Send async Slack notification for tool permission requests
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

# Read stdin JSON
$inputJson = [Console]::In.ReadToEnd()
$toolName = $null
try {
  $hookData = $inputJson | ConvertFrom-Json
  $toolName = $hookData.tool_name
} catch {}

# Load webhook URL from .env
$webhookUrl = $null
$envFile = Join-Path (Split-Path -Parent $PSScriptRoot) ".env"
if (Test-Path $envFile) {
  foreach ($line in (Get-Content $envFile)) {
    if ($line -match '^SLACK_WEBHOOK_URL=(.+)$') {
      $webhookUrl = $matches[1].Trim('"')
      break
    }
  }
}

# Send async Slack notification
if ($webhookUrl -and $toolName) {
  try {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $json = @{
      text = "Claude Code: permission request"
      attachments = @(@{
        color = "warning"
        title = "Permission request"
        text = "Tool: $toolName"
        footer = "Claude Code | $ts"
      })
    } | ConvertTo-Json -Depth 5 -Compress
    $body = "payload=" + [System.Uri]::EscapeDataString($json)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $encoded = [Convert]::ToBase64String($bytes)
    $cmd = "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;Invoke-RestMethod -Uri '$webhookUrl' -Method Post -Body ([System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('$encoded'))) -ContentType 'application/x-www-form-urlencoded' -TimeoutSec 5"
    Start-Process powershell.exe -ArgumentList "-NoProfile","-EncodedCommand",([Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($cmd))) -WindowStyle Hidden
  } catch {}
}

# Return permission decision
Write-Output '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask"}}'
exit 0
