"""Generate reproducible, dependency-free PWA icons (original geometric monogram)."""
import math
import struct
import zlib
from pathlib import Path

def segment(x, y, ax, ay, bx, by):
    dx, dy = bx-ax, by-ay
    t = max(0, min(1, ((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)))
    return math.hypot(x-ax-t*dx, y-ay-t*dy)

def make(size):
    pixels = bytearray()
    for py in range(size):
        pixels.append(0)
        for px in range(size):
            x,y=px/size,py/size
            color=(40,104,78)
            # A lowercase d and a geometric m, entirely inside maskable safe area.
            d = abs(math.hypot(x-.34,y-.53)-.105)<.025 or segment(x,y,.445,.32,.445,.635)<.025
            m = any(segment(x,y,*s)<.025 for s in [(.52,.63,.52,.43),(.52,.43,.61,.53),(.61,.53,.70,.43),(.70,.43,.70,.63)])
            if d or m: color=(247,248,239)
            if math.hypot(x-.72,y-.29)<.034: color=(220,189,118)
            pixels.extend(color)
    def chunk(kind,data):
        return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(pixels)))+chunk(b'IEND',b'')
    Path(f'public/icon-{size}.png').write_bytes(png)
for size in (192,512): make(size)
