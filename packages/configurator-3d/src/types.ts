export type VehicleConfig = {
  modelSlug: string;
  trimSlug: string;
  colorHex: string;
  wheels: string;
  interior: string;
  options: string[];
};

export type VehicleAsset = {
  modelSlug: string;
  glbUrl: string;
  hdriUrl: string;
  source: "citroen-cad" | "hunyuan-3d-3.1";
  generatedAt?: string;
};
