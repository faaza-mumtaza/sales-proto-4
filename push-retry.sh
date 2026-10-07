#!/bin/bash
# Auto-retry push — GitHub write path sedang 500 (insiden infra).
# Berhenti otomatis saat push sukses. Log: /home/z/my-project/push-retry.log
cd /home/z/my-project
for i in $(seq 1 40); do
  if git push origin main > /dev/null 2>&1; then
    echo "$(date '+%H:%M:%S') PUSH BERHASIL (percobaan #$i)" >> push-retry.log
    exit 0
  fi
  echo "$(date '+%H:%M:%S') gagal (percobaan #$i)" >> push-retry.log
  sleep 180
done
echo "$(date '+%H:%M:%S') BATAL setelah 40 percobaan (~2 jam)" >> push-retry.log
