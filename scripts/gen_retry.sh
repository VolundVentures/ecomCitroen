#!/usr/bin/env bash
set -u

ROOT="c:/Users/Zakaria/ecomCitroen/ecomCitroen"
OUT="$ROOT/apps/store-citroen-ma/public/generated"
LOG="$OUT/_logs"
mkdir -p "$OUT/hero" "$OUT/backdrops" "$OUT/3d" "$LOG"

TOKEN=$(grep '^REPLICATE_API_TOKEN=' "$ROOT/.env" | cut -d= -f2- | tr -d ' \r\n')
export REPLICATE_API_TOKEN="$TOKEN"

BASELINE='Ultra-editorial automotive photography in the style of a Kinfolk / Freunde von Freunden / Citroen global campaign. Muted cinematic color grade: warm putty, soft terracotta, pale sage, desaturated teal, natural stone. Golden-hour soft light, gentle film grain, shallow depth of field, subtle atmospheric haze. Never harsh, never neon, never saturated red. Photorealistic, no text, no watermarks, no logos except a tasteful Citroen chevron on the grille.'

run_image() {
  local slug="$1" ratio="$2" outpath="$3" prompt="$4"
  local logf="$LOG/${slug}.log"
  local metaf="$LOG/${slug}.meta.json"
  local full_prompt="$prompt $BASELINE"
  local body
  body=$(node -e "process.stdout.write(JSON.stringify({input:{prompt:process.argv[1],aspect_ratio:process.argv[2],resolution:'2K',output_format:'jpg',safety_filter_level:'block_only_high'}}));" "$full_prompt" "$ratio")
  echo "[$slug] retry POST ratio=$ratio" >> "$logf"
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
    echo "[$slug] FAILED status=$status" >> "$logf"
    echo "FAIL|$slug|$id|$status" > "$LOG/${slug}.result"
    return 1
  fi
  local out
  out=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));const o=j.output;console.log(Array.isArray(o)?o[0]:o)}catch(e){}")
  curl -sL -o "$outpath" "$out"
  if [[ -s "$outpath" ]]; then
    echo "OK|$slug|$id|$outpath|$(wc -c < "$outpath")" > "$LOG/${slug}.result"
    echo "[$slug] OK -> $outpath"
  else
    echo "FAIL|$slug|$id|download-empty" > "$LOG/${slug}.result"
  fi
}

# Retry the 5 failed images, staggered 3s to avoid 429 burst
run_image "hero-homepage" "21:9" "$OUT/hero/homepage.jpg" "Wide cinematic shot of a metallic sand-beige 2026 Citroen C3 Aircross parked on a minimalist coastal road at golden hour near Essaouira Morocco, soft Atlantic haze, abstract modern architecture in background, subject positioned in right third of frame, generous negative sky space on left for overlaid text, sophisticated editorial mood." &
sleep 3
run_image "hero-c3-aircross" "16:9" "$OUT/hero/c3-aircross.jpg" "A 2026 Citroen C3 Aircross SUV in a soft two-tone sage-green-over-graphite livery, captured three-quarter front on a Moroccan riad courtyard at dawn, warm terracotta walls behind, palm shadows across the hood, shallow depth of field." &
sleep 3
run_image "hero-berlingo" "16:9" "$OUT/hero/berlingo.jpg" "A 2026 Citroen Berlingo family van in deep metallic petrol-blue parked at a sunlit coastal viewpoint over Chefchaouen with soft blue-painted Moroccan village walls behind, three-quarter front angle, a picnic basket and bicycles subtly visible, warm candid lifestyle mood." &
sleep 3
run_image "bd-chefchaouen" "3:2" "$OUT/backdrops/chefchaouen.jpg" "Empty quiet street in Chefchaouen between soft blue-washed walls at late afternoon, no people, no cars, ready to composite a vehicle, editorial campaign backdrop." &
sleep 3
run_image "bd-rabat-hassan" "3:2" "$OUT/backdrops/rabat-hassan.jpg" "Empty plaza near Hassan Tower in Rabat at early morning, warm travertine stones, soft mist, minimalist historic columns in background, no people, no cars, ready to composite a vehicle, editorial campaign backdrop." &

wait

# Retry 3D with direct citroen.ma URL that has .png extension
run_3d() {
  local slug="3d-c3-aircross-v2"
  local outpath="$OUT/3d/c3-aircross.glb"
  local logf="$LOG/${slug}.log"
  local metaf="$LOG/${slug}.meta.json"

  # Upload a local PNG explicitly as filename=image.png
  local local_img="$ROOT/apps/store-citroen-ma/public/models/c3-aircross/colors/polar-white/01.png"
  if [[ ! -f "$local_img" ]]; then
    # fallback: look for any 01.png in colors
    local_img=$(ls "$ROOT/apps/store-citroen-ma/public/models/c3-aircross/colors/"*/01.png 2>/dev/null | head -1)
  fi
  echo "[$slug] source=$local_img" >> "$logf"
  # Upload with explicit filename so Replicate sees .png extension
  local up
  up=$(curl -sS -X POST "https://api.replicate.com/v1/files" \
    -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
    -F "content=@${local_img};type=image/png;filename=c3-aircross.png")
  echo "$up" > "$LOG/${slug}.upload.json"
  local img_url
  img_url=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$LOG/${slug}.upload.json','utf8'));console.log(j.urls&&j.urls.get||'')}catch(e){}")
  echo "[$slug] uploaded=$img_url" >> "$logf"
  if [[ -z "$img_url" ]]; then
    echo "FAIL|$slug||upload-failed" > "$LOG/${slug}.result"; return 1
  fi
  local body
  body=$(node -e "process.stdout.write(JSON.stringify({input:{image:process.argv[1],enable_pbr:true,face_count:300000,generate_type:'Normal'}}));" "$img_url")
  local resp
  resp=$(curl -sS -X POST "https://api.replicate.com/v1/models/tencent/hunyuan-3d-3.1/predictions" \
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
    sleep 10; waited=$((waited+10))
    resp=$(curl -sS "https://api.replicate.com/v1/predictions/$id" -H "Authorization: Bearer $REPLICATE_API_TOKEN")
    echo "$resp" > "$metaf"
    status=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).status||'')}catch(e){}")
    echo "[$slug] poll ${waited}s status=$status" >> "$logf"
  done
  if [[ "$status" != "succeeded" ]]; then
    local err
    err=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));console.log(j.error||j.status||'unknown')}catch(e){console.log('parse-err')}")
    echo "FAIL|$slug|$id|$err" > "$LOG/${slug}.result"; return 1
  fi
  local out
  out=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));const o=j.output;console.log(typeof o==='string'?o:(Array.isArray(o)?o[0]:(o.mesh||o.glb||'')))}catch(e){}")
  curl -sL -o "$outpath" "$out"
  if [[ -s "$outpath" ]]; then
    echo "OK|$slug|$id|$outpath|$(wc -c < "$outpath")" > "$LOG/${slug}.result"
    echo "[$slug] OK -> $outpath"
  else
    echo "FAIL|$slug|$id|download-empty" > "$LOG/${slug}.result"
  fi
}

run_3d
