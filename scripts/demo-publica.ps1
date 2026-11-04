# Demonstração pública pelo Cloudflare Tunnel (docs/operacao/demo-publica.md).
#
#   ./scripts/demo-publica.ps1           sobe a pilha + o túnel e mostra o endereço público
#   ./scripts/demo-publica.ps1 -Parar    derruba só o túnel e volta a API para o uso local
#
# Só o `web` (site + /api + /media pelo nginx) vai para o túnel. A API, o banco e o Mailpit continuam em 127.0.0.1;
# o Mailpit NUNCA fica público. O endereço muda a cada subida do túnel, e quem tiver o link entra.
param(
    [switch] $Parar,
    # Outra pilha (outro -p do compose) e outro arquivo de variáveis. O padrão é a pilha do compose.yaml com o .env.
    [string] $Projeto = '',
    [string] $EnvFile = '',
    [int] $TimeoutSegundos = 90
)
# Continue, e não Stop: o docker escreve progresso no stderr, e no Windows PowerShell isso viraria exceção quando a
# saída é redirecionada. As falhas são conferidas pelo $LASTEXITCODE de cada chamada.
$ErrorActionPreference = 'Continue'

$root = Split-Path -Parent $PSScriptRoot
if (-not $EnvFile) { $EnvFile = Join-Path $root '.env' }
if (-not (Test-Path $EnvFile)) { throw "Falta o $EnvFile. Rode ./scripts/setup-env.ps1 antes." }

$compose = @('compose', '-f', (Join-Path $root 'compose.yaml'), '--env-file', $EnvFile)
if ($Projeto) { $compose += @('-p', $Projeto) }

# Lê um valor do arquivo de variáveis sem mostrá-lo.
function Get-EnvValue([string] $name) {
    $line = Get-Content $EnvFile -Encoding utf8 | Where-Object { $_ -match "^\s*$name\s*=" } | Select-Object -Last 1
    if ($line) { return ($line -split '=', 2)[1].Trim() } else { return '' }
}

$webPort = Get-EnvValue 'WEB_PORT'
if (-not $webPort) { $webPort = '8080' }

# O compose lê o ambiente do processo antes do arquivo: é assim que a API sobe em Production com o endereço do túnel.
$saved = @{ ASPNETCORE_ENVIRONMENT = $env:ASPNETCORE_ENVIRONMENT; APP_PUBLIC_BASE_URL = $env:APP_PUBLIC_BASE_URL }

try {
    if ($Parar) {
        Write-Host 'Derrubando o túnel...'
        & docker @compose --profile tunnel rm --stop --force cloudflared | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'docker compose rm falhou.' }

        # A API volta para o uso local: Development e links apontando para localhost.
        $env:ASPNETCORE_ENVIRONMENT = $null
        $env:APP_PUBLIC_BASE_URL = $null
        & docker @compose up -d --no-deps --force-recreate api | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Falha ao recriar a API.' }
        Write-Host "Túnel derrubado. O endereço antigo deixou de funcionar; a pilha local segue em http://localhost:$webPort."
        return
    }

    if (-not (Get-EnvValue 'Email__Smtp__Host')) {
        Write-Warning ('Sem SMTP no .env: os e-mails vão para o Mailpit local, que não é público. Quem abrir o link ' +
            'não recebe a confirmação de cadastro; só as contas do seed entram. Para e-mail de verdade, preencha o ' +
            'bloco do Gmail no .env (ver .env.example).')
    }

    $env:ASPNETCORE_ENVIRONMENT = 'Production'
    Write-Host 'Subindo a pilha e o túnel (pode levar alguns minutos no primeiro build)...'
    & docker @compose --profile tunnel up -d --build
    if ($LASTEXITCODE -ne 0) { throw 'docker compose up falhou. Veja o erro acima.' }

    Write-Host 'Esperando o endereço do túnel...'
    $url = $null
    $deadline = (Get-Date).AddSeconds($TimeoutSegundos)
    while (-not $url -and (Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 2
        $logs = (& docker @compose --profile tunnel logs cloudflared 2>&1 | ForEach-Object { "$_" }) -join "`n"
        $match = [regex]::Match($logs, 'https://[a-z0-9-]+\.trycloudflare\.com')
        if ($match.Success) { $url = $match.Value }
    }
    if (-not $url) { throw "O cloudflared não mostrou o endereço em $TimeoutSegundos s. Veja: docker compose logs cloudflared" }

    # Os links dos e-mails (confirmação, nova senha) precisam do endereço público: recria só a API.
    $env:APP_PUBLIC_BASE_URL = $url
    & docker @compose up -d --no-deps --force-recreate api | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao recriar a API com o endereço público.' }

    Write-Host 'Esperando a API responder pelo endereço público...'
    $ok = $false
    $deadline = (Get-Date).AddSeconds($TimeoutSegundos)
    while (-not $ok -and (Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 3
        try { $ok = (Invoke-WebRequest "$url/api/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop).StatusCode -eq 200 } catch { $ok = $false }
    }
    if (-not $ok) { Write-Warning "O endereço ainda não respondeu (a Cloudflare pode levar mais um pouco). Tente abrir: $url" }

    Write-Host ''
    Write-Host "  Endereço público:  $url" -ForegroundColor Green
    Write-Host ''
    Write-Host '  Quem tiver o link entra. O endereço muda a cada subida do túnel.'
    Write-Host '  Contas de demonstração: bun scripts/seed-demo.ts com SEED_PASSWORD definida (ver o guia).'
    Write-Host '  Para derrubar:      ./scripts/demo-publica.ps1 -Parar'
}
finally {
    $env:ASPNETCORE_ENVIRONMENT = $saved.ASPNETCORE_ENVIRONMENT
    $env:APP_PUBLIC_BASE_URL = $saved.APP_PUBLIC_BASE_URL
}
