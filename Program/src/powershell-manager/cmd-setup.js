// v0.0.60: setup CMD downloads a pinned agent and starts it; token printed by PLA.
export const PLA_SOURCE='https://raw.githubusercontent.com/xcxc84584-prog/ClusterOpt/2aa46615c72bfc789b50a131260d3ab7203060db/Program/local-agent/server.mjs';
export const SETUP_FILENAME='ClusterOpt-PLA-Setup-v0.0.60.cmd';
export function createSetupCmd(){
 const lines=[
 '@echo off',
 'setlocal EnableExtensions DisableDelayedExpansion',
 'title ClusterOpt Local Agent v0.0.60',
 'echo ==========================================',
 'echo ClusterOpt PowerShell Local Agent v0.0.60',
 'echo ==========================================',
 'where node.exe >nul 2>nul',
 'if errorlevel 1 goto missing_node',
 'set "AGENT_DIR=%USERPROFILE%\\ClusterOpt-Agent"',
 'set "AGENT_FILE=%AGENT_DIR%\\server.mjs"',
 'if not exist "%AGENT_DIR%" mkdir "%AGENT_DIR%"',
 'if errorlevel 1 goto failed',
 'echo [1/2] Downloading pinned agent...',
 'powershell.exe -NoProfile -NonInteractive -Command "try { Invoke-WebRequest -UseBasicParsing -Uri '+PLA_SOURCE+' -OutFile ($env:USERPROFILE + ''\\ClusterOpt-Agent\\server.mjs'') -ErrorAction Stop } catch { exit 1 }"',
 'if errorlevel 1 goto failed',
 'echo [2/2] Starting local agent...',
 'echo.',
 'echo ==========================================',
 'echo PAIRING TOKEN APPEARS BELOW',
 'echo Copy the token into ClusterOpt setup.',
 'echo Keep this window open while connected.',
 'echo ==========================================',
 'echo.',
 'node.exe "%AGENT_FILE%"',
 'echo.',
 'echo Agent stopped. Press any key to close.',
 'pause >nul',
 'exit /b 0',
 ':missing_node',
 'echo [ERROR] Node.js 20 or later is required.',
 'pause',
 'exit /b 1',
 ':failed',
 'echo [ERROR] Agent setup failed.',
 'pause',
 'exit /b 1'
 ];
 return lines.join('\r\n')+'\r\n';
}
