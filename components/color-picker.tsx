"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ColorOption {
  name: string
  value: string
}

interface ColorPickerProps {
  color: string
  setColor: (color: string) => void
}

const colorOptions: ColorOption[] = [
  { name: "Mint", value: "#94F6BC" },
  { name: "Lavender", value: "#E6E6FA" },
  { name: "Peach", value: "#FFDAB9" },
  { name: "Sky", value: "#87CEEB" },
  { name: "Lemon", value: "#FFFACD" },
  { name: "Rose", value: "#FFD1DC" },
  { name: "Lilac", value: "#C8A2C8" },
  { name: "Coral", value: "#FF7F50" },
]

export default function ColorPicker({ color, setColor }: ColorPickerProps) {
  const selectedColor = colorOptions.find((option) => option.value === color) || colorOptions[0]

  return (
    <Select value={color} onValueChange={setColor}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: selectedColor.value }} />
            <span>{selectedColor.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {colorOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: option.value }} />
              <span>{option.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
