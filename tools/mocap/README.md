# Motion capture to PocketFootball poses

Scripts that turn a BVH motion capture clip into the game's pose angles (the pose layout in `js/render3d.js`).
The clips themselves are not kept in the repository; download them into a folder of their own.

Source used so far: the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu), in the BVH conversion at
github.com/sfd158/cmu-mocap. CMU: free to use, may be included in a product, the data itself may not be resold.
Credit: "The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding
from NSF EIA-0196217."

- `look.py survey <clips>`: length, hip speed, and every fast overhead hand (throws) in each clip.
- `side.py <clip> <t0> <t1> <n> <out.png>`: stick figures from the mover's own side and from above (PNG, no libraries).
- `retarget.py <clip> <t0> <t1> <n>`: every channel, frame by frame (legs and chest against the hips).
- `throwtab2.py <clip> <t0> <t1> <n> <release>`: the throw table in `render3d.js` (THROW): arms fitted with
  `armfit.py` so the elbow and hand land where the thrower's did, the chest measured against the line of the throw.

Run with the project's Python that has numpy (`.voice/venv/bin/python -I`); only numpy is needed.
Used: 79_91 (the throw, rows 1.65 to 2.35 s, release 2.05 s), 78_28 (hip drop in hard cuts), 09_01 (running arms).
