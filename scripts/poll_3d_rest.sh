#!/usr/bin/env bash
set -u
TOKEN=$(grep '^REPLICATE_API_TOKEN=' .env | cut -d= -f2- | tr -d ' \r\n')
poll_and_save() {
  local id="$1" out="$2" label="$3"
  for i in $(seq 1 80); do
    resp=$(curl -sS "https://api.replicate.com/v1/predictions/$id" -H "Authorization: Bearer $TOKEN")
    status=$(echo "$resp" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).status||''))")
    echo "[$(date +%T)][$label] iter=$i status=$status"
    if [[ "$status" == "succeeded" ]]; then
      url=$(echo "$resp" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const o=j.output;console.log(typeof o==='string'?o:(Array.isArray(o)?o[0]:(o&&(o.mesh||o.glb)||'')))})")
      curl -sL -o "$out" "$url"
      ls -la "$out"
      return 0
    fi
    if [[ "$status" == "failed" || "$status" == "canceled" ]]; then
      echo "$label FAILED"; return 1
    fi
    sleep 15
  done
}
poll_and_save "ajcwhsp2shrmw0cxk0yawxbk1r" "apps/store-citroen-ma/public/generated/3d/c5-aircross.glb" "c5" &
poll_and_save "f7k9dhe5ynrmr0cxk0yan3cm50" "apps/store-citroen-ma/public/generated/3d/berlingo.glb"   "berlingo" &
wait
echo "all-done"
