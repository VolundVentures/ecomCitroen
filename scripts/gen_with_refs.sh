#!/usr/bin/env bash
# Regenerate the 4 car-in-scene images using Nano Banana Pro EDIT MODE
# (image_input reference → compose the ACTUAL car into the scene).
# Also retry the 3D model with a data-URI payload so the Hunyuan file-extension check passes.

set -u
ROOT="c:/Users/Zakaria/ecomCitroen/ecomCitroen"
OUT="$ROOT/apps/store-citroen-ma/public/generated"
LOG="$OUT/_logs"
mkdir -p "$OUT/hero" "$OUT/3d" "$LOG"
TOKEN=$(grep '^REPLICATE_API_TOKEN=' "$ROOT/.env" | cut -d= -f2- | tr -d ' \r\n')
export REPLICATE_API_TOKEN="$TOKEN"

BASELINE='Preserve the exact vehicle design, body proportions, headlight signature, grille chevron, wheel design, trim colour and badging of the reference image — the car in the scene MUST look exactly like the reference. Ultra-editorial automotive photography, Kinfolk / Freunde von Freunden mood: warm putty, soft terracotta, pale sage, desaturated teal, natural stone. Golden-hour soft light, gentle film grain, shallow depth of field, subtle atmospheric haze. Photorealistic, no text, no watermarks.'

# ---- Upload a local PNG/JPG to Replicate files, return its .urls.get ----
upload_file() {
  local local_path="$1"
  local up
  up=$(curl -sS -X POST "https://api.replicate.com/v1/files" \
    -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
    -F "content=@${local_path};type=image/png")
  node -e "try{const j=JSON.parse(process.argv[1]);console.log(j.urls&&j.urls.get||'')}catch(e){}" "$up"
}

# ---- Run one nano-banana-pro EDIT job with image_input reference ----
run_edit_job() {
  local slug="$1" ratio="$2" outpath="$3" prompt="$4" ref_url="$5"
  local logf="$LOG/${slug}.log"
  local metaf="$LOG/${slug}.meta.json"
  local full_prompt="$prompt $BASELINE"
  local body
  body=$(node -e "
    const p=process.argv[1], r=process.argv[2], u=process.argv[3];
    process.stdout.write(JSON.stringify({input:{prompt:p,aspect_ratio:r,resolution:'2K',output_format:'jpg',safety_filter_level:'block_only_high',image_input:[u]}}));
  " "$full_prompt" "$ratio" "$ref_url")

  echo "[$slug] POST nano-banana-pro EDIT ratio=$ratio ref=$ref_url" > "$logf"
  local resp
  resp=$(curl -sS -X POST "https://api.replicate.com/v1/models/google/nano-banana-pro/predictions" \
    -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Prefer: wait" \
    -d "$body")
  echo "$resp" > "$metaf"

  local id status
  id=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).id||'')}catch(e){}")
  status=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).status||'')}catch(e){}")
  echo "[$slug] id=$id status=$status" >> "$logf"

  local waited=0
  while [[ "$status" == "starting" || "$status" == "processing" ]] && (( waited < 600 )); do
    sleep 8; waited=$((waited+8))
    resp=$(curl -sS "https://api.replicate.com/v1/predictions/$id" -H "Authorization: Bearer $REPLICATE_API_TOKEN")
    echo "$resp" > "$metaf"
    status=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).status||'')}catch(e){}")
    echo "[$slug] poll ${waited}s status=$status" >> "$logf"
  done

  if [[ "$status" != "succeeded" ]]; then
    local err
    err=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));console.log(j.error||j.status||'unknown')}catch(e){}")
    echo "FAIL|$slug|$id|$err" > "$LOG/${slug}.result"
    echo "[$slug] FAILED $err" >> "$logf"
    return 1
  fi
  local out
  out=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));const o=j.output;console.log(Array.isArray(o)?o[0]:o)}catch(e){}")
  curl -sL -o "$outpath" "$out"
  if [[ -s "$outpath" ]]; then
    echo "OK|$slug|$id|$outpath|$(wc -c < "$outpath")" > "$LOG/${slug}.result"
    echo "[$slug] OK -> $outpath" >> "$logf"
  else
    echo "FAIL|$slug|$id|download-empty" > "$LOG/${slug}.result"
  fi
}

