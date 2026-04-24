#!/usr/bin/env bash
# Batch-generate Citroën Morocco hero imagery (10 images via nano-banana-pro)
# + 1 3D GLB via hunyuan-3d-3.1 on Replicate. All jobs run in parallel.

set -u
START_TS=$(date +%s)

ROOT="c:/Users/Zakaria/ecomCitroen/ecomCitroen"
OUT="$ROOT/apps/store-citroen-ma/public/generated"
LOG="$OUT/_logs"
mkdir -p "$OUT/hero" "$OUT/backdrops" "$OUT/3d" "$LOG"

# Load token
TOKEN=$(grep '^REPLICATE_API_TOKEN=' "$ROOT/.env" | cut -d= -f2- | tr -d ' \r\n')
if [[ -z "$TOKEN" ]]; then echo "ERROR: no REPLICATE_API_TOKEN" >&2; exit 1; fi
export REPLICATE_API_TOKEN="$TOKEN"

BASELINE='Ultra-editorial automotive photography in the style of a Kinfolk / Freunde von Freunden / Citroen global campaign. Muted cinematic color grade: warm putty, soft terracotta, pale sage, desaturated teal, natural stone. Golden-hour soft light, gentle film grain, shallow depth of field, subtle atmospheric haze. Never harsh, never neon, never saturated red. Photorealistic, no text, no watermarks, no logos except a tasteful Citroen chevron on the grille.'

# ---- helpers -------------------------------------------------------------
json_escape() {
  # minimal JSON string escape for prompt
  python -c "import json,sys; print(json.dumps(sys.stdin.read()))" 2>/dev/null || \
  node -e "let s=require('fs').readFileSync(0,'utf8');process.stdout.write(JSON.stringify(s))"
}

run_image_job() {
  local slug="$1" ratio="$2" outpath="$3" prompt="$4"
  local logf="$LOG/${slug}.log"
  local metaf="$LOG/${slug}.meta.json"
  local full_prompt="$prompt [Apply shared aesthetic baseline.] $BASELINE"
  local body
  body=$(node -e "
    const p=process.argv[1], r=process.argv[2];
    process.stdout.write(JSON.stringify({input:{prompt:p,aspect_ratio:r,resolution:'2K',output_format:'jpg',safety_filter_level:'block_only_high'}}));
  " "$full_prompt" "$ratio")

  echo "[$slug] POST nano-banana-pro ratio=$ratio" >> "$logf"
  local resp
  resp=$(curl -sS -X POST "https://api.replicate.com/v1/models/google/nano-banana-pro/predictions" \
    -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Prefer: wait" \
    -d "$body")
  echo "$resp" > "$metaf"

  local id status out err
  id=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).id||'')}catch(e){}")
  status=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).status||'')}catch(e){}")
  echo "[$slug] id=$id status=$status" >> "$logf"

  # Poll if not yet finished
  local waited=0
  while [[ "$status" == "starting" || "$status" == "processing" ]] && (( waited < 600 )); do
    sleep 8; waited=$((waited+8))
    resp=$(curl -sS "https://api.replicate.com/v1/predictions/$id" \
      -H "Authorization: Bearer $REPLICATE_API_TOKEN")
    echo "$resp" > "$metaf"
    status=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).status||'')}catch(e){}")
    echo "[$slug] poll ${waited}s status=$status" >> "$logf"
  done

  if [[ "$status" != "succeeded" ]]; then
    err=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));console.log(j.error||j.status||'unknown')}catch(e){console.log('parse-err')}")
    echo "[$slug] FAILED: $err" >> "$logf"
    echo "FAIL|$slug|$id|$err" > "$LOG/${slug}.result"
    return 1
  fi

  out=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));const o=j.output;console.log(Array.isArray(o)?o[0]:o)}catch(e){}")
  echo "[$slug] output=$out" >> "$logf"
  mkdir -p "$(dirname "$outpath")"
  curl -sL -o "$outpath" "$out"
  if [[ -s "$outpath" ]]; then
    echo "OK|$slug|$id|$outpath|$(stat -c %s "$outpath" 2>/dev/null || wc -c < "$outpath")" > "$LOG/${slug}.result"
  else
    echo "FAIL|$slug|$id|download-empty" > "$LOG/${slug}.result"
    return 1
  fi
}

