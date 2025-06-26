export interface ColorOption {
  name: string;
  value: string;
  watermarkAlpha?: number;
}

export const colorOptions: ColorOption[] = [
  { name: "Apricot Cream", value: "#ffe0b2", watermarkAlpha: 0.085 },
  { name: "Pistachio Green", value: "#c7f7c0", watermarkAlpha: 0.1 },
  { name: "Blush Pink", value: "#ffd1dc", watermarkAlpha: 0.07 },
  { name: "Sky Mist", value: "#d0f0fd", watermarkAlpha: 0.105 },
  { name: "Lilac Cloud", value: "#e0d3f7", watermarkAlpha: 0.06 },
  { name: "Lemon Whip", value: "#fff7ba", watermarkAlpha: 0.12 },
  { name: "Light Denim Blue", value: "#b3c7f7", watermarkAlpha: 0.045 },
];
