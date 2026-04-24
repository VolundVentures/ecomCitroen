#!/usr/bin/env bash
set -u
ROOT="c:/Users/Zakaria/ecomCitroen/ecomCitroen"
OUT="$ROOT/apps/store-citroen-ma/public/generated"
LOG="$OUT/_logs"
TOKEN=$(grep '^REPLICATE_API_TOKEN=' "$ROOT/.env" | cut -d= -f2- | tr -d ' \r\n')
export REPLICATE_API_TOKEN="$TOKEN"
BASE='Preserve the exact vehicle design, body proportions, headlight signature, grille chevron, wheel design, trim colour and badging of the reference image. Ultra-editorial automotive photography: warm putty, soft terracotta, pale sage, natural stone. Golden-hour soft light, gentle film grain, shallow depth of field. Photorealistic, no text, no watermarks.'

do_one() {
  local slug="$1" ratio="$2" outpath="$3" ref_local="$4" prompt="$5"
  local up=$(curl -sS -X POST "https://api.replicate.com/v1/files" -H "Authorization: Bearer $REPLICATE_API_TOKEN" -F "content=@${ref_local};type=image/png")
  local ref=$(node -e "try{console.log(JSON.parse(process.argv[1]).urls.get||'')}catch(e){}" "$up")
  echo "ref=$ref"
  local body=$(node -e "process.stdout.write(JSON.stringify({input:{prompt:process.argv[1],aspect_ratio:process.argv[2],resolution:'2K',output_format:'jpg',image_input:[process.argv[3]],safety_filter_level:'block_only_high'}}));" "$prompt $BASE" "$ratio" "$ref")

  # Retry up to 5 times on 429
  local resp id status attempt=0
  while (( attempt < 5 )); do
    resp=$(curl -sS -X POST "https://api.replicate.com/v1/models/google/nano-banana-pro/predictions" \
      -H "Authorization: Bearer $REPLICATE_API_TOKEN" -H "Content-Type: application/json" -H "Prefer: wait" -d "$body")
    status=$(node -e "try{console.log(JSON.parse(process.argv[1]).status||'')}catch(e){}" "$resp")
    id=$(node -e "try{console.log(JSON.parse(process.argv[1]).id||'')}catch(e){}" "$resp")
    echo "[$slug] attempt=$((attempt+1)) id=$id status=$status"
    if [[ -n "$id" ]]; then break; fi
    attempt=$((attempt+1))
    sleep $((30 * attempt))
  done

  if [[ -z "$id" ]]; then echo "FAIL|$slug||all-attempts-failed" > "$LOG/${slug}.result"; return 1; fi

  local waited=0
  while [[ "$status" == "starting" || "$status" == "processing" ]] && (( waited < 600 )); do
    sleep 8; waited=$((waited+8))
    resp=$(curl -sS "https://api.replicate.com/v1/predictions/$id" -H "Authorization: Bearer $REPLICATE_API_TOKEN")
    status=$(node -e "try{console.log(JSON.parse(process.argv[1]).status||'')}catch(e){}" "$resp")
    echo "  poll ${waited}s status=$status"
  done

  if [[ "$status" != "succeeded" ]]; then echo "FAIL|$slug|$id|$status" > "$LOG/${slug}.result"; return 1; fi

  local out=$(node -e "try{const j=JSON.parse(process.argv[1]);const o=j.output;console.log(Array.isArray(o)?o[0]:o)}catch(e){}" "$resp")
  curl -sL -o "$outpath" "$out"
  [[ -s "$outpath" ]] && echo "OK|$slug|$id|$outpath|$(wc -c < "$outpath")" > "$LOG/${slug}.result" || echo "FAIL|$slug|$id|empty" > "$LOG/${slug}.result"
  echo "[$slug] -> $outpath"
}

do_one "hero-c5-aircross-v4" "16:9" "$OUT/hero/c5-aircross.jpg" \
  "$ROOT/apps/store-citroen-ma/public/models/c5-aircross/hero/hero-desktop.jpg" \
  "Place the EXACT 2026 Citroen C5 Aircross from the reference image parked at a quiet modernist villa near the Atlas mountains at early morning, soft rose mountain light, minimalist poolside composition, three-quarter rear angle."

echo "--- sleeping 25s to avoid rate limit ---"
sleep 25

do_one "hero-berlingo-v4" "16:9" "$OUT/hero/berlingo.jpg" \
  "$ROOT/apps/store-citroen-ma/public/models/berlingo/hero/profile.png" \
  "Place the EXACT 2026 Citroen Berlingo family van from the reference image at a sunlit coastal viewpoint above Chefchaouen, soft blue-washed Moroccan village walls behind, three-quarter front angle, a picnic basket and two bicycles subtly visible."
