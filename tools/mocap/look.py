"""Survey clips: throws (fast overhead hand), runs (hip speed), and draw stick-figure contact sheets as PNG.
   python look.py survey <files...>      python look.py sheet <file> <t0> <t1> <n> <out.png> [view]"""
import sys, os, zlib, struct, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bvh import BVH

BONES = [('Hips', 'LowerBack'), ('LowerBack', 'Spine'), ('Spine', 'Spine1'), ('Spine1', 'Neck'), ('Neck', 'Neck1'), ('Neck1', 'Head'),
         ('Spine1', 'LeftShoulder'), ('LeftShoulder', 'LeftArm'), ('LeftArm', 'LeftForeArm'), ('LeftForeArm', 'LeftHand'),
         ('Spine1', 'RightShoulder'), ('RightShoulder', 'RightArm'), ('RightArm', 'RightForeArm'), ('RightForeArm', 'RightHand'),
         ('Hips', 'LHipJoint'), ('LHipJoint', 'LeftUpLeg'), ('LeftUpLeg', 'LeftLeg'), ('LeftLeg', 'LeftFoot'), ('LeftFoot', 'LeftToeBase'),
         ('Hips', 'RHipJoint'), ('RHipJoint', 'RightUpLeg'), ('RightUpLeg', 'RightLeg'), ('RightLeg', 'RightFoot'), ('RightFoot', 'RightToeBase')]


def png(path, img):
    h, w, _ = img.shape
    raw = b''.join(b'\x00' + img[y].tobytes() for y in range(h))
    ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw, 6)) + ch(b'IEND', b''))


def line(img, a, b, col, th=2):
    n = int(max(abs(b[0] - a[0]), abs(b[1] - a[1]))) + 1
    for k in range(n + 1):
        x, y = a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n
        img[max(0, int(y) - th // 2):int(y) + th // 2 + 1, max(0, int(x) - th // 2):int(x) + th // 2 + 1] = col


def survey(path):
    b = BVH(path)
    step = max(1, int(round(1 / 60 / b.dt)))  # about 60 frames a second
    P = b.all_pos(step)
    dt = b.dt * step
    I = b.idx
    out = [f'{path}: {b.frames} frames at {1 / b.dt:.0f}/s = {b.frames * b.dt:.1f}s']
    hip = P[:, I['Hips']]
    hs = np.linalg.norm(np.diff(hip[:, [0, 2]], axis=0), axis=1) / dt
    out.append(f'  hip speed max {hs.max():.1f}/s mean {hs.mean():.1f} (units/s); height {hip[:, 1].mean():.1f}')
    for hand in ('RightHand', 'LeftHand'):
        h = P[:, I[hand]]
        sp = np.linalg.norm(np.diff(h, axis=0), axis=1) / dt
        head = P[:, I['Head'], 1]
        peaks = [k for k in range(2, len(sp) - 2) if sp[k] == sp[k - 2:k + 3].max() and sp[k] > 120 and h[k, 1] > head[k] - 8]
        last = -99
        for k in peaks:
            if k - last > 30:
                out.append(f'  {hand} fast at {k * dt:6.2f}s speed {sp[k]:.0f} height-vs-head {h[k, 1] - head[k]:+.1f}')
                last = k
    print('\n'.join(out))


def sheet(path, t0, t1, n, outp, view='side'):
    b = BVH(path)
    I = b.idx
    frames = [int((t0 + (t1 - t0) * k / max(1, n - 1)) / b.dt) for k in range(n)]
    Ps = [b.fk(min(f, b.frames - 1))[0] for f in frames]
    allp = np.concatenate(Ps)
    # project: 'side' looks along the axis the hips moved least on; 'front' the other horizontal axis
    span = allp.max(0) - allp.min(0)
    ax = 0 if view == 'front' else 2
    if view == 'auto':
        ax = 0 if span[0] < span[2] else 2
    W, H, cell = 160 * n, 240, 160
    img = np.full((H, W, 3), 245, np.uint8)
    for k, P in enumerate(Ps):
        c = P[I['Hips']]
        sc = 2.4
        pt = lambda j: (k * cell + cell / 2 + (P[I[j]][ax] - c[ax]) * sc, H - 20 - (P[I[j]][1] - allp[:, 1].min()) * sc)
        for a, bb in BONES:
            col = (200, 40, 40) if 'Right' in a + bb or 'RHip' in a + bb else (40, 70, 200) if 'Left' in a + bb or 'LHip' in a + bb else (30, 30, 30)
            line(img, pt(a), pt(bb), col, 2)
        line(img, (k * cell, 0), (k * cell, H - 1), (200, 200, 200), 0)
    png(outp, img)
    print('wrote', outp, [round(f * b.dt, 2) for f in frames])


if __name__ == '__main__':
    if sys.argv[1] == 'survey':
        for p in sys.argv[2:]:
            survey(p)
    else:
        sheet(sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), sys.argv[6], sys.argv[7] if len(sys.argv) > 7 else 'auto')
