# ============================================================
#  hacker.ps1  -  Consola "hacker" de BROMA (nativa PowerShell)
#  Texto que se escribe solo + barras de progreso + lluvia Matrix.
#  100% inofensivo: no toca ni un archivo del sistema.
# ============================================================

# --- Preparar ventana: verde sobre negro, titulo, maximizar ---
try {
    $Host.UI.RawUI.WindowTitle = 'root@breach: ~/intrusion'
    $Host.UI.RawUI.BackgroundColor = 'Black'
    $Host.UI.RawUI.ForegroundColor = 'Green'
    Clear-Host
} catch {}

# Intentar maximizar la ventana (si falla, no pasa nada)
try {
    Add-Type -Name Win -Namespace Native -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("user32.dll")]
public static extern bool ShowWindow(System.IntPtr hWnd, int nCmdShow);
[System.Runtime.InteropServices.DllImport("kernel32.dll")]
public static extern System.IntPtr GetConsoleWindow();
'@ -ErrorAction SilentlyContinue
    [Native.Win]::ShowWindow([Native.Win]::GetConsoleWindow(), 3) | Out-Null  # 3 = maximizar
} catch {}

# ------------------------------------------------------------
#  Utilidades de animacion
# ------------------------------------------------------------
function Type-Line {
    param(
        [string]$Text,
        [System.ConsoleColor]$Color = 'Green',
        [int]$Speed = 12
    )
    foreach ($ch in $Text.ToCharArray()) {
        Write-Host -NoNewline $ch -ForegroundColor $Color
        Start-Sleep -Milliseconds $Speed
    }
    Write-Host ''
}

function Progress-Bar {
    param(
        [string]$Label,
        [int]$Steps = 24,
        [int]$Delay = 60
    )
    $pct = 0
    for ($i = 1; $i -le $Steps; $i++) {
        $pct = [int](($i / $Steps) * 100)
        $filled = '#' * $i
        $empty  = '-' * ($Steps - $i)
        Write-Host -NoNewline ("`r{0} [" -f $Label) -ForegroundColor DarkGreen
        Write-Host -NoNewline $filled -ForegroundColor Green
        Write-Host -NoNewline $empty -ForegroundColor DarkGray
        Write-Host -NoNewline ("] {0,3}%" -f $pct) -ForegroundColor Green
        Start-Sleep -Milliseconds ($Delay + (Get-Random -Minimum 0 -Maximum 40))
    }
    Write-Host ''
}

function Matrix-Burst {
    param([int]$Lines = 12)
    $chars = 'アイウエオカキクケコサシスセソ0110ABCDEF#$%&'.ToCharArray()
    $width = 70
    try { $width = [Math]::Min(100, $Host.UI.RawUI.WindowSize.Width - 2) } catch {}
    for ($l = 0; $l -lt $Lines; $l++) {
        $sb = -join (1..$width | ForEach-Object { $chars | Get-Random })
        Write-Host $sb -ForegroundColor Green
        Start-Sleep -Milliseconds 55
    }
}

function Rnd { param([int]$max = 255) Get-Random -Minimum 0 -Maximum $max }

# ------------------------------------------------------------
#  Secuencia principal
# ------------------------------------------------------------
Type-Line 'INITIATING INTRUSION SEQUENCE...' White 10
Start-Sleep -Milliseconds 300
Progress-Bar 'Connecting to target server' 24 55
Type-Line 'connection established with simyo-core.internal' Cyan 8
Start-Sleep -Milliseconds 200
Write-Host ''

# --- Fase 1: reconocimiento de red ---
Type-Line '>>> PHASE 1: NETWORK RECON <<<' Cyan 6
Type-Line ("> net.scan(range=`"192.168.{0}.0/24`", stealth=True)" -f (Rnd)) DarkGray 4
Type-Line 'open ports: 22, 443, 8081 - banner grabbing...' Cyan 4
Type-Line ("active host found: 10.{0}.{1}.{2} (TTL=64, linux)" -f (Rnd),(Rnd),(Rnd)) DarkGray 4
Type-Line '[OK] network topology reconstructed - 14 nodes visible' Cyan 4
Progress-Bar 'Scanning target network' 24 40
Write-Host ''

# --- Fase 2: fuerza bruta ---
Type-Line '>>> PHASE 2: BRUTE FORCE / CREDENTIALS <<<' Yellow 6
Type-Line '> hash.crack(algo="sha256", dict="rockyou_ext.txt")' DarkGray 4
Type-Line ("trying combination {0}/4096... attempt {1}" -f (Rnd),(Rnd)) DarkGray 4
Type-Line 'decrypting payload... AES256 -> XOR fallback detected' Yellow 4
Type-Line '[OK] valid password found - hash match' Cyan 4
Progress-Bar 'Cracking credentials' 24 45
Write-Host ''

# --- Fase 3: firewall ---
Type-Line '>>> PHASE 3: FIREWALL BYPASS <<<' Red 6
Type-Line ("[WARN] adaptive firewall detected, rerouting via proxy_{0}" -f (Rnd)) Red 4
Type-Line ("spoofing MAC 3C:5A:B4:{0}:{1}:{2} ... done" -f (Rnd),(Rnd),(Rnd)) Cyan 4
Type-Line '> tunnel.open(protocol="icmp", encapsulate=True)' DarkGray 4
Type-Line '[OK] firewall rule evaded - traffic disguised as DNS' Cyan 4
Progress-Bar 'Evading security perimeter' 24 50
Write-Host ''

# --- Fase 4: escalada + rootkit (mas tenso) ---
Type-Line 'WARNING: target system is actively monitoring this connection.' Red 9
Start-Sleep -Milliseconds 300
Type-Line 'Running deep exploit chain - do not disconnect...' Yellow 9
Start-Sleep -Milliseconds 300
Matrix-Burst 10
Type-Line 'escalating privileges: user -> root ... token forged' Yellow 6
Type-Line ("[OK] kernel exploit CVE-2024-{0} applied successfully" -f (Rnd)) Cyan 4
Type-Line '> rootkit.install(hide_process=True, autostart=True)' DarkGray 4
Type-Line '[OK] backdoor disguised as systemd service' Cyan 4
Progress-Bar 'Installing persistence' 30 70
Write-Host ''

# --- Final ---
Start-Sleep -Milliseconds 300
Type-Line 'All security layers have been bypassed.' White 8
Progress-Bar 'Finalizing' 20 40
Start-Sleep -Milliseconds 400

$banner = @'

    ###   ######  ######  ######  ######  ######
   #   #  #       #       #       #       #
   #####  #       #       #####   #####   ######
   #   #  #       #       #           #        #
   #   #  ######  ######  ######  ######  ######

           A C C E S S   G R A N T E D
'@
Write-Host $banner -ForegroundColor Green
Write-Host ''
Type-Line 'Full control established on remote host.' Cyan 8
Write-Host ''
Write-Host 'Cerrando en 6 segundos...' -ForegroundColor DarkGray
Start-Sleep -Seconds 6

# Cerrar la ventana de la consola de verdad (funciona tambien en Windows Terminal)
try {
    $p = (Get-CimInstance Win32_Process -Filter "ProcessId=$PID").ParentProcessId
    if ($p) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue }
} catch {}
Stop-Process -Id $PID -Force
