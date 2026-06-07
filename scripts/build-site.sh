#!/usr/bin/env bash
# 정적 사이트 배포본 생성 — 공개 대상만 dist/ 로 복사한다.
# 제외: db/, docs/, README.md, .gitignore, *.src.html (소스/내부 파일)
# Cloudflare Pages 빌드 명령: bash scripts/build-site.sh  /  출력 디렉터리: dist
set -euo pipefail

cd "$(dirname "$0")/.."   # 저장소 루트로 이동(어디서 실행하든 안전)

rm -rf dist
mkdir -p dist

cp index.html dist/
cp -r assets flyer share dist/
find dist -name '*.src.html' -delete   # 공유카드 소스 등 비공개 파일 제외

echo "build-site: dist/ 생성 완료 ($(find dist -type f | wc -l) files)"
