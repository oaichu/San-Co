#!/bin/bash
# Bootstrap VM Oracle Cloud Always Free (Ubuntu aarch64/amd64) cho Sân Cờ.
# Chạy trên VM sau khi SSH vào:  bash bootstrap-vm.sh
# Script: mở firewall OS + cài Coolify (tự cài Docker).
set -euo pipefail

echo "==> Cập nhật hệ thống"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

echo "==> Mở cổng trong OS firewall"
# Oracle Ubuntu image có sẵn rule REJECT trong iptables — chèn ACCEPT trước nó.
for p in 80 443; do
  sudo iptables -C INPUT -p tcp --dport "$p" -j ACCEPT 2>/dev/null \
    || sudo iptables -I INPUT 5 -p tcp --dport "$p" -j ACCEPT
done
# Giữ rule sau reboot.
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent netfilter-persistent
sudo netfilter-persistent save

echo "==> Cài Coolify (tự cài Docker nếu thiếu)"
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash

IP=$(curl -fsSL ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
cat <<EOF

============================================================
 Coolify đã cài xong.

 Mở dashboard bằng MỘT trong hai cách:
   a) SSH tunnel (khuyến nghị, an toàn):
        ssh -L 8000:localhost:8000 ubuntu@$IP
      rồi mở http://localhost:8000
   b) Mở tạm cổng 8000 trong Oracle Security List
      rồi truy cập http://$IP:8000

 Tiếp theo: xem docs/DEPLOY.md mục "3. Cấu hình Coolify".
============================================================
EOF
