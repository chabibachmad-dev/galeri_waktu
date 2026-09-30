"""Generate simple app icons for the PWA (no external assets needed).
Monokrom hitam/putih (gaya "Snail OS", disamakan dengan ringkasan_harian &
dompet_harian) -- motif "foto polaroid" dengan garis timeline kecil di
bawahnya, supaya beda tipis dari kedua app lain tapi tetap satu keluarga
desain.
"""
from PIL import Image, ImageDraw

OUT_DIR = "/home/claude/galeri_waktu/public/icons"

BLACK = (0, 0, 0, 255)
WHITE = (255, 255, 255, 255)


def make_icon(size: int, path: str, maskable: bool = False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = int(size * 0.08) if maskable else 0
    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=int(size * 0.22),
        fill=BLACK,
    )

    # "Foto polaroid" -- kartu putih dengan bingkai bawah lebih tebal,
    # sedikit dimiringkan biar terasa seperti tumpukan foto di album.
    photo_w = size * 0.42
    photo_h = size * 0.46
    cx, cy = size * 0.5, size * 0.46

    def draw_polaroid(offset_x, offset_y, angle_hint):
        x0 = cx - photo_w / 2 + offset_x
        y0 = cy - photo_h / 2 + offset_y
        x1 = x0 + photo_w
        y1 = y0 + photo_h
        draw.rounded_rectangle([x0, y0, x1, y1], radius=size * 0.02, fill=WHITE)
        # area "gambar" gelap di dalam bingkai (foto itu sendiri)
        border = size * 0.035
        bottom_border = size * 0.09
        draw.rectangle(
            [x0 + border, y0 + border, x1 - border, y1 - bottom_border],
            fill=BLACK,
        )

    # Foto belakang (sedikit offset), lalu foto depan di atasnya.
    draw_polaroid(size * 0.09, -size * 0.03, None)
    draw_polaroid(-size * 0.06, size * 0.02, None)

    # Garis timeline kecil + tiga titik di bawah, motif "kronologi".
    line_y = size * 0.84
    draw.line([size * 0.24, line_y, size * 0.76, line_y], fill=BLACK, width=max(2, int(size * 0.016)))
    for dot_x in (size * 0.24, size * 0.5, size * 0.76):
        r = size * 0.02
        draw.ellipse([dot_x - r, line_y - r, dot_x + r, line_y + r], fill=BLACK)

    img.save(path)


if __name__ == "__main__":
    import os

    os.makedirs(OUT_DIR, exist_ok=True)
    make_icon(192, f"{OUT_DIR}/icon-192.png")
    make_icon(512, f"{OUT_DIR}/icon-512.png")
    make_icon(512, f"{OUT_DIR}/icon-maskable-512.png", maskable=True)
    print("Icons generated.")
