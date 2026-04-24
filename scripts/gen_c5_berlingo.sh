#!/usr/bin/env bash
set -u
ROOT="c:/Users/Zakaria/ecomCitroen/ecomCitroen"
OUT="$ROOT/apps/store-citroen-ma/public/generated"
LOG="$OUT/_logs"
TOKEN=$(grep '^REPLICATE_API_TOKEN=' "$ROOT/.env" | cut -d= -f2- | tr -d ' \r\n')
export REPLICATE_API_TOKEN="$TOKEN"
BASELINE='Preserve the exact vehicle design, body proportions, headlight signature, grille chevron, wheel design, trim colour and badging of the reference image — the car in the scene MUST look exactly like the reference. Ultra-editorial automotive photography: warm putty, soft terracotta, pale sage, desaturated teal, natural stone. Golden-hour soft light, gentle film grain, shallow depth of field. Photorealistic, no text, no watermarks.'

upload_file() {
  local up
  up=$(curl -sS -X POST "https://api.replicate.com/v1/files" -H "Authorization: Bearer $REPLICATE_API_TOKEN" -F "content=@${1};type=image/png")
  node -e "try{const j=JSON.parse(process.argv[1]);console.log(j.urls&&j.urls.get||'')}catch(e){}" "$up"
}
run_job() {
  local slug="$1" ratio="$2" outpath="$3" prompt="$4" ref="$5"
  local logf="$LOG/${slug}.log" metaf="$LOG/${slug}.meta.json"
  local body=$(node -e "process.stdout.write(JSON.stringify({input:{prompt:process.argv[1],aspect_ratio:process.argv[2],resolution:'2K',output_format:'jpg',safety_filter_level:'block_only_high',image_input:[process.argv[3]]}}));" "$prompt $BASELINE" "$ratio" "$ref")
  local resp=$(curl -sS -X POST "https://api.replicate.com/v1/models/google/nano-banana-pro/predictions" -H "Authorization: Bearer $REPLICATE_API_TOKEN" -H "Content-Type: application/json" -H "Prefer: wait" -d "$body")
  echo "$resp" > "$metaf"
  local id=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).id||'')}catch(e){}")
  local status=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).status||'')}catch(e){}")
  echo "[$slug] id=$id status=$status" > "$logf"
  local waited=0
  while [[ "$status" == "starting" || "$status" == "processing" ]] && (( waited < 600 )); do
    sleep 8; waited=$((waited+8))
    resp=$(curl -sS "https://api.replicate.com/v1/predictions/$id" -H "Authorization: Bearer $REPLICATE_API_TOKEN")
    echo "$resp" > "$metaf"
    status=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).status||'')}catch(e){}")
    echo "[$slug] poll ${waited}s status=$status" >> "$logf"
  done
  if [[ "$status" != "succeeded" ]]; then
    local err=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));console.log(j.error||j.status||'unknown')}catch(e){}")
    echo "FAIL|$slug|$id|$err" > "$LOG/${slug}.result"
    return 1
  fi
  local out=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));const o=j.output;console.log(Array.isArray(o)?o[0]:o)}catch(e){}")
  curl -sL -o "$outpath" "$out"
  [[ -s "$outpath" ]] && echo "OK|$slug|$id|$outpath|$(wc -c < "$outpath")" > "$LOG/${slug}.result"
  echo "[$slug] done -> $outpath ($(wc -c < $outpath))" >> "$logf"
}

REF_C5=$(upload_file "$ROOT/apps/store-citroen-ma/public/models/c5-aircross/hero/hero-desktop.jpg")
REF_BERLINGO=$(upload_file "$ROOT/apps/store-citroen-ma/public/models/berlingo/hero/profile.png")
echo "refs: c5=$REF_C5 berlingo=$REF_BERLINGO"

run_job "hero-c5-aircross-v3" "16:9" "$OUT/hero/c5-aircross.jpg" "Place the EXACT 2026 Citroen C5 Aircross from the reference image parked at a quiet modernist villa near the Atlas mountains at early morning, soft rose mountain light, minimalist poolside composition, three-quarter rear angle." "$REF_C5" &
sleep 6
run_job "hero-berlingo-v3" "16:9" "$OUT/hero/berlingo.jpg" "Place the EXACT 2026 Citroen Berlingo family van from the reference image at a sunlit coastal viewpoint above Chefchaouen, soft blue-washed Moroccan village walls behind, three-quarter front angle, a picnic basket and two bicycles subtly visible, warm lifestyle mood." "$REF_BERLINGO" &
wait
echo "done"
