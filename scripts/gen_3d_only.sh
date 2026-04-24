#!/usr/bin/env bash
set -u
ROOT="c:/Users/Zakaria/ecomCitroen/ecomCitroen"
OUT="$ROOT/apps/store-citroen-ma/public/generated"
LOG="$OUT/_logs"
mkdir -p "$OUT/3d"
TOKEN=$(grep '^REPLICATE_API_TOKEN=' "$ROOT/.env" | cut -d= -f2- | tr -d ' \r\n')
export REPLICATE_API_TOKEN="$TOKEN"

slug="3d-c3-aircross-v2"
outpath="$OUT/3d/c3-aircross.glb"
logf="$LOG/${slug}.log"
metaf="$LOG/${slug}.meta.json"
local_img="$ROOT/apps/store-citroen-ma/public/models/c3-aircross/colors/polar-white/01.png"

echo "[$slug] starting" > "$logf"
up=$(curl -sS -X POST "https://api.replicate.com/v1/files" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -F "content=@${local_img};type=image/png;filename=c3_aircross.png")
echo "$up" > "$LOG/${slug}.upload.json"
img_url=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$LOG/${slug}.upload.json','utf8'));console.log(j.urls&&j.urls.get||'')}catch(e){}")
echo "[$slug] uploaded=$img_url" >> "$logf"

body=$(node -e "process.stdout.write(JSON.stringify({input:{image:process.argv[1],enable_pbr:true,face_count:300000,generate_type:'Normal'}}));" "$img_url")
resp=$(curl -sS -X POST "https://api.replicate.com/v1/models/tencent/hunyuan-3d-3.1/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: wait" \
  -d "$body")
echo "$resp" > "$metaf"
id=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).id||'')}catch(e){}")
status=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).status||'')}catch(e){}")
echo "[$slug] id=$id status=$status" >> "$logf"

waited=0
while [[ "$status" == "starting" || "$status" == "processing" ]] && (( waited < 600 )); do
  sleep 10; waited=$((waited+10))
  resp=$(curl -sS "https://api.replicate.com/v1/predictions/$id" -H "Authorization: Bearer $REPLICATE_API_TOKEN")
  echo "$resp" > "$metaf"
  status=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).status||'')}catch(e){}")
  echo "[$slug] poll ${waited}s status=$status" >> "$logf"
done

if [[ "$status" != "succeeded" ]]; then
  err=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));console.log(j.error||j.status||'unknown')}catch(e){}")
  echo "FAIL|$slug|$id|$err" > "$LOG/${slug}.result"
  echo "FAILED: $err" >> "$logf"
  exit 1
fi

out=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));const o=j.output;console.log(typeof o==='string'?o:(Array.isArray(o)?o[0]:(o&&(o.mesh||o.glb)||'')))}catch(e){}")
echo "[$slug] output=$out" >> "$logf"
curl -sL -o "$outpath" "$out"
if [[ -s "$outpath" ]]; then
  echo "OK|$slug|$id|$outpath|$(wc -c < "$outpath")" > "$LOG/${slug}.result"
  echo "OK -> $outpath" >> "$logf"
else
  echo "FAIL|$slug|$id|empty-download" > "$LOG/${slug}.result"
fi