run_3d_job() {
  local slug="3d-c3-aircross"
  local outpath="$OUT/3d/c3-aircross.glb"
  local logf="$LOG/${slug}.log"
  local metaf="$LOG/${slug}.meta.json"

  # Try primary URL first
  local img_url="https://www.citroen.ma/content/dam/citroen/master/b2c/c3-aircross/c3-aircross-packshot.png"
  local check
  check=$(curl -sSIL -o /dev/null -w "%{http_code}" "$img_url" || echo "000")
  echo "[$slug] primary URL status=$check" >> "$logf"
  if [[ "$check" != "200" ]]; then
    # Upload local file instead
    local local_img="$ROOT/apps/store-citroen-ma/public/models/c3-aircross/colors/polar-white/01.png"
    echo "[$slug] uploading $local_img" >> "$logf"
    local up
    up=$(curl -sS -X POST "https://api.replicate.com/v1/files" \
      -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
      -F "content=@${local_img};type=image/png")
    echo "$up" > "$LOG/${slug}.upload.json"
    img_url=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$LOG/${slug}.upload.json','utf8'));console.log(j.urls&&j.urls.get||'')}catch(e){}")
    echo "[$slug] uploaded url=$img_url" >> "$logf"
    if [[ -z "$img_url" ]]; then
      echo "FAIL|$slug||upload-failed" > "$LOG/${slug}.result"
      return 1
    fi
  fi

  local body
  body=$(node -e "
    process.stdout.write(JSON.stringify({input:{image:process.argv[1],enable_pbr:true,face_count:300000,generate_type:'Normal'}}));
  " "$img_url")

  local resp
  resp=$(curl -sS -X POST "https://api.replicate.com/v1/models/tencent/hunyuan-3d-3.1/predictions" \
    -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Prefer: wait" \
    -d "$body")
  echo "$resp" > "$metaf"

  local id status out err
  id=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).id||'')}catch(e){}")
  status=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).status||'')}catch(e){}")
  echo "[$slug] id=$id status=$status" >> "$logf"

  local waited=0
  while [[ "$status" == "starting" || "$status" == "processing" ]] && (( waited < 600 )); do
    sleep 10; waited=$((waited+10))
    resp=$(curl -sS "https://api.replicate.com/v1/predictions/$id" \
      -H "Authorization: Bearer $REPLICATE_API_TOKEN")
    echo "$resp" > "$metaf"
    status=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$metaf','utf8')).status||'')}catch(e){}")
    echo "[$slug] poll ${waited}s status=$status" >> "$logf"
  done

  if [[ "$status" != "succeeded" ]]; then
    err=$(node -e "try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));console.log(j.error||j.status||'unknown')}catch(e){console.log('parse-err')}")
    echo "[$slug] FAILED: $err" >> "$logf"
    echo "FAIL|$slug|$id|$err" > "$LOG/${slug}.result"
    return 1
  fi

  out=$(node -e "
    try{const j=JSON.parse(require('fs').readFileSync('$metaf','utf8'));
    const o=j.output;
    if(!o){console.log('');}
    else if(typeof o==='string'){console.log(o);}
    else if(Array.isArray(o)){console.log(o[0]);}
    else if(o.mesh){console.log(o.mesh);}
    else if(o.glb){console.log(o.glb);}
    else{console.log(JSON.stringify(o));}
    }catch(e){}
  ")
  echo "[$slug] output=$out" >> "$logf"
  mkdir -p "$(dirname "$outpath")"
  curl -sL -o "$outpath" "$out"
  if [[ -s "$outpath" ]]; then
    echo "OK|$slug|$id|$outpath|$(stat -c %s "$outpath" 2>/dev/null || wc -c < "$outpath")" > "$LOG/${slug}.result"
  else
    echo "FAIL|$slug|$id|download-empty" > "$LOG/${slug}.result"
    return 1
  fi
}

