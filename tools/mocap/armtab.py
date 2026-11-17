"""Arms (fitted) and the chest's lean against the hips, sampled over [t0, t1]: rows of SRX, SRZ, ER, SLX, SLZ, EL, CHRX."""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bvh import BVH
from retarget import frame_from, nz
from armfit import fit
b = BVH(sys.argv[1]); I = b.idx
t0, t1, n = float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4])
prev, rows = {'L': None, 'R': None}, []
for k in range(n):
    t = t0 + (t1 - t0) * k / (n - 1)
    P = b.fk(min(b.frames - 1, int(round(t / b.dt))))[0]; g = lambda j: P[I[j]]
    Pf = frame_from(g('RightUpLeg') - g('LeftUpLeg'), np.array([0., 1., 0.]))
    Cf = frame_from(g('RightArm') - g('LeftArm'), g('Neck') - g('LowerBack'))
    Rr = Pf.T @ Cf
    r = {'t': round(t, 3), 'CHRX': float(np.arctan2(Rr[2][1], Rr[1][1])), 'CHRY': float(np.arctan2(Rr[0][2], Rr[0][0]))}
    for s, Sd in (('L', 'Left'), ('R', 'Right')):
        u = Cf.T @ nz(g(Sd + 'ForeArm') - g(Sd + 'Arm')); w = Cf.T @ nz(g(Sd + 'Hand') - g(Sd + 'ForeArm'))
        p, err = fit(u, w, prev[s]); prev[s] = p
        r['S' + s + 'X'], r['S' + s + 'Z'], r['E' + s] = [float(x) for x in p]
        r['err' + s] = float(err)
    rows.append(r)
print(json.dumps(rows))
