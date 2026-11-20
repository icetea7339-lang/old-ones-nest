# 방 그림 조각을 한 장으로 붙인다: python3 tests/roomtile.py tests/rooms_<이름표>
import sys, os
from PIL import Image, ImageDraw
d = sys.argv[1]; fs = sorted(f for f in os.listdir(d) if f.startswith('day_') and f.endswith('.png') and f.count('_') == 1 and not f[4:-4].isdigit())
ims = [(f[4:-4], Image.open(os.path.join(d, f))) for f in fs]
if not ims: sys.exit('no crops')
w, h = max(i.width for _, i in ims), max(i.height for _, i in ims); cols = 5; rows = (len(ims) + cols - 1) // cols; S = 2
sheet = Image.new('RGB', (cols * w * S, rows * (h * S + 18)), '#0b0c16'); dr = ImageDraw.Draw(sheet)
for k, (name, im) in enumerate(ims):
    x, y = (k % cols) * w * S, (k // cols) * (h * S + 18); sheet.paste(im.resize((im.width * S, im.height * S), Image.NEAREST), (x, y + 18)); dr.text((x + 4, y + 3), name, fill='#ece6d6')
sheet.save(os.path.join(d, 'sheet.png')); print(len(ims), 'rooms ->', os.path.join(d, 'sheet.png'))
