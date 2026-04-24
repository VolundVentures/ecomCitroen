#!/usr/bin/env bash
set -u
TOKEN=$(grep '^REPLICATE_API_TOKEN=' .env | cut -d= -f2- | tr -d ' \r\n')
ID="tf25q3wxdnrmr0cxk0s8dqz1c4"
OUT="apps/store-citroen-ma/public/generated/3d/c3-aircross.glb"
mkdir -p "$(dirname "$OUT")"
for i in $(seq 1 80); do
  resp=$(curl -sS "https://api.replicate.com/v1/predictions/$ID" -H "Authorization: Bearer $TOKEN")
  status=$(echo "$resp" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).status||''))")
  echo "[$(date +%T)] iter=$i status=$status"
  if [[ "$status" == "succeeded" ]]; then
    out=$(echo "$resp" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const o=j.output;console.log(typeof o==='string'?o:(Array.isArray(o)?o[0]:(o&&(o.mesh||o.glb)||'')))})")
    echo "OUT=$out"
    curl -sL -o "$OUT" "$out"
    ls -la "$OUT"
    exit 0
  fi
  if [[ "$status" == "failed" || "$status" == "canceled" ]]; then
    err=$(echo "$resp" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).error||''))")
    echo "FAILED: $err"; exit 1
  fi
  sleep 15
done
echo "timeout"
