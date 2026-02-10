# Stop Hook - Send Slack notification when Claude Code session ends
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

# Read stdin JSON
$inputJson = [Console]::In.ReadToEnd()
$reason = "unknown"
try {
  $hookData = $inputJson | ConvertFrom-Json
  if ($hookData.reason) { $reason = $hookData.reason }
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

# Send sync Slack notification (session ending, no need for async)
if ($webhookUrl) {
  try {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $json = @{
      text = "Claude Code: session ended"
      attachments = @(@{
        color = "good"
        title = "Session ended"
        text = "Reason: $reason"
        footer = "Claude Code | $ts"
      })
    } | ConvertTo-Json -Depth 5 -Compress
    $body = "payload=" + [System.Uri]::EscapeDataString($json)
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded' -TimeoutSec 5 | Out-Null
  } catch {}
}

# Return empty JSON
Write-Output '{}'
exit 0
