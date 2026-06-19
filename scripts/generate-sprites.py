#!/usr/bin/env python3
"""Génère les frames "punch" (8: droite, 9: gauche) pour chaque spritesheet
axolotl, et la spritesheet de vague d'esquive.

Layout du sheet axolotl (300x258, frames 100x86, 3 colonnes) :
  row 0 : 0 idle-right, 1 walk-right-a, 2 walk-right-b
  row 1 : 3 idle-left,  4 walk-left-a,  5 walk-left-b
  row 2 : 6 jump-right, 7 jump-left,    8 (vide -> punch-right)
  row 3 : 9 punch-left (nouvelle rangée, sheet agrandi à 300x344)
"""
from PIL import Image, ImageDraw
import colorsys
import glob
import os

FRAME_W, FRAME_H = 100, 86
SHEET_DIR = '/home/user/unlock/client/public/assets/sprites/axolotls'
WAVE_OUT = '/home/user/unlock/client/public/assets/sprites/waves/wave.png'


def get_frame(sheet, col, row):
    return sheet.crop((col * FRAME_W, row * FRAME_H, (col + 1) * FRAME_W, (row + 1) * FRAME_H))


def sample_colors(frame):
    """Retourne (body, outline, gills) de la frame idle."""
    px = frame.load()
    # corps : centre de la tête
    body = px[55, 30]
    # contour : pixel opaque le plus sombre
    darkest, dval = None, 1e9
    # branchie : pixel opaque le plus saturé
    gill, gsat = None, -1
    for y in range(FRAME_H):
        for x in range(FRAME_W):
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            v = r + g + b
            if v < dval:
                dval, darkest = v, (r, g, b, 255)
            h, s, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > gsat and vv > 0.3:
                gsat, gill = s, (r, g, b, 255)
    return body, darkest, gill


def shift_lean(frame, direction):
    """Penche le haut du sprite vers l'avant : les lignes au-dessus de la
    taille sont décalées progressivement dans la direction du coup."""
    out = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    for y in range(FRAME_H):
        # lean: 0 px en bas, jusqu'à 6 px en haut
        lean = int((1 - y / FRAME_H) * 6) * direction
        row = frame.crop((0, y, FRAME_W, y + 1))
        out.paste(row, (lean, y), row)
    return out


def mix(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1[:3], c2[:3])) + (255,)


def draw_arm(img, body, outline, direction):
    """Dessine un bras tendu + poing "mitaine" devant le sprite.
    direction: +1 = droite, -1 = gauche."""
    d = ImageDraw.Draw(img)
    shade = mix(body, outline, 0.35)   # ombrage du dessous
    arm_y0, arm_y1 = 47, 55            # bras épais de 8 px

    if direction > 0:
        arm_x0, arm_x1 = 58, 79        # fill commence DANS le corps
        edge_x0, edge_x1 = 70, 80      # contour seulement hors silhouette
        fist_cx, fist_cy = 86, 51
        back_x = 4                     # traits de vitesse à l'arrière
    else:
        arm_x0, arm_x1 = 21, 42
        edge_x0, edge_x1 = 20, 30
        fist_cx, fist_cy = 14, 51
        back_x = 70

    # Bras : remplissage depuis l'intérieur du corps (fusion sans couture),
    # contour uniquement sur la partie qui dépasse de la silhouette.
    d.rectangle([arm_x0, arm_y0, arm_x1, arm_y1], fill=body)
    d.rectangle([arm_x0, arm_y1 - 2, arm_x1, arm_y1], fill=shade)
    d.line([edge_x0, arm_y0 - 1, edge_x1, arm_y0 - 1], fill=outline)
    d.line([edge_x0, arm_y1 + 1, edge_x1, arm_y1 + 1], fill=outline)

    # Poing : ovale 16x13 type mitaine, contour 1 px, ombrage moitié basse
    rx, ry = 8, 6
    d.ellipse([fist_cx - rx - 1, fist_cy - ry - 1, fist_cx + rx + 1, fist_cy + ry + 1], fill=outline)
    d.ellipse([fist_cx - rx, fist_cy - ry, fist_cx + rx, fist_cy + ry], fill=body)
    d.chord([fist_cx - rx, fist_cy - ry, fist_cx + rx, fist_cy + ry], 0, 180, fill=shade)
    # Pli du pouce
    d.arc([fist_cx - rx + 2, fist_cy - 2, fist_cx + rx - 2, fist_cy + ry], 20, 160, fill=outline)

    # Traits de vitesse à l'arrière du personnage (effet dash)
    speed = (255, 255, 255, 210)
    for sy, ln in [(40, 11), (48, 15), (56, 9)]:
        d.line([back_x, sy, back_x + ln, sy], fill=speed, width=2)
    return img


