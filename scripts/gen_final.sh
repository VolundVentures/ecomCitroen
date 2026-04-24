#!/usr/bin/env bash
set -u
ROOT="c:/Users/Zakaria/ecomCitroen/ecomCitroen"
OUT="$ROOT/apps/store-citroen-ma/public/generated"
LOG="$OUT/_logs"
TOKEN=$(grep '^REPLICATE_API_TOKEN=' "$ROOT/.env" | cut -d= -f2- | tr -d ' \r\n')
export REPLICATE_API_TOKEN="$TOKEN"
BASE='Preserve EXACTLY the vehicle design, body proportions, headlight signature, grille chevron, wheel design, trim colour and badging of the reference. Ultra-editorial automotive photography: warm putty, terracotta, pale sage, natural stone, golden hour. Photorealistic, no text, no watermarks.'

up_file() {
  local up=$(curl -sS -X POST "https://api.replicate.com/v1/files" -H "Authorization: Bearer $REPLICATE_API_TOKEN" -F "content=@${1};type=image/png")
  node -e "try{console.log(JSON.parse(process.argv[1]).urls.get||'')}catch(e){}" "$up"
}

do_job() {
  local slug="$1" outpath="$2" ref_local="$3" prompt="$4"
  local metaf="$LOG/${slug}.meta.json" logf="$LOG/${slug}.log"
  local ref=$(up_file "$ref_local")
  echo "[$slug] ref=$ref" > "$logf"
  local body=$(node -e "process.stdout.write(JSON.stringify({input:{prompt:process.argv[1],aspect_ratio:'16:9',resolution:'2K',output_format:'jpg',image_input:[process.argv[2]],safety_filter_level:'block_only_high'}}))" "$prompt $BASE" "$ref")
  local resp id status
  for attempt in 1 2 3; do
    resp=$(curl -sS -X POST "https://api.replicate.com/v1/models/google/nano-banana-pro/predictions" -H "Authorization: Bearer $REPLICATE_API_TOKEN" -H "Content-Type: application/json" -H "Prefer: wait" -d "$body")
    id=$(node -e "try{console.log(JSON.parse(process.argv[1]).id||'')}catch(e){}" "$resp")
    status=$(node -e "try{console.log(JSON.parse(process.argv[1]).status||'')}catch(e){}" "$resp")
    echo "[$slug] attempt $attempt id=$id status=$status" >> "$logf"
    [[ -n "$id" ]] && break
    sleep $((45 * attempt))
  done
  [[ -z "$id" ]] && { echo "FAIL|$slug||no-id" > "$LOG/${slug}.result"; return 1; }
  echo "$resp" > "$metaf"
  local waited=0
  while [[ "$status" == "starting" || "$status" == "processing" ]] && (( waited < 600 )); do
    sleep 8; waited=$((waited+8))
    resp=$(curl -sS "https://api.replicate.com/v1/predictions/$id" -H "Authorization: Bearer $REPLICATE_API_TOKEN")
    echo "$resp" > "$metaf"
    status=$(node -e "try{console.log(JSON.parse(process.argv[1]).status||'')}catch(e){}" "$resp")
  done
  [[ "$status" != "succeeded" ]] && { echo "FAIL|$slug|$id|$status" > "$LOG/${slug}.result"; return 1; }
  local out=$(node -e "try{console.log((o=>Array.isArray(o)?o[0]:o)(JSON.parse(process.argv[1]).output))}catch(e){}" "$resp")
  curl -sL -o "$outpath" "$out"
  [[ -s "$outpath" ]] && echo "OK|$slug|$id|$outpath|$(wc -c < "$outpath")" > "$LOG/${slug}.result"
  echo "[$slug] -> $outpath" >> "$logf"
}

do_job "hero-c5-final" "$OUT/hero/c5-aircross.jpg" \
  "$ROOT/apps/store-citroen-ma/public/models/c5-aircross/hero/hero-desktop.jpg" \
  "Place the EXACT 2026 Citroen C5 Aircross SUV from the reference image parked on a stone driveway at a quiet modernist villa near the Atlas mountains at early morning, soft rose mountain light behind, three-quarter rear angle."

sleep 30

do_job "hero-berlingo-final" "$OUT/hero/berlingo.jpg" \
  "$ROOT/apps/store-citroen-ma/public/models/berlingo/hero/profile.png" \
  "Place the EXACT 2026 Citroen Berlingo family van from the reference image at a sunlit coastal viewpoint above Chefchaouen with soft blue-washed Moroccan walls behind, three-quarter front angle, a picnic basket and two bicycles subtly visible."
