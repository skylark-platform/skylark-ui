import { useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";

export const ColourPicker = () => {
  const [color, setColor] = useState("#aabbcc");

  return (
    <div className="border rounded">
      <HexColorPicker color={color} onChange={setColor} />
      <HexColorInput color={color} onChange={setColor} />
    </div>
  );
};
