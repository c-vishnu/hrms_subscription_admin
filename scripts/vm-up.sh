#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. On Ubuntu/Debian run:"
  echo "  curl -fsSL https://get.docker.com | sudo sh"
  echo "  sudo usermod -aG docker \"\$USER\""
  echo "Then log out and back in."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is not available. Install the Docker Compose plugin, then retry."
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi

docker compose up -d --build

port="$(grep -E '^APP_PORT=' .env | cut -d= -f2 || true)"
port="${port:-8080}"

echo
echo "HRMS Subscription Admin is running."
echo "On this VM:    http://127.0.0.1:${port}"
echo "From the LAN:  http://$(hostname -I 2>/dev/null | awk '{print $1}'):${port}"
echo
echo "Logs:   docker compose logs -f"
echo "Stop:   docker compose down"
