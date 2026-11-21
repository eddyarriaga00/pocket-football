"""Measure a walking or running clip the way the game's stride is shaped (render3d.js gaitOf), in hip heights and
   radians, so the two can be compared: speed, cadence, step length, the share of the cycle a foot is down, the hips'
   rise and fall and their roll, the shoulders' turn against the hips, the lean, the arm swing and the elbow, the knee
   at its most bent in the air, how high the heel comes up behind and the knee in front.
   python gait.py <clip.bvh> [t0 t1]"""
import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bvh import BVH
from retarget import frame_from, nz, limb


def measure(path, t0=None, t1=None):
    b = BVH(path); I = b.idx
    f0 = int((t0 or 0) / b.dt); f1 = int(t1 / b.dt) if t1 else b.frames
    fr = range(f0, f1)
    P = np.array([b.fk(f)[0] for f in fr]); dt = b.dt; n = len(P)
    g = lambda j: P[:, I[j]]
    hip = g('Hips'); hh = np.percentile(hip[:, 1], 90)  # about the standing hip height
    ground = min(g('LeftToeBase')[:, 1].min(), g('RightToeBase')[:, 1].min())
    hh -= ground
    v = np.gradient(hip[:, [0, 2]], dt, axis=0); sp = np.linalg.norm(v, axis=1)
    fwd = nz(hip[-1, [0, 2]] - hip[0, [0, 2]])
    out = {'file': os.path.basename(path), 'secs': round(n * dt, 2), 'speed_hh': float(np.median(sp) / hh)}
    # foot contacts: the ankle moving slower than a fifth of the body's speed and low
    downs = {}
    for S in ('Left', 'Right'):
        a = g(S + 'Foot'); va = np.linalg.norm(np.gradient(a[:, [0, 2]], dt, axis=0), axis=1)
        low = a[:, 1] - a[:, 1].min() < 0.12 * hh
        downs[S] = (va < 0.35 * np.median(sp)) & low
    duty = float(np.mean([d.mean() for d in downs.values()]))
    # steps: each rising edge of a contact
    edges = sorted([k for S in downs for k in np.where(np.diff(downs[S].astype(int)) == 1)[0]])
    edges = [e for i, e in enumerate(edges) if i == 0 or e - edges[i - 1] > 0.12 / dt]
    if len(edges) > 2:
        step_t = float(np.median(np.diff(edges)) * dt)
        out['cadence'] = 1 / step_t
        out['step_hh'] = float(np.median(sp) * step_t / hh)
    out['duty'] = duty
    hy = hip[:, 1] - ground
    out['hip_mean'] = float(hy.mean() / hh); out['hip_bounce'] = float((np.percentile(hy, 97) - np.percentile(hy, 3)) / hh)
    # frames
    ang = {k: [] for k in ('roll', 'lean', 'twist', 'slx', 'srx', 'slz', 'el', 'kl', 'hl', 'headx')}
    up = np.array([0., 1., 0.])
    for k in range(n):
        p = lambda j: P[k, I[j]]
        r = p('RightUpLeg') - p('LeftUpLeg'); ang['roll'].append(np.arctan2(r[1], np.hypot(r[0], r[2])))
        Pf = frame_from(r, up)
        Cf = frame_from(p('RightArm') - p('LeftArm'), p('Neck') - p('LowerBack'))
        Rr = Pf.T @ Cf
        ang['twist'].append(np.arctan2(Rr[0][2], Rr[0][0])); ang['lean'].append(np.arctan2(Rr[2][1], Rr[1][1]))
        for S, key in (('Left', 'slx'), ('Right', 'srx')):
            u = Cf.T @ nz(p(S + 'ForeArm') - p(S + 'Arm')); x, z = limb(u); ang[key].append(x)
            if S == 'Left':
                ang['slz'].append(z)
                w = nz(p('LeftHand') - p('LeftForeArm')); ang['el'].append(np.arccos(np.clip(np.dot(nz(p('LeftForeArm') - p('LeftArm')), w), -1, 1)))
        t = Pf.T @ nz(p('LeftLeg') - p('LeftUpLeg')); hx, hz = limb(t); ang['hl'].append(hx)
        ang['kl'].append(np.arccos(np.clip(np.dot(nz(p('LeftLeg') - p('LeftUpLeg')), nz(p('LeftFoot') - p('LeftLeg'))), -1, 1)))
    A = {k: np.array(v) for k, v in ang.items()}
    rng = lambda x: float(np.percentile(x, 97) - np.percentile(x, 3))
    out.update(pelvis_roll=rng(A['roll']) / 2, lean=float(np.median(A['lean'])), twist=rng(A['twist']) / 2,
               arm_fwd=float(np.percentile(A['slx'], 97)), arm_back=float(np.percentile(A['slx'], 3)), arm_out=float(np.median(A['slz'])),
               elbow_mean=float(np.median(A['el'])), elbow_rng=rng(A['el']), knee_max=float(np.percentile(A['kl'], 98)), knee_min=float(np.percentile(A['kl'], 3)),
               hip_fwd=float(np.percentile(A['hl'], 97)), hip_back=float(np.percentile(A['hl'], 3)))
    lf = g('LeftFoot')[:, 1] - g('LeftFoot')[:, 1].min(); out['heel_lift'] = float(np.percentile(lf, 98) / hh)
    side = np.array([-fwd[1], fwd[0]]); sway = (hip[:, [0, 2]] - hip[:, [0, 2]].mean(0)) @ side
    sway = sway - np.polyval(np.polyfit(np.arange(n), sway, 1), np.arange(n)); out['sway'] = float((np.percentile(sway, 97) - np.percentile(sway, 3)) / 2 / hh)
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    files = [a for a in args if a.endswith('.bvh')]; nums = [float(a) for a in args if not a.endswith('.bvh')]
    rows = [measure(f, *(nums[:2] if len(nums) >= 2 else [])) for f in files]
    keys = [k for k in rows[0] if k != 'file']
    print(f"{'':14}" + ' '.join(f'{r["file"][:9]:>9}' for r in rows))
    for k in keys:
        print(f'{k:14}' + ' '.join(f'{r.get(k, float("nan")):9.2f}' for r in rows))
