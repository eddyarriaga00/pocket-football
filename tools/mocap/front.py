"""Stick figures seen from in front of the mover (his facing at each frame), several rows of frames."""
import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bvh import BVH
from look import BONES, png, line
from retarget import frame_from
b = BVH(sys.argv[1]); I = b.idx
t0, t1, n, out = float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
fr = [int((t0 + (t1 - t0) * k / (n - 1)) / b.dt) for k in range(n)]
cell, H, sc, per = 130, 230, 5.0, 10
rows = (n + per - 1) // per
img = np.full((H * rows, cell * per, 3), 248, np.uint8)
for k, f in enumerate(fr):
    P, _ = b.fk(f)
    Pf = frame_from(P[I['RightUpLeg']] - P[I['LeftUpLeg']], np.array([0., 1., 0.]))
    L = (P - P[I['Hips']]) @ Pf
    ox, oy = (k % per) * cell + cell / 2, (k // per) * H + H - 25
    for a, bb in BONES:
        col = (200, 40, 40) if 'Right' in a + bb or 'RHip' in a + bb else (40, 70, 200) if 'Left' in a + bb or 'LHip' in a + bb else (30, 30, 30)
        pt = lambda j: (ox - L[I[j]][0] * sc, oy - (L[I[j]][1] + 18) * sc)  # seen from in front: his right on the image's left
        line(img, pt(a), pt(bb), col, 2)
png(out, img)
print([round(f * b.dt, 2) for f in fr][:: max(1, n // 10)])
