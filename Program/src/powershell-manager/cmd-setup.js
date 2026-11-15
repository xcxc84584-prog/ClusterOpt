// v0.0.64: minimal CMD bootstrap; all dependencies and port decisions are handled by PowerShell.
export const PLA_SOURCE='https://raw.githubusercontent.com/xcxc84584-prog/ClusterOpt/main/Program/local-agent/server.mjs';
export const SETUP_FILENAME='ClusterOpt-PLA-Setup-v0.0.64-r1.cmd';
export function createSetupCmd(){
 const lines=[
 '@echo off',
 'setlocal EnableExtensions DisableDelayedExpansion',
 'title ClusterOpt Local Agent v0.0.64 r1',
 'echo ==========================================',
 'echo ClusterOpt PowerShell Local Agent v0.0.64 r1',
 'echo ==========================================',
 'set "AGENT_DIR=%USERPROFILE%\\ClusterOpt-Agent"',
 'if not exist "%AGENT_DIR%" mkdir "%AGENT_DIR%"',
 'set "INSTALLER=%AGENT_DIR%\\install-v064.ps1"',
 'echo [1/2] Downloading setup helper...',
 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference=\'Stop\'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $u=\'https://raw.githubusercontent.com/xcxc84584-prog/ClusterOpt/main/Program/local-agent/install-v064.ps1\'; try { Invoke-WebRequest -UseBasicParsing -Uri $u -OutFile (Join-Path $env:USERPROFILE 'ClusterOpt-Agent\\install-v064.ps1') -TimeoutSec 45 } catch { Write-Host $_.Exception.Message; exit 1 }"',
 'if errorlevel 1 goto failed',
 'echo [2/2] Installing and starting agent...',
 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%INSTALLER%"',
 'if errorlevel 1 goto failed',
 'echo Setup complete. You can close this window.',
 'pause',
 'exit /b 0',
 ':failed',
 'echo [ERROR] Setup failed. Review the detailed error above.',
 'pause',
 'exit /b 1'
 ];
 return lines.join('\r\n')+'\r\n';
}
