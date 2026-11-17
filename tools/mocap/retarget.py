"""Turn a BVH clip into PocketFootball's pose angles (render3d.js pose layout), frame by frame.
   The game's figure faces -z with +x to his right and +y up. A shoulder is Rx(SX)*Rz(SZ) applied to an arm hanging
   down (0,-1,0); an elbow or a knee bends about its own x; a hip is Rx(H)*Rz(HZ); the chest Rx(CHRX)*Ry(CHRY).
   python retarget.py <file.bvh> <t0> <t1> <n>   -> JSON rows of the channels"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bvh import BVH

nz = lambda v: v / (np.linalg.norm(v) or 1)


def frame_from(right, up):
    x = nz(right)
    y = nz(up - x * np.dot(up, x))
    z = np.cross(x, y)  # backward: the figure faces -z
    return np.stack([x, y, z], axis=1)  # columns: the frame's axes in world space


def limb(d):
    """(X, Z) for Rx(X)*Rz(Z)*(0,-1,0) = d, d in the parent's frame"""
    zr = np.arcsin(np.clip(d[0], -1, 1))
    xr = np.arctan2(-d[2], -d[1])
    return xr, zr


def Rx(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def Rz(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def bend(A, v):
    """the bend about x of a child segment v (world dir) below a joint whose frame is A (world)"""
    l = A.T @ v
    return np.arctan2(-l[2], -l[1])


def pose(P, I, h0):
    g = lambda n: P[I[n]]
    up = np.array([0.0, 1.0, 0.0])
    Pf = frame_from(g('RightUpLeg') - g('LeftUpLeg'), up)  # the pelvis: level, turned the way the hips face
    Cf = frame_from(g('RightArm') - g('LeftArm'), g('Neck') - g('LowerBack'))
    Rr = Pf.T @ Cf  # chest in pelvis
    out = {'CHRY': float(np.arctan2(Rr[0][2], Rr[0][0])), 'CHRX': float(np.arctan2(Rr[2][1], Rr[1][1]))}
    for side, S, E, H, K in (('L', 'SLX', 'EL', 'HL', 'KL'), ('R', 'SRX', 'ER', 'HR', 'KR')):
        Sd = 'Left' if side == 'L' else 'Right'
        u = Cf.T @ nz(g(Sd + 'ForeArm') - g(Sd + 'Arm'))
        sx, sz = limb(u)
        A = Cf @ Rx(sx) @ Rz(sz)
        out[S], out['S' + side + 'Z'] = float(sx), float(sz)
        out[E] = float(bend(A, nz(g(Sd + 'Hand') - g(Sd + 'ForeArm'))))
        t = Pf.T @ nz(g(Sd + 'Leg') - g(Sd + 'UpLeg'))
        hx, hz = limb(t)
        A = Pf @ Rx(hx) @ Rz(hz)
        out[H], out['H' + side + 'Z'] = float(hx), float(hz)
        out[K] = float(bend(A, nz(g(Sd + 'Foot') - g(Sd + 'Leg'))))
    out['PELY'] = float(g('Hips')[1] / h0)  # as a share of the standing hip height
    out['yaw'] = float(np.arctan2(-Pf[0][2], Pf[0][0]))  # which way the hips face, for reference
    return out


if __name__ == '__main__':
    b = BVH(sys.argv[1])
    t0, t1, n = float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4])
    h0 = max(b.fk(f)[0][b.idx['Hips']][1] for f in range(0, b.frames, 12))
    rows = []
    for k in range(n):
        t = t0 + (t1 - t0) * k / max(1, n - 1)
        P, _ = b.fk(min(b.frames - 1, int(round(t / b.dt))))
        r = pose(P, b.idx, h0)
        r['t'] = round(t, 3)
        rows.append(r)
    print(json.dumps(rows))
