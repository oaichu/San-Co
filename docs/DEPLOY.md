# Deploy Sân Cờ — Oracle Cloud Always Free + Coolify

Stack này miễn phí vĩnh viễn, SQLite bền (disk thật), và **push lên GitHub là tự deploy** —
tương đương trải nghiệm Vercel nhưng tự chủ hoàn toàn.

Kiến trúc: `GitHub → webhook → Coolify → docker build (Dockerfile repo) → container`
với named volume mount vào `/app/data` giữ `san-co.db`.

---

## 1. Tạo VM miễn phí trên Oracle Cloud

1. Đăng ký tại <https://cloud.oracle.com> — gói **Always Free** (cần thẻ để xác minh,
   không trừ tiền; chọn "Pay As You Go" upgrade là KHÔNG cần thiết).
2. **Compute → Instances → Create instance**:
   - Name: `san-co`
   - Image: **Canonical Ubuntu 22.04** (hoặc 24.04), kiến trúc **aarch64**
   - Shape: **VM.Standard.A1.Flex** (Ampere ARM) — đặt **2 OCPU / 12 GB RAM**
     (Always Free cho tới 4 OCPU + 24 GB; dư sức cho app này)
   - Networking: tạo VCN mới, tick **Assign a public IPv4 address**
   - SSH keys: upload public key của bạn (hoặc để Oracle sinh, lưu private key)
3. Ghi lại **Public IP** của VM.

> Nếu hết capacity A1 ở region bạn chọn, thử region khác (Seoul/Osaka gần VN),
> hoặc dùng `VM.Standard.E2.1.Micro` (x86, 1 GB RAM — yếu, chỉ nên tạm).

## 2. Mở cổng + cài Coolify

**Oracle Security List** (Networking → VCN → Subnet → Security List → Add Ingress Rules):

| Port | Source CIDR | Mục đích |
|------|-------------|----------|
| 22 | `0.0.0.0/0` | SSH |
| 80 | `0.0.0.0/0` | HTTP → Let's Encrypt + redirect |
| 443 | `0.0.0.0/0` | HTTPS |

**SSH vào VM rồi chạy bootstrap** (mở firewall OS + cài Coolify):

```bash
ssh ubuntu@<IP_VM>
curl -fsSL https://raw.githubusercontent.com/<you>/<repo>/main/deploy/bootstrap-vm.sh | bash
```

hoặc copy `deploy/bootstrap-vm.sh` lên VM rồi `bash bootstrap-vm.sh`.

## 3. Domain miễn phí

Cần domain cho HTTPS (cookie Secure, wss). Hai cách free:

- **DuckDNS** (khuyến nghị): đăng nhập <https://www.duckdns.org> bằng GitHub,
  tạo subdomain vd `sanco.duckdns.org` → trỏ về IP VM.
- **sslip.io**: không cần đăng ký — dùng `<IP>.sslip.io` làm domain.

## 4. Cấu hình Coolify

1. Mở dashboard Coolify (SSH tunnel `ssh -L 8000:localhost:8000 ubuntu@<IP>`,
   hoặc mở tạm port 8000 trong Security List). Tạo tài khoản admin lần đầu.
2. **+ Add → Project** → `san-co` → **Add Resource → Public Repository**
   (repo public) hoặc **GitHub App** (repo private — khuyến nghị, webhook tự động).
3. Build Pack: **Dockerfile** (Coolify tự nhận `Dockerfile` ở root repo).
4. Cấu hình:
   - **Port**: `3000`
   - **Domain**: `https://sanco.duckdns.org` (Coolify tự xin Let's Encrypt)
   - **Environment variables**: `SC_SECURE_COOKIE=1`
   - **Persistent Storage**: thêm volume → Destination `/app/data`
     (giữ `san-co.db` qua mọi lần deploy)
   - **Health check**: `/api/health` (Dockerfile đã khai báo)
5. **Deploy** lần đầu. Kiểm tra `https://sanco.duckdns.org/api/health` → `{"ok":true}`.

## 5. Auto-deploy khi push GitHub

- **GitHub App** (private repo): Coolify tự đăng ký webhook — push là deploy, không cần làm gì.
- **Public repo**: Coolify → app → **Webhooks** → copy URL → GitHub repo
  → **Settings → Webhooks → Add webhook** → paste URL, content type `application/json`,
  event `Just the push event`. Xong.

## 6. Vận hành

- **Log**: Coolify dashboard → app → Logs (hoặc `docker logs -f <container>`).
- **Backup DB**: `docker cp <container>:/app/data/san-co.db ./backup-$(date +%F).db`
  hoặc snapshot toàn volume `/var/lib/docker/volumes/.../san-co-data`.
- **Rollback**: Coolify giữ lịch sử deploy → nút Redeploy commit cũ.
- **DB tách biệt**: set env `SC_DB` nếu muốn đổi đường dẫn SQLite.

## Lưu ý

- Repo phải có `Dockerfile` (đã có sẵn, multi-stage, healthcheck, non-root).
- `better-sqlite3` build trên arm64: Dockerfile đã có toolchain fallback.
- WebSocket `/ws` chạy qua Traefik của Coolify — không cần config thêm.
- Always Free không giới hạn thời gian; giữ VM "Always Free-eligible" khi tạo.