def make_punch_frame(idle, direction):
    body, outline, gills = sample_colors(idle)
    leaned = shift_lean(idle, direction)
    return draw_arm(leaned, body, outline, direction)


def process_sheet(path):
    sheet = Image.open(path).convert('RGBA')
    if sheet.height >= FRAME_H * 4:
        print(f'  déjà étendu, skip ({os.path.basename(path)})')
        return

    idle_r = get_frame(sheet, 0, 0)
    idle_l = get_frame(sheet, 0, 1)

    punch_r = make_punch_frame(idle_r, +1)
    punch_l = make_punch_frame(idle_l, -1)

    out = Image.new('RGBA', (300, FRAME_H * 4), (0, 0, 0, 0))
    out.paste(sheet, (0, 0))
    out.paste(punch_r, (2 * FRAME_W, 2 * FRAME_H))   # frame 8 (row2 col2)
    out.paste(punch_l, (0, 3 * FRAME_H))             # frame 9 (row3 col0)
    out.save(path)
    print(f'  ok ({os.path.basename(path)})')


def make_wave_sheet():
    """4 frames 100x40 de vague de surf pixel-art (dessin 50x20, scale x2)."""
    frames = []
    deep = (24, 86, 160, 235)
    mid = (44, 140, 220, 245)
    light = (110, 200, 250, 250)
    foam = (240, 252, 255, 255)

    for f in range(4):
        lo = Image.new('RGBA', (50, 20), (0, 0, 0, 0))
        d = ImageDraw.Draw(lo)
        # corps d'eau : demi-ellipse
        d.ellipse([1, 8, 48, 26], fill=deep)
        d.ellipse([4, 10, 45, 24], fill=mid)
        # crête ondulée : bosses claires dont la phase varie par frame
        for i in range(6):
            bx = 3 + i * 8 + (f % 4)
            by = 8 + (1 if (i + f) % 2 == 0 else 0)
            d.ellipse([bx - 4, by - 3, bx + 4, by + 4], fill=light)
        # écume blanche sur la crête (phase animée)
        for i in range(6):
            bx = 3 + i * 8 + (f % 4)
            by = 6 + (1 if (i + f) % 2 == 0 else 0)
            d.ellipse([bx - 3, by - 2, bx + 3, by + 2], fill=foam)
        # gouttelettes au-dessus, positions par frame
        drops = [(8 + f * 3, 2), (24 + ((f * 5) % 9), 1), (38 - f * 2, 3)]
        for dx, dy in drops:
            if 0 <= dx < 50:
                d.point((dx, dy), fill=foam)
                d.point((dx + 1, dy + 1), fill=light)
        frames.append(lo.resize((100, 40), Image.NEAREST))

    sheet = Image.new('RGBA', (400, 40), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * 100, 0))
    os.makedirs(os.path.dirname(WAVE_OUT), exist_ok=True)
    sheet.save(WAVE_OUT)
    print(f'wave sheet: {WAVE_OUT} ({sheet.size})')


if __name__ == '__main__':
    print('Punch frames:')
    for path in sorted(glob.glob(f'{SHEET_DIR}/axolotl-*.png')):
        process_sheet(path)
    make_wave_sheet()
