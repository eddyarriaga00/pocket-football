"""Fit the game's shoulder (SX, SZ) and elbow (E) to put the elbow and the hand where the clip has them (directions in
   the chest frame, both segments of equal length), since the game's arm has no twist of its own."""
import numpy as np
from retarget import Rx, Rz

G = None
def grid():
    global G
    if G is None:
        sx, sz, e = np.meshgrid(np.linspace(-np.pi, np.pi, 73), np.linspace(-1.55, 1.55, 32), np.linspace(0, 2.7, 28), indexing='ij')
        sx, sz, e = sx.ravel(), sz.ravel(), e.ravel()
        cx, s_x, cz, s_z, ce, se = np.cos(sx), np.sin(sx), np.cos(sz), np.sin(sz), np.cos(e), np.sin(e)
        el = np.stack([s_z, -cz * cx, -cz * s_x], 1)                       # A*(0,-1,0)
        # forearm A*Rx(e)*(0,-1,0) = A*(0,-ce,-se); A = Rx(sx)Rz(sz)
        v = np.stack([np.zeros_like(e), -ce, -se], 1)
        vz = np.stack([cz * v[:, 0] - s_z * v[:, 1], s_z * v[:, 0] + cz * v[:, 1], v[:, 2]], 1)   # Rz
        fa = np.stack([vz[:, 0], cx * vz[:, 1] - s_x * vz[:, 2], s_x * vz[:, 1] + cx * vz[:, 2]], 1)  # Rx
        G = (sx, sz, e, el, el + fa)
    return G

def fit(u, w, prev=None):
    """u, w: the upper arm and forearm directions in the chest frame -> (SX, SZ, E); prev keeps the solution continuous"""
    sx, sz, e, el, hd = grid()
    cost = np.sum((el - u) ** 2, 1) + np.sum((hd - (u + w)) ** 2, 1)
    if prev is not None:
        d = np.angle(np.exp(1j * (sx - prev[0])))
        cost = cost + 0.02 * (d ** 2 + (sz - prev[1]) ** 2 + (e - prev[2]) ** 2)
    k = int(np.argmin(cost))
    best = np.array([sx[k], sz[k], e[k]])
    # refine
    step = np.array([0.09, 0.05, 0.05])
    def c(p):
        A = Rx(p[0]) @ Rz(p[1])
        el_ = A @ np.array([0, -1, 0]); hd_ = el_ + A @ Rx(p[2]) @ np.array([0, -1, 0])
        r = np.sum((el_ - u) ** 2) + np.sum((hd_ - u - w) ** 2)
        if prev is not None:
            r += 0.02 * (np.angle(np.exp(1j * (p[0] - prev[0]))) ** 2 + (p[1] - prev[1]) ** 2 + (p[2] - prev[2]) ** 2)
        return r
    cur = c(best)
    for _ in range(60):
        moved = False
        for i in range(3):
            for s in (-1, 1):
                q = best.copy(); q[i] += s * step[i]
                if i == 2: q[2] = np.clip(q[2], 0, 2.7)
                v = c(q)
                if v < cur: best, cur, moved = q, v, True
        if not moved: step /= 2
    return best, cur
