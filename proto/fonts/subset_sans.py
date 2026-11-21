# Nest Sans 만들기: IBM Plex Sans KR 을 이 게임 글에 쓰인 글자만 남겨 woff2 로 줄이고, 이름을 바꾼다 ("Plex" 는 OFL 예약 이름).
# python3 fonts/subset_sans.py IBMPlexSansKR-Regular.ttf IBMPlexSansKR-Bold.ttf
import sys, glob, os, subprocess
from fontTools.ttLib import TTFont
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
txt = ''.join(open(f, encoding='utf8').read() for f in glob.glob(os.path.join(root, 'src', '*.js')) + glob.glob(os.path.join(root, 'src', '*.css')) + [os.path.join(root, 'build.sh')])
chars = set(txt) | set(chr(c) for c in range(32, 127)) | set('…·→←↑↓↻★☆◆◇●○■□▲▼⤡⤢✕×「」『』〈〉《》–—‘’“”')
cf = os.path.join(here, '_chars.txt'); open(cf, 'w', encoding='utf8').write(''.join(sorted(chars)))
for src, out in zip(sys.argv[1:3], ['NestSans-Regular.woff2', 'NestSans-Bold.woff2']):
    tmp = os.path.join(here, '_tmp.woff2')
    subprocess.check_call(['pyftsubset', src, '--text-file=' + cf, '--output-file=' + tmp, '--flavor=woff2', '--layout-features=kern,liga', '--no-hinting', '--desubroutinize'])
    f = TTFont(tmp)
    for n in f['name'].names:
        if n.nameID in (1, 3, 4, 6, 16):
            n.string = n.toUnicode().replace('IBM Plex Sans KR', 'Nest Sans').replace('IBMPlexSansKR', 'NestSans').replace('Plex', 'Nest')
    f.flavor = 'woff2'; f.save(os.path.join(here, out)); os.remove(tmp)
    print(out, os.path.getsize(os.path.join(here, out)))
os.remove(cf)
