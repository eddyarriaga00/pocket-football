"""Read a BVH file (as data only) and compute joint world positions and rotations per frame."""
import numpy as np


def rot(axis, deg):
    a = np.radians(deg)
    c, s = np.cos(a), np.sin(a)
    if axis == 'X':
        return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
    if axis == 'Y':
        return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


class BVH:
    def __init__(self, path):
        lines = open(path).read().split('\n')
        self.names, self.parent, self.offset, self.chans = [], [], [], []
        stack, i = [], 0
        while not lines[i].strip().startswith('MOTION'):
            t = lines[i].strip().split()
            if t and t[0] in ('ROOT', 'JOINT'):
                self.names.append(t[1])
                self.parent.append(stack[-1] if stack else -1)
                self.offset.append(None)
                self.chans.append([])
                cur = len(self.names) - 1
            elif t and t[0] == 'End':
                self.names.append(self.names[stack[-1]] + '_end')
                self.parent.append(stack[-1])
                self.offset.append(None)
                self.chans.append([])
                cur = len(self.names) - 1
            elif t and t[0] == '{':
                stack.append(cur)
            elif t and t[0] == '}':
                stack.pop()
            elif t and t[0] == 'OFFSET':
                self.offset[stack[-1]] = np.array([float(v) for v in t[1:4]])
            elif t and t[0] == 'CHANNELS':
                self.chans[stack[-1]] = t[2:]
            i += 1
        self.frames = int(lines[i + 1].split()[1])
        self.dt = float(lines[i + 2].split()[2])
        data = [l.split() for l in lines[i + 3:i + 3 + self.frames] if l.strip()]
        self.data = np.array(data, dtype=float)
        self.idx = {n: k for k, n in enumerate(self.names)}

    def fk(self, f):
        """world position and rotation of every joint at frame f"""
        row, c = self.data[f], 0
        P, R = [None] * len(self.names), [None] * len(self.names)
        for j, n in enumerate(self.names):
            r, pos = np.eye(3), self.offset[j].copy()
            for ch in self.chans[j]:
                v = row[c]
                c += 1
                if ch.endswith('position'):
                    pos['XYZ'.index(ch[0])] = v if self.parent[j] < 0 else pos['XYZ'.index(ch[0])]
                else:
                    r = r @ rot(ch[0], v)
            if self.parent[j] < 0:
                P[j], R[j] = pos, r
            else:
                pr = R[self.parent[j]]
                P[j] = P[self.parent[j]] + pr @ self.offset[j]
                R[j] = pr @ r
        return np.array(P), R

    def all_pos(self, step=1):
        return np.array([self.fk(f)[0] for f in range(0, self.frames, step)])
