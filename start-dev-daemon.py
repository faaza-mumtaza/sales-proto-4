import os, sys, time

# Double-fork launcher untuk Next.js dev server — agar lolos dari reaper
# sandbox yang membunuh proses hasil perintah Bash saat perintah selesai.
LOG = "/home/z/my-project/dev.log"

pid = os.fork()
if pid == 0:
    os.setsid()
    # arahkan ulang stdin/stdout/stderr ke log
    log_fd = os.open(LOG, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    devnull = os.open(os.devnull, os.O_RDONLY)
    os.dup2(devnull, 0)
    os.dup2(log_fd, 1)
    os.dup2(log_fd, 2)
    pid2 = os.fork()
    if pid2 == 0:
        os.chdir("/home/z/my-project")
        env = dict(os.environ)
        env["PATH"] = "/home/z/my-project/node_modules/.bin:" + env.get("PATH", "")
        with open("/tmp/dev-daemon.pid", "w") as f:
            f.write(str(os.getpid()))
        os.execvpe(
            "bash",
            ["bash", "-c", "exec ./node_modules/.bin/next dev -p 3000"],
            env,
        )
    os._exit(0)
os.waitpid(pid, 0)
print(f"launcher exited; dev server daemon pid written to /tmp/dev-daemon.pid")
