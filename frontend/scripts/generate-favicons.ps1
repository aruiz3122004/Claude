# generate-favicons.ps1
# Genera los PNG e ICO del brand-mark de Metalúrgica del Caribe usando GDI+.
# Correr desde la raíz del repo:  pwsh ./frontend/scripts/generate-favicons.ps1
#
# El SVG fuente es ./frontend/assets/brand-mark.svg; esta implementación lo
# redibuja en código para no depender de un rasterizador externo (ImageMagick/sharp).

Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\public\favicons'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$primary = [System.Drawing.ColorTranslator]::FromHtml('#E8521D')
$dark    = [System.Drawing.ColorTranslator]::FromHtml('#0E1116')
$transparent = [System.Drawing.Color]::Transparent

function New-BrandBitmap {
    param(
        [int]$size,
        [switch]$solidBg,
        [double]$padding = 0.0
    )
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($solidBg) {
        $g.Clear($dark)
    } else {
        $g.Clear($transparent)
    }

    # viewBox del SVG: 0 0 40 40. Mapear con padding opcional.
    $pad = $size * $padding
    $inner = $size - 2 * $pad
    $scale = $inner / 40.0
    $ox = $pad
    $oy = $pad

    function PX([double]$v) { return [single]($ox + $v * $scale) }
    function PY([double]$v) { return [single]($oy + $v * $scale) }

    $strokePx = [single](2.5 * $scale)
    $pen = New-Object System.Drawing.Pen($primary, $strokePx)
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    # Triángulo: M4 32 L20 6 L36 32 Z
    $tri = @(
        (New-Object System.Drawing.PointF((PX 4), (PY 32))),
        (New-Object System.Drawing.PointF((PX 20), (PY 6))),
        (New-Object System.Drawing.PointF((PX 36), (PY 32)))
    )
    $g.DrawPolygon($pen, $tri)

    # Círculo relleno en (20,24) r=4
    $brush = New-Object System.Drawing.SolidBrush($primary)
    $cx = (PX 20); $cy = (PY 24); $r = [single](4 * $scale)
    $g.FillEllipse($brush, ($cx - $r), ($cy - $r), ($r * 2), ($r * 2))

    # Línea inferior: M12 32 L28 32
    $g.DrawLine($pen, (PX 12), (PY 32), (PX 28), (PY 32))

    $pen.Dispose()
    $brush.Dispose()
    $g.Dispose()
    return $bmp
}

function Save-Png {
    param([System.Drawing.Bitmap]$bmp, [string]$path)
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "wrote $path"
}

# PNGs
$sizes = @(
    @{ name = 'favicon-16.png';           size = 16;  solidBg = $false; pad = 0.0 },
    @{ name = 'favicon-32.png';           size = 32;  solidBg = $false; pad = 0.0 },
    @{ name = 'apple-touch-icon.png';     size = 180; solidBg = $true;  pad = 0.12 },
    @{ name = 'icon-192.png';             size = 192; solidBg = $false; pad = 0.08 },
    @{ name = 'icon-512.png';             size = 512; solidBg = $false; pad = 0.08 },
    @{ name = 'icon-maskable-512.png';    size = 512; solidBg = $true;  pad = 0.18 }
)

foreach ($spec in $sizes) {
    $bmp = New-BrandBitmap -size $spec.size -solidBg:$spec.solidBg -padding $spec.pad
    Save-Png $bmp (Join-Path $outDir $spec.name)
    $bmp.Dispose()
}

# ICO (multi-size)
$icoPath = Join-Path $outDir 'favicon.ico'
$icoSizes = @(16, 32, 48)
$bitmaps = @()
foreach ($s in $icoSizes) { $bitmaps += (New-BrandBitmap -size $s -solidBg:$false -padding 0.0) }

# Serializar manualmente el formato ICO (header + directorio + PNGs embebidos).
# Cada entrada usa PNG embebido, soportado por Windows Vista+ y navegadores.
$stream = New-Object System.IO.MemoryStream
$w = New-Object System.IO.BinaryWriter($stream)

# ICONDIR
$w.Write([uint16]0)
$w.Write([uint16]1)
$w.Write([uint16]$icoSizes.Count)

# Reservar directorio y recoger los PNG en buffer
$pngBuffers = @()
foreach ($b in $bitmaps) {
    $ms = New-Object System.IO.MemoryStream
    $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBuffers += ,($ms.ToArray())
    $ms.Dispose()
}

$dirSize = 16 * $icoSizes.Count
$offset = 6 + $dirSize

for ($i = 0; $i -lt $icoSizes.Count; $i++) {
    $s = $icoSizes[$i]
    $len = $pngBuffers[$i].Length
    $sizeField = if ($s -ge 256) { 0 } else { [byte]$s }
    $w.Write([byte]$sizeField)      # width
    $w.Write([byte]$sizeField)      # height
    $w.Write([byte]0)               # colors
    $w.Write([byte]0)               # reserved
    $w.Write([uint16]1)             # planes
    $w.Write([uint16]32)            # bits per pixel
    $w.Write([uint32]$len)          # size
    $w.Write([uint32]$offset)       # offset
    $offset += $len
}
foreach ($buf in $pngBuffers) { $w.Write($buf) }
$w.Flush()
[System.IO.File]::WriteAllBytes($icoPath, $stream.ToArray())
$w.Dispose()
$stream.Dispose()
foreach ($b in $bitmaps) { $b.Dispose() }

Write-Output "wrote $icoPath"
Write-Output "done."
