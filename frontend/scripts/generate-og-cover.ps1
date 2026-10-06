# generate-og-cover.ps1
# Genera public/og-cover.jpg (1200x630) para la metaimagen Open Graph de
# Metalúrgica del Caribe. Dibuja con GDI+ sin dependencias externas.
# Correr desde la raíz del repo:  pwsh ./frontend/scripts/generate-og-cover.ps1

Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\public'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
$outPath = Join-Path $outDir 'og-cover.jpg'

$W = 1200
$H = 630

$bg       = [System.Drawing.ColorTranslator]::FromHtml('#0E1116')
$grid     = [System.Drawing.ColorTranslator]::FromHtml('#1D2430')
$primary  = [System.Drawing.ColorTranslator]::FromHtml('#E8521D')
$text     = [System.Drawing.ColorTranslator]::FromHtml('#ECECEE')
$muted    = [System.Drawing.ColorTranslator]::FromHtml('#9BA3AD')
$line     = [System.Drawing.ColorTranslator]::FromHtml('#3A414C')

$bmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Fondo
$g.Clear($bg)

# Grid blueprint 48x48
$gridPen = New-Object System.Drawing.Pen($grid, 1)
for ($x = 0; $x -lt $W; $x += 48) { $g.DrawLine($gridPen, $x, 0, $x, $H) }
for ($y = 0; $y -lt $H; $y += 48) { $g.DrawLine($gridPen, 0, $y, $W, $y) }
$gridPen.Dispose()

# Fade radial (simulado con rectángulo semitransparente oscuro al borde)
$fadeBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF(0, 0)),
    (New-Object System.Drawing.PointF($W, $H)),
    ([System.Drawing.Color]::FromArgb(0, 14, 17, 22)),
    ([System.Drawing.Color]::FromArgb(220, 14, 17, 22))
)
$g.FillRectangle($fadeBrush, 0, 0, $W, $H)
$fadeBrush.Dispose()

# Barra de acento izquierda
$accentBrush = New-Object System.Drawing.SolidBrush($primary)
$g.FillRectangle($accentBrush, 0, 0, 8, $H)
$accentBrush.Dispose()

# Brand-mark grande (viewBox 40x40 escalado x8 = 320 px, origen 90,120)
$ox = 90.0
$oy = 120.0
$scale = 8.0
function PX([double]$v) { return [single]($ox + $v * $scale) }
function PY([double]$v) { return [single]($oy + $v * $scale) }

$strokePx = [single](2.5 * $scale)
$pen = New-Object System.Drawing.Pen($primary, $strokePx)
$pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

$tri = @(
    (New-Object System.Drawing.PointF((PX 4), (PY 32))),
    (New-Object System.Drawing.PointF((PX 20), (PY 6))),
    (New-Object System.Drawing.PointF((PX 36), (PY 32)))
)
$g.DrawPolygon($pen, $tri)

$brush = New-Object System.Drawing.SolidBrush($primary)
$cx = (PX 20); $cy = (PY 24); $r = [single](4 * $scale)
$g.FillEllipse($brush, ($cx - $r), ($cy - $r), ($r * 2), ($r * 2))
$g.DrawLine($pen, (PX 12), (PY 32), (PX 28), (PY 32))
$pen.Dispose()
$brush.Dispose()

# Tipografía: Oswald/Impact con fallback a Arial Narrow
function Get-DisplayFont {
    param([int]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Bold)
    $families = @('Oswald', 'Impact', 'Arial Narrow', 'Arial Black', 'Arial')
    foreach ($name in $families) {
        try {
            $f = New-Object System.Drawing.Font($name, [single]$size, $style, [System.Drawing.GraphicsUnit]::Pixel)
            if ($f.Name -ieq $name) { return $f }
            $f.Dispose()
        } catch {}
    }
    return (New-Object System.Drawing.Font('Arial', [single]$size, $style, [System.Drawing.GraphicsUnit]::Pixel))
}
function Get-BodyFont {
    param([int]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular)
    $families = @('Inter', 'Segoe UI', 'Arial')
    foreach ($name in $families) {
        try {
            $f = New-Object System.Drawing.Font($name, [single]$size, $style, [System.Drawing.GraphicsUnit]::Pixel)
            if ($f.Name -ieq $name) { return $f }
            $f.Dispose()
        } catch {}
    }
    return (New-Object System.Drawing.Font('Arial', [single]$size, $style, [System.Drawing.GraphicsUnit]::Pixel))
}

$fontBrand   = Get-DisplayFont -size 86  -style ([System.Drawing.FontStyle]::Bold)
$fontSmall   = Get-DisplayFont -size 28  -style ([System.Drawing.FontStyle]::Regular)
$fontTag     = Get-DisplayFont -size 68  -style ([System.Drawing.FontStyle]::Bold)
$fontBody    = Get-BodyFont    -size 18  -style ([System.Drawing.FontStyle]::Regular)

$textBrush  = New-Object System.Drawing.SolidBrush($text)
$mutedBrush = New-Object System.Drawing.SolidBrush($muted)
$primBrush  = New-Object System.Drawing.SolidBrush($primary)

# Izquierda: brand-mark arriba (ya dibujado), METALURGICA + sublinea abajo.
# Caracteres acentuados via code points para no depender del encoding del .ps1.
$g.DrawString('METAL' + [char]0x00DA + 'RGICA', $fontBrand, $textBrush, [single]90, [single]460)
$g.DrawString('DEL CARIBE ' + [char]0x00B7 + ' BARRANQUILLA ' + [char]0x00B7 + ' DESDE 1999', $fontSmall, $mutedBrush, [single]94, [single]556)

# Derecha: tagline del hero con espaciado seguro
$g.DrawString('Metal',       $fontTag, $textBrush,  [single]650, [single]210)
$g.DrawString('que ',        $fontTag, $textBrush,  [single]650, [single]300)
$queWidth = $g.MeasureString('que ', $fontTag).Width
$g.DrawString('aguanta',     $fontTag, $primBrush,  [single](650 + $queWidth), [single]300)
$g.DrawString('el oficio.',  $fontTag, $textBrush,  [single]650, [single]390)

# Linea de referencia + leyenda tipo plano de taller
$linePen = New-Object System.Drawing.Pen($line, 1)
$g.DrawLine($linePen, 650, 510, 1130, 510)
$linePen.Dispose()
$g.DrawString('HERRER' + [char]0x00CD + 'A ' + [char]0x00B7 + ' ESTRUCTURAS MET' + [char]0x00C1 + 'LICAS ' + [char]0x00B7 + ' SOLDADURA MIG TIG', $fontBody, $mutedBrush, [single]650, [single]524)

$fontBrand.Dispose(); $fontSmall.Dispose(); $fontTag.Dispose(); $fontBody.Dispose()
$textBrush.Dispose(); $mutedBrush.Dispose(); $primBrush.Dispose()

# Guardar JPG con calidad 85
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
         Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int64]85
)
$bmp.Save($outPath, $codec, $params)
$params.Dispose()
$g.Dispose()
$bmp.Dispose()

Write-Output "wrote $outPath"
Write-Output "done."
