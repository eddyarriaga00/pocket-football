"""The throw table relative to the throw's direction: the chest's turn and lean against the target line, the arms
   fitted in the chest frame. Writes JSON rows."""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bvh import BVH
from retarget import frame_from, nz
from armfit import fit
b = BVH(sys.argv[1]); I = b.idx
t0, t1, n, trel = float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
F = lambda t: b.fk(min(b.frames - 1, int(round(t / b.dt))))[0]
h0 = max(b.fk(f)[0][I['Hips']][1] for f in range(0, b.frames, 12))
v = F(trel + 0.01)[I['RightHand']] - F(trel - 0.01)[I['RightHand']]
fwd = nz(np.array([v[0], 0, v[2]])); up = np.array([0., 1., 0.])
T = frame_from(np.cross(fwd, up), up)  # facing the throw: x right, y up, z back
rows, prev = [], {'L': None, 'R': None}
for k in range(n):
    t = t0 + (t1 - t0) * k / (n - 1)
    P = F(t); g = lambda j: P[I[j]]
    Cf = frame_from(g('RightArm') - g('LeftArm'), g('Neck') - g('LowerBack'))
    Rr = T.T @ Cf
    r = {'t': round(t, 3), 'CHRY': float(np.arctan2(Rr[0][2], Rr[0][0])), 'CHRX': float(np.arctan2(Rr[2][1], Rr[1][1])), 'PELY': float(g('Hips')[1] / h0)}
    for s, Sd in (('L', 'Left'), ('R', 'Right')):
        u = Cf.T @ nz(g(Sd + 'ForeArm') - g(Sd + 'Arm')); w = Cf.T @ nz(g(Sd + 'Hand') - g(Sd + 'ForeArm'))
        p, err = fit(u, w, prev[s]); prev[s] = p
        r['S' + s + 'X'], r['S' + s + 'Z'], r['E' + s] = [float(x) for x in p]
    hp = T.T @ (g('RightHand') - g('Hips')); r['hand'] = [round(float(x), 1) for x in hp]
    rows.append(r)
print(json.dumps(rows))