# ---- Upload the 3 model reference shots ----
REF_C3=$(upload_file "$ROOT/apps/store-citroen-ma/public/models/c3-aircross/colors/mercury-grey-bi/02.png")
echo "ref c3=$REF_C3"
REF_C5=$(upload_file "$ROOT/apps/store-citroen-ma/public/models/c5-aircross/hero/hero-desktop.jpg")
echo "ref c5=$REF_C5"
REF_BERLINGO=$(upload_file "$ROOT/apps/store-citroen-ma/public/models/berlingo/hero/profile.png")
echo "ref berlingo=$REF_BERLINGO"

# ---- Kick off the 4 edit jobs in parallel with small stagger ----
run_edit_job "hero-homepage-v2" "21:9" "$OUT/hero/homepage.jpg" \
  "Place the EXACT 2026 Citroen C3 Aircross from the reference image onto a minimalist coastal road at golden hour near Essaouira Morocco, soft Atlantic haze behind, abstract modern concrete architecture in background, subject positioned in the right third of the frame, generous negative sky space on the left for overlaid editorial text, sophisticated cinematic mood." \
  "$REF_C3" &
sleep 3
run_edit_job "hero-c3-aircross-v2" "16:9" "$OUT/hero/c3-aircross.jpg" \
  "Place the EXACT 2026 Citroen C3 Aircross from the reference image in a quiet Moroccan riad courtyard at dawn, warm terracotta walls behind the car, dappled palm shadows across the hood, three-quarter front angle matching the reference." \
  "$REF_C3" &
sleep 3
run_edit_job "hero-c5-aircross-v2" "16:9" "$OUT/hero/c5-aircross.jpg" \
  "Place the EXACT 2026 Citroen C5 Aircross from the reference image parked at a quiet modernist villa near the Atlas mountains at early morning, soft rose mountain light in the background, minimalist pool reflection foreground, three-quarter rear angle." \
  "$REF_C5" &
sleep 3
run_edit_job "hero-berlingo-v2" "16:9" "$OUT/hero/berlingo.jpg" \
  "Place the EXACT 2026 Citroen Berlingo family van from the reference image at a sunlit coastal viewpoint above Chefchaouen, soft blue-washed Moroccan village walls in the background, three-quarter front angle, a picnic basket and two bicycles subtly visible beside the van, warm candid lifestyle mood." \
  "$REF_BERLINGO" &

wait
echo "==== edit jobs done ===="

# ---- 3D retry: use data URI (base64) instead of Replicate Files URL ----
slug="3d-c3-aircross-v3"
outpath="$OUT/3d/c3-aircross.glb"
logf="$LOG/${slug}.log"
metaf="$LOG/${slug}.meta.json"
local_img="$ROOT/apps/store-citroen-ma/public/models/c3-aircross/colors/polar-white/01.png"
echo "[$slug] base64-encoding $local_img" > "$logf"
B64=$(base64 -w0 "$local_img")
DATAURI="data:image/png;base64,$B64"

body=$(node -e "process.stdout.write(JSON.stringify({input:{image:process.argv[1],enable_pbr:true,face_count:300000,generate_type:'Normal'}}));" "$DATAURI")
echo "[$slug] POST hunyuan-3d-3.1 data-uri len=${#DATAURI}" >> "$logf"
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
  echo "[$slug] FAILED $err" >> "$logf"
else
  out=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));const o=j.output;console.log(typeof o==='string'?o:(Array.isArray(o)?o[0]:(o&&(o.mesh||o.glb)||'')))}catch(e){}")
  curl -sL -o "$outpath" "$out"
  if [[ -s "$outpath" ]]; then
    echo "OK|$slug|$id|$outpath|$(wc -c < "$outpath")" > "$LOG/${slug}.result"
    echo "[$slug] OK -> $outpath" >> "$logf"
  else
    echo "FAIL|$slug|$id|empty-download" > "$LOG/${slug}.result"
  fi
fi
echo "==== all done ===="