# ---- job definitions -----------------------------------------------------
declare -a JOBS=(
  "hero-homepage|21:9|$OUT/hero/homepage.jpg|Wide cinematic shot of a metallic sand-beige 2026 Citroen C3 Aircross parked on a minimalist coastal road at golden hour near Essaouira Morocco, soft Atlantic haze, abstract modern architecture in background, subject positioned in right third of frame, generous negative sky space on left for overlaid text, sophisticated editorial mood."
  "hero-c3-aircross|16:9|$OUT/hero/c3-aircross.jpg|A 2026 Citroen C3 Aircross SUV in a soft two-tone sage-green-over-graphite livery, captured three-quarter front on a Moroccan riad courtyard at dawn, warm terracotta walls behind, palm shadows across the hood, shallow depth of field."
  "hero-c5-aircross|16:9|$OUT/hero/c5-aircross.jpg|A 2026 Citroen C5 Aircross SUV in pearl white, parked at a quiet modernist villa near the Atlas mountains at early morning, soft rose mountain light, minimalist poolside composition, three-quarter rear angle showing sculpted rear lights."
  "hero-berlingo|16:9|$OUT/hero/berlingo.jpg|A 2026 Citroen Berlingo family van in deep metallic petrol-blue parked at a sunlit coastal viewpoint over Chefchaouen with soft blue-painted Moroccan village walls behind, three-quarter front angle, a picnic basket and bicycles subtly visible, warm candid lifestyle mood."
  "bd-marrakech-medina|3:2|$OUT/backdrops/marrakech-medina.jpg|Empty cobblestone alley in Marrakech medina at golden hour, warm ochre walls, dappled light, no people, no cars, ready to composite a vehicle into the foreground, editorial campaign backdrop."
  "bd-casa-corniche|3:2|$OUT/backdrops/casa-corniche.jpg|Empty Casablanca corniche promenade at blue hour, soft Atlantic mist, minimalist art-deco streetlamps, wet pavement reflections, no people, no cars, ready to composite a vehicle, editorial campaign backdrop."
  "bd-essaouira-beach|3:2|$OUT/backdrops/essaouira-beach.jpg|Wide empty beach at Essaouira at early morning, pale sand, distant fishing boats, low haze on horizon, no people, no cars, ready to composite a vehicle, editorial campaign backdrop."
  "bd-chefchaouen|3:2|$OUT/backdrops/chefchaouen.jpg|Empty quiet street in Chefchaouen between soft blue-washed walls at late afternoon, no people, no cars, ready to composite a vehicle, editorial campaign backdrop."
  "bd-atlas-mountains|3:2|$OUT/backdrops/atlas-mountains.jpg|Empty mountain switchback road in the High Atlas at golden hour, warm amber rock faces, distant snow peaks, no people, no cars, ready to composite a vehicle, editorial campaign backdrop."
  "bd-rabat-hassan|3:2|$OUT/backdrops/rabat-hassan.jpg|Empty plaza near Hassan Tower in Rabat at early morning, warm travertine stones, soft mist, minimalist historic columns in background, no people, no cars, ready to composite a vehicle, editorial campaign backdrop."
)

# ---- launch all jobs in parallel ----------------------------------------
for j in "${JOBS[@]}"; do
  IFS='|' read -r slug ratio outpath prompt <<< "$j"
  run_image_job "$slug" "$ratio" "$outpath" "$prompt" &
done
run_3d_job &

wait
END_TS=$(date +%s)
ELAPSED=$((END_TS-START_TS))

# ---- build manifest ------------------------------------------------------
node -e "
const fs=require('fs');
const path=require('path');
const logDir='$LOG';
const out='$OUT';
const jobs=[
$(for j in "${JOBS[@]}"; do IFS='|' read -r slug ratio outpath prompt <<< "$j"; printf "  {slug:%s,ratio:%s,path:%s,prompt:%s},\n" "$(node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$slug")" "$(node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$ratio")" "$(node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$outpath")" "$(node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$prompt")"; done)
  {slug:'3d-c3-aircross',ratio:'',path:'$OUT/3d/c3-aircross.glb',prompt:'hunyuan-3d-3.1 from C3 Aircross packshot'}
];
const manifest={generated_at:new Date().toISOString(),elapsed_seconds:$ELAPSED,assets:[]};
for(const j of jobs){
  const rf=path.join(logDir,j.slug+'.result');
  let entry={slug:j.slug,prompt:j.prompt,path:j.path,status:'unknown'};
  if(fs.existsSync(rf)){
    const line=fs.readFileSync(rf,'utf8').trim();
    const [st,slug,id,rest,size]=line.split('|');
    entry.status=st==='OK'?'succeeded':'failed';
    entry.prediction_id=id||null;
    if(st==='OK'){entry.size_bytes=Number(size)||null;}
    else{entry.error=rest||'unknown';}
  }
  manifest.assets.push(entry);
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('manifest written');
"

# ---- final report --------------------------------------------------------
echo ""
echo "=========================================="
echo "BATCH COMPLETE — ${ELAPSED}s"
echo "=========================================="
for f in "$LOG"/*.result; do
  [[ -f "$f" ]] && cat "$f"
done
