"""Stick figures in the thrower's own frame: left image side view (forward to the left), right image from above."""
import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bvh import BVH
from look import BONES, png, line
from retarget import frame_from
b = BVH(sys.argv[1]); I = b.idx
t0, t1, n, out = float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
fr = [int((t0 + (t1 - t0) * k / (n - 1)) / b.dt) for k in range(n)]
P0, _ = b.fk(fr[0])
Pf = frame_from(P0[I['RightUpLeg']] - P0[I['LeftUpLeg']], np.array([0., 1., 0.]))  # the first frame's pelvis: the view is fixed
cell, H, sc = 170, 300, 6.0
img = np.full((H * 2, cell * n, 3), 248, np.uint8)
for k, f in enumerate(fr):
    P, _ = b.fk(f)
    L = (P - P0[I['Hips']]) @ Pf  # into the first pelvis frame: x right, y up, z back
    for a, bb in BONES:
        col = (200, 40, 40) if 'Right' in a + bb or 'RHip' in a + bb else (40, 70, 200) if 'Left' in a + bb or 'LHip' in a + bb else (30, 30, 30)
        side = lambda j: (k * cell + cell / 2 + L[I[j]][2] * sc, H - 30 - (L[I[j]][1] + 18) * sc)       # side: back to the right
        top = lambda j: (k * cell + cell / 2 + L[I[j]][0] * sc, H + H / 2 + L[I[j]][2] * sc)             # above: right to the right, back down
        line(img, side(a), side(bb), col, 2)
        line(img, top(a), top(bb), col, 2)
png(out, img)
print([round(f * b.dt, 2) for f in fr])
