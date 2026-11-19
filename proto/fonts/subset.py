# 제목·단추용 픽셀 글꼴을 게임에 쓰는 글자만 남겨 줄인다 (Galmuri11 Bold, SIL OFL 1.1)
# 쓰는 법: python3 fonts/subset.py <Galmuri11-Bold.ttf 경로>   → fonts/NestPix.woff2
# 남기는 글자: 자주 쓰는 한글 2,350자(KS X 1001) + 영문·숫자·기호 + 소스에 실제로 나오는 모든 글자
import io, os, sys, glob
from fontTools import subset
here = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1]
chars = set(chr(c) for c in range(0x20, 0x7F))
for c in range(0xAC00, 0xD7A4):
    try:
        if len(chr(c).encode('euc-kr')) == 2: chars.add(chr(c))
    except UnicodeEncodeError:
        pass
for fn in glob.glob(os.path.join(here, '..', 'src', '*')) + [os.path.join(here, '..', 'build.sh')]:
    chars |= set(io.open(fn, encoding='utf8').read())
chars = {c for c in chars if ord(c) >= 0x20}
opt = subset.Options(); opt.flavor = 'woff2'; opt.layout_features = ['*']; opt.name_IDs = ['*']; opt.notdef_outline = True
font = subset.load_font(src, opt)
have = set(chr(c) for c in font.getBestCmap())
miss = sorted(chars - have)
s = subset.Subsetter(opt); s.populate(text=''.join(sorted(chars & have))); s.subset(font)
out = os.path.join(here, 'NestPix.woff2'); subset.save_font(font, out, opt)
print('글자', len(chars & have), '· 글꼴에 없는 글자', len(miss), ''.join(miss)[:80], '·', os.path.getsize(out), 'bytes')
