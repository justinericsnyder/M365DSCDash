import {
  createDarkTheme,
  type BrandVariants,
  type Theme,
} from "@fluentui/react-components";

/**
 * Custom brand ramp based on the crimson-mauve palette (#8B3A5C primary).
 * Generated to approximate the existing dark theme accent.
 */
const crimsonMauveBrand: BrandVariants = {
  10: "#0D0507",
  20: "#1A0C12",
  30: "#2C1420",
  40: "#3D1C2E",
  50: "#4F243C",
  60: "#612D4A",
  70: "#733558",
  80: "#8B3A5C",
  90: "#A04870",
  100: "#B55884",
  110: "#C86998",
  120: "#D87FAC",
  130: "#E898C0",
  140: "#F0B4D4",
  150: "#F6CEE4",
  160: "#FBE8F2",
};

export const crimsonDarkTheme: Theme = {
  ...createDarkTheme(crimsonMauveBrand),
  // Override specific tokens to match the existing palette
  colorNeutralBackground1: "#1A0C12",
  colorNeutralBackground2: "#2C1420",
  colorNeutralBackground3: "#20101A",
  colorNeutralBackground4: "#3D1C2E",
  colorNeutralStroke1: "#5A2438",
  colorNeutralStroke2: "#5A243880",
  colorNeutralForeground1: "#F8EEF2",
  colorNeutralForeground2: "#D4A0B4",
  colorNeutralForeground3: "#D4A0B4",
  colorNeutralForeground4: "#D4A0B480",
  colorSubtleBackground: "transparent",
  colorSubtleBackgroundHover: "#5A243830",
  colorSubtleBackgroundPressed: "#5A243850",
  colorNeutralBackgroundStatic: "#1A0C12",
  colorBrandBackground: "#8B3A5C",
  colorBrandBackgroundHover: "#A04870",
  colorBrandBackgroundPressed: "#733558",
  colorBrandForeground1: "#D87FAC",
  colorBrandForeground2: "#E898C0",
  colorBrandStroke1: "#8B3A5C",
  colorBrandStroke2: "#A04870",
  colorPaletteRedBackground1: "#3A0E14",
  colorPaletteRedBackground3: "#F28B8B",
  colorPaletteRedForeground1: "#F28B8B",
  colorPaletteRedForeground3: "#F28B8B",
  colorPaletteRedBorderActive: "#F28B8B",
  colorPaletteGreenBackground1: "#18241C",
  colorPaletteGreenBackground3: "#7ECC9A",
  colorPaletteGreenForeground1: "#7ECC9A",
  colorPaletteGreenForeground3: "#7ECC9A",
  colorPaletteGreenBorderActive: "#7ECC9A",
  colorPaletteYellowBackground1: "#2E2010",
  colorPaletteYellowBackground3: "#E8D07A",
  colorPaletteYellowForeground1: "#E8D07A",
  colorPaletteYellowForeground3: "#E8D07A",
  colorPaletteYellowBorderActive: "#E8D07A",
};

/** Semantic status colors matching the application's design */
export const statusColors = {
  green: "#7ECC9A",
  red: "#F28B8B",
  yellow: "#E8D07A",
  blue: "#B89ADA",
  purple: "#7C3AED",
} as const;
